const WS_URL = "ws://localhost:8000/ws";

const btnStart         = document.getElementById("btn-start");
const btnStop          = document.getElementById("btn-stop");
const statusEl         = document.getElementById("status");
const statusDot        = document.getElementById("status-dot");
const transcriptOutput = document.getElementById("transcript-output");
const notesOutput      = document.getElementById("notes-output");

let ws = null;

// --- WebSocket ---

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

// --- Controls ---

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

// --- Transcript ---

function appendTranscript(timestamp, text) {
  const line = document.createElement("div");
  line.className = "t-line";
  line.innerHTML = `<span class="ts">${timestamp}</span>${escapeHtml(text)}`;
  transcriptOutput.appendChild(line);
  transcriptOutput.scrollTop = transcriptOutput.scrollHeight;
}

// --- Notes ---

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

// --- Export ---

document.getElementById("btn-export-transcript").addEventListener("click", () => {
  const text = [...document.querySelectorAll(".t-line")]
    .map(el => el.textContent).join("\n");
  download("transcript.txt", text, "text/plain");
});

// Export notes directly from the DOM (already the latest version)


document.getElementById("btn-export-notes").addEventListener("click", async () => {
  try {
    const res  = await fetch("http://localhost:8000/notes");
    const data = await res.json();
    download("lecture_notes.md", data.notes, "text/markdown");
  } catch {
    alert("Could not fetch notes from server.");
  }
});

// --- Helpers ---

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
