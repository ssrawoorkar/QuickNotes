// WebSocket URL — works locally and in production
const WS_URL = location.protocol === "https:"
  ? `wss://${location.host}/ws`
  : `ws://${location.host}/ws`;

const btnStart         = document.getElementById("btn-start");
const btnStop          = document.getElementById("btn-stop");
const statusEl         = document.getElementById("status");
const statusDot        = document.getElementById("status-dot");
const transcriptOutput = document.getElementById("transcript-output");
const notesOutput      = document.getElementById("notes-output");
const profileAvatar    = document.getElementById("profile-avatar");
const profileName      = document.getElementById("profile-name");
const profileTrigger   = document.getElementById("profile-trigger");
const profileDropdown  = document.getElementById("profile-dropdown");

let ws             = null;
let mediaRecorder  = null;
let micStream      = null;
let audioCtx       = null;
let silencePoller  = null;
let isRecording    = false;
let recordingStart = 0;

const SILENCE_THRESHOLD  = 0.015; // RMS below this = silence
const SILENCE_DURATION   = 300;   // ms of continuous silence before splitting
const MIN_CHUNK_MS       = 1000;  // never split before 1 s of audio
const MAX_CHUNK_MS       = 45000; // hard cap — split even if no pause

// ── Auth: load current user ──────────────────────────────────────────────

async function loadUser() {
  try {
    const res = await fetch("/auth/me");
    if (res.status === 401) { window.location.href = "/login"; return; }
    const user = await res.json();
    if (user.picture) { profileAvatar.src = user.picture; profileAvatar.alt = user.name || "User avatar"; }
    if (user.name)    { profileName.textContent = user.name; }
  } catch {
    window.location.href = "/login";
  }
}

loadUser();

// ── Profile dropdown ─────────────────────────────────────────────────────

profileTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = profileDropdown.classList.contains("open");
  profileDropdown.classList.toggle("open", !isOpen);
  profileTrigger.setAttribute("aria-expanded", String(!isOpen));
  profileDropdown.setAttribute("aria-hidden", String(isOpen));
});

document.addEventListener("click", (e) => {
  if (!profileTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.classList.remove("open");
    profileTrigger.setAttribute("aria-expanded", "false");
    profileDropdown.setAttribute("aria-hidden", "true");
  }
});

// ── WebSocket ────────────────────────────────────────────────────────────

function connect(onOpen) {
  ws = new WebSocket(WS_URL);
  ws.onopen    = () => { if (onOpen) onOpen(); };
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === "notes") renderNotes(msg.text);
  };
  ws.onerror = () => setStatus("Connection error", false);
  ws.onclose = () => { ws = null; };
}

function send(payload) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

// ── MediaRecorder + Whisper ───────────────────────────────────────────────

function getRecordingMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) || "";
}

function mimeToExt(mimeType) {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg"))  return "ogg";
  if (mimeType.includes("mp4"))  return "mp4";
  return "webm";
}

async function startMic() {
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const mimeType = getRecordingMimeType();
  console.log("Recording mimeType:", mimeType || "(browser default)");

  // ── Silence detection via Web Audio ──────────────────────────────────────
  audioCtx = new AudioContext();
  const source   = audioCtx.createMediaStreamSource(micStream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const pcmBuf = new Float32Array(analyser.frequencyBinCount);

  function getRMS() {
    analyser.getFloatTimeDomainData(pcmBuf);
    let sum = 0;
    for (let i = 0; i < pcmBuf.length; i++) sum += pcmBuf[i] * pcmBuf[i];
    return Math.sqrt(sum / pcmBuf.length);
  }

  // ── Chunk cycle ───────────────────────────────────────────────────────────
  let chunkStart   = 0;
  let silenceStart = null;

  function splitChunk() {
    if (!mediaRecorder || mediaRecorder.state !== "recording") return;
    const prev = mediaRecorder;
    startCycle();        // new recorder starts immediately — zero gap
    prev.stop();         // flush previous chunk
    silenceStart = null;
  }

  function startCycle() {
    if (!isRecording) return;
    mediaRecorder = mimeType
      ? new MediaRecorder(micStream, { mimeType })
      : new MediaRecorder(micStream);

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 100) await transcribeChunk(event.data, mimeType);
    };

    mediaRecorder.onerror = (e) => {
      console.error("MediaRecorder error:", e);
      setStatus("Mic error — try restarting", false);
    };

    mediaRecorder.start();
    chunkStart   = Date.now();
    silenceStart = null;
  }

  // Poll audio level every 100 ms for silence / hard-cap detection
  silencePoller = setInterval(() => {
    if (!isRecording) return;
    const elapsed = Date.now() - chunkStart;

    // Hard cap — split regardless of audio level
    if (elapsed >= MAX_CHUNK_MS) { splitChunk(); return; }

    // Too short — don't split yet
    if (elapsed < MIN_CHUNK_MS) { silenceStart = null; return; }

    const rms = getRMS();
    if (rms < SILENCE_THRESHOLD) {
      if (!silenceStart) silenceStart = Date.now();
      else if (Date.now() - silenceStart >= SILENCE_DURATION) splitChunk();
    } else {
      silenceStart = null;
    }
  }, 100);

  startCycle();
}

