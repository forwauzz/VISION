# Vision — Repo Review & Implementation Plan

**Reviewed:** PRD, Stitch assets (6 screens: HTML + PNG), design system.  
**Goal:** Use Stitch HTML/images **exactly** as the frontend and wire the app to the PRD.

---

## 1. What’s in the repo

| Asset | Purpose |
|-------|--------|
| `prd.txt` | Product requirements (multi-establishment, capture, transcript, frames, templates, layered editing). |
| `stitch (6).zip` | 6 Stitch screens; each has `code.html` (Tailwind, standalone) + `screen.png`. |
| `stitch-extracted/` | Extracted zip: one folder per screen with `code.html` + `screen.png`. |
| `.env` | Local env (excluded from git). |

---

## 2. PRD ↔ Stitch mapping

| PRD section | Stitch screen | Notes |
|-------------|----------------|--------|
| **Marketing / entry** | `vision_landing_page` | Hero, value prop, “Request Access” → should route to login. |
| **§4 Auth (simulated)** | `login_screen_(desktop)_-_v1` | Email/password, “Enter Vision”; store user + prepare for establishment. |
| **§3 Multi-establishment** | `establishment_selector_(desktop)_-_v1` | After login: if >1 establishment → this screen; search, cards, “Add New Establishment”. |
| **§5.1 Dashboard** | `dashboard_(desktop)_-_v1` | Active establishment, “New Session” (BEGIN SESSION), recent sessions list, switch establishment. |
| **§5.2–5.6 Session** | `session_screen_(desktop)` | Create session, video capture, transcript, frames, template output. Exam type (Shoulder/Scar) not in Stitch — add step before or on this screen. |
| **§5.7 Layered editing + export** | `transcript_review_&_merge_(desktop)` | Edit transcript, link to video/frames, edit structured report; export / finalize. |

---

## 3. Screen-by-screen summary

### 3.1 Vision Landing Page
- **Role:** Public entry; “Request Access” and “Watch Showcase”.
- **Wiring:** “Request Access” (and possibly nav CTA) → navigate to **Login**.
- **Reuse:** Full page as-is (or as template). No app state.

### 3.2 Login Screen
- **Role:** Simulated login (PRD §4).
- **Elements:** Email, password, “Enter Vision”, “Request Credentials”, “Forgot?”.
- **Wiring:** On submit → validate (hardcoded/mock) → store `user_id` (and optionally `establishments[]`) in memory/localStorage → if user has **>1 establishment** → go to **Establishment Selector**; else **Dashboard** with `active_establishment_id` set.
- **Reuse:** Use `code.html` as the view; bind form to auth logic.

### 3.3 Establishment Selector
- **Role:** Choose active establishment after login (PRD §3, §5.1).
- **Elements:** Header (user “Dr. Alexander Vance”), search, grid of establishment cards, “Add New Establishment”.
- **Wiring:** On card click → set `active_establishment_id` in storage → go to **Dashboard**. Search filters the list (client-side for MVP). “Add New Establishment” can be disabled or modal for MVP.
- **Reuse:** Use `code.html`; data source = mock list of establishments per user.

### 3.4 Dashboard
- **Role:** Post–establishment selection home (PRD §5.1).
- **Elements:** Establishment dropdown (“Downtown Branch”), user, “BEGIN SESSION”, recent sessions list (In Progress / Completed), search, “View History”.
- **Wiring:** “BEGIN SESSION” → go to **exam type selection** then **Session Screen** (or directly to Session with default exam type). Session list = mocked or from local storage. Establishment dropdown → back to **Establishment Selector**.
- **Reuse:** Use `code.html`; feed sessions and current establishment from state/API.

### 3.5 Session Screen
- **Role:** Live capture + transcript + frames + structured output (PRD §5.2–5.6).
- **Layout:** Left: **Live Transcript** (timestamped, one “active” segment). Center: **Video** (REC, timer, 4K HDR) + **Key Frames** carousel. Right: **Surgical Report** (Procedure Notes, Clinical Findings, Recommendations). Bottom: Capture Frame, End Session, duration.
- **Wiring:**  
  - **Video:** `getUserMedia` + `MediaRecorder` (or equivalent); display in center panel.  
  - **Transcript:** Start audio recording; send to transcription API; append segments with `start_time` / `end_time`; highlight “active” segment (e.g. by current time or selection).  
  - **Frames:** “Capture Frame” → grab current video frame + timestamp; add to carousel; link to nearest transcript segment (PRD §5.5).  
  - **Click frame → highlight transcript; click transcript → show linked frames** (sync state).  
  - **Right panel:** Load template by exam type; merge transcript + frame descriptions into structured output; allow edit (PRD §5.6, §5.7).  
  - **End Session** → persist session (mocked or API) → go to **Transcript Review & Merge** (or Dashboard with “review” link).
- **Reuse:** Use `code.html` layout and styles; replace static content with live data and bind events.

### 3.6 Transcript Review & Merge
- **Role:** Post-session layered editing and export (PRD §5.7).
- **Layout:** Left: **Audio Transcript** (editable blocks, timestamps, “sync to video”). Center: **Video Context & OCR** (video + OCR chips, visual observation cards). Right: **Structured Report** (editable sections).
- **Wiring:** Load session by `session_id`. Transcript blocks editable; “arrow” syncs center panel to that timestamp. OCR/visual cards can be “merged” into report. Right panel = same structured report as in Session, editable. “Export” → JSON (and/or PDF if in scope). “Finalize & Archive” → mark complete, then Dashboard or session list.
- **Reuse:** Use `code.html`; feed session data; bind edit and export actions.

