/**
 * Vision Devices — Device Management page.
 * Matches stitch_device_management design; keeps default camera and microphone selection.
 */
import { useEffect, useState } from 'react'
import { getDevicePrefs, setDevicePrefs } from '../lib/devicePrefs.js'
import { DEVICE_OPTIONS, DEVICE_CARDS } from '../lib/deviceOptions.js'
import AppLayout from '../components/AppLayout.jsx'

function deviceLabel(device, index, kind) {
  const base = kind === 'videoinput' ? 'Camera' : 'Microphone'
  return device.label?.trim() || `${base} ${index + 1}`
}

const GLASS_PANEL = 'bg-surface-dark/60 backdrop-blur-sm border border-primary/10'

export default function Devices() {
  const [videoDevices, setVideoDevices] = useState([])
  const [audioDevices, setAudioDevices] = useState([])
  const [selectedVideoId, setSelectedVideoId] = useState('')
  const [selectedAudioId, setSelectedAudioId] = useState('')
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState('')
  const [saved, setSaved] = useState(false)
  const [showDefaults, setShowDefaults] = useState(false)

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

  return (
    <AppLayout>
      <div className="p-6 lg:p-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Device Management</h2>
            <p className="text-slate-400 text-lg max-w-2xl">Monitor and calibrate high-fidelity imaging hardware across your clinical network.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden xl:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
              <input className="bg-surface-dark border border-border-dark text-slate-100 rounded-lg pl-10 pr-4 py-2 w-64 focus:ring-primary focus:border-primary" placeholder="Search hardware..." type="text" aria-label="Search hardware" />
            </div>
            <button type="button" className="bg-primary hover:bg-primary/90 text-background-dark font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-primary/10">
              <span className="material-symbols-outlined">add_circle</span>
              Pair New Device
            </button>
          </div>
        </header>

        <section className={`${GLASS_PANEL} rounded-xl p-4 mb-12`}>
          <button
            type="button"
            onClick={() => setShowDefaults(!showDefaults)}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors w-full text-left"
            aria-expanded={showDefaults}
          >
            <span className="material-symbols-outlined text-primary">{showDefaults ? 'expand_less' : 'expand_more'}</span>
            <span className="font-semibold">Default camera & microphone</span>
            <span className="text-slate-500 text-sm">({videoDevices.length} camera{videoDevices.length !== 1 ? 's' : ''}, {audioDevices.length} mic{audioDevices.length !== 1 ? 's' : ''} found)</span>
            {saved && <span className="text-emerald-500 text-sm ml-auto">Saved</span>}
          </button>
          {showDefaults && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border-dark">
              <div>
                <label htmlFor="default-camera" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Camera</label>
                <select
                  id="default-camera"
                  value={selectedVideoId ?? ''}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60"
                  aria-label="Select default camera"
                >
                  <option value="">System default (webcam)</option>
                  {videoDevices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>{deviceLabel(d, i, 'videoinput')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="default-mic" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Microphone</label>
                <select
                  id="default-mic"
                  value={selectedAudioId ?? ''}
                  onChange={(e) => setSelectedAudioId(e.target.value)}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60"
                  aria-label="Select default microphone"
                >
                  <option value="">System default</option>
                  {audioDevices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>{deviceLabel(d, i, 'audioinput')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="default-device-type" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Primary device type</label>
                <select
                  id="default-device-type"
                  value={selectedDeviceTypeId ?? ''}
                  onChange={(e) => setSelectedDeviceTypeId(e.target.value)}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60"
                  aria-label="Select primary device type"
                >
                  <option value="">Not set</option>
                  {DEVICE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button type="button" onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#d4b56d] text-background-dark font-bold rounded-lg transition-all">
                  <span className="material-symbols-outlined">save</span>
                  {saved ? 'Saved' : 'Save defaults'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12`}>
          <div className={`${GLASS_PANEL} p-6 rounded-xl flex items-center gap-4`}>
            <div className="size-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Active Devices</p>
              <p className="text-2xl font-bold text-white">03</p>
            </div>
          </div>
          <div className={`${GLASS_PANEL} p-6 rounded-xl flex items-center gap-4`}>
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">sync</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Syncing Status</p>
              <p className="text-2xl font-bold text-white">Optimal</p>
            </div>
          </div>
          <div className={`${GLASS_PANEL} p-6 rounded-xl flex items-center gap-4`}>
            <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <span className="material-symbols-outlined">battery_charging_full</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Average Battery</p>
              <p className="text-2xl font-bold text-white">63%</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {DEVICE_CARDS.map((card) => {
            const isOffline = card.status === 'offline'
            const isPairing = card.status === 'pairing'
            const batteryColor = isOffline ? 'text-slate-600' : card.batteryDisplay === '42%' ? 'text-orange-400' : 'text-slate-400'
            return (
              <div key={card.id} className={`${GLASS_PANEL} rounded-xl overflow-hidden group hover:border-primary/40 transition-all ${isOffline ? 'opacity-90' : ''}`}>
                <div className={`aspect-video relative overflow-hidden bg-neutral-dark/50 ${isOffline ? 'grayscale opacity-50' : ''}`}>
                  <img src={card.imageUrl} alt="" className={`w-full h-full object-cover ${isOffline ? '' : isPairing ? 'opacity-80 blur-[2px]' : 'opacity-80 group-hover:scale-105 transition-transform duration-500'}`} />
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
                    <button type="button" className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-colors ${isOffline ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'}`} disabled={isOffline}>
                      {isOffline ? 'Offline' : 'Configure'}
                    </button>
                    <button type="button" className={`px-3 border rounded-lg transition-colors ${isOffline ? 'border-slate-800 text-slate-600' : 'border-slate-700 hover:border-slate-500 text-slate-400'}`} aria-label="More options">
                      <span className="material-symbols-outlined text-sm">more_vert</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          <button type="button" className="border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center p-8 group hover:border-primary/50 transition-all cursor-pointer bg-primary/5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-4">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Add New Device</h3>
            <p className="text-slate-400 text-sm text-center">Register new clinical hardware to your Vision network</p>
          </button>
        </section>

        <footer className="mt-16 pt-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm gap-4">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden />
              Central Relay: Online
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden />
              Encryption: AES-256 Active
            </span>
          </div>
          <div>Version 4.2.1-clinical • System Last Calibrated: 2h ago</div>
        </footer>
      </div>
    </AppLayout>
  )
}
