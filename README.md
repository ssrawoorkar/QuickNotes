# QuickNotes
Ai note taking app so you can pay attention

---

## 🔧 Reminders / Future Fixes

- [ ] **Switch summarization model from `claude-sonnet-4-6` to `gpt-4.1-mini`** — Claude is overkill for this task. Update `MODEL` in `app/summarization/note_generator.py` and swap the `anthropic` client for the OpenAI SDK.
- [ ] **Wire settings to backend** — Settings page saves to `localStorage` only. Connect to a `/settings` POST endpoint so preferences (whisper model, chunk duration, summarize interval, rolling window) actually affect the recorder pipeline at runtime.
- [x] **Google OAuth** — working. Credentials in `.env`. If it breaks, check Google Cloud Console → Audience has the right test users and the redirect URI `http://localhost:8000/auth/google/callback` is still listed.
