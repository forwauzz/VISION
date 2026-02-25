/**
 * Vision Demo — Pitch prototype. Linear step flow with mock data.
 * No auth, no real recording/transcription. For team/investor presentations.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import GoldenVLoading from '../components/GoldenVLoading.jsx'
import {
  MOCK_TRANSCRIPT,
  MOCK_FRAMES,
  MOCK_VIDEO_PLACEHOLDER,
  VISIT_TYPE_CARDS,
  TEMPLATE_OPTIONS,
  getMockSummaryForTemplate,
} from '../lib/demoMockData.js'
import { DEVICE_CARDS } from '../lib/deviceOptions.js'

const PROCESS_STEPS = ['Transcribing…', 'Analyzing…', 'Masking…']

function formatSegmentTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Demo() {
  const [step, setStep] = useState(1)
  const [selectedDevice, setSelectedDevice] = useState('')
  const [selectedVisitType, setSelectedVisitType] = useState('')
  const [patientName, setPatientName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [processStep, setProcessStep] = useState(0)
  const [visibleTranscriptIndex, setVisibleTranscriptIndex] = useState(-1)

  useEffect(() => {
    if (step !== 6) return
    const steps = PROCESS_STEPS.length
    const tid = setInterval(() => {
      setProcessStep((prev) => {
        if (prev >= steps - 1) {
          clearInterval(tid)
          setStep(7)
          return prev
        }
        return prev + 1
      })
    }, 2200)
    return () => clearInterval(tid)
  }, [step])

  useEffect(() => {
    if (step !== 4 || !isRecording) return
    const intervals = [0, 1200, 2500, 3800, 5000]
    const tid = intervals.map((delay, i) =>
      setTimeout(() => setVisibleTranscriptIndex(i), delay)
    )
    return () => tid.forEach(clearTimeout)
  }, [step, isRecording])

  const summary = selectedTemplate ? getMockSummaryForTemplate(selectedTemplate) : {}

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-xl font-extrabold tracking-widest uppercase dark:text-white">Vision</span>
          </Link>
          <span className="text-xs font-bold text-primary/80 uppercase tracking-widest">Demo — Step {step}/9</span>
          <Link to="/" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">Exit Demo</Link>
        </div>
      </nav>

      <main className="pt-28 pb-16 px-6 max-w-5xl mx-auto">
        {step === 1 && (
          <section className="space-y-8">
            <h1 className="text-3xl font-bold dark:text-white">Select device</h1>
            <p className="text-slate-400">Choose your capture hardware for this session.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {DEVICE_CARDS.map((card) => {
                const isOffline = card.status === 'offline'
                const isPairing = card.status === 'pairing'
                const isSelected = selectedDevice === card.id
                const batteryColor = isOffline ? 'text-slate-600' : card.batteryDisplay === '42%' ? 'text-orange-400' : 'text-slate-400'
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => !isOffline && setSelectedDevice(card.id)}
                    disabled={isOffline}
                    className={`rounded-xl overflow-hidden text-left transition-all border ${
                      isSelected ? 'border-primary ring-2 ring-primary/40 gold-glow' : 'border-white/10 hover:border-primary/40'
                    } ${isOffline ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer'} bg-surface-dark/60 backdrop-blur-sm`}
                  >
                    <div className={`aspect-video relative overflow-hidden bg-neutral-dark/50 ${isOffline ? 'grayscale opacity-50' : ''}`}>
                      <img src={card.imageUrl} alt="" className={`w-full h-full object-cover ${isOffline ? '' : isPairing ? 'opacity-80 blur-[2px]' : 'opacity-80'}`} />
                      {card.status === 'online' && (
                        <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded border border-green-500/30 backdrop-blur-md">ONLINE</div>
                      )}
                      {card.status === 'offline' && (
                        <div className="absolute top-4 right-4 bg-slate-900/60 text-slate-300 text-xs font-bold px-2 py-1 rounded border border-white/10 backdrop-blur-md">OFFLINE</div>
                      )}
                      {isPairing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 backdrop-blur-[2px]">
                          <div className="flex flex-col items-center">
                            <span className="material-symbols-outlined text-primary text-4xl animate-pulse mb-2">bluetooth_searching</span>
                            <span className="text-primary text-xs font-bold tracking-widest uppercase">Pairing...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className={`text-xl font-bold ${isOffline ? 'text-slate-500 italic' : 'text-white'}`}>{card.label}</h3>
                          <p className={`text-sm ${isOffline ? 'text-slate-600' : 'text-slate-400'}`}>{card.description}</p>
                        </div>
                        <div className={`text-right ${batteryColor}`}>
                          <span className="material-symbols-outlined mb-1 block">{card.batteryIcon}</span>
                          <p className="text-sm font-bold">{card.batteryDisplay}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className={`flex-1 py-2.5 rounded-lg font-bold text-sm text-center ${isOffline ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                          {isOffline ? 'Offline' : 'Select'}
                        </span>
                        <span className={`px-3 py-2.5 border rounded-lg ${isOffline ? 'border-slate-800 text-slate-600' : 'border-slate-700 text-slate-400'}`}>
                          <span className="material-symbols-outlined text-sm">more_vert</span>
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
              <div className="border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center p-8 bg-primary/5 opacity-60 cursor-not-allowed" aria-hidden>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <span className="material-symbols-outlined text-3xl">add</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Add New Device</h3>
                <p className="text-slate-400 text-sm text-center">Register new clinical hardware to your Vision network</p>
              </div>
            </div>
            <button
              type="button"
              disabled={!selectedDevice}
              onClick={() => setStep(2)}
              className="px-8 py-3 rounded-lg bg-primary text-background-dark font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-8">
            <h1 className="text-3xl font-bold dark:text-white">Select visit type</h1>
            <p className="text-slate-400 max-w-2xl">
              Choose the specialized clinical path for the patient&apos;s upcoming session. This will tailor the diagnostic tools and clinical workflow accordingly.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VISIT_TYPE_CARDS.map((card) => {
                const isSelected = selectedVisitType === card.id
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedVisitType(card.id)}
                    className={`rounded-xl p-6 text-left transition-all border flex flex-col min-h-[320px] ${
                      isSelected ? 'border-primary bg-primary/10 gold-glow' : 'border-white/10 hover:border-primary/50 bg-surface-dark/60'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4 shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl text-primary">{card.icon}</span>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-xl shrink-0" aria-hidden>check_circle</span>
                      )}
                    </div>
                    <h3 className={`text-xl font-bold mb-2 shrink-0 ${isSelected ? 'text-primary' : 'dark:text-white'}`}>{card.title}</h3>
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed break-words flex-1">{card.description}</p>
                    <div className="aspect-video rounded-lg overflow-hidden bg-black/40 shrink-0 mt-auto">
                      <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-2 rounded-lg border border-white/20">
                Back
              </button>
              <button
                type="button"
                disabled={!selectedVisitType}
                onClick={() => setStep(3)}
                className="px-8 py-3 rounded-lg bg-primary text-background-dark font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-8">
            <h1 className="text-3xl font-bold dark:text-white">New session</h1>
            <label className="block">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Patient name</span>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. John Smith"
                className="mt-2 w-full max-w-md px-4 py-3 rounded-lg bg-surface-dark border border-white/10 text-white placeholder-slate-500"
              />
            </label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-2 rounded-lg border border-white/20">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-8 py-3 rounded-lg bg-primary text-background-dark font-bold"
              >
                New Session
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white">Recording — {patientName || 'Patient'}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="aspect-video rounded-xl border border-primary/40 overflow-hidden bg-black relative">
                  <img src={MOCK_VIDEO_PLACEHOLDER} alt="Live capture" className="w-full h-full object-cover" />
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span className="text-xs font-bold text-white">REC</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={() => setIsRecording(true)}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-background-dark font-bold"
                    >
                      <span className="material-symbols-outlined">mic</span>
                      Start recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setIsRecording(false); setStep(6) }}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold"
                    >
                      <span className="material-symbols-outlined">stop_circle</span>
                      Stop recording
                    </button>
                  )}
                </div>
              </div>
              <div className="border border-white/10 rounded-xl p-4 bg-surface-dark">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Live transcript</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {MOCK_TRANSCRIPT.map((seg, i) => (
                    <div
                      key={seg.segment_id}
                      className={`p-3 rounded-lg transition-opacity ${
                        isRecording && visibleTranscriptIndex >= i ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      <span className="text-xs font-bold text-primary">{formatSegmentTime(seg.start_time)}</span>
                      <p className="text-sm text-white/80 mt-1">{seg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {isRecording && (
              <div className="border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Key frames</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {MOCK_FRAMES.map((f) => (
                    <div key={f.frame_id} className="min-w-[140px]">
                      <img src={f.dataUrl} alt="Frame" className="aspect-video rounded border border-white/10 object-cover" />
                      <span className="text-[10px] text-primary/80">{new Date(f.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {step === 6 && (
          <GoldenVLoading
            message="Processing…"
            subMessage="Transcribing, analyzing, and masking. This usually takes 30–60 seconds."
            steps={PROCESS_STEPS}
            activeStep={processStep}
          />
        )}

        {step === 7 && (
          <section className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white">Review</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="border border-white/10 rounded-xl p-4 bg-surface-dark">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Audio transcript</h3>
                {MOCK_TRANSCRIPT.map((seg) => (
                  <div key={seg.segment_id} className="mb-4 p-3 rounded-lg border border-white/5">
                    <span className="text-xs font-bold text-primary">{formatSegmentTime(seg.start_time)}</span>
                    <p className="text-sm text-white/80 mt-1">{seg.text}</p>
                  </div>
                ))}
              </div>
              <div className="border border-white/10 rounded-xl p-4 bg-surface-dark">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Video & frames</h3>
                <img src={MOCK_VIDEO_PLACEHOLDER} alt="Recording" className="w-full aspect-video rounded-lg object-cover mb-4" />
                <div className="flex gap-2 overflow-x-auto">
                  {MOCK_FRAMES.map((f) => (
                    <img key={f.frame_id} src={f.dataUrl} alt="Frame" className="w-20 h-14 rounded object-cover shrink-0" />
                  ))}
                </div>
              </div>
              <div className="border border-white/10 rounded-xl p-4 bg-surface-dark">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Combined description (per frame)</h3>
                {MOCK_FRAMES.map((f, i) => (
                  <div key={f.frame_id} className="mb-4 p-3 rounded-lg border border-white/5">
                    <span className="text-xs font-bold text-primary">Frame {i + 1}</span>
                    <p className="text-sm text-white/80 mt-1">{f.visual_description}</p>
                    <p className="text-xs text-slate-500 mt-2 italic">Audio: {MOCK_TRANSCRIPT[i]?.text?.slice(0, 60)}…</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(8)}
              className="px-8 py-3 rounded-lg bg-primary text-background-dark font-bold"
            >
              Generate summary
            </button>
          </section>
        )}

        {step === 8 && (
          <section className="space-y-8">
            <h1 className="text-3xl font-bold dark:text-white">Select template</h1>
            <p className="text-slate-400">Choose an Orthopedic, Plastic Surgery, or clinical documentation template for your report.</p>
            <label className="block">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">Template</span>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full max-w-md px-4 py-3 rounded-lg bg-surface-dark border border-white/10 text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                aria-label="Select report template"
              >
                <option value="">Select a template…</option>
                {TEMPLATE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(7)} className="px-6 py-2 rounded-lg border border-white/20">
                Back
              </button>
              <button
                type="button"
                disabled={!selectedTemplate}
                onClick={() => setStep(9)}
                className="px-8 py-3 rounded-lg bg-primary text-background-dark font-bold disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </section>
        )}

        {step === 9 && (
          <section className="space-y-8">
            <h1 className="text-3xl font-bold dark:text-white">Report summary</h1>
            <div className="rounded-xl border border-primary/20 bg-surface-dark p-8 space-y-8 max-w-4xl">
              {Object.keys(summary).map((heading) => (
                <div key={heading} className="border-b border-white/5 pb-6 last:border-b-0 last:pb-0">
                  <h2 className="text-lg font-bold text-primary uppercase tracking-wider mb-3">{heading}</h2>
                  <p className="text-slate-300 leading-relaxed text-sm md:text-base">{summary[heading]}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setStep(1)
                setSelectedDevice('')
                setSelectedVisitType('')
                setPatientName('')
                setSelectedTemplate('')
                setProcessStep(0)
                setVisibleTranscriptIndex(-1)
              }}
              className="px-8 py-3 rounded-lg bg-primary text-background-dark font-bold"
            >
              Start new demo
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
