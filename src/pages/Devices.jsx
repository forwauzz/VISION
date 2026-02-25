/**
 * Vision Devices — Camera and microphone default selection.
 * Adapted from stitch_device_management; wired to MediaDevices API.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuth, clearAuth } from '../lib/auth.js'
import { getDevicePrefs, setDevicePrefs } from '../lib/devicePrefs.js'

function deviceLabel(device, index, kind) {
  const base = kind === 'videoinput' ? 'Camera' : 'Microphone'
  return device.label?.trim() || `${base} ${index + 1}`
}

export default function Devices() {
  const navigate = useNavigate()
  const [auth, setAuth] = useState(getAuth)
  const [videoDevices, setVideoDevices] = useState([])
  const [audioDevices, setAudioDevices] = useState([])
  const [selectedVideoId, setSelectedVideoId] = useState(null)
  const [selectedAudioId, setSelectedAudioId] = useState(null)
  const [saved, setSaved] = useState(false)
  const displayName = auth?.displayName ?? 'User'

  useEffect(() => {
    setAuth(getAuth())
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        if (cancelled) return
        const video = devices.filter((d) => d.kind === 'videoinput')
        const audio = devices.filter((d) => d.kind === 'audioinput')
        setVideoDevices(video)
        setAudioDevices(audio)
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
  }, [])

  function handleSave() {
    const ok = setDevicePrefs({
      videoDeviceId: selectedVideoId || null,
      audioDeviceId: selectedAudioId || null,
    })
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  function handleLogout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const videoCount = videoDevices.length
  const audioCount = audioDevices.length

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen selection:bg-primary/30">
      <header className="sticky top-0 z-50 w-full border-b border-border-dark bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="size-9 bg-primary flex items-center justify-center rounded-lg shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-background-dark font-bold text-2xl">visibility</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white uppercase">Vision</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              <Link to="/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Dashboard</Link>
              <span className="text-sm font-semibold text-primary border-b-2 border-primary pb-0.5">Devices</span>
              <Link to="/establishment-selector" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Establishments</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-bold text-white leading-none">{displayName}</span>
              <span className="text-[10px] text-primary uppercase tracking-widest mt-1 font-semibold">Administrator</span>
            </div>
            <div className="relative group cursor-pointer" title="Log out">
              <button type="button" onClick={handleLogout} className="block rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50">
                <div className="size-10 rounded-full border-2 border-border-dark group-hover:border-primary transition-all p-0.5">
                  <img alt="User avatar" className="rounded-full w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcga_wSdkRQTchXdjuyfVOc8J-ygzwH1sqf79dzyrncUtdKPfxtG4M-MZEZQzEtacZEZBHrsa_YNhM4Tt_W2bUXovl0XpeIdLEyA04r899Aaq915I9a7ImM5b1p7e9YPyxKtXB6IfizGQ5MfcjmfKXJBIJ3l-QHn3p1u4bh1423TqAIn5lqBuxWK_cWjhfNqj7oK6dcJ5U9uKYNN7jL4MtUfyMZc5juIrf0LGxj-THyz6glkG25VbtPnXOMrmC2Wcm3bvR1rMZkmI" />
                </div>
              </button>
              <div className="absolute -bottom-1 -right-1 bg-background-dark border border-border-dark rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-[12px] text-red-400">logout</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Device Management</h2>
          <p className="text-slate-400 text-lg max-w-2xl">Set your default camera and microphone for sessions. Webcam is the default if none is chosen.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-surface-dark/60 backdrop-blur-sm border border-border-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">videocam</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Default camera</h3>
                <p className="text-slate-500 text-sm">{videoCount} device{videoCount !== 1 ? 's' : ''} found</p>
              </div>
            </div>
            <select
              value={selectedVideoId ?? ''}
              onChange={(e) => setSelectedVideoId(e.target.value || null)}
              className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              aria-label="Select default camera"
            >
              <option value="">System default (webcam)</option>
              {videoDevices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>{deviceLabel(d, i, 'videoinput')}</option>
              ))}
            </select>
          </div>

          <div className="bg-surface-dark/60 backdrop-blur-sm border border-border-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">mic</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Default microphone</h3>
                <p className="text-slate-500 text-sm">{audioCount} device{audioCount !== 1 ? 's' : ''} found</p>
              </div>
            </div>
            <select
              value={selectedAudioId ?? ''}
              onChange={(e) => setSelectedAudioId(e.target.value || null)}
              className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              aria-label="Select default microphone"
            >
              <option value="">System default</option>
              {audioDevices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>{deviceLabel(d, i, 'audioinput')}</option>
              ))}
            </select>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#d4b56d] text-background-dark font-bold rounded-lg transition-all"
          >
            <span className="material-symbols-outlined">save</span>
            {saved ? 'Saved' : 'Save defaults'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-500 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Defaults saved
            </span>
          )}
        </div>

        <p className="mt-8 text-slate-500 text-sm max-w-xl">
          These defaults are used when you start a session. You can also choose a different device in the exam modal before each session.
        </p>
      </main>
    </div>
  )
}
