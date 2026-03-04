# Session flows — What happens when

This document answers what happens when the user uses key controls on the Session screen.

---

## When you click **End session**

- **If you were recording (you had pressed Start recording):**
  1. Recording stops and the full video is processed.
  2. **Transcription:** The audio from the recording is sent to the transcription service and converted into a timestamped transcript.
  3. **Frames:** Key frames are automatically taken from the video at 10-second intervals (up to 20 frames). Each frame is linked to the nearest part of the transcript by time.
  4. **Vision:** Each frame is sent to the AI vision service to get a short clinical description of what is visible (e.g. range of motion, swelling, posture).
  5. **Report:** The transcript and frame descriptions are combined into a structured exam report (e.g. Inspection, Active Range of Motion, Swelling, Scarring) and saved with the session.
  6. You are taken to **Transcript Review**, where you can edit the report, add a SOAP-style summary, or finalize.

- **If you were not recording but you had captured frames manually (or with auto-capture):**
  - Any frames that do not yet have a vision description are sent to the AI to be described, then the report is built and saved. You are taken to Transcript Review.

- **If you had neither recording nor frames that need describing:**
  - Whatever transcript and frames you have (if any) are saved with the current report content, the session is marked completed, and you are taken to Transcript Review.

In all cases, the session appears in your dashboard as completed and can be reopened from the review page or the dashboard.

---

## When **Auto-capture (every 10s)** runs

- Auto-capture only runs when **all** of these are true:
  - You have started the exam (exam mode is active).
  - The **“Auto-capture (every 10s)”** checkbox is checked.
  - Recording is on (you have pressed Start recording).

- **What it does:** Every 10 seconds, the app takes a snapshot of the current video (live camera or the recorded replay), adds it as a key frame, and links it to the transcript at that time. Frames are labeled as “Auto” in the Key Frames strip. Up to 20 frames can be captured in a session.

- **If you turn off the checkbox or stop recording:** No new auto-captures are taken. Frames you already captured stay in the session.

- **Manual captures:** You can still press **Capture Frame** at any time to add a frame at the current moment, in addition to (or instead of) auto-capture.
