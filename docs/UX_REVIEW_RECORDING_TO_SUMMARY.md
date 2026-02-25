# UX Review: Begin Recording → Generating a Summary

**Scope:** Dashboard (Begin session) → Exam type modal → Session (start recording, recording, end session) → Loading (analyzing / generating report) → Transcript Review (summary, finalize).

**Platform:** Web (Vision clinical capture app). **Target users:** Surgeons / clinicians capturing exam sessions.

---

## Flow Summary

1. **Dashboard** — User clicks "Begin session" → exam type modal (Shoulder / Scar / Orthopedic, optional body region) → "Starting session…" loading → Session page.
2. **Session (pre-record)** — Camera preview, "Start recording" CTA. Optional "Starting session…" while camera/mic/transcription prepare.
3. **Session (recording)** — Live transcript (left), video (center), Surgical Report (right). Optional overlay: "Start exam mode" to enable frame capture. Footer: Capture Frame, End Session.
4. **End Session** — User clicks "End Session" → full-screen loading: "Analyzing recording…" (30–60s) then "Generating report…" (10–15s) → auto-navigate to Review.
5. **Transcript Review** — Transcript, Key Frames, Structured Report. Actions: "Suggest from transcript & frames", "Summarize with AI", "Finalize & Archive".

---

## Heuristic Evaluation

| Issue | Heuristic violated | Severity | Recommendation |
|-------|--------------------|----------|-----------------|
| User doesn’t know what “End Session” will do (transcribe + describe + 30–60s wait, then redirect). | **Visibility of system status** | Major | Before starting analysis: show a short confirmation or inline copy, e.g. “End session will transcribe the recording, describe frames, and build your report (about 1 min). Continue?” Optional: progress steps (Transcribing → Extracting frames → Describing → Done). |
| Long full-screen loading (30–60s) with no progress or step indication. | **Visibility of system status** | Major | Add step-based progress (e.g. “Step 1/3: Transcribing…”, “Step 2/3: Extracting frames…”, “Step 3/3: Building report…”). Keep GoldenVLoading; add a progress indicator or step list. |
| “Start exam mode” appears only after recording starts; no upfront explanation that frame capture is a separate step. | **Recognition rather than recall** | Minor | On first visit or in empty state: one line under “Start recording”, e.g. “You’ll be prompted to start exam mode to capture key frames.” Or add a short tooltip/label near the CTA. |
| “End Session” uses icon `cancel` (suggesting “cancel/abort”), but the action is “finish and generate report”. | **Match between system and real world** | Major | Use a “finish/complete” icon (e.g. `stop_circle`, `check_circle`, `flag`) and consider label “Finish & generate report” or “End & generate report” so intent is clear. |
| No way to cancel or go back once “Analyzing recording…” has started. | **User control and freedom** | Minor | Allow “Cancel” during analysis only if technically feasible (e.g. abort transcription). If not, at least show “This may take 30–60 seconds” and avoid blocking the whole UI if possible. |
| Two different loading messages (“Analyzing recording…” vs “Generating report…”) without explaining the transition. | **Consistency and standards** | Minor | Use one continuous flow with sub-steps (e.g. same overlay, same component, with step title + optional progress bar) so the transition doesn’t feel like a second unrelated wait. |
| Review page: “Summarize with AI” is separate from the automatic post–End Session summary; users may not know they already have a report. | **Recognition rather than recall** | Minor | On Review load, if report was just generated: short banner “Report generated from your session. Edit below or run Summarize with AI for a fresh pass.” Clarify that End Session already produced a structured report. |
| Capture Frame disabled when not in exam mode; no inline explanation why. | **Help users recognize, diagnose, recover from errors** | Minor | When disabled, show tooltip or inline hint: “Start exam mode above to capture frames,” or keep the overlay copy that says “Start exam mode to capture key frames.” |
| 5‑minute video cap: message appears after the fact (“Video recording stopped at 5 min”). | **Error prevention** | Minor | Add a soft warning before the cap (e.g. at 4:30: “Video will stop at 5 min. You can keep recording audio and capture from recorded video.”). |
| Session footer: “End Session” and “Capture Frame” are equal weight; primary action (End) is white, secondary (Capture) is outline. | **Aesthetic and minimalist design** | Minor | Align with goal: End Session is the main exit; keep it primary. Ensure “Capture Frame” is clearly secondary (e.g. outline) so hierarchy is obvious. |

