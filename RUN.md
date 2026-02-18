# How to run Vision

## 1. Run the app (required)

```bash
npm run dev
```

Then open **http://localhost:5177** in your browser.

- Login (any email/password) → pick establishment → Dashboard → **BEGIN SESSION** → choose exam type → Session page.
- Click **Start recording** to begin capture. The camera is already on; recording starts the timer and sends audio to the transcription server (if it’s running).

## 2. Run the transcription server (optional, for live transcript)

The **Start recording** button works without the server (video + frames + report work).  
To get **live transcript** in the left panel, run the server in a **second terminal**:

```bash
npm run server
```

Leave it running. Ensure `DEEPGRAM_API_KEY` is set in `.env` (see `.env.example`).

- **Terminal 1:** `npm run server` (transcription proxy on port 3009)
- **Terminal 2:** `npm run dev` (app on port 5177)

Vite proxies `/api/transcribe` to the server, so the app will use it when you record.
