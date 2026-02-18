/**
 * Vision Session Screen — Phase 6 + post-MVP: exam mode, auto-capture, Web Speech nudge, batch Vision at end.
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { getSessionById, saveSessionPayload, updateSession } from '../lib/sessions.js'
import GoldenVLoading from '../components/GoldenVLoading.jsx'
import { getAuth } from '../lib/auth.js'
import { transcribeAudioChunk } from '../lib/transcribe.js'
import { getTemplateForExamType, mergeTranscriptAndFramesIntoStructuredExam, structuredExamToSingleText, singleTextToStructuredExam } from '../lib/examTemplates.js'
import { describeFrames } from '../lib/visionApi.js'

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

function formatSegmentTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Session() {
  const navigate = useNavigate()
  const location = useLocation()
  const sessionId = location.state?.sessionId || new URLSearchParams(location.search).get('sessionId')
  const session = location.state?.session ?? (sessionId ? getSessionById(sessionId) : null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const elapsedRef = useRef(0)

  const [transcriptSegments, setTranscriptSegments] = useState([])
  const [frames, setFrames] = useState([])
  const [structuredExam, setStructuredExam] = useState({})
  const [startTime, setStartTime] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [activeSegmentId, setActiveSegmentId] = useState(null)
  const [transcribeError, setTranscribeError] = useState('')
  const [captureError, setCaptureError] = useState('')
  const [isStartingRecording, setIsStartingRecording] = useState(false)
  const [examModeActive, setExamModeActive] = useState(false)
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [visionError, setVisionError] = useState('')
  const [showExamPhaseNudge, setShowExamPhaseNudge] = useState(false)
  const lastAutoCaptureRef = useRef(0)
  const autoCaptureIntervalRef = useRef(null)
  const framesCountRef = useRef(0)
  const chunkTimeoutRef = useRef(null)
  const restartAfterChunkRef = useRef(false)
  const audioStreamRef = useRef(null)
  const recorderOptionsRef = useRef({})
  framesCountRef.current = frames.length

  const auth = getAuth()
  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const webSpeechAvailable = !!SpeechRecognition

  useEffect(() => {
    if (!session?.id) {
      navigate('/dashboard', { replace: true })
      return
    }
    setStructuredExam(getTemplateForExamType(session.examType))
    let stream = null
    const setup = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          video.muted = true
          await video.play().catch(() => {})
        }
      } catch (e) {
        console.error('getUserMedia failed', e)
        setCaptureError('Camera/mic access failed. Allow access and refresh.')
      }
    }
    setup()
    return () => {
      if (chunkTimeoutRef.current) clearTimeout(chunkTimeoutRef.current)
      streamRef.current?.getTracks?.().forEach((t) => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      mediaRecorderRef.current?.state !== 'inactive' && mediaRecorderRef.current?.stop()
      mediaRecorderRef.current = null
    }
  }, [session?.id, navigate])

  useEffect(() => {
    if (!isRecording || !startTime) return
    const tid = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
      elapsedRef.current = Math.floor((Date.now() - startTime) / 1000)
    }, 1000)
    return () => clearInterval(tid)
  }, [isRecording, startTime])

  // Web Speech: optional phrase detection; show nudge "Exam phase detected — enable auto-capture?"
  useEffect(() => {
    if (!webSpeechAvailable || !isRecording || !SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .toLowerCase()
      if (/physical exam|let's do your physical exam|lets do your physical exam/.test(text)) {
        setShowExamPhaseNudge(true)
      }
    }
    rec.start()
    return () => rec.abort()
  }, [webSpeechAvailable, isRecording])

  const startRecording = useCallback(async () => {
    if (!session?.id || isStartingRecording) return
    setTranscribeError('')
    setCaptureError('')
    setIsStartingRecording(true)
    let stream = streamRef.current
    if (!stream || !stream.active) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          video.muted = true
          await video.play().catch(() => {})
        }
      } catch (e) {
        setCaptureError('Could not access camera/mic. Check permissions.')
        setIsStartingRecording(false)
        return
      }
    }
    try {
      const audioTracks = stream.getAudioTracks()
      const audioOnlyStream = audioTracks.length > 0 ? new MediaStream(audioTracks) : stream
      audioStreamRef.current = audioOnlyStream
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const options = mimeType ? { mimeType, audioBitsPerSecond: 128000 } : { audioBitsPerSecond: 128000 }
      recorderOptionsRef.current = options

      const scheduleChunkStop = () => {
        chunkTimeoutRef.current = setTimeout(() => {
          const rec = mediaRecorderRef.current
          if (rec?.state === 'recording') {
            restartAfterChunkRef.current = true
            rec.stop()
          }
        }, 5000)
      }

      const startRecorder = () => {
        const audioStream = audioStreamRef.current
        const opts = recorderOptionsRef.current
        if (!audioStream || !opts) return
        const rec = new MediaRecorder(audioStream, opts)
        rec.ondataavailable = async (e) => {
          if (e.data.size === 0) return
          const offset = Math.max(0, elapsedRef.current - 5)
          try {
            const segments = await transcribeAudioChunk(e.data, offset)
            setTranscriptSegments((prev) => [...prev, ...segments])
          } catch (err) {
            setTranscribeError(err.message || 'Transcription failed')
          } finally {
            if (restartAfterChunkRef.current) {
              restartAfterChunkRef.current = false
              startRecorder()
              scheduleChunkStop()
            }
          }
        }
        mediaRecorderRef.current = rec
        rec.start()
        scheduleChunkStop()
      }

      startRecorder()
      setStartTime(Date.now())
      setElapsedSeconds(0)
      elapsedRef.current = 0
      setIsRecording(true)
    } catch (e) {
      console.error('MediaRecorder start failed', e)
      setCaptureError('Recording could not start. Try allowing microphone.')
    }
    setIsStartingRecording(false)
  }, [session?.id, isStartingRecording])

  const stopRecording = useCallback(() => {
    if (chunkTimeoutRef.current) {
      clearTimeout(chunkTimeoutRef.current)
      chunkTimeoutRef.current = null
    }
    restartAfterChunkRef.current = false
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  const captureFrame = useCallback((isAuto = false) => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const frameId = `frame-${Date.now()}`
    const linkedId = activeSegmentId || transcriptSegments[transcriptSegments.length - 1]?.segment_id || ''
    setFrames((prev) => {
      if (prev.length >= 20) return prev
      return [...prev, { frame_id: frameId, timestamp: new Date().toISOString(), linked_transcript_segment_id: linkedId, visual_description: '', dataUrl, autoCaptured: isAuto }]
    })
    if (isAuto) lastAutoCaptureRef.current = Date.now()
  }, [activeSegmentId, transcriptSegments])

  // Auto-capture: 1 frame per 10s when exam mode + auto-capture on, cap 20 (must be after captureFrame)
  useEffect(() => {
    if (!examModeActive || !autoCaptureEnabled || !isRecording) return
    const intervalMs = 10000
    const tid = setInterval(() => {
      if (framesCountRef.current >= 20) return
      if (Date.now() - lastAutoCaptureRef.current < intervalMs) return
      captureFrame(true)
    }, intervalMs)
    autoCaptureIntervalRef.current = tid
    return () => {
      clearInterval(tid)
      autoCaptureIntervalRef.current = null
    }
  }, [examModeActive, autoCaptureEnabled, isRecording, captureFrame])

  const handleEndSession = useCallback(async () => {
    if (!session?.id) return
    stopRecording()
    setVisionError('')
    const needsVision = frames.length > 0 && frames.some((f) => !(f.visual_description || '').trim())
    if (needsVision) {
      setGeneratingReport(true)
      try {
        const payloadForVision = {
          examType: session.examType,
          audio_transcript: transcriptSegments.map((s) => ({ text: s.text, start_time: s.start_time, end_time: s.end_time, segment_id: s.segment_id })),
          frames: frames.map((f) => ({ frame_id: f.frame_id, timestamp: f.timestamp, linked_transcript_segment_id: f.linked_transcript_segment_id, visual_description: f.visual_description || '', dataUrl: f.dataUrl, autoCaptured: f.autoCaptured })),
        }
        const updatedFrames = await describeFrames(payloadForVision)
        const payload = {
          audio_transcript: transcriptSegments.map((s) => ({ text: s.text, start_time: s.start_time, end_time: s.end_time })),
          frames: updatedFrames.map((f) => ({ frame_id: f.frame_id, timestamp: f.timestamp, linked_transcript_segment_id: f.linked_transcript_segment_id, visual_description: f.visual_description || '', visibility: f.visibility, autoCaptured: f.autoCaptured, dataUrl: f.dataUrl })),
          structured_exam: mergeTranscriptAndFramesIntoStructuredExam(transcriptSegments, updatedFrames, getTemplateForExamType(session.examType)),
        }
        saveSessionPayload(session.id, payload)
        updateSession(session.id, { status: 'completed' })
        navigate(`/review?sessionId=${encodeURIComponent(session.id)}`, { state: { sessionId: session.id } })
      } catch (e) {
        setVisionError(e.message || 'Report generation failed')
      } finally {
        setGeneratingReport(false)
      }
      return
    }
    const payload = {
      audio_transcript: transcriptSegments.map((s) => ({ text: s.text, start_time: s.start_time, end_time: s.end_time })),
      frames: frames.map((f) => ({ frame_id: f.frame_id, timestamp: f.timestamp, linked_transcript_segment_id: f.linked_transcript_segment_id, visual_description: f.visual_description || '', visibility: f.visibility, autoCaptured: f.autoCaptured, dataUrl: f.dataUrl })),
      structured_exam: structuredExam,
    }
    saveSessionPayload(session.id, payload)
    updateSession(session.id, { status: 'completed' })
    navigate(`/review?sessionId=${encodeURIComponent(session.id)}`, { state: { sessionId: session.id } })
  }, [session?.id, session?.examType, transcriptSegments, frames, structuredExam, stopRecording, navigate])

  const sessionIdDisplay = session?.id ? session.id.replace(/^session-/, '').slice(0, 12).toUpperCase() : '—'
  const examTypeLabel = session?.examType ?? '—'
  const displayName = auth?.displayName ?? 'User'

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-white selection:bg-primary/30 overflow-hidden h-screen flex flex-col">
      {showExamPhaseNudge && !examModeActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-labelledby="exam-nudge-title">
          <div className="bg-charcoal-darker border border-primary/30 rounded-xl p-6 max-w-sm shadow-xl">
            <h2 id="exam-nudge-title" className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Exam phase detected</h2>
            <p className="text-white/80 text-sm mb-4">Enable auto-capture to take a frame every 10 seconds during the exam?</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setAutoCaptureEnabled(true); setExamModeActive(true); setShowExamPhaseNudge(false) }} className="flex-1 px-4 py-2 rounded-lg bg-primary text-charcoal-darker font-bold text-sm uppercase tracking-wider">
                Enable
              </button>
              <button type="button" onClick={() => setShowExamPhaseNudge(false)} className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/80 font-bold text-sm uppercase tracking-wider hover:bg-white/5">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      {generatingReport && (
        <GoldenVLoading
          message="Generating report…"
          subMessage="AI is describing key frames and building your structured report. This may take 10–15 seconds."
        />
      )}
      {isStartingRecording && (
        <GoldenVLoading
          message="Starting session…"
          subMessage="Preparing camera, microphone, and transcription. Please wait."
        />
      )}
      {visionError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-red-900/90 border border-red-500/50 text-sm text-white flex items-center gap-2 max-w-md">
          <span className="material-symbols-outlined">error</span>
          {visionError}
          <button type="button" onClick={() => setVisionError('')} className="ml-2 text-white/80 hover:text-white" aria-label="Dismiss">×</button>
        </div>
      )}
      <header className="flex h-16 items-center justify-between border-b border-white/5 px-8 bg-charcoal-darker shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-primary transition-colors text-sm font-medium">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Dashboard
          </Link>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="size-6 text-primary">
              <span className="material-symbols-outlined text-2xl">visibility</span>
            </div>
            <h1 className="text-xl font-bold tracking-widest text-white font-serif italic">VISION</h1>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-primary/70 font-bold">Session ID</span>
            <span className="text-sm font-medium">{sessionIdDisplay} — {examTypeLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="material-symbols-outlined text-sm text-primary">stethoscope</span>
            <span className="text-xs font-semibold tracking-wide">SURGEON: {displayName.toUpperCase()}</span>
          </div>
          <button type="button" className="p-2 text-white/60 hover:text-white transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="size-8 rounded-full border border-primary/30 p-0.5 bg-cover bg-center" style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuB3RIlwqjAq3v9FhU_Wvq1eH84TbcFrxD5L1XFTI4DH00Z6zMgfeNEAVvi53gfq38eT1aF9KB-ILJ_Tmwum1tUYXeJXo8465xx1z1zWs_jIXVp4tFZAEBYMS2bPaBGdmkP7PLeqHblAkKgUhOipHDpRhsmGSfXMDv3tURpIm5XS7eayFM-zHrBhth9uRuzSSAUy-XMoRkp6cvmnk_otsC_FQBo8fAfwGI77FWsviqILhMdQxk9luS_wBCkJX9fabNAfd-Iv0OqtwbY)' }} />
        </div>
      </header>

      <main className="flex flex-1 min-h-0 w-full overflow-hidden">
        <aside className="w-80 border-r border-white/5 bg-charcoal-darker flex flex-col shrink-0">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">Live Transcript</h3>
            <span className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold">
              {isRecording && <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />}
              {isRecording ? 'LIVE' : 'Ready'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {(transcribeError || captureError) && <p className="text-xs text-red-400">{transcribeError || captureError}</p>}
            {transcriptSegments.map((seg) => (
              <button key={seg.segment_id} type="button" className={`w-full text-left space-y-1 p-3 rounded-lg transition-colors ${activeSegmentId === seg.segment_id ? 'active-glow bg-primary/5' : 'hover:bg-white/5'}`} onClick={() => setActiveSegmentId(seg.segment_id)}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-primary">{formatSegmentTime(seg.start_time)}</span>
                </div>
                <p className="text-sm leading-relaxed font-light text-white/80">{seg.text}</p>
              </button>
            ))}
            {!isRecording && transcriptSegments.length === 0 && (
              <div className="h-20 w-full border-t border-dashed border-white/10 mt-4 flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-tighter text-white/20">Start recording to capture transcript</span>
              </div>
            )}
            {isRecording && (
              <div className="h-12 w-full border-t border-dashed border-white/10 mt-4 flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-tighter text-white/20">Listening...</span>
              </div>
            )}
          </div>
        </aside>

        <section className="flex-1 bg-background-dark flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar min-w-0">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-xl bg-primary/20 blur opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative aspect-video rounded-lg border border-primary/40 bg-black overflow-hidden shadow-2xl">
              {!isRecording ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-charcoal-darker">
                  <p className="text-white/60 text-sm">Camera ready. Start recording to capture video and transcript.</p>
                  {captureError && <p className="text-red-400 text-xs max-w-xs text-center">{captureError}</p>}
                  <button type="button" disabled={isStartingRecording} onClick={() => startRecording()} className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-background-dark font-bold text-sm uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-wait">
                    <span className="material-symbols-outlined">{isStartingRecording ? 'hourglass_empty' : 'mic'}</span>
                    {isStartingRecording ? 'Starting…' : 'Start recording'}
                  </button>
                </div>
              ) : !examModeActive ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-charcoal-darker/80">
                  <p className="text-white/80 text-sm">Recording. Start exam mode to capture key frames (manual or auto).</p>
                  <button type="button" onClick={() => setExamModeActive(true)} className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary font-bold text-sm uppercase tracking-widest hover:bg-primary/10 transition-colors" aria-label="Start exam mode">
                    <span className="material-symbols-outlined" aria-hidden>stethoscope</span>
                    Start exam mode
                  </button>
                </div>
              ) : null}
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 flex items-center gap-3">
                {isRecording && (
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/50">
                    <span className="size-2 rounded-full bg-red-600 rec-pulse" />
                    <span className="text-[10px] font-bold tracking-widest text-white uppercase">REC</span>
                  </div>
                )}
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white tracking-widest uppercase">Live</div>
              </div>
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <span className="text-xs font-mono font-bold text-primary">{formatDuration(elapsedSeconds)}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80">Key Frames ({frames.length}/20)</h3>
              {examModeActive && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={autoCaptureEnabled} onChange={(e) => setAutoCaptureEnabled(e.target.checked)} className="rounded border-primary/50 text-primary focus:ring-primary/50" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Auto-capture (every 10s)</span>
                </label>
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {frames.map((f) => (
                <button key={f.frame_id} type="button" className="min-w-[180px] space-y-2 group cursor-pointer text-left" onClick={() => setActiveSegmentId(f.linked_transcript_segment_id)}>
                  <div className="aspect-video rounded border border-white/10 bg-charcoal-darker overflow-hidden group-hover:border-primary/50 transition-colors relative">
                    <img src={f.dataUrl} alt="Frame" className="h-full w-full object-cover" />
                    {f.autoCaptured && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary/90 text-[9px] font-bold text-charcoal-darker uppercase">Auto</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-primary/80">{new Date(f.timestamp).toLocaleTimeString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="w-96 border-l border-white/5 bg-charcoal-darker flex flex-col shrink-0">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">clinical_notes</span>
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">Surgical Report</h3>
            </div>
            <button type="button" className="text-white/40 hover:text-white" aria-label="Fullscreen"><span className="material-symbols-outlined">fullscreen</span></button>
          </div>
          <div className="px-4 pt-3">
            <button type="button" onClick={() => setStructuredExam(mergeTranscriptAndFramesIntoStructuredExam(transcriptSegments, frames, getTemplateForExamType(session.examType)))} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/50 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors" aria-label="Suggest from transcript and frames">
              <span className="material-symbols-outlined text-sm" aria-hidden>auto_awesome</span>
              Suggest from transcript & frames
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <textarea
              className="w-full min-h-[280px] text-sm font-light text-white/90 bg-white/5 p-3 rounded border border-white/10 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-y"
              value={structuredExamToSingleText(structuredExam, getTemplateForExamType(session?.examType))}
              onChange={(e) => setStructuredExam(singleTextToStructuredExam(e.target.value, getTemplateForExamType(session?.examType), structuredExam))}
              placeholder="Use ## Section name then content for each section."
            />
          </div>
        </aside>
      </main>

      <footer className="h-14 w-full border-t border-white/5 bg-charcoal-darker grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">System Status</span>
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-[10px] font-bold text-white/80 whitespace-nowrap">ENCRYPTED</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-white/60">
            <span className="material-symbols-outlined text-lg select-none" aria-hidden>mic</span>
            <span className="material-symbols-outlined text-lg select-none" aria-hidden>videocam</span>
            <span className="material-symbols-outlined text-lg select-none" aria-hidden>hard_drive</span>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <button type="button" disabled={!isRecording || !examModeActive} onClick={() => captureFrame(false)} className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary hover:text-charcoal-darker transition-all duration-300 text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Capture frame">
            <span className="material-symbols-outlined text-lg select-none" aria-hidden>photo_camera</span>
            Capture Frame
          </button>
          <button type="button" disabled={generatingReport} onClick={handleEndSession} className="flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black hover:bg-primary transition-colors text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed" aria-label="End session">
            <span className="material-symbols-outlined text-lg select-none" aria-hidden>cancel</span>
            End Session
          </button>
        </div>
        <div className="flex items-center gap-4 justify-end min-w-0">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-primary/60 uppercase">Duration</span>
            <span className="text-xs font-mono font-bold tracking-tighter">{formatDuration(elapsedSeconds)}</span>
          </div>
          <button type="button" className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors" aria-label="Help">
            <span className="material-symbols-outlined text-lg select-none" aria-hidden>help_outline</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
