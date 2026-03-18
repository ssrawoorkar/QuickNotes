"""AI summarization — rolling window approach with existing notes as context."""

import logging
import os

from openai import OpenAI

logger = logging.getLogger(__name__)

SUMMARIZE_INTERVAL = 45
MODEL              = "gpt-4o-mini"

PROMPT_FIRST = """\
You are a note-taking assistant. Summarize the speech below into clean, concise notes.

Rules:
- Output only the notes. No commentary, warnings, or meta-text.
- Use headings and bullet points.
- Capture key points, steps, terms, and facts from whatever is being said.

Speech:
{recent_window}
"""

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
    """Calls GPT-4o-mini with a rolling window: recent speech + existing notes."""

    def __init__(self):
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not set — summarization disabled")
        self._client = OpenAI(api_key=api_key) if api_key else None

    def summarize(self, recent_window: str, existing_notes: str = "") -> str:
        if not self._client:
            return "*(Summarization unavailable — OPENAI_API_KEY not set)*"

        if not recent_window.strip():
            return existing_notes

        if existing_notes.strip():
            prompt = PROMPT_UPDATE.format(
                existing_notes=existing_notes,
                recent_window=recent_window,
            )
        else:
            prompt = PROMPT_FIRST.format(recent_window=recent_window)

        try:
            response = self._client.chat.completions.create(
                model=MODEL,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            notes = response.choices[0].message.content.strip()
            logger.info("Notes updated (%d chars)", len(notes))
            return notes
        except Exception as exc:
            logger.exception("OpenAI API error: %s", exc)
            return existing_notes or f"*(Error: {exc})*"
