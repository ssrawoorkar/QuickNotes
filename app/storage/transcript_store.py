"""In-memory + disk transcript buffer with a rolling recent window."""

import logging
import os
import time
from collections import deque
from datetime import datetime

logger = logging.getLogger(__name__)

TRANSCRIPTS_DIR = "data/transcripts"
WINDOW_SECONDS  = 150   # 2.5 minutes kept in the rolling window


class TranscriptStore:
    """
    Maintains three buffers:
      full_transcript  — every line ever spoken (for export / disk)
      recent_window    — last WINDOW_SECONDS of speech (sent to LLM)
      summarized_notes — managed externally by NotesStore; referenced here for clarity
    """

    def __init__(self):
        os.makedirs(TRANSCRIPTS_DIR, exist_ok=True)
        self._full:   list[tuple[str, str]]          = []   # (timestamp_str, text)
        self._window: deque[tuple[float, str, str]]  = deque()  # (unix_time, timestamp_str, text)
        self._file = os.path.join(
            TRANSCRIPTS_DIR,
            f"transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
        )

    # ── Write ──────────────────────────────────────────────────────────────

    def append(self, timestamp: str, text: str):
        """Add a transcribed line to both the full log and the rolling window."""
        now = time.time()
        self._full.append((timestamp, text))
        self._window.append((now, timestamp, text))
        self._trim_window(now)
        self._persist(timestamp, text)

    # ── Read ───────────────────────────────────────────────────────────────

    def get_recent_window(self) -> str:
        """Return the last WINDOW_SECONDS of spoken text as a single string."""
        self._trim_window(time.time())
        return " ".join(text for _, _, text in self._window)

    def get_full_transcript(self) -> str:
        """Return the complete timestamped transcript."""
        return "\n".join(f"[{ts}] {text}" for ts, text in self._full)

    def is_empty(self) -> bool:
        return len(self._full) == 0

    def clear(self):
        """Reset all buffers for a new session and open a fresh disk file."""
        self._full.clear()
        self._window.clear()
        self._file = os.path.join(
            TRANSCRIPTS_DIR,
            f"transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
        )

    # ── Internal ───────────────────────────────────────────────────────────

    def _trim_window(self, now: float):
        cutoff = now - WINDOW_SECONDS
        while self._window and self._window[0][0] < cutoff:
            self._window.popleft()

    def _persist(self, timestamp: str, text: str):
        try:
            with open(self._file, "a", encoding="utf-8") as f:
                f.write(f"[{timestamp}] {text}\n")
        except OSError as exc:
            logger.warning("Could not write transcript to disk: %s", exc)
