"""Speech-to-text via faster-whisper (small.en model)."""

import logging
from datetime import datetime

logger = logging.getLogger(__name__)

MODEL_SIZE = "small.en"


class WhisperEngine:
    """Wraps faster-whisper for chunk-level transcription."""

    def __init__(self):
        self._model = None
        self._load_model()

    def _load_model(self):
        try:
            from faster_whisper import WhisperModel
            self._model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
            logger.info("Whisper model '%s' loaded", MODEL_SIZE)
        except ImportError:
            logger.error("faster-whisper not installed — run: pip install faster-whisper")

    def transcribe(self, audio_np) -> dict | None:
        """
        Transcribe a numpy float32 audio array.

        Returns {"timestamp": "HH:MM:SS", "text": "..."} or None if silent/failed.
        """
        if self._model is None:
            return None

        try:
            segments, _ = self._model.transcribe(audio_np, beam_size=5, vad_filter=True)
            text = " ".join(seg.text.strip() for seg in segments).strip()
            if not text:
                return None
            timestamp = datetime.now().strftime("%H:%M:%S")
            logger.debug("Transcribed [%s]: %s", timestamp, text)
            return {"timestamp": timestamp, "text": text}
        except Exception as exc:
            logger.exception("Transcription error: %s", exc)
            return None
