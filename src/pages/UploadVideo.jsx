/**
 * Upload short video — transcribe, extract frames, Vision, then structured exam or SOAP note.
 * Reuses transcribeVideo, extractFramesFromVideoBlob, describeFrames, summarizeSession.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuth } from '../lib/auth.js'
import { createSessionStub, saveSessionPayload, updateSession } from '../lib/sessions.js'
import { transcribeVideo } from '../lib/transcribe.js'
import { extractFramesFromVideoBlob } from '../lib/videoFrameExtract.js'
import { describeFrames, summarizeSession } from '../lib/visionApi.js'
import { getTemplateForExamType, mergeTranscriptAndFramesIntoStructuredExam } from '../lib/examTemplates.js'
import GoldenVLoading from '../components/GoldenVLoading.jsx'
import AppLayout from '../components/AppLayout.jsx'

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB (Netlify body limit 6 MB)
const MAX_DURATION_SECONDS = 300 // 5 minutes
const FRAME_OPTIONS = { intervalSeconds: 10, maxFrames: 20 }

function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read video duration'))
    }
    video.src = url
  })
}

export default function UploadVideo() {
  const navigate = useNavigate()
  const auth = getAuth()
  const [examType, setExamType] = useState('Shoulder')
  const [bodyRegion, setBodyRegion] = useState('')
  const [outputFormat, setOutputFormat] = useState('structured') // 'structured' | 'soap'
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')

  const activeEst = auth?.establishments?.find((e) => e.id === auth?.activeEstablishmentId)
  const canSubmit = auth?.userId && auth?.activeEstablishmentId && file && !processing

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!file || !auth?.userId || !auth?.activeEstablishmentId) return
    if (file.size > MAX_FILE_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_FILE_BYTES / 1024 / 1024} MB.`)
      return
    }
    let durationSec = 0
    try {
      durationSec = await getVideoDuration(file)
    } catch (err) {
      setError(err.message || 'Could not read video.')
      return
    }
    if (durationSec > MAX_DURATION_SECONDS) {
      setError(`Video is too long. Maximum duration is ${MAX_DURATION_SECONDS / 60} minutes.`)
      return
    }

    const effectiveExamType = outputFormat === 'soap' ? 'SOAP' : examType
    const session = createSessionStub({
      userId: auth.userId,
      establishmentId: auth.activeEstablishmentId,
      examType: effectiveExamType,
      bodyRegion: bodyRegion.trim() || undefined,
    })
    if (!session) {
      setError('Could not create session.')
      return
    }

    setProcessing(true)
    const sessionStart = Date.now()

    try {
      setProcessingStep('Transcribing audio…')
      const audio_transcript = await transcribeVideo(file)
      setProcessingStep('Extracting frames…')
      const extractedFrames = await extractFramesFromVideoBlob(
        file,
        FRAME_OPTIONS,
        audio_transcript,
        sessionStart
      )
      setProcessingStep('Describing frames…')
      const payloadForVision = {
        examType: outputFormat === 'soap' ? examType : effectiveExamType,
        bodyRegion: bodyRegion.trim() || '',
        audio_transcript: audio_transcript.map((s) => ({ text: s.text, start_time: s.start_time, end_time: s.end_time, segment_id: s.segment_id })),
        frames: extractedFrames.map((f) => ({ frame_id: f.frame_id, timestamp: f.timestamp, linked_transcript_segment_id: f.linked_transcript_segment_id, visual_description: f.visual_description || '', dataUrl: f.dataUrl, autoCaptured: f.autoCaptured })),
      }
      const updatedFrames = await describeFrames(payloadForVision)
      setProcessingStep('Building report…')

      let structured_exam
      if (outputFormat === 'soap') {
        const soapHeadings = ['Subjective', 'Objective', 'Assessment', 'Plan']
        structured_exam = await summarizeSession({
          examType: examType,
          audio_transcript: audio_transcript.map((s) => ({ text: s.text })),
          frames: updatedFrames.map((f) => ({ visual_description: f.visual_description })),
          headings: soapHeadings,
        })
        // Ensure all SOAP keys exist
        const template = getTemplateForExamType('SOAP')
        structured_exam = { ...template, ...structured_exam }
      } else {
        const template = getTemplateForExamType(effectiveExamType)
        structured_exam = mergeTranscriptAndFramesIntoStructuredExam(audio_transcript, updatedFrames, template)
      }

      const payload = {
        audio_transcript: audio_transcript.map((s) => ({ text: s.text, start_time: s.start_time, end_time: s.end_time })),
        frames: updatedFrames.map((f) => ({
          frame_id: f.frame_id,
          timestamp: f.timestamp,
          linked_transcript_segment_id: f.linked_transcript_segment_id,
          visual_description: f.visual_description || '',
          visibility: f.visibility,
          autoCaptured: f.autoCaptured,
          dataUrl: f.dataUrl,
        })),
        structured_exam,
      }
      saveSessionPayload(session.id, payload)
      updateSession(session.id, { status: 'completed' })
      navigate(`/review?sessionId=${encodeURIComponent(session.id)}`, { state: { sessionId: session.id } })
    } catch (err) {
      setError(err.message || 'Processing failed.')
    } finally {
      setProcessing(false)
      setProcessingStep('')
    }
  }

  if (processing) {
    return (
      <GoldenVLoading
        message="Analyzing video…"
        subMessage={processingStep || 'This may take 30–60 seconds.'}
      />
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-white mb-2">Process a short video</h1>
        <p className="text-slate-500 text-sm mb-8">
          Upload a video to transcribe audio, extract key frames, and generate a structured exam or SOAP note. Max {MAX_FILE_BYTES / 1024 / 1024} MB, {MAX_DURATION_SECONDS / 60} min.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Exam type (context)</label>
            <div className="flex flex-wrap gap-2">
              {['Shoulder', 'Scar', 'Orthopedic'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setExamType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    examType === type ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-dark border-border-dark text-slate-400 hover:border-primary/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="body-region" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Body region <span className="text-slate-600 font-normal normal-case">(optional)</span>
            </label>
            <input
              id="body-region"
              type="text"
              value={bodyRegion}
              onChange={(e) => setBodyRegion(e.target.value)}
              placeholder="e.g. left knee, right shoulder"
              className="w-full bg-surface-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Output format</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="outputFormat"
                  checked={outputFormat === 'structured'}
                  onChange={() => setOutputFormat('structured')}
                  className="text-primary focus:ring-primary/50"
                />
                <span className="text-sm text-white">Structured exam</span>
                <span className="text-slate-500 text-xs">(Inspection, ROM, Swelling, etc.)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="outputFormat"
                  checked={outputFormat === 'soap'}
                  onChange={() => setOutputFormat('soap')}
                  className="text-primary focus:ring-primary/50"
                />
                <span className="text-sm text-white">SOAP note</span>
                <span className="text-slate-500 text-xs">(Subjective, Objective, Assessment, Plan)</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="video-file" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Video file
            </label>
            <input
              id="video-file"
              type="file"
              accept="video/*,.webm,.mp4"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setError('')
              }}
              className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-background-dark file:font-semibold file:cursor-pointer hover:file:bg-primary/90"
            />
            {file && (
              <p className="mt-1 text-slate-500 text-xs">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary hover:bg-primary/90 text-background-dark font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span className="material-symbols-outlined">upload</span>
            Process video
          </button>
        </form>

        {activeEst && (
          <p className="mt-8 text-slate-500 text-xs text-center">
            Session will be saved for <span className="text-slate-400">{activeEst.name}</span>.
          </p>
        )}
      </div>
    </AppLayout>
  )
}
