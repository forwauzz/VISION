/**
 * Vision MVP — Call transcription proxy (Phase 6). Returns segments with start_time, end_time in seconds.
 * @param {Blob} audioBlob
 * @param {number} timeOffsetSeconds — add to segment start/end for global session time
 * @returns {Promise<Array<{ text: string, start_time: number, end_time: number, segment_id: string }>>}
 */
export async function transcribeAudioChunk(audioBlob, timeOffsetSeconds = 0) {
  if (!audioBlob || audioBlob.size === 0) return []
  const contentType = audioBlob.type || 'audio/webm'
  const body = await audioBlob.arrayBuffer()
  if (body.byteLength === 0) return []
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    let message = err.error || 'Transcription failed'
    if (res.status === 502 || res.status === 500) message = 'Transcription server unreachable. Start it with: npm run server'
    if (res.status === 400 && err.details) message += ` (${err.details.slice(0, 80)})`
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
