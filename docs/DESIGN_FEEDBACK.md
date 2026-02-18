# Vision — Design Feedback (External LLMs)

**Purpose:** Consolidated second-opinion from Claude, Perplexity, and GPT on the MVP approach for: phrase trigger vs manual/“Start exam” gate, auto-capture, batch OpenAI Vision at end of session, and report merge. Use this when implementing frame capture, Vision pipeline, and report generation.

**Context:** Deepgram used only for full transcript ($200 credit); OpenAI API in .env for Vision. Goal: full audio + frames → transcript + AI-described frames → combined structured report.

**Use case:** Vision will be used with **fake patients** (training, demos). Including the Web Speech option is therefore valuable: it demonstrates that phrase-triggered phase detection can work in practice, not just in theory, without implying reliance on it for real-PHI production.

---

## 1. Consensus: Overall Architecture

All three agree:

- **Sound for MVP:** Deepgram = authoritative transcript only; lightweight trigger (or none); manual + optional auto frame capture; batch Vision at end of session; deterministic report merge.
- **Batch Vision at end:** Right call — no real-time AI during exam, predictable cost, one enrichment pass. Acceptable “report ready” delay (design for ~10–15 s).
- **Manual capture = primary:** Make manual frame capture obvious and easy (big button, shortcut). Any automation is a helpful extra, not something clinicians rely on.
- **Cost discipline:** Cap frames per session (e.g. 15–20); downscale/compress images before Vision; parallelize Vision calls server-side.

---

## 2. “When to Capture” — Consensus and Simplification

### Agreement across all three

- **Do not rely on Web Speech as a hard gate.** Use it only as advisory (e.g. “Exam phase detected — enable auto-capture?”).
- **Primary signal: explicit UI control.** A **“Start physical exam” / “Start exam mode”** button (or “Exam mode” with manual + auto-capture options right after “Begin session”) is the most reliable, audit-friendly, and clinician-friendly option.
- **GPT’s take:** For production with real patients, phrase detection can be overkill; “Start exam mode” + manual capture may be enough. For demos and training, phrase detection is still useful to show capability.

### Recommended MVP approach (including fake-patient / demo use)

1. **Primary:** “Start exam mode” button after session start + optional “Auto-capture every X seconds” toggle. Cap frames (e.g. max 15–20 per session; optional max per section). Manual capture remains the gold standard.
2. **Include Web Speech as an option:** Because Vision is used with **fake patients** (training, demos), ship Web Speech as an optional phrase trigger (e.g. “physical exam”, “let’s do your physical exam”). It proves the feature works in practice, not just in theory. On phrase detection: show a soft nudge (“Exam phase detected — enable auto-capture?”) or optionally auto-enable exam mode. If the API is unavailable or errors, hide the option and rely on the button. For real-PHI production later, keep Web Speech behind a gate or replace with the same ASR vendor (Perplexity: Web Speech often sends audio to third party; compliance concern for Quebec/Law 25 and HIPAA).

### Auto-capture limits (Perplexity + GPT)

- Only during “physical exam” / exam mode.
- Max 1 frame every 10–15 s (or 5–8 s); hard cap per session (e.g. 15–20 frames).
- Auto-captured frames clearly labeled; easy to bulk delete (“keep / discard”).

---

## 3. Batch Vision at End of Session

### Implementation guidance

- **Parallelize:** Use `Promise.all` (or equivalent) for frame descriptions; do not send sequentially (Claude, Perplexity).
- **Frame ↔ description mapping (Perplexity):** Do not rely on position/URL alone. Embed an explicit frame ID in the prompt (e.g. “Image A: [data]”, “Image B: [data]”) and require JSON output with `frame_id` echoed (e.g. `{ "frame_id": "A", "visual_description": "..." }`) so responses map reliably to frames.
- **Latency:** Design for 10–15 s; show “Generating report…” / “Report is being prepared…” and allow user to leave and return (async). Avoid 30–60 s surprises (Perplexity, GPT).
- **Image prep (GPT):** Downscale and compress (e.g. JPEG/WebP) before sending; no need for 4K for MVP — keeps cost and latency lower.

---

## 4. Vision Prompt Design (All Three)

### System / role

