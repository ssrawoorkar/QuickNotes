"""AI summarization — rolling window approach with existing notes as context."""

import logging
import os

import anthropic

logger = logging.getLogger(__name__)

SUMMARIZE_INTERVAL = 45   # seconds between automatic summarization runs
MODEL              = "claude-sonnet-4-6"

# Used on the first call when there are no existing notes yet
PROMPT_FIRST = """\
You are a note-taking assistant. Summarize the speech below into clean, concise notes.

Rules:
- Output only the notes. No commentary, warnings, or meta-text.
- Use headings and bullet points.
- Capture key points, steps, terms, and facts from whatever is being said.

Speech:
{recent_window}
"""

# Used on subsequent calls — LLM receives existing notes + new speech
PROMPT_UPDATE = """\
You are a note-taking assistant maintaining a running set of notes.

Existing notes:
{existing_notes}

Recent speech (last 2–3 minutes):
{recent_window}

Update the notes to incorporate any new information from the recent speech.

Rules:
- Output only the complete updated notes. No commentary or meta-text.
- Do not duplicate content already captured in the existing notes.
- Use headings and bullet points.
- Capture key points, steps, terms, and facts.
"""


class NoteGenerator:
    """Calls Claude with a rolling window: recent speech + existing notes."""

    def __init__(self):
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            logger.warning("ANTHROPIC_API_KEY not set — summarization disabled")
        self._client = anthropic.Anthropic(api_key=api_key) if api_key else None

    def summarize(self, recent_window: str, existing_notes: str = "") -> str:
        """
        Generate or update notes.
        - First call (no existing notes): summarize the window from scratch.
        - Subsequent calls: update existing notes with new content from the window.
        """
        if not self._client:
            return "*(Summarization unavailable — ANTHROPIC_API_KEY not set)*"

        if not recent_window.strip():
            return existing_notes  # nothing new to process

        if existing_notes.strip():
            prompt = PROMPT_UPDATE.format(
                existing_notes=existing_notes,
                recent_window=recent_window,
            )
        else:
            prompt = PROMPT_FIRST.format(recent_window=recent_window)

        try:
            message = self._client.messages.create(
                model=MODEL,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            notes = message.content[0].text.strip()
            logger.info("Notes updated (%d chars)", len(notes))
            return notes
        except Exception as exc:
            logger.exception("Claude API error: %s", exc)
            return existing_notes or f"*(Error: {exc})*"
