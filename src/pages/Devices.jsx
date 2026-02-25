/**
 * Vision Devices — Camera and microphone default selection.
 * Adapted from stitch_device_management; wired to MediaDevices API.
 */
import { useEffect, useState } from 'react'
import { getDevicePrefs, setDevicePrefs } from '../lib/devicePrefs.js'
import { DEVICE_OPTIONS } from '../lib/deviceOptions.js'
import AppLayout from '../components/AppLayout.jsx'

function deviceLabel(device, index, kind) {
  const base = kind === 'videoinput' ? 'Camera' : 'Microphone'
  return device.label?.trim() || `${base} ${index + 1}`
}

export default function Devices() {
  const [videoDevices, setVideoDevices] = useState([])
  const [audioDevices, setAudioDevices] = useState([])
  const [selectedVideoId, setSelectedVideoId] = useState('')
  const [selectedAudioId, setSelectedAudioId] = useState('')
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState('')
  const [saved, setSaved] = useState(false)

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
        setSelectedDeviceTypeId(prefs.deviceTypeId ?? '')
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
      deviceTypeId: selectedDeviceTypeId || null,
    })
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const videoCount = videoDevices.length
  const audioCount = audioDevices.length

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Device Management</h2>
          <p className="text-slate-400 text-lg max-w-2xl">Set your default camera and microphone for sessions. Webcam is the default if none is chosen.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
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
              onChange={(e) => setSelectedVideoId(e.target.value)}
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
              onChange={(e) => setSelectedAudioId(e.target.value)}
              className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              aria-label="Select default microphone"
            >
              <option value="">System default</option>
              {audioDevices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>{deviceLabel(d, i, 'audioinput')}</option>
              ))}
            </select>
          </div>

          <div className="bg-surface-dark/60 backdrop-blur-sm border border-border-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">devices</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Primary device type</h3>
                <p className="text-slate-500 text-sm">Capture hardware for sessions</p>
              </div>
            </div>
            <select
              value={selectedDeviceTypeId ?? ''}
              onChange={(e) => setSelectedDeviceTypeId(e.target.value)}
              className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              aria-label="Select primary device type"
            >
              <option value="">Not set</option>
              {DEVICE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
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
      </div>
    </AppLayout>
  )
}
