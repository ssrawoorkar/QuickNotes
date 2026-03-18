"""API routes: WebSocket for live updates, REST for notes export."""

import asyncio
import io
import logging
import os

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import JSONResponse
from openai import OpenAI

from app.summarization.note_generator import NoteGenerator, SUMMARIZE_INTERVAL
from app.storage.transcript_store import TranscriptStore
from app.storage.notes_store import NotesStore

logger = logging.getLogger(__name__)
router = APIRouter()

# Shared singletons (one per server process)
transcript_store = TranscriptStore()
notes_store      = NotesStore()
note_gen         = NoteGenerator()


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """Main WebSocket: receives transcript lines from browser, streams notes back."""
    await ws.accept()
    logger.info("WebSocket client connected")

    loop      = asyncio.get_running_loop()
    recording = False
    summarize_task: asyncio.Task | None = None

    # ── Helpers ────────────────────────────────────────────────────────────

    async def push_notes():
        """Run one summarization pass and push the result to the client."""
        recent   = transcript_store.get_recent_window()
        existing = notes_store.get()
        notes_md = await loop.run_in_executor(
            None, note_gen.summarize, recent, existing
        )
        notes_store.update(notes_md)
        await ws.send_json({"type": "notes", "text": notes_store.get()})

    async def summarize_loop():
        """Periodically summarize while recording is active."""
        try:
            while True:
                await asyncio.sleep(SUMMARIZE_INTERVAL)
                if not transcript_store.is_empty():
                    logger.info("Scheduled summarization triggered")
                    await push_notes()
        except asyncio.CancelledError:
            pass

    # ── Command loop ────────────────────────────────────────────────────────

    try:
        while True:
            data   = await ws.receive_json()
            action = data.get("action")

            if action == "start" and not recording:
                transcript_store.clear()
                notes_store.clear()
                recording      = True
                summarize_task = asyncio.create_task(summarize_loop())
                logger.info("Recording started")

            elif action == "transcript":
                timestamp = data.get("timestamp", "")
                text      = data.get("text", "")
                if text:
                    transcript_store.append(timestamp, text)

            elif action == "stop" and recording:
                recording = False

                if summarize_task:
                    summarize_task.cancel()
                    summarize_task = None

                # Final flush — summarize whatever remains in the window
                if not transcript_store.is_empty():
                    logger.info("Final summarization on stop")
                    await push_notes()

                logger.info("Recording stopped")

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
        if summarize_task:
            summarize_task.cancel()


@router.get("/notes")
def get_notes():
    """Return the current notes as a markdown string."""
    return JSONResponse({"notes": notes_store.get()})


@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Receive an audio chunk from the browser and return the transcript via Whisper."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return JSONResponse({"error": "OPENAI_API_KEY not set"}, status_code=500)

    content = await audio.read()
    if not content:
        return JSONResponse({"text": ""})

    try:
        client = OpenAI(api_key=api_key)
        audio_file = io.BytesIO(content)
        audio_file.name = audio.filename or "chunk.webm"
        result = client.audio.transcriptions.create(model="whisper-1", file=audio_file)
        return JSONResponse({"text": result.text})
    except Exception as exc:
        logger.exception("Whisper transcription error: %s", exc)
        return JSONResponse({"error": str(exc)}, status_code=500)
