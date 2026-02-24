/**
 * Vision MVP — Call transcription proxy (Phase 6). Returns segments with start_time, end_time in seconds.
 * @param {Blob} audioBlob
 * @param {number} timeOffsetSeconds — add to segment start/end for global session time
 * @returns {Promise<Array<{ text: string, start_time: number, end_time: number, segment_id: string }>>}
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

function isNetworkError(e) {
  const msg = (e && e.message) || ''
  return /failed to fetch|network|connection reset|connection refused|load failed/i.test(msg)
}

export async function transcribeAudioChunk(audioBlob, timeOffsetSeconds = 0) {
  if (!audioBlob || audioBlob.size === 0) return []
  const contentType = audioBlob.type || 'audio/webm'
  const body = await audioBlob.arrayBuffer()
  if (body.byteLength === 0) return []
  let res
  try {
    res = await fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body,
    })
  } catch (e) {
    if (isNetworkError(e)) throw new Error('Transcription server unreachable. Run in a separate terminal: npm run server. OPENAI_API_KEY must be set in .env.')
    throw e
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    let message = err.error || 'Transcription failed'
    if (res.status === 404) {
      message = 'Transcription API not available here. On Netlify the backend is not deployed—deploy it elsewhere and set VITE_API_BASE_URL, or run locally with: npm run server'
    } else if (res.status === 413 || err.code === 'TOO_LARGE') {
      message = 'Audio chunk too large (Netlify limit 6MB). Use shorter recording chunks or run the backend locally.'
    } else if (res.status === 503 && err.code === 'NO_API_KEY') {
      message = 'Transcription not configured. OPENAI_API_KEY must be set in .env. Run: npm run server'
    } else if (res.status === 502 || res.status === 500) {
      if (err.code === 'NO_API_KEY') message = 'Transcription not configured. OPENAI_API_KEY must be set in .env. Run: npm run server'
      else message = err.details ? `${err.error || 'Transcription failed'}: ${String(err.details).slice(0, 120)}` : 'Transcription server error. Ensure npm run server is running and OPENAI_API_KEY is set in .env'
    } else if (res.status === 400 && err.details) {
      message += ` (${String(err.details).slice(0, 80)})`
    }
    throw new Error(message)
  }
  const { segments } = await res.json()
  if (!Array.isArray(segments)) return []
  const baseId = `seg-${Date.now()}`
  return segments.map((s, i) => ({
    text: s.text || '',
    start_time: (s.start_time ?? 0) + timeOffsetSeconds,
    end_time: (s.end_time ?? 0) + timeOffsetSeconds,
    segment_id: `${baseId}-${i}`,
  }))
}

/**
 * Transcribe full video (or audio) recording. Returns segments with start_time, end_time in seconds (0-based).
 * @param {Blob} videoBlob — recorded video (e.g. video/webm) or audio blob
 * @returns {Promise<Array<{ text: string, start_time: number, end_time: number, segment_id: string }>>}
 */
export async function transcribeVideo(videoBlob) {
  if (!videoBlob || videoBlob.size === 0) return []
  const contentType = videoBlob.type || 'video/webm'
  const body = await videoBlob.arrayBuffer()
  if (body.byteLength === 0) return []
  let res
  try {
    res = await fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body,
    })
  } catch (e) {
    if (isNetworkError(e)) throw new Error('Transcription server unreachable. Run in a separate terminal: npm run server. OPENAI_API_KEY must be set in .env.')
    throw e
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    let message = err.error || 'Transcription failed'
    if (res.status === 404) {
      message = 'Transcription API not available here. On Netlify the backend is not deployed—deploy it elsewhere and set VITE_API_BASE_URL, or run locally with: npm run server'
    } else if (res.status === 413 || err.code === 'TOO_LARGE') {
      message = 'Audio chunk too large (Netlify limit 6MB). Use shorter recording chunks or run the backend locally.'
    } else if (res.status === 503 && err.code === 'NO_API_KEY') {
      message = 'Transcription not configured. OPENAI_API_KEY must be set in .env. Run: npm run server'
    } else if (res.status === 502 || res.status === 500) {
      if (err.code === 'NO_API_KEY') message = 'Transcription not configured. OPENAI_API_KEY must be set in .env. Run: npm run server'
      else message = err.details ? `${err.error || 'Transcription failed'}: ${String(err.details).slice(0, 120)}` : 'Transcription server error. Ensure npm run server is running and OPENAI_API_KEY is set in .env'
    } else if (res.status === 400 && err.details) {
      message += ` (${String(err.details).slice(0, 80)})`
    }
    throw new Error(message)
  }
  const { segments } = await res.json()
  if (!Array.isArray(segments)) return []
  const baseId = `seg-${Date.now()}`
  return segments.map((s, i) => ({
    text: s.text || '',
    start_time: s.start_time ?? 0,
    end_time: s.end_time ?? 0,
    segment_id: `${baseId}-${i}`,
  }))
}
