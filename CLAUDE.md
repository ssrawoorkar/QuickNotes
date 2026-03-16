# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**QuickNotes** — an AI-powered note-taking app that records lectures, transcribes audio in real time, and generates structured study notes automatically, so students can pay full attention without manually taking notes.

> Repository: https://github.com/ssrawoorkar/QuickNotes.git

---

## Architecture

```
Microphone
↓
Audio chunk capture (sounddevice / pyaudio)
↓
Speech-to-text (Faster-Whisper, model: small.en)
↓
Transcript buffer (in-memory + disk at data/transcripts/)
↓
AI summarization every 60–90s (Claude API)
↓
Structured notes (data/notes/lecture_notes.md)
```

**Backend:** Python + FastAPI + uvicorn, served over WebSockets for live updates.
**Frontend:** HTML/CSS/Vanilla JS (two-panel: live transcript left, generated notes right). React or Tauri are potential future upgrades.

### Project Structure

```
QuickNotes/
  app/
    audio/recorder.py          # mic capture, 5–10s chunks
    transcription/whisper_engine.py
    summarization/note_generator.py
    storage/transcript_store.py
    storage/notes_store.py
  api/
    server.py
    routes.py
  ui/
    index.html
    app.js
    styles.css
  data/
    transcripts/
    notes/
  requirements.txt
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | Python |
| Audio capture | `sounddevice` or `pyaudio` |
| Transcription | `faster-whisper` (`small.en` model) |
| API server | `fastapi` + `uvicorn` |
| AI summarization | Claude API (`anthropic`) |
| Frontend | HTML + CSS + Vanilla JS + WebSockets |

---

## MVP Features & Build Order

Build in this order — each module must be independently testable:

1. **Audio recording** — continuous mic capture, chunked every 5–10s, low CPU
2. **Speech-to-text** — Faster-Whisper converts chunks, appends to transcript buffer with timestamps (`[HH:MM:SS]`)
3. **Transcript buffer** — in-memory + written to `data/transcripts/`
4. **AI summarization** — every 60–90s, send new transcript content to Claude API, append output to `data/notes/lecture_notes.md`
5. **File storage** — persist transcript and notes to disk
6. **Simple UI** — two-panel live view via WebSocket
7. **Export** — download `lecture_notes.md` and `lecture_transcript.txt`

### AI Summarization Prompt

```
Convert the following lecture transcript into structured study notes.

Focus on:
- definitions
- key ideas
- examples
- important terms

Format the output with headings and bullet points.
```

---

## Non-Goals (MVP)

Do not implement: authentication, user accounts, cloud sync, collaboration, mobile, complex note editing, or productivity integrations.

---

## Coding Guidelines

- Modular Python with docstrings on all functions
- Keep modules small and single-purpose
- Include logging for debugging
- Avoid unnecessary dependencies
- Cross-platform compatibility where possible
- Readable over clever

---

## Commands

_To be filled in once dependencies are installed:_

```bash
# Install dependencies
pip install -r requirements.txt

# Start dev server
uvicorn api.server:app --reload

# Run a single module test (example)
python -m pytest app/audio/test_recorder.py
```

---

## Environment Variables

```
ANTHROPIC_API_KEY=...
```

---

## Future Features (post-MVP)

Exam detection, flashcard generation, lecture topic segmentation, semantic search, offline LLM summarization, multi-lecture knowledge base. Keep modules decoupled so these can be added later.