---

## Design Critique

### What works well

- **Clear entry point:** Dashboard “Begin session” and exam type modal are easy to find and understand.
- **Persistent context:** Session ID and exam type in the header; duration and REC state visible during recording.
- **GoldenVLoading:** Branded, accessible (`role="status"`, `aria-live="polite"`), and sets expectation with subMessage (e.g. 30–60s).
- **Review layout:** Three-column layout (Transcript, Frames, Report) supports the task; “Suggest from transcript & frames” and “Summarize with AI” are discoverable.
- **Finalize & Archive:** Single clear CTA to leave Review and return to Dashboard.

### Issues (prioritized)

1. **No confirmation before long-running “End Session”.** User commits to 30–60s with no undo and no explanation of steps. *Rationale:* Reduces anxiety and sets expectations.
2. **Progress during analysis is opaque.** Two messages (“Analyzing…” then “Generating…”) feel like two separate black boxes. *Rationale:* Step visibility improves perceived performance and trust.
3. **“End Session” icon/label suggests cancel.** Icon `cancel` and label “End Session” don’t communicate “finish and generate report.” *Rationale:* Correct affordance reduces misclicks and confusion.
4. **Exam mode is a second step after “Start recording”.** Users may not know they need to enable exam mode to capture frames. *Rationale:* Upfront or contextual hint improves recognition.
5. **Review: relationship between auto-generated report and “Summarize with AI” is unclear.** Users may re-summarize unnecessarily or not know the report is already built. *Rationale:* Clarifying copy reduces duplicate work and confusion.

### Suggested improvements

- **End Session flow:** Add a confirmation step: “End session and generate report? This will take about 1 minute.” [Cancel] [End & generate report]. Then show step-based progress (Transcribing → Extracting frames → Building report) in the same full-screen overlay.
- **Session CTA:** Change “End Session” to “Finish & generate report” (or “End & generate report”) and use a finish/stop icon instead of `cancel`.
- **Session empty state:** One line under “Start recording”: “After you start, you can enable exam mode to capture key frames.”
- **Review banner:** When arriving from Session with a freshly generated report: “Report generated. Edit sections below or run Summarize with AI to regenerate.”
- **Video cap:** At 4:30, show a non-blocking message: “Video stops at 5 min. Audio continues; you can capture frames from the recording.”

### Quick wins

- Replace “End Session” label with “Finish & generate report” and icon with `stop_circle` or `check_circle`.
- Add one line under the main CTA when not recording: “You’ll be able to start exam mode to capture key frames once recording has started.”
- In GoldenVLoading for analysis: show a small step list (e.g. “1. Transcribing audio · 2. Extracting frames · 3. Building report”) and update the active step as the pipeline progresses.
- On Review, when `location.state?.fromSession === true` (or similar), show a short banner: “Report generated from your session. Edit below or use Summarize with AI to refine.”

### Strategic improvements

- **Unified “generating summary” experience:** Single full-screen state from “End Session” to “Report ready,” with step-by-step progress and consistent copy (no separate “Analyzing” vs “Generating” mental model).
- **Optional in-session preview:** After a few frames, show a minimal “Report preview” or “Draft report” so the user knows what will be generated (could be Phase 2).
- **Accessibility:** Ensure loading overlay is focus-trapped and announced by screen readers; consider `aria-busy="true"` on a container and clear “loading” vs “ready” states for key actions.

---

## Summary

The flow from **begin recording** to **generating a summary** is logically sound but has gaps in **visibility of system status** (what “End Session” does, what happens during 30–60s) and **match between system and real world** (icon/label for “finish and generate report”). The largest impact will come from:

1. Confirming “End Session” and explaining the ~1 min wait.
2. Showing step-by-step progress during analysis.
3. Renaming and re-iconing “End Session” to “Finish & generate report.”
4. Clarifying on Review that a report was already generated and what “Summarize with AI” does.

Implementing the quick wins above will improve clarity and perceived control without large refactors.
