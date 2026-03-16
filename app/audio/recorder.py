"""Continuous microphone capture, emitting audio chunks every CHUNK_SECONDS."""

import logging
import threading

logger = logging.getLogger(__name__)

SAMPLE_RATE = 16000      # Hz — Whisper expects 16kHz
CHUNK_SECONDS = 5        # emit a chunk every N seconds
CHANNELS = 1


class AudioRecorder:
    """Records from the default microphone and calls on_chunk with raw numpy audio."""

    def __init__(self, on_chunk):
        self.on_chunk = on_chunk
        self._thread = None
        self._stop_event = threading.Event()

    def start(self):
        """Start recording in a background thread."""
        if self._thread and self._thread.is_alive():
            logger.warning("Recorder already running, ignoring start()")
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._record_loop, daemon=True)
        self._thread.start()
        logger.info("AudioRecorder started (sample_rate=%d, chunk=%ds)", SAMPLE_RATE, CHUNK_SECONDS)

    def stop(self):
        """Signal the recording thread to stop."""
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=CHUNK_SECONDS + 2)
        logger.info("AudioRecorder stopped")

    def _record_loop(self):
        try:
            import sounddevice as sd
        except ImportError:
            logger.error("sounddevice not installed — run: pip install sounddevice")
            return

        chunk_frames = SAMPLE_RATE * CHUNK_SECONDS

        while not self._stop_event.is_set():
            try:
                audio = sd.rec(
                    chunk_frames,
                    samplerate=SAMPLE_RATE,
                    channels=CHANNELS,
                    dtype="float32",
                )
                sd.wait()
                if not self._stop_event.is_set() and self.on_chunk:
                    self.on_chunk(audio.flatten())
            except Exception as exc:
                logger.exception("Error during audio capture: %s", exc)
                break