- Assisting with **documentation** of visual findings for **medico-legal** purposes.
- **Only describe what is directly visible.** Do not diagnose, infer cause, or prognosis. Neutral, objective language. No speculation.

### Context in request

- **Exam type** and **body region** (e.g. “Orthopedic shoulder exam”, “knee exam after workplace injury”) (Claude, Perplexity, GPT).
- **Transcript excerpt** around the frame timestamp to ground the description (e.g. “checking external rotation”) (Claude, Perplexity, GPT).

### Output format

- **Structured JSON per frame:** e.g. `frame_id`, `visual_description` (1–3 sentences, max length), optional `visibility`: `"ok" | "obscured" | "not_assessable"` to plug into “Not visually assessable” (Perplexity).
- **Explicitly forbid:** Measurements, severity grading unless visually obvious, “likely”, “consistent with”, “suggestive of” (Perplexity). If image quality is insufficient: “Image insufficient for clinical description” (GPT).

---

## 5. Report Merge (Current vs Improved)

- **Current:** Inspection = transcript; other sections = frame descriptions or “Not visually assessable.” Fine for MVP.
- **Improvement (GPT):** Longer term, consider a single merge step: “Using transcript + frame descriptions, generate structured sections (Inspection, ROM, Swelling, Scarring). Do not invent findings.” For MVP, current deterministic merge is acceptable; optional upgrade later.

---

## 6. Risks to Design For

| Risk | Mitigation |
|------|-------------|
| Web Speech unreliable / not available | Treat as optional; hide feature if unavailable; manual path always works. Included for fake-patient/demo use to show it can work. |
| Web Speech & PHI/compliance | For real-PHI production: gate or replace with same ASR vendor or in-house model. For fake patients/demos, acceptable as optional feature (Perplexity). |
| Vision latency 10–30 s | Progress UI; async; allow navigation away and return. |
| Vision cost | Cap frames; downscale/compress; parallelize. |
| Vision over-interpretation | Prompt constraints; show description next to frame; edits easy; AI = draft, clinician must accept (Perplexity). |
| localStorage / long sessions | Consider server-side session persist before go-live (Claude). |

---

## 7. Staged Implementation Plan (Synthesis)

**Phase 1 (MVP):**

1. Add **“Start exam mode”** (or “Start physical exam”) button after session start; optional **“Auto-capture”** toggle with rate limit (e.g. 1 frame / 10–15 s) and session cap (e.g. 15–20 frames).
2. **Include Web Speech as an option** for phrase-triggered phase detection (e.g. “physical exam”, “let’s do your physical exam”). Rationale: Vision is used with **fake patients** (training, demos), so having Web Speech demonstrates that the capability works in practice, not just theoretically. Implement as advisory only (nudge or optional auto-enable); if unavailable, hide it. For real-PHI production, gate or replace with contracted ASR.
3. **End session** → send session + frames to backend → backend runs **OpenAI Vision** in parallel with frame IDs in prompt and echoed in JSON; store `visual_description` (and optional `visibility`) per frame.
4. Show **“Generating report…”**; then load updated session and run existing report merge (transcript + frame descriptions).
5. **Vision prompt:** Specialty/body context, transcript excerpt per frame, structured JSON, no diagnosis/speculation.

**Phase 2 (optional):**

- Consider LLM merge step for report (transcript + frame descriptions → structured sections) instead of rule-based only.

---

## 8. Source Summary

| Source | Key emphasis |
|--------|------------------|
| **Claude** | Manual primary; Web Speech as enhancement; parallel Vision; “Start physical exam” button; structured Vision output; session persist consideration. |
| **Perplexity** | PHI/compliance gate for Web Speech; frame ID in Vision prompt for mapping; visibility field; explicit prompt forbids; cap frames and rate-limit auto-capture. |
| **GPT** | Simplify trigger: drop phrase detection for MVP; “Start exam mode” + auto-capture toggle; downscale images; transcript excerpt for Vision; avoid overautomation; keep it “boring and deterministic.” |

---

*Last updated: 2025-02-17. Reflects feedback from Claude, Perplexity, and GPT on Vision MVP frame capture and Vision pipeline design. Web Speech included as an option for fake-patient/demo use to demonstrate phrase-triggered phase detection works in practice.*