---

## 4. Design system (from Stitch HTML)

Use consistently when wiring or adding new UI:

| Token | Value | Usage |
|-------|--------|--------|
| **Primary** | `#c6a65d` | Buttons, accents, borders, highlights. |
| **Background dark** | `#111111` / `#121212` | Main app background. |
| **Surface/panel** | `#1a1a1a`, `#1e1e1e`, `#0a0a0a` | Sidebars, cards. |
| **Font display** | Manrope | Body, UI. |
| **Font serif** | Playfair Display | Brand “Vision”, section titles. |
| **Icons** | Material Symbols Outlined | From Google Fonts. |
| **Tailwind** | CDN with `plugins=forms,container-queries` | Dark mode: `class`. |

Shared CSS patterns in Stitch: `.gold-glow`, `.glass-nav`, `.custom-scrollbar`, `.active-glow`, `.rec-pulse`. Extract into a single shared stylesheet or Tailwind config when moving to a framework.

---

## 5. Data flow (MVP)

- **Auth:** Login (mock) → `user_id`, optional `establishments[]` → Establishment Selector or Dashboard.
- **Establishment:** Selection → `active_establishment_id` in storage → used in Dashboard and Session.
- **Session creation:** Dashboard “BEGIN SESSION” → choose exam type (Shoulder/Scar) → create `session_id`, `user_id`, `establishment_id`, `exam_type`, `timestamps.start` → open Session Screen.
- **During session:** Append `audio_transcript[]` and `frames[]`; link frames to transcript segments; build `structured_exam` from template + edits.
- **End session:** Save full session payload (PRD §6 schema) → redirect to Transcript Review or Dashboard.
- **Review:** Load session → edit transcript / report → Export JSON (and optionally “Finalize & Archive”).

---

## 6. Suggested implementation order

1. **Project setup** — Repo structure, dependency-free static build or small framework (e.g. Vite + vanilla or React), shared Tailwind config and design tokens from Stitch.
2. **Design system** — One shared layout/theme: colors, fonts, scrollbars, gold-glow; copy from Stitch `code.html` into components or global CSS.
3. **Static screens** — Serve each Stitch `code.html` as a route (Landing, Login, Establishment Selector, Dashboard, Session, Review) so we have exact UI and navigation skeleton.
4. **Auth + routing** — Simulated login and establishment selection; store `user_id`, `active_establishment_id`; route Landing → Login → (Selector if >1) → Dashboard.
5. **Dashboard wiring** — Sessions list (from storage), establishment switcher, “BEGIN SESSION” → exam type → Session Screen.
6. **Session Screen wiring** — Real video + audio capture, **real transcription API** (integrate one provider), real frame capture and frame–transcript linking, right panel from template; “End Session” persists full session and navigates.
7. **Transcript Review wiring** — Load real session data, editable transcript and report, sync to video time, **real Export** (JSON, optionally PDF) / Finalize.
8. **Templates & schema** — JSON templates for Shoulder/Scar (PRD §5.6); merge logic into `structured_exam`; validate against PRD §6 schema.

**Working MVP scope:** Auth stays simulated (no real login backend). Every other feature must be functional: real capture, real transcription, real persistence (e.g. localStorage or later backend), real export. No mocks for core flows.

---

## 7. Gaps / decisions

| Item | PRD | Stitch | Decision |
|------|-----|--------|----------|
| Exam type (Shoulder/Scar) | §5.2: user selects before “Start Session” | Not on screen | Add modal or step before Session Screen, or a bar on Session Screen. |
| “Add New Establishment” | — | Button on selector | MVP: hide or show “Coming soon”; no backend. |
| Request Credentials / Forgot? | — | On login | MVP: no-op or mailto. |
| Real transcription API | §5.4 | — | Integrate one provider; keep segment timestamps. |
| OCR in Review | — | Shown in center column | MVP: optional; can mock or skip. |

---

## 8. File layout suggestion

Keep Stitch as source of truth, app code separate:

```
VISION/
├── prd.txt
├── .env
├── docs/
│   └── REVIEW_AND_PLAN.md          # this file
├── stitch-extracted/                # unzipped Stitch (reference only)
│   └── stitch/
│       ├── vision_landing_page/
│       ├── login_screen_(desktop)_-_v1/
│       ├── establishment_selector_(desktop)_-_v1/
│       ├── dashboard_(desktop)_-_v1/
│       ├── session_screen_(desktop)/
│       └── transcript_review_&_merge_(desktop)/
├── src/                             # app to be added
│   ├── index.html
│   ├── styles/                      # shared design system
│   ├── pages/                       # one per screen, or routes
│   ├── lib/                         # auth, api, session state
│   └── templates/                  # JSON exam templates
└── package.json
```

Next step: choose stack (e.g. Vite + React or Vite + vanilla), then implement steps 1–3 (setup, design system, static routes from Stitch HTML).

---

## 9. Multi-agent orchestration

Vision uses a **Cursor multi-agent orchestration** for structured execution. See **[docs/ORCHESTRATION.md](ORCHESTRATION.md)** for the full workflow.

**Agents (in `.cursor/agents/`):** Lead Technical Director → Frontend Engineer, Backend Engineer, Data/Schema Architect → QA & Validation → Debug & Refactor → Simulated Human Reviewer → Executive Reporter.

**Loop:** You set objective → Lead delegates → Specialists implement → QA validates → Debug fixes → Human Reviewer evaluates UX → Executive Reporter summarizes for you.
