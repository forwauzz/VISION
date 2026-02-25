/**
 * Vision — Device preferences for camera and microphone.
 * Persists default video/audio device IDs in localStorage.
 * null = use browser default (webcam).
 */

const DEVICE_PREFS_KEY = 'VISION_DEVICE_PREFS'

/**
 * @typedef {{ videoDeviceId?: string | null, audioDeviceId?: string | null }} DevicePrefs
 */

/**
 * @returns {DevicePrefs}
 */
export function getDevicePrefs() {
  try {
    const raw = localStorage.getItem(DEVICE_PREFS_KEY)
    if (!raw) return { videoDeviceId: null, audioDeviceId: null }
    const parsed = JSON.parse(raw)
    return {
      videoDeviceId: parsed.videoDeviceId ?? null,
      audioDeviceId: parsed.audioDeviceId ?? null,
    }
  } catch {
    return { videoDeviceId: null, audioDeviceId: null }
  }
}

/**
 * @param {{ videoDeviceId?: string | null, audioDeviceId?: string | null }} prefs
 * @returns {boolean}
 */
export function setDevicePrefs(prefs) {
  try {
    const current = getDevicePrefs()
    const next = {
      videoDeviceId: prefs.videoDeviceId !== undefined ? prefs.videoDeviceId : current.videoDeviceId,
      audioDeviceId: prefs.audioDeviceId !== undefined ? prefs.audioDeviceId : current.audioDeviceId,
    }
    localStorage.setItem(DEVICE_PREFS_KEY, JSON.stringify(next))
    return true
  } catch {
    return false
  }
}
