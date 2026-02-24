# Vision — Implementation Summary

**Product:** Web-native, mobile-responsive multimodal documentation platform for clinicians (multi-establishment SaaS). MVP validates capture, transcription, frame–transcript mapping, structured templates, layered editing, and export — not a diagnostic system.

---

## What Was Implemented

### Stack & setup
- **Vite + React + React Router + Tailwind** on port **5177**
- Design system from Stitch (tokens, gold primary `#c6a65d`, dark background, Manrope + Playfair Display, Material Symbols)
- Six Stitch-derived screens with full navigation: Landing → Login → Establishment Selector → Dashboard → Session → Transcript Review → Dashboard

### Auth & multi-establishment (simulated)
- **Simulated login:** any email/password; no real backend
- **Establishments:** user adds via “Add Establishment”; `activeEstablishmentId` stored in localStorage
- **Protected routes:** unauthenticated users redirect to `/login`; zero establishments → redirect to establishment selector
- **Logout** clears auth and redirects to login

### Dashboard & sessions
- **Sessions** stored in localStorage per establishment (`VISION_SESSIONS`); list on Dashboard with empty state
- **BEGIN SESSION** → exam type modal (Shoulder / Scar) → creates session stub → navigates to Session with context
- Session row click → Session or Review by `sessionId`; Session page loads from state or by ID, else redirects to Dashboard

### Session screen (capture & report)
- **Video + audio:** getUserMedia, MediaRecorder (10s chunks), optional **live transcript** via Express proxy → Deepgram (`POST /api/transcribe`); requires `npm run server` + `DEEPGRAM_API_KEY`
- **Capture Frame** from video; frames linked to transcript segments; click sync between transcript and Key Frames
- **Structured report** from exam template (editable); **End Session** saves full payload (audio_transcript, frames, structured_exam) and navigates to `/review`
- **Exam mode:** “Start exam mode” overlay, optional auto-capture (10s interval, cap 20), Web Speech nudge; batch **OpenAI Vision** at end (`POST /api/vision/describe-frames`) for frame descriptions; “Generating report…” flow; requires `OPENAI_API_KEY`

### Transcript Review & export
- Load session by `sessionId`; **editable transcript** (with segment_id fallback)
- **Key Frames** panel: click segment → scroll to linked frame and highlight; click frame → highlight transcript segment
- **Editable Structured Report**; **Export JSON**; **Finalize & Archive** (status completed, navigate to Dashboard)
- **“Summarize with AI”:** `POST /api/vision/summarize-session` (OpenAI) — transcript + frame descriptions → structured_exam sections (Inspection, ROM, Swelling, Scarring); no invention of findings

### Templates & validation
- **JSON templates:** `templates/shoulder.json`, `templates/scar.json` (examType, headings, placeholders)
- **getTemplateForExamType(examType)**; **mergeTranscriptAndFramesIntoStructuredExam()** for report merge
- **“Suggest from transcript & frames”** on Session and Review
- **validateSessionPayload** and **validateStructuredExam** (PRD §6); validation on Export

### Data & APIs
- **No mock data** except auth: real capture, real Deepgram transcription, real OpenAI Vision descriptions, real summarization; sessions and establishments in localStorage
- **Env:** `DEEPGRAM_API_KEY`, `OPENAI_API_KEY` (see `.env.example`)

---

## Key files

| Area | Files |
|------|--------|
| App & routing | `src/App.jsx`, `src/components/ProtectedRoute.jsx` |
| Auth | `src/lib/auth.js`, `src/lib/authStorageSchema.js` |
| Sessions | `src/lib/sessions.js`, `src/lib/sessionStorageSchema.js` |
| Capture & APIs | `src/lib/transcribe.js`, `src/lib/visionApi.js` |
| Templates & validation | `src/lib/examTemplates.js`, `src/lib/validateSession.js`, `templates/*.json` |
| Backend | `server/index.js` (transcribe + `/api/vision/describe-frames`, `/api/vision/summarize-session`) |

---

## Not in MVP

Post-MVP: PDF export, video storage, OCR, production DB, full admin, real-time collaboration.
