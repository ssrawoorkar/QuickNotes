// Settings page — load/save preferences to localStorage

const DEFAULTS = {
  whisperModel:       "small.en",
  chunkDuration:      "5",
  summarizeInterval:  "45",
  rollingWindow:      "150",
  summarizeOnStop:    true,
};

function loadSettings() {
  const saved = JSON.parse(localStorage.getItem("qn_settings") || "{}");
  const s = { ...DEFAULTS, ...saved };

  document.getElementById("setting-whisper-model").value      = s.whisperModel;
  document.getElementById("setting-chunk-duration").value     = s.chunkDuration;
  document.getElementById("setting-summarize-interval").value = s.summarizeInterval;
  document.getElementById("setting-window").value             = s.rollingWindow;
  document.getElementById("setting-summarize-on-stop").checked = s.summarizeOnStop;
}

document.getElementById("btn-save").addEventListener("click", () => {
  const settings = {
    whisperModel:      document.getElementById("setting-whisper-model").value,
    chunkDuration:     document.getElementById("setting-chunk-duration").value,
    summarizeInterval: document.getElementById("setting-summarize-interval").value,
    rollingWindow:     document.getElementById("setting-window").value,
    summarizeOnStop:   document.getElementById("setting-summarize-on-stop").checked,
  };

  localStorage.setItem("qn_settings", JSON.stringify(settings));

  const status = document.getElementById("save-status");
  status.textContent = "✓ Saved";
  status.classList.add("visible");
  setTimeout(() => status.classList.remove("visible"), 2500);
});

loadSettings();
