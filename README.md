# QuickNotes
Ai note taking app so you can pay attention

---

## 🔧 Reminders / Future Fixes

- [x] **Summarization model** — using `gpt-4.1-mini` via OpenAI SDK (`app/summarization/note_generator.py`).
- [ ] **Wire settings to backend** — Settings page saves to `localStorage` only. Max Chunk Duration, Summarization Interval, and Rolling Window need a `/settings` POST endpoint so they actually affect the pipeline at runtime.
- [x] **Google OAuth** — working. Credentials in `.env`. If it breaks, check Google Cloud Console → Audience has the right test users and the redirect URI `http://localhost:8000/auth/google/callback` is still listed.
