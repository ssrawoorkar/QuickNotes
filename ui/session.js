const WS_URL = "ws://localhost:8000/ws";

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

let ws = null;

// ── Auth: load current user ──────────────────────────────────────────────

async function loadUser() {
  try {
    const res = await fetch("/auth/me");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const user = await res.json();
    if (user.picture) {
      profileAvatar.src = user.picture;
      profileAvatar.alt = user.name || "User avatar";
    }
    if (user.name) {
      profileName.textContent = user.name;
    }
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
  ws.onopen    = () => { setStatus("Connected", false); if (onOpen) onOpen(); };
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === "transcript") appendTranscript(msg.timestamp, msg.text);
    if (msg.type === "notes")      renderNotes(msg.text);
  };
  ws.onerror   = () => setStatus("Error", false);
  ws.onclose   = () => { setStatus("Disconnected", false); ws = null; };
}

function send(payload) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

// ── Controls ─────────────────────────────────────────────────────────────

btnStart.addEventListener("click", () => {
  btnStart.disabled = true;
  btnStop.disabled  = false;
  setStatus("Connecting…", false);
  document.querySelectorAll(".empty").forEach(el => el.remove());

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
    const res  = await fetch("http://localhost:8000/notes");
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
    if (!content) { alert("No notes to save yet."); return; }
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
