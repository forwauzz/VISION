# Vision — Troubleshooting

## Audio capture and transcription

**Flow:** Microphone → MediaRecorder (10s chunks) → `transcribeAudioChunk()` → POST `/api/transcribe` (proxy to backend) → Deepgram API → segments shown in Live Transcript.

### POST /api/transcribe 400 (Bad Request)

- **Backend must be running:** `npm run server` (port 3009). The Vite dev server proxies `/api` to it. If the backend is not running, you may see connection errors or 502, not 400.
- **400 from our server:** We no longer return 400 for an empty body; we return 200 with `{ segments: [] }`.
- **400 from Deepgram:** If the request reaches our server and we forward the audio to Deepgram, a 400 usually means:
  - **Invalid or missing API key:** Set `DEEPGRAM_API_KEY` in `.env` and restart the server.
  - **Audio format / length:** We send `audio/webm` (or opus). Deepgram supports it; very short or silent chunks can sometimes be rejected. The client now sends the body as `ArrayBuffer` so the proxy forwards it correctly.
- **Check:** Open `http://localhost:3009/api/health`. If it returns `{"ok":true,"service":"vision-api"}`, the backend is up. If you get connection refused, start the server with `npm run server`.

### No transcript segments appearing

- Ensure you clicked **Start recording** and then **Start exam mode** (so the UI is ready).
- Wait at least ~10 seconds; the first chunk is sent after 10s.
- Check the browser console for the exact error (e.g. 503 = missing key, 400 = Deepgram rejected the audio).
- Ensure the microphone is allowed and not muted.

---

## Vision (frame descriptions)

**Flow:** End Session with frames → POST `/api/vision/describe-frames` → OpenAI Vision → descriptions merged into session.

### POST /api/vision/describe-frames 404 (Not Found)

- The backend that serves `/api/transcribe` and `/api/health` also serves `/api/vision/describe-frames`. If you get 404:
  - **Backend not running:** Start it with `npm run server`.
  - **Old process:** Restart the server so it loads the latest code (including the Vision route).
- Check: `http://localhost:3009/api/health` should return 200. If that works but Vision still 404s, restart the server.

### 503 Vision not configured

- Add `OPENAI_API_KEY` to `.env` and restart the server (`npm run server`).

---

## Summarize with AI (Transcript Review)

**Flow:** "Summarize with AI" → POST `/api/vision/summarize-session` (proxied to backend) → OpenAI → structured report sections.

### POST /api/vision/summarize-session 404 (Not Found)

- **Cause:** The request is proxied from the Vite dev server (e.g. port 5177) to the backend (port 3009). A **404 means the backend is not running** or the proxy target is unreachable.
- **Fix:** Start the API server in a separate terminal:
  ```bash
  npm run server
  ```
  Then keep it running while you use the app (e.g. `npm run dev` in another terminal).
- **Check:** Open `http://localhost:3009/api/health`. You should see `{"ok":true,"service":"vision-api"}`. If you get "Connection refused", the server is not running.
- **Optional:** For development, run two terminals: **Terminal 1** `npm run server`, **Terminal 2** `npm run dev`. Use the app at the Vite URL (e.g. http://localhost:5177); all `/api/*` requests will be proxied to the backend.
