"""Persist and retrieve the current generated notes (single living document)."""

import logging
import os

logger = logging.getLogger(__name__)

NOTES_FILE = "data/notes/lecture_notes.md"


class NotesStore:
    """
    Holds the latest complete set of notes as a single string.
    Each LLM call returns a full updated version — we overwrite, not append.
    """

    def __init__(self):
        os.makedirs(os.path.dirname(NOTES_FILE), exist_ok=True)
        self._notes: str = ""

    def update(self, notes: str):
        """Replace the current notes with a freshly generated version."""
        self._notes = notes.strip()
        self._persist()

    def get(self) -> str:
        return self._notes

    def is_empty(self) -> bool:
        return not self._notes

    def clear(self):
        """Reset notes for a new session."""
        self._notes = ""

    def _persist(self):
        try:
            with open(NOTES_FILE, "w", encoding="utf-8") as f:
                f.write(self._notes)
        except OSError as exc:
            logger.warning("Could not write notes to disk: %s", exc)
