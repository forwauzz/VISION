/**
 * Vision Dashboard — from stitch-extracted/stitch/dashboard_(desktop)_-_v1/code.html
 * Phase 4: user and active establishment; Phase 5: sessions from storage, exam type modal, BEGIN SESSION → Session.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuth, setActiveEstablishment } from '../lib/auth.js'
import { getSessionsByEstablishment, createSessionStub } from '../lib/sessions.js'
import { getDevicePrefs } from '../lib/devicePrefs.js'
import GoldenVLoading from '../components/GoldenVLoading.jsx'
import AppLayout from '../components/AppLayout.jsx'

function formatSessionMeta(startedAt) {
  const d = new Date(startedAt)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' • Today'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined }) + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function sessionToDisplay(stub) {
  const statusLabel = stub.status === 'in_progress' ? 'In Progress' : 'Completed'
  return {
    ...stub,
    title: `${stub.examType} Exam`,
    ref: `#VSN-${stub.id.slice(-8).replace(/-/g, '').toUpperCase().slice(0, 6)}`,
    meta: formatSessionMeta(stub.startedAt),
    duration: stub.status === 'in_progress' ? '—' : '—',
    status: statusLabel,
    icon: stub.status === 'in_progress' ? 'sensors' : 'history',
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [auth, setAuth] = useState(getAuth)
  const activeEst = auth?.establishments?.find((e) => e.id === auth?.activeEstablishmentId)
  const establishmentName = activeEst?.name ?? 'Select establishment'
  const [showExamModal, setShowExamModal] = useState(false)
  const [bodyRegion, setBodyRegion] = useState('')
  const [isStartingSession, setIsStartingSession] = useState(false)
  const [videoDevices, setVideoDevices] = useState([])
  const [audioDevices, setAudioDevices] = useState([])
  const [selectedVideoId, setSelectedVideoId] = useState('')
  const [selectedAudioId, setSelectedAudioId] = useState('')

  const sessions = (auth?.activeEstablishmentId ? getSessionsByEstablishment(auth.activeEstablishmentId) : []).map(sessionToDisplay).slice(0, 10)

  useEffect(() => {
    setAuth(getAuth())
  }, [])

  useEffect(() => {
    if (auth?.establishments?.length === 0) {
      navigate('/establishment-selector', { replace: true })
    }
  }, [auth?.establishments?.length, auth?.activeEstablishmentId, navigate])

  function handleSwitchEstablishment(establishmentId) {
    if (setActiveEstablishment(establishmentId)) setAuth(getAuth())
  }

  function handleBeginSession() {
    setShowExamModal(true)
  }

  useEffect(() => {
    if (!showExamModal) return
    let cancelled = false
    const load = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        if (cancelled) return
        setVideoDevices(devices.filter((d) => d.kind === 'videoinput'))
        setAudioDevices(devices.filter((d) => d.kind === 'audioinput'))
        const prefs = getDevicePrefs()
        setSelectedVideoId(prefs.videoDeviceId ?? '')
        setSelectedAudioId(prefs.audioDeviceId ?? '')
      } catch {
        if (!cancelled) {
          setVideoDevices([])
          setAudioDevices([])
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [showExamModal])

  function deviceLabel(device, index, kind) {
    const base = kind === 'videoinput' ? 'Camera' : 'Microphone'
    return device.label?.trim() || `${base} ${index + 1}`
  }

  function handleChooseExamType(examType) {
    if (!auth?.userId || !auth?.activeEstablishmentId) return
    setShowExamModal(false)
    setIsStartingSession(true)
    const region = bodyRegion.trim()
    const videoId = selectedVideoId || null
    const audioId = selectedAudioId || null
    setBodyRegion('')
    setSelectedVideoId('')
    setSelectedAudioId('')
    setTimeout(() => {
      const session = createSessionStub({ userId: auth.userId, establishmentId: auth.activeEstablishmentId, examType, bodyRegion: region })
      if (session) {
        navigate(`/session?sessionId=${encodeURIComponent(session.id)}`, {
          state: { session, videoDeviceId: videoId, audioDeviceId: audioId },
        })
      }
      setIsStartingSession(false)
    }, 400)
  }

  function handleSessionClick(s) {
    if (s.status === 'In Progress') {
      navigate(`/session?sessionId=${encodeURIComponent(s.id)}`, { state: { sessionId: s.id } })
    } else {
      navigate(`/review?sessionId=${encodeURIComponent(s.id)}`, { state: { sessionId: s.id } })
    }
  }

  return (
    <AppLayout>
      {isStartingSession && (
        <GoldenVLoading
          message="Starting session…"
          subMessage="Preparing your workspace and exam template."
        />
      )}
      <div className="sticky top-0 z-30 border-b border-border-dark bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/establishment-selector" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-dark border border-border-dark hover:border-primary/50 transition-colors cursor-pointer group">
            <span className="material-symbols-outlined text-primary text-sm">storefront</span>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{establishmentName}</span>
            <span className="material-symbols-outlined text-slate-500 text-sm">expand_more</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <section className="flex flex-col items-center justify-center text-center py-20 mb-12">
          <h2 className="text-slate-500 text-sm font-bold uppercase tracking-[0.3em] mb-4">Command Center</h2>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Ready for a new session?</h1>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-xl group-hover:bg-primary/30 transition duration-500" aria-hidden />
              <button type="button" data-testid="begin-session" onClick={handleBeginSession} className="relative flex items-center gap-3 px-10 py-5 bg-primary hover:bg-[#d4b56d] text-background-dark text-lg font-bold rounded-xl transition-all active:scale-[0.98] gold-glow" aria-label="Begin session">
                <span className="material-symbols-outlined font-bold select-none" aria-hidden>play_arrow</span>
                <span>BEGIN SESSION</span>
              </button>
            </div>
            <Link to="/upload-video" className="flex items-center gap-3 px-8 py-5 bg-surface-dark border border-border-dark hover:border-primary/50 text-white font-bold rounded-xl transition-all active:scale-[0.98]" aria-label="Upload video">
              <span className="material-symbols-outlined font-bold select-none" aria-hidden>upload_file</span>
              <span>UPLOAD VIDEO</span>
            </Link>
          </div>
          <p className="mt-8 text-slate-500 max-w-md text-sm leading-relaxed">
            Start a real-time analysis session for <span className="text-slate-300 font-medium italic">{establishmentName}</span>. All data is encrypted and logged.
          </p>

          {auth?.establishments?.length > 0 && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Your establishments</span>
              <div className="flex flex-wrap justify-center gap-2">
                {auth.establishments.map((est) => (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => handleSwitchEstablishment(est.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      est.id === auth?.activeEstablishmentId
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-surface-dark border-border-dark text-slate-400 hover:border-primary/50 hover:text-slate-300'
                    }`}
                  >
                    {est.name}
                    {est.primary && <span className="ml-1.5 text-[10px] uppercase text-primary">Primary</span>}
                  </button>
                ))}
              </div>
              <Link to="/establishment-selector" className="text-slate-500 hover:text-primary text-xs font-medium transition-colors">
                Manage all establishments →
              </Link>
            </div>
          )}
        </section>

        <section className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-white tracking-tight">Recent Sessions</h2>
              <p className="text-slate-500 text-xs mt-1">Showing the last 5 activities</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                <input className="bg-surface-dark border-border-dark focus:border-primary focus:ring-0 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 w-64 transition-all" placeholder="Search sessions..." type="text" />
              </div>
              <button type="button" className="text-xs font-bold text-primary hover:underline underline-offset-4 tracking-wider uppercase">View History</button>
            </div>
          </div>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">No sessions yet. Click BEGIN SESSION to start.</p>
            ) : (
              sessions.map((s) => (
                <button key={s.id} type="button" className="group relative w-full text-left bg-surface-dark border border-border-dark hover:border-primary/40 rounded-xl p-5 flex items-center justify-between gap-4 transition-all hover:bg-surface-dark/80 cursor-pointer min-w-0" onClick={() => handleSessionClick(s)}>
                  <div className="flex items-center gap-5 min-w-0 flex-1">
                    <div className={`size-12 shrink-0 rounded-lg flex items-center justify-center ${s.status === 'In Progress' ? 'bg-primary/10 border border-primary/20' : 'bg-slate-800 border border-border-dark'}`}>
                      <span className={`material-symbols-outlined select-none ${s.status === 'In Progress' ? 'text-primary' : 'text-slate-500'}`} aria-hidden>{s.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-white font-bold tracking-tight truncate">{s.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${s.status === 'In Progress' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-slate-800 text-slate-400 border border-border-dark'}`}>
                          {s.status === 'In Progress' && <span className="size-1.5 rounded-full bg-primary animate-pulse" />}
                          {s.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1 font-medium truncate">{s.ref} • {s.meta}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-slate-300 text-sm font-bold">{s.duration}</p>
                      <p className="text-slate-500 text-[10px] uppercase">Duration</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors select-none" aria-hidden>chevron_right</span>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="mt-12 pt-8 border-t border-border-dark flex items-center justify-between text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">
            <div className="flex gap-6">
              <span>System Status: <span className="text-emerald-500">Operational</span></span>
              <span>Lat: 24ms</span>
            </div>
            <div>Vision v2.4.0-Stable • © 2024</div>
          </div>
        </section>
      </div>
      <div className="fixed top-1/4 -left-32 size-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" aria-hidden />
      <div className="fixed bottom-0 -right-32 size-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" aria-hidden />

      {showExamModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="exam-modal-title">
          <div className="bg-surface-dark border border-border-gold rounded-2xl p-8 max-w-md w-full mx-4 gold-glow">
            <h2 id="exam-modal-title" className="text-xl font-bold text-white mb-2">Select exam type</h2>
            <p className="text-slate-400 text-sm mb-6">Choose the type of exam and devices for this session.</p>
            <div className="mb-4 space-y-3">
              <div>
                <label htmlFor="exam-video-device" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Camera
                </label>
                <select
                  id="exam-video-device"
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                  aria-label="Select camera"
                >
                  <option value="">Default (webcam)</option>
                  {videoDevices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>{deviceLabel(d, i, 'videoinput')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="exam-audio-device" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Microphone
                </label>
                <select
                  id="exam-audio-device"
                  value={selectedAudioId}
                  onChange={(e) => setSelectedAudioId(e.target.value)}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                  aria-label="Select microphone"
                >
                  <option value="">Default</option>
                  {audioDevices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>{deviceLabel(d, i, 'audioinput')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-5">
              <label htmlFor="body-region" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Body region <span className="text-slate-600 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="body-region"
                type="text"
                value={bodyRegion}
                onChange={(e) => setBodyRegion(e.target.value)}
                placeholder="e.g. left knee, right shoulder, lower leg"
                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <button type="button" onClick={() => handleChooseExamType('Shoulder')} className="flex-1 min-w-[120px] flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 hover:border-primary/50 text-white font-semibold transition-all">
                <span className="material-symbols-outlined text-primary">elderly</span>
                Shoulder
              </button>
              <button type="button" onClick={() => handleChooseExamType('Scar')} className="flex-1 min-w-[120px] flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 hover:border-primary/50 text-white font-semibold transition-all">
                <span className="material-symbols-outlined text-primary">healing</span>
                Scar
              </button>
              <button type="button" onClick={() => handleChooseExamType('Orthopedic')} className="flex-1 min-w-[120px] flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 hover:border-primary/50 text-white font-semibold transition-all">
                <span className="material-symbols-outlined text-primary">medical_services</span>
                Orthopedic
              </button>
            </div>
            <button type="button" onClick={() => { setShowExamModal(false); setBodyRegion('') }} className="mt-6 w-full py-2 text-slate-400 hover:text-white text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
