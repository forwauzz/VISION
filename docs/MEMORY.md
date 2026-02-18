# Vision — Project Memory

**Purpose:** Single source of context for PRD, Stitch, implementation state, and decisions. Updated automatically at the end of each vision-loop by the Executive Reporter so the next loop (and the founder) has current context.

---

## 1. PRD summary

- **Product:** Vision — web-native, mobile-responsive multimodal documentation platform for clinicians. Multi-establishment SaaS.
- **MVP validates:** Simulated login, multiple establishments per user, in-browser camera + audio capture, timestamped frames, frame–transcript mapping, structured templates, layered editing (transcript | frame descriptions | structured exam), export. Not a diagnostic system.
- **Data model (conceptual):** User, Establishment, Membership (user_id, establishment_id, role), Session (user_id, establishment_id, exam_type, timestamps, transcript, frames, structured_output). PRD §6 schema: `audio_transcript[]` with start/end time, `frames[]` with frame_id, timestamp, linked_transcript_segment_id, visual_description; `structured_exam` with headings (e.g. Inspection, Active Range of Motion, Swelling, Scarring).
- **Auth (MVP):** Email/password, fake validation; if >1 establishment → selector, else Dashboard; store user_id, active_establishment_id (e.g. localStorage).
- **Non-goals (MVP):** Deterministic pose detection, EMR export, production DB hardening, full admin panel, real-time collaborative editing.

---

## 2. Stitch ↔ routes and PRD

| Route | Stitch screen | PRD |
|-------|----------------|-----|
| `/` | vision_landing_page | Marketing; Request Access → login |
| `/login` | login_screen_(desktop)_-_v1 | §4 Auth (simulated) |
| `/establishment-selector` | establishment_selector_(desktop)_-_v1 | §3 Multi-establishment |
| `/dashboard` | dashboard_(desktop)_-_v1 | §5.1 Dashboard |
| `/session` | session_screen_(desktop) | §5.2–5.6 Session (capture, transcript, frames, report) |
| `/review` | transcript_review_&_merge_(desktop) | §5.7 Layered editing, export |

**Design:** Primary `#c6a65d`, background dark `#111111`/`#121212`, Manrope + Playfair Display, Material Symbols Outlined. All UI derived from `stitch-extracted/stitch/*/code.html` (see `.cursor/rules/stitch-ui.mdc`).

---

## 3. Implementation state

**Stack:** Vite, React, React Router, Tailwind. Dev server port **5177**.

**Phases completed:**
- **Phase 1** — Project setup: `package.json`, Vite, Tailwind, `src/` layout (pages, components, lib, styles, templates), design tokens from Stitch.
- **Phase 2** — Design system: Stitch tokens in `tailwind.config.js`, shared CSS (gold-glow, glass-nav, hero-gradient, logo-underline, card-hover-effect, custom-scrollbar, active-glow, rec-pulse, serif-title, Material Symbols base).
- **Phase 3** — Static screens: All 6 Stitch screens implemented as React pages; routes wired; navigation flow Landing → Login → Establishment Selector → Dashboard → Session → Review → Dashboard.
- **Phase 4** — Auth + routing: `VISION_AUTH` in localStorage (schema in `src/lib/authStorageSchema.js`); `src/lib/auth.js` (getAuth, mockLogin, setActiveEstablishment, clearAuth); `ProtectedRoute` redirects unauthenticated users to `/login`; Login submit → mock login → redirect to establishment-selector if >1 establishment else dashboard; establishment card click persists `activeEstablishmentId` and navigates to dashboard; Dashboard shows user and active establishment; logout clears auth and redirects to login.
- **Phase 5** — Dashboard wiring: `VISION_SESSIONS` and SessionStub in `src/lib/sessionStorageSchema.js`; `src/lib/sessions.js` (getSessionsByEstablishment, createSessionStub, getSessionById, updateSession); Dashboard sessions list from storage (establishment-scoped), empty state; "BEGIN SESSION" → exam type modal (Shoulder/Scar) → create session stub → navigate to Session with context; session row click → `/session` or `/review` with sessionId; Session page reads session from state or by sessionId, redirects to dashboard if missing, shows session ID and exam type in header.

- **Phase 6** — Session Screen wiring: full session payload schema (audio_transcript, frames, structured_exam); `saveSessionPayload` in sessions.js; transcription proxy `server/index.js` (Express, POST /api/transcribe → Deepgram); Session page: getUserMedia + video, Start recording → MediaRecorder 10s chunks → transcribe API → live transcript; Capture Frame from video, link to segment; frame–transcript click sync; right panel from exam template (editable); End Session saves payload and navigates to /review. Run transcription: `npm run server` and set `DEEPGRAM_API_KEY` in .env.

