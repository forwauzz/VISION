# Vision orchestration loop

You are starting the **Vision multi-agent orchestration loop**. Follow this sequence exactly.

**Context:** Implementation phases are defined in **`docs/REVIEW_AND_PLAN.md`** §6 (Suggested implementation order). Use them to scope and order work.

## 1. Objective

- If the user provided text after the command (e.g. `/vision-loop Build the dashboard`), that text is the **objective**.
- If **no objective was provided**, or the user said "start" / "begin" / "first phase" / "from the plan", use the **default starting phase** from REVIEW_AND_PLAN.md:
  - **Phase 1 — Project setup:** Repo structure, dependency-free static build or small framework (e.g. Vite + vanilla or React), shared Tailwind config and design tokens from Stitch. This is where we start.
- Otherwise ask: "What's the objective for this loop?" and wait for it.

**Phases (for reference when the Lead plans):** 1 Project setup → 2 Design system → 3 Static screens → 4 Auth + routing → 5 Dashboard wiring → 6 Session Screen wiring → 7 Transcript Review wiring → 8 Templates & schema.

## 2. Start with the Lead Technical Director

Invoke the **Lead Technical Director** subagent (`lead-technical-director`) with the objective. When the objective maps to a phase in REVIEW_AND_PLAN.md §6, tell the Lead which phase (e.g. "Phase 1 — Project setup") so it can define tasks and acceptance criteria accordingly.

The Lead must:
- Break the objective into atomic tasks.
- Assign each task to Frontend Engineer, Backend Engineer, or Data/Schema Architect.
- Define acceptance criteria for each task.
- Specify the order of execution (e.g. schema first, then backend, then frontend).

Do not skip this step. The Lead does not write code; it only plans and delegates.

## 3. Run specialists in order

For each task the Lead assigned, invoke the corresponding subagent in the order the Lead specified:

- **Data/Schema tasks** → `data-schema-architect`
- **Backend/API tasks** → `backend-engineer`
- **Frontend/UI tasks** → `frontend-engineer`

Pass the relevant task description and acceptance criteria to each specialist. Let each produce its deliverables before moving to the next.

## 4. QA validation

Invoke the **QA & Validation** subagent (`qa-validation`) with:
- The Lead's acceptance criteria.
- The deliverables from the specialists.

QA produces a structured report (Pass/Fail, issues with severity). Do not fix anything yet.

## 5. Debug (if QA found issues)

If QA reported Critical or Warning issues, invoke the **Debug & Refactor** subagent (`debug-refactor`) with the QA report and the affected code/files. The Debug agent fixes issues and refactors; it does not add features. Re-run QA on changed areas if needed.

## 6. Simulated Human Reviewer

Invoke the **Simulated Human Reviewer** subagent (`simulated-human-reviewer`) to evaluate the feature from an orthopedic surgeon's perspective (usability, clarity, friction). This agent comments only on product/UX, not code.

## 7. Executive Reporter — final summary and memory update

Invoke the **Executive Reporter** subagent (`executive-reporter`) to produce the consolidated report. It must include:

- What was done.
- QA findings and what was fixed.
- Simulated clinical feedback.
- Exactly 3 recommendations.
- Risks.
- Next milestone.

**Then the Executive Reporter must update `docs/MEMORY.md`** (without the user asking): append one line to the **Loop history** section and, if the cycle changed implementation state or decisions, refresh the **Implementation state** and **Key decisions** sections. This keeps context for the next loop and the founder.

Present the Executive Reporter's output clearly to the user as the **final summary** of this loop.

---

**In short:** Lead → Specialists (in order) → QA → Debug (if needed) → Human Reviewer → Executive Reporter (summary + update docs/MEMORY.md) → show the user the final report.
