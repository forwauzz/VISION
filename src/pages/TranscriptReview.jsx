/**
 * Vision Transcript Review & Merge — loads session by sessionId, shows real transcript/frames/report.
 * Transcript–frame sync: click segment → scroll to linked frame; click frame → highlight segment.
 * When recording storage is enabled, shows Recording section and Re-run analysis per case.
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { getSessionById, saveSessionPayload } from '../lib/sessions.js'
import GoldenVLoading from '../components/GoldenVLoading.jsx'
import { mergeTranscriptAndFramesIntoStructuredExam, getTemplateForExamType } from '../lib/examTemplates.js'
import { validateSessionPayload } from '../lib/validateSession.js'
import { summarizeSession, describeFrames } from '../lib/visionApi.js'
import * as recordingStorage from '../lib/recordingStorage.js'
import { transcribeVideo } from '../lib/transcribe.js'
import { extractFramesFromVideoBlob } from '../lib/videoFrameExtract.js'

function formatSegmentTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TranscriptReview() {
  const navigate = useNavigate()
  const location = useLocation()
  const sessionId = location.state?.sessionId || new URLSearchParams(location.search).get('sessionId')
  const session = sessionId ? getSessionById(sessionId) : null

  const [transcript, setTranscript] = useState([])
  const [localFrames, setLocalFrames] = useState([])
  const [structuredExam, setStructuredExam] = useState({})
  const [activeSegmentId, setActiveSegmentId] = useState(null)
  const [summarizing, setSummarizing] = useState(false)
  const [summarizeError, setSummarizeError] = useState('')
  const [hasRecording, setHasRecording] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState(null)
  const [reRunningAnalysis, setReRunningAnalysis] = useState(false)
  const [reRunError, setReRunError] = useState('')
  const [dismissFromSessionBanner, setDismissFromSessionBanner] = useState(false)
  const frameRefsMap = useRef({})

  useEffect(() => {
    if (!sessionId) {
      navigate('/dashboard', { replace: true })
      return
    }
    const loaded = getSessionById(sessionId)
    if (!loaded) {
      navigate('/dashboard', { replace: true })
      return
    }
    const segments = (loaded.audio_transcript ?? []).map((s, i) => ({
      ...s,
      segment_id: s.segment_id ?? `seg-review-${i}`,
    }))
    setTranscript(segments)
    setLocalFrames(loaded.frames ? [...loaded.frames] : [])
    setStructuredExam(loaded.structured_exam ? { ...loaded.structured_exam } : {})
  }, [sessionId, navigate])

  useEffect(() => {
    if (!recordingStorage.enabled() || !sessionId) {
      setHasRecording(false)
      return
    }
    recordingStorage.has(sessionId).then(setHasRecording)
  }, [sessionId])

  useEffect(() => {
    return () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl)
    }
  }, [recordingUrl])

  const frames = localFrames
  const totalDuration = transcript.length > 0
    ? Math.max(...transcript.map((s) => s.end_time ?? 0))
    : 0

  useEffect(() => {
    if (!activeSegmentId) return
    const el = frameRefsMap.current[activeSegmentId]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeSegmentId])

  function handleTranscriptChange(index, text) {
    setTranscript((prev) => {
      const next = [...prev]
      if (next[index]) next[index] = { ...next[index], text }
      return next
    })
  }

  function handleExport() {
    const payload = {
      sessionId,
      session: session ? { id: session.id, examType: session.examType, startedAt: session.startedAt, endAt: session.endAt } : null,
      audio_transcript: transcript,
      frames: frames.map((f) => ({ frame_id: f.frame_id, timestamp: f.timestamp, linked_transcript_segment_id: f.linked_transcript_segment_id, visual_description: f.visual_description })),
      structured_exam: structuredExam,
    }
    const validation = validateSessionPayload({ ...session, audio_transcript: transcript, frames, structured_exam: structuredExam })
    if (!validation.valid) console.warn('[Vision] Export schema warnings:', validation.errors)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `vision-session-${sessionId || 'export'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function handleSummarizeWithAI() {
    if (!session?.examType) return
    setSummarizeError('')
    setSummarizing(true)
    try {
      const template = getTemplateForExamType(session.examType)
      const payload = {
        examType: session.examType,
        audio_transcript: transcript.map((s) => ({ text: s.text })),
        frames: localFrames.map((f) => ({ visual_description: f.visual_description })),
        headings: Object.keys(template),
      }
      const structured_exam = await summarizeSession(payload)
      setStructuredExam((prev) => ({ ...prev, ...structured_exam }))
    } catch (e) {
      setSummarizeError(e.message || 'Summarization failed')
    } finally {
      setSummarizing(false)
    }
  }

  function handleFinalize() {
    if (!sessionId) return
    saveSessionPayload(sessionId, {
      audio_transcript: transcript,
      frames: localFrames,
      structured_exam: structuredExam,
    })
    navigate('/dashboard', { replace: true })
  }

  function handleFrameDescriptionChange(frameId, value) {
    setLocalFrames((prev) => prev.map((f) => (f.frame_id === frameId ? { ...f, visual_description: value } : f)))
  }

  const handleOpenRecording = useCallback(async () => {
    if (!sessionId) return
    const blob = await recordingStorage.get(sessionId)
    if (!blob) return
    setRecordingUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(blob)
    })
    setReRunError('')
  }, [sessionId])

  const handleReRunAnalysis = useCallback(async () => {
    if (!sessionId || !session?.examType) return
    setReRunError('')
    setReRunningAnalysis(true)
    try {
      const blob = await recordingStorage.get(sessionId)
      if (!blob) {
        setReRunError('No recording found for this session.')
        return
      }
      const audio_transcript = await transcribeVideo(blob)
      const sessionStartMs = session.startedAt ? new Date(session.startedAt).getTime() : Date.now()
      const extractedFrames = await extractFramesFromVideoBlob(
        blob,
        { intervalSeconds: 10, maxFrames: 20 },
        audio_transcript,
        sessionStartMs
      )
      const payloadForVision = {
        examType: session.examType,
        audio_transcript: audio_transcript.map((s) => ({ text: s.text, start_time: s.start_time, end_time: s.end_time, segment_id: s.segment_id })),
        frames: extractedFrames.map((f) => ({ frame_id: f.frame_id, timestamp: f.timestamp, linked_transcript_segment_id: f.linked_transcript_segment_id, visual_description: f.visual_description || '', dataUrl: f.dataUrl, autoCaptured: f.autoCaptured })),
      }
      const updatedFrames = await describeFrames(payloadForVision)
      const payload = {
        audio_transcript: audio_transcript.map((s) => ({ text: s.text, start_time: s.start_time, end_time: s.end_time })),
        frames: updatedFrames.map((f) => ({ frame_id: f.frame_id, timestamp: f.timestamp, linked_transcript_segment_id: f.linked_transcript_segment_id, visual_description: f.visual_description || '', visibility: f.visibility, autoCaptured: f.autoCaptured, dataUrl: f.dataUrl })),
        structured_exam: mergeTranscriptAndFramesIntoStructuredExam(audio_transcript, updatedFrames, getTemplateForExamType(session.examType)),
      }
      saveSessionPayload(sessionId, payload)
      const segments = (payload.audio_transcript ?? []).map((s, i) => ({
        ...s,
        segment_id: s.segment_id ?? `seg-review-${i}`,
      }))
      setTranscript(segments)
      setLocalFrames(payload.frames ? [...payload.frames] : [])
      setStructuredExam(payload.structured_exam ? { ...payload.structured_exam } : {})
    } catch (e) {
      setReRunError(e.message || 'Re-run analysis failed')
    } finally {
      setReRunningAnalysis(false)
    }
  }, [sessionId, session?.examType, session?.startedAt])

  function handleMergeIntoReport(frame) {
    const template = getTemplateForExamType(session?.examType)
    const headings = Object.keys(template || {})
    const firstHeading = headings[0] || 'Inspection'
    const text = (frame.visual_description || '').trim()
    if (!text) return
    setStructuredExam((prev) => {
      const current = (prev[firstHeading] || '').trim()
      const appended = current ? `${current}\n• ${text}` : text
      return { ...prev, [firstHeading]: appended }
    })
  }

  if (!session) return null

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-200 antialiased overflow-hidden h-screen flex flex-col">
      {summarizing && (
        <GoldenVLoading
          message="Summarizing with AI…"
          subMessage="Building structured report from transcript and key frames. This may take a few seconds."
        />
      )}
      {reRunningAnalysis && (
        <GoldenVLoading
          message="Re-running analysis…"
          subMessage="Transcribing recording, extracting frames, and describing. This may take 30–60 seconds."
        />
      )}
      <header className="flex h-16 items-center justify-between border-b border-border-muted bg-background-dark px-6 shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-sm font-medium">
            <span className="material-symbols-outlined text-lg">dashboard</span>
            Dashboard
          </Link>
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">visibility</span>
            <h2 className="text-xl font-extrabold tracking-tight text-white font-display">VISION</h2>
          </div>
          <div className="h-6 w-px bg-border-muted" />
          <h1 className="text-sm font-semibold text-slate-400 tracking-wider uppercase">Review & Merge</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-500">{session.examType} • {session.id.slice(0, 20)}</span>
          <button type="button" onClick={handleExport} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-background-dark transition-all hover:bg-primary/90">
            <span className="material-symbols-outlined text-sm">ios_share</span>
            Export JSON
          </button>
        </div>
      </header>

      <main className="flex flex-1 min-h-0 overflow-hidden flex-col">
        {location.state?.fromSession && !dismissFromSessionBanner && (
          <div className="px-6 py-3 flex items-center justify-between gap-4 bg-primary/10 border-b border-primary/20 shrink-0">
            <p className="text-sm text-white/90">Report generated from your session. Edit sections below or use Summarize with AI to refine.</p>
            <button type="button" onClick={() => setDismissFromSessionBanner(true)} className="text-white/60 hover:text-white shrink-0" aria-label="Dismiss">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        <div className="flex flex-1 min-h-0 overflow-hidden">
        <section className="flex w-1/4 flex-col border-r border-border-muted bg-charcoal-accent/50 min-w-0">
          <div className="flex items-center justify-between border-b border-border-muted p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="material-symbols-outlined text-lg">mic</span>
              Audio Transcript
            </h3>
            <span className="text-[10px] font-medium text-slate-500">{formatSegmentTime(totalDuration)} TOTAL</span>
          </div>
          <div className="custom-scroll flex-1 overflow-y-auto p-4 space-y-4">
            {transcript.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No transcript for this session.</p>
            ) : (
              transcript.map((seg, i) => (
                <div
                  key={seg.segment_id ?? i}
                  role="button"
                  tabIndex={0}
                  className={`rounded-xl border p-4 transition-all cursor-pointer ${activeSegmentId === (seg.segment_id ?? i) ? 'border-primary bg-primary/10 active-glow' : 'border-border-muted hover:border-primary/30 hover:bg-primary/5'}`}
                  onClick={() => setActiveSegmentId(seg.segment_id ?? i)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveSegmentId(seg.segment_id ?? i); } }}
                >
                  <span className="text-xs font-bold text-primary/80 block mb-2">{formatSegmentTime(seg.start_time)} — Sync to frame</span>
                  <textarea className="w-full min-h-[60px] text-sm leading-relaxed text-slate-300 bg-transparent border-none focus:ring-0 focus:text-white resize-y outline-none pointer-events-auto" value={seg.text} onChange={(e) => handleTranscriptChange(i, e.target.value)} onClick={(e) => e.stopPropagation()} />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="flex flex-1 flex-col border-r border-border-muted bg-background-dark min-w-0">
          {recordingStorage.enabled() && hasRecording && (
            <div className="border-b border-border-muted p-4 space-y-3 bg-charcoal-accent/30">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <span className="material-symbols-outlined text-lg">video_library</span>
                Recording
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={handleOpenRecording} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/50 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors" aria-label="Open recording">
                  <span className="material-symbols-outlined text-sm" aria-hidden>play_circle</span>
                  Open recording
                </button>
                <button type="button" disabled={reRunningAnalysis} onClick={handleReRunAnalysis} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/50 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors disabled:opacity-60 disabled:cursor-wait" aria-label="Re-run analysis from recording">
                  <span className="material-symbols-outlined text-sm" aria-hidden>refresh</span>
                  {reRunningAnalysis ? 'Analyzing…' : 'Re-run analysis'}
                </button>
              </div>
              {reRunError && <p className="text-xs text-red-400">{reRunError}</p>}
              {recordingUrl && (
                <div className="rounded-lg border border-white/10 overflow-hidden bg-black aspect-video max-w-md">
                  <video src={recordingUrl} controls muted playsInline className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between border-b border-border-muted p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="material-symbols-outlined text-lg">videocam</span>
              Key Frames
            </h3>
          </div>
          <div className="custom-scroll flex-1 overflow-y-auto p-6 flex flex-wrap gap-4 content-start">
            {frames.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 w-full">No frames captured.</p>
            ) : (
              frames.map((f) => (
                <div
                  key={f.frame_id}
                  ref={(el) => { if (el && f.linked_transcript_segment_id) frameRefsMap.current[f.linked_transcript_segment_id] = el }}
                  className={`rounded-xl border overflow-hidden flex-shrink-0 w-[220px] transition-all ${activeSegmentId === f.linked_transcript_segment_id ? 'border-primary ring-2 ring-primary/40 active-glow' : 'border-border-muted bg-charcoal-accent hover:border-primary/40'}`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => setActiveSegmentId(f.linked_transcript_segment_id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveSegmentId(f.linked_transcript_segment_id); } }}
                  >
                    <div className="aspect-video w-full bg-slate-800 relative">
                      {f.dataUrl ? <img src={f.dataUrl} alt="Frame" className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No image</div>}
                      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white/80">{new Date(f.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className="p-2 space-y-2">
                    <textarea
                      className="w-full min-h-[60px] text-xs leading-relaxed text-slate-300 bg-white/5 border border-white/10 rounded p-2 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-y outline-none"
                      value={f.visual_description || ''}
                      onChange={(e) => handleFrameDescriptionChange(f.frame_id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Frame description…"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleMergeIntoReport(f); }}
                      className="flex items-center gap-1.5 w-full justify-center px-2 py-1.5 rounded border border-primary/50 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors"
                      aria-label="Merge this frame description into report"
                    >
                      <span className="material-symbols-outlined text-sm" aria-hidden>add_circle</span>
                      Merge into report
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="flex w-1/3 flex-col bg-charcoal-accent min-w-[280px]">
          <div className="flex items-center justify-between border-b border-border-muted p-4 bg-background-dark/30">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="material-symbols-outlined text-lg">description</span>
              Structured Report
            </h3>
          </div>
          <div className="px-4 pt-2 space-y-2">
            <button type="button" onClick={() => setStructuredExam(mergeTranscriptAndFramesIntoStructuredExam(transcript, frames, getTemplateForExamType(session.examType)))} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/50 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors" aria-label="Suggest from transcript and frames">
              <span className="material-symbols-outlined text-sm" aria-hidden>auto_awesome</span>
              Suggest from transcript & frames
            </button>
            <button type="button" disabled={summarizing} onClick={handleSummarizeWithAI} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/50 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors disabled:opacity-60 disabled:cursor-wait" aria-label="Summarize with AI">
              <span className="material-symbols-outlined text-sm" aria-hidden>summarize</span>
              {summarizing ? 'Summarizing…' : 'Summarize with AI'}
            </button>
            {summarizeError && <p className="text-xs text-red-400">{summarizeError}</p>}
          </div>
          <div className="custom-scroll flex-1 overflow-y-auto p-6 space-y-4">
            {Object.keys(getTemplateForExamType(session?.examType)).map((heading) => (
              <div key={heading} className="border-b border-border-muted pb-4 last:border-b-0 last:pb-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mb-1.5">{heading}</p>
                <textarea
                  className="w-full text-sm leading-relaxed text-slate-300 bg-transparent resize-none outline-none border-none focus:ring-0 placeholder:text-slate-600 min-h-[2.5rem]"
                  value={structuredExam[heading] || ''}
                  rows={2}
                  onChange={(e) => setStructuredExam((prev) => ({ ...prev, [heading]: e.target.value }))}
                  placeholder="—"
                />
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-border-muted bg-background-dark/80 backdrop-blur-md">
            <button type="button" onClick={handleFinalize} className="w-full flex items-center justify-center gap-3 rounded-xl bg-primary py-4 text-sm font-black uppercase tracking-[0.2em] text-background-dark shadow-lg shadow-primary/20 transition-transform active:scale-95 hover:brightness-110">
              Finalize & Archive
              <span className="material-symbols-outlined">verified</span>
            </button>
          </div>
        </section>
        </div>
      </main>
    </div>
  )
}