- **Phase 7** — Transcript Review wiring: Load session by sessionId; editable transcript (with segment_id fallback); center panel Key Frames with transcript–frame sync (click segment → scroll to linked frame and highlight; click frame → highlight transcript segment); editable Structured Report; Export JSON; Finalize & Archive (saveSessionPayload, status completed, navigate to dashboard).
- **Phase 8** — Templates & schema: JSON templates in `templates/shoulder.json` and `templates/scar.json` (examType, headings, placeholders); `getTemplateForExamType(examType)` returns template per type; `mergeTranscriptAndFramesIntoStructuredExam(transcript, frames, template)` merges into structured_exam (Inspection = transcript text, others = frame descriptions or "Not visually assessable"); "Suggest from transcript & frames" button on Session and Transcript Review; `validateSessionPayload` and `validateStructuredExam` in `src/lib/validateSession.js` (PRD §6); validation warned on Export.
- **Phase 9** — Start exam mode + Vision: "Start exam mode" overlay, auto-capture toggle (10s, cap 20), Web Speech nudge, POST /api/vision/describe-frames, "Generating report…", visionApi.js, visibility/autoCaptured, OPENAI_API_KEY in .env.example.
- **Session summarization (OpenAI):** POST /api/vision/summarize-session (text-only): examType + transcript + frame descriptions → structured_exam (Inspection, ROM, Swelling, Scarring). "Summarize with AI" on Transcript Review merges AI output into report; no invention of findings (per DESIGN_FEEDBACK §5).
- **No mock data (auth only simulated):** Establishments: mockLogin returns empty list; user adds via Add Establishment form (addEstablishment in auth.js). Dashboard redirects to establishment-selector if 0 establishments. All other data: real capture, real APIs, localStorage sessions.

**Not yet done:** Post-MVP (e.g. PDF export, video storage, OCR).

**Key files:** `src/App.jsx`, `src/pages/*.jsx`, `src/components/ProtectedRoute.jsx`, `src/lib/auth.js`, `src/lib/authStorageSchema.js`, `src/lib/sessions.js`, `src/lib/sessionStorageSchema.js`, `src/lib/transcribe.js`, `src/lib/visionApi.js`, `src/lib/examTemplates.js`, `src/lib/validateSession.js`, `templates/shoulder.json`, `templates/scar.json`, `server/index.js` (transcribe + /api/vision/describe-frames), `vite.config.js` (proxy /api), `docs/DESIGN_FEEDBACK.md`, `src/index.css`, `tailwind.config.js`, `index.html`, `.cursor/rules/stitch-ui.mdc`, `docs/REVIEW_AND_PLAN.md`, `docs/ORCHESTRATION.md`.

**UI fixes applied:** Material Symbols variable font so icons render (not "play_arrow" text); `aria-hidden` and `select-none` on icon spans; `aria-label` on icon+text buttons; Dashboard session list overflow (min-w-0, truncate); Session footer layout (grid instead of absolute center) to prevent overlap.

---

## 4. Key decisions

| Topic | Decision |
|-------|----------|
| **Auth** | **Simulated only.** No real backend login. mockLogin + localStorage; establishments list starts empty — user adds via “Add Establishment” (functional). |
| **Everything else** | **No mock data.** Real capture, real transcription (Deepgram), real frame descriptions (OpenAI Vision), real summarization (OpenAI), session data in localStorage, export real JSON. Establishments are user-added only. |
| Exam type (Shoulder/Scar) | Add modal or step before Session (not in Stitch). |
| Add New Establishment | MVP: button can be no-op or "Coming soon". |
| Stitch UI | All frontend UI derived from Stitch `code.html`; no ad-hoc layouts. |
| Port | 5177. |
| Memory | This file; Executive Reporter updates it at end of each vision-loop. |

---

## 5. Loop history

*(Updated by Executive Reporter at end of each vision-loop. One line per cycle.)*

- 2025-02 — Created MEMORY; Phase 1–3 done; UI audit (icons, overlap, naming) done; next: Phase 4 Auth + routing.
- 2025-02-17 — Phase 4 Auth + routing implemented (auth schema, mockLogin, ProtectedRoute, establishment persistence, logout); QA pass; next: Phase 5 Dashboard wiring.
- 2025-02-17 — Phase 5 Dashboard wiring (sessions schema, sessions list from storage, exam type modal, Session context); QA pass; next: Phase 6 Session Screen wiring.
- 2025-02-17 — Phase 6 Session wiring (full session schema, Deepgram transcription proxy, video/audio capture, live transcript, frame capture and link, structured report, End Session persist); QA pass; next: Phase 7 Transcript Review wiring.
- 2025-02-17 — Phase 7 Transcript Review wiring (transcript–frame sync, segment_id fallback, Export JSON, Finalize & Archive); next: Phase 8 Templates & schema.
- 2025-02-17 — Phase 8 Templates & schema (JSON templates Shoulder/Scar, getTemplateForExamType per type, mergeTranscriptAndFramesIntoStructuredExam, Suggest button Session + Review, validateSessionPayload/validateStructuredExam); MVP phases complete.
- 2025-02-17 — Phase 9 Start exam mode + Vision (exam mode overlay, auto-capture toggle 10s/20 cap, Web Speech nudge, batch OpenAI Vision at end, Generating report…, visionApi.js, visibility/autoCaptured schema); planned items from MEMORY + DESIGN_FEEDBACK implemented and tested (build pass).
- 2025-02-17 — Session summarization with OpenAI: POST /api/vision/summarize-session, "Summarize with AI" on Transcript Review; transcript + frame descriptions → structured report sections (no invention of findings); build pass.