async function transcribeChunk(blob, mimeType) {
  const resolvedType = blob.type || mimeType;
  const ext          = mimeToExt(resolvedType);
  const formData     = new FormData();
  formData.append("audio", blob, `chunk.${ext}`);

  try {
    const res  = await fetch("/transcribe", { method: "POST", body: formData });
    const data = await res.json();
    const text = data.text && data.text.trim();
    if (text && text.split(/\s+/).length >= 4) {
      const elapsed = elapsedLabel();
      appendTranscript(elapsed, text);
      send({ action: "transcript", timestamp: elapsed, text });
    }
  } catch (err) {
    console.error("Transcription error:", err);
    setStatus("Transcription error — still recording", true);
  }
}

function stopMic() {
  clearInterval(silencePoller);
  silencePoller = null;
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
  if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
  if (micStream) micStream.getTracks().forEach(t => t.stop());
  mediaRecorder = null;
  micStream     = null;
}

function elapsedLabel() {
  const secs = Math.floor((Date.now() - recordingStart) / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}m ${s}s`;
}

// ── Controls ─────────────────────────────────────────────────────────────

btnStart.addEventListener("click", async () => {
  btnStart.disabled = true;
  btnStop.disabled  = false;
  isRecording       = true;
  recordingStart    = Date.now();
  document.querySelectorAll(".empty").forEach(el => el.remove());
  setStatus("Connecting…", false);

  try {
    await startMic();
  } catch (err) {
    alert("Microphone access denied. Please allow mic access and try again.");
    isRecording = false;
    btnStart.disabled = false;
    btnStop.disabled  = true;
    setStatus("Idle", false);
    return;
  }

  const startRecording = () => {
    send({ action: "start" });
    setStatus("Recording…", true);
  };

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    connect(startRecording);
  } else {
    startRecording();
  }
});

btnStop.addEventListener("click", () => {
  isRecording = false;
  stopMic();
  send({ action: "stop" });
  btnStart.disabled = false;
  btnStop.disabled  = true;
  setStatus("Stopped", false);
});

// ── Transcript ───────────────────────────────────────────────────────────

function appendTranscript(timestamp, text) {
  const line = document.createElement("div");
  line.className = "t-line";
  line.innerHTML = `<span class="ts">${timestamp}</span>${escapeHtml(text)}`;
  transcriptOutput.appendChild(line);
  transcriptOutput.scrollTop = transcriptOutput.scrollHeight;
}

// ── Notes ────────────────────────────────────────────────────────────────

function renderNotes(markdown) {
  notesOutput.innerHTML = simpleMarkdown(markdown);
}

function simpleMarkdown(md) {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm,  "<h2>$1</h2>")
    .replace(/^# (.+)$/gm,   "<h1>$1</h1>")
    .replace(/^---$/gm,      "<hr/>")
    .replace(/^- (.+)$/gm,   "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)(?=\s*(?!<li>))/g, "<ul>$1</ul>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/\n{2,}/g,        "<br/><br/>");
}

// ── Export ───────────────────────────────────────────────────────────────

document.getElementById("btn-export-transcript").addEventListener("click", () => {
  const text = [...document.querySelectorAll(".t-line")]
    .map(el => el.textContent).join("\n");
  download("transcript.txt", text, "text/plain");
});

document.getElementById("btn-export-notes").addEventListener("click", async () => {
  try {
    const res  = await fetch("/notes");
    const data = await res.json();
    download("lecture_notes.md", data.notes, "text/markdown");
  } catch {
    alert("Could not fetch notes from server.");
  }
});

// ── Google Drive ──────────────────────────────────────────────────────────

async function getNotesContent() {
  const res  = await fetch("/notes");
  const data = await res.json();
  return data.notes || "";
}

document.getElementById("btn-save-drive").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    const content = await getNotesContent();
    if (!content) { alert("No notes to save yet."); btn.innerHTML = orig; btn.disabled = false; return; }
    const res  = await fetch("/drive/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (res.ok) {
      btn.textContent = "✓ Saved";
      setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 2500);
    } else if (res.status === 401) {
      alert("Drive access expired. Please sign in again.");
      window.location.href = "/auth/google";
    } else {
      alert("Failed to save to Drive: " + (data.detail || data.error));
      btn.innerHTML = orig; btn.disabled = false;
    }
  } catch {
    alert("Could not reach server.");
    btn.innerHTML = orig; btn.disabled = false;
  }
});

document.getElementById("btn-open-docs").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = "Creating…";
  try {
    const content = await getNotesContent();
    if (!content) { alert("No notes to open yet."); btn.innerHTML = orig; btn.disabled = false; return; }
    const res  = await fetch("/drive/create-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (res.ok) {
      window.open(data.doc_url, "_blank");
      btn.innerHTML = orig; btn.disabled = false;
    } else if (res.status === 401) {
      alert("Drive access expired. Please sign in again.");
      window.location.href = "/auth/google";
    } else {
      alert("Failed to create Doc: " + (data.detail || data.error));
      btn.innerHTML = orig; btn.disabled = false;
    }
  } catch {
    alert("Could not reach server.");
    btn.innerHTML = orig; btn.disabled = false;
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────

function setStatus(text, live) {
  statusEl.textContent = text;
  statusEl.className   = live ? "live" : "";
  statusDot.className  = live ? "live" : "";
}

function escapeHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function download(name, content, mime) {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([content], { type: mime })),
    download: name,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}
