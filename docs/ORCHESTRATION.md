# Vision — Multi-Agent Orchestration

This is the **structured execution engine** for Vision. You (founder) set objectives; the Lead Technical Director distributes work; specialists execute; QA and Debug validate and fix; a simulated clinical reviewer evaluates UX; the Executive Reporter summarizes for you.

---

## Agents (8)

| Agent | Role | When to use |
|-------|------|-------------|
| **Lead Technical Director** | Orchestrator. Breaks objectives into tasks, assigns specialists, defines acceptance criteria. Never codes. | Start here: give it your objective. |
| **Frontend Engineer** | React/Next.js, MediaRecorder, getUserMedia, transcript/frame UI, dashboard, Stitch-aligned screens. | When Lead assigns UI or capture tasks. |
| **Backend Engineer** | REST APIs, transcription, Vision API, templates, session/frame/transcript logic. | When Lead assigns API or server tasks. |
| **Data/Schema Architect** | User, Establishment, Membership, Session, Frame, Transcript, structured output schemas. Multi-tenant design. | When Lead assigns data model or schema tasks. |
| **QA & Validation** | Compares implementation to acceptance criteria and PRD. Reports gaps and violations. Does not fix. | After specialists deliver; before Debug. |
| **Debug & Refactor** | Fixes QA issues, improves modularity, removes duplication. No new features. | After QA report; addresses issues. |
| **Simulated Human Reviewer** | Orthopedic-surgeon POV. Evaluates usability, transcript–frame clarity, friction. No code comments. | After QA/Debug; before final report. |
| **Executive Reporter** | Founder-facing summary: what was done, QA/fixes, clinical feedback, 3 recommendations, risks, next milestone. | At end of loop; gives you the consolidated report. |

All agents live in **`.cursor/agents/`** as Cursor subagents (`.md` with YAML frontmatter).

---

## Workflow loop

```
You → Lead Technical Director
        ↓
Lead → breaks objective into tasks, assigns owners
        ↓
Specialists → Frontend | Backend | Data/Schema (in order specified by Lead)
        ↓
QA & Validation → validates against acceptance criteria and PRD
        ↓
Debug & Refactor → fixes issues from QA (and optionally clinical feedback)
        ↓
Simulated Human Reviewer → evaluates UX and clinical clarity
        ↓
Executive Reporter → summarizes and reports back to you
```

---

## How to run the loop

### Option A — Slash command (recommended)

In Cursor chat, type **`/`** and choose **`vision-loop`** from the list (or type **`/vision-loop`**).

- **With objective:** `/vision-loop Build multi-establishment dashboard with switching`
- **Without objective:** `/vision-loop` — the AI will ask for your objective, then start the Lead and run the full loop.

The command is defined in **`.cursor/commands/vision-loop.md`**. It instructs the model to: invoke Lead Technical Director → run specialists in order → QA → Debug (if needed) → Simulated Human Reviewer → Executive Reporter, and present the final summary to you. No extra steps required.

### Option B — Step by step (manual)

### Step 1 — You set the objective

In chat, state what you want. Examples:

- *"Build multi-establishment dashboard with switching."*
- *"Wire the session screen: video capture, transcript panel, and frame capture button."*
- *"Add exam type selection (Shoulder/Scar) before starting a session."*

### Step 2 — Invoke the Lead Technical Director

Say something like:

- *"Use the Lead Technical Director subagent to plan and delegate: [paste your objective]."*

The Lead will:
- Break the objective into atomic tasks.
- Assign each task to Frontend Engineer, Backend Engineer, or Data/Schema Architect.
- Define acceptance criteria.
- Specify the order of execution (e.g. schema first, then backend, then frontend).

### Step 3 — Run specialists

You or the main AI can then invoke specialists in the order the Lead specified, e.g.:

- *"Use the data-schema-architect subagent to define the Session and Frame schema as specified by the Lead."*
- *"Use the backend-engineer subagent to implement the establishment switching endpoint per the Lead's task list."*
- *"Use the frontend-engineer subagent to implement the dashboard and establishment switcher per the Lead's spec."*

Each specialist returns implementation (and optionally a short explanation). No specialist should add scope beyond the assigned tasks.

### Step 4 — QA

After deliverables exist:

- *"Use the qa-validation subagent to validate the multi-establishment dashboard and switching against the Lead's acceptance criteria and the PRD."*

QA returns a structured report (Pass/Fail per criterion, issues with severity, summary). It does not fix anything.

### Step 5 — Debug

If QA (or the Simulated Human Reviewer) found issues:

- *"Use the debug-refactor subagent to fix the issues in the QA report: [paste or summarize issues]."*

Debug makes minimal, surgical changes and does not add features.

### Step 6 — Simulated Human Reviewer

When the flow is implementable end-to-end (even if mocked):

- *"Use the simulated-human-reviewer subagent to evaluate the Vision dashboard and establishment switching from a surgeon's perspective."*

The reviewer comments only on product and UX, not code.

### Step 7 — Executive Reporter

To close the loop and get your summary:

- *"Use the executive-reporter subagent to summarize this cycle: objective, what was built, QA results, debug changes, clinical feedback, and give me 3 recommendations and the next milestone."*

You get a single consolidated report: what was done, what’s fixed, what the “surgeon” said, what to do next, risks, and suggested next milestone.

---

## One-shot prompt (shortcut)

You can paste a single prompt that describes the full loop so the AI runs it in sequence:

```
Run the Vision orchestration loop for this objective: [YOUR OBJECTIVE]

1. Invoke Lead Technical Director to break into tasks and assign owners.
2. Run specialists in order (data-schema → backend → frontend as needed).
3. Run QA & Validation on the deliverables.
4. If QA found issues, run Debug & Refactor to fix them.
5. Run Simulated Human Reviewer for UX feedback.
6. Run Executive Reporter to produce the final summary for me.
```

The AI will invoke each subagent in turn and surface the Executive Reporter’s output as your final consolidated report.

---

## Rules of engagement

- **Lead** never implements; only plans and delegates.
- **Specialists** only do what the Lead assigned; no scope creep.
- **QA** only reports; **Debug** only fixes and refactors.
- **Simulated Human Reviewer** only evaluates product/UX.
- **Executive Reporter** is the only agent that speaks in a founder-facing, strategic summary.

This keeps the loop operational and repeatable.
