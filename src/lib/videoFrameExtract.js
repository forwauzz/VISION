/**
 * Vision — Extract frames from a recorded video blob at fixed intervals.
 * Used to build frame list for "analyze recorded video" flow.
 * @typedef {{ text: string, start_time: number, end_time: number, segment_id?: string }} TranscriptSegment
 * @typedef {{ frame_id: string, timestamp: string, linked_transcript_segment_id: string, visual_description: string, dataUrl?: string, autoCaptured?: boolean }} FrameRecord
 */

const DEFAULT_INTERVAL_SECONDS = 10
const DEFAULT_MAX_FRAMES = 20

function findNearestSegmentId(transcriptSegments, timeSeconds) {
  if (!transcriptSegments?.length) return ''
  let best = transcriptSegments[0]
  let bestDist = Math.abs((best.start_time + best.end_time) / 2 - timeSeconds)
  for (const seg of transcriptSegments) {
    const mid = (seg.start_time + seg.end_time) / 2
    const dist = Math.abs(mid - timeSeconds)
    if (dist < bestDist) {
      bestDist = dist
      best = seg
    }
  }
  return best?.segment_id ?? ''
}

/**
 * @param {Blob | string} blobOrUrl — video Blob or object URL string
 * @param {{ intervalSeconds?: number, maxFrames?: number }} options
 * @param {TranscriptSegment[]} transcriptSegments — for linking frames to segments by time
 * @param {number} sessionStartTimeMs — session start time (ms) for ISO timestamp
 * @returns {Promise<FrameRecord[]>}
 */
export async function extractFramesFromVideoBlob(blobOrUrl, options, transcriptSegments, sessionStartTimeMs) {
  const intervalSeconds = options?.intervalSeconds ?? DEFAULT_INTERVAL_SECONDS
  const maxFrames = options?.maxFrames ?? DEFAULT_MAX_FRAMES
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl)
  const revokeUrl = typeof blobOrUrl !== 'string'

  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'metadata'
  video.src = url

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve
    video.onerror = () => reject(new Error('Video failed to load'))
  })

  const duration = video.duration
  if (!Number.isFinite(duration) || duration <= 0) return []

  const timestamps = []
  for (let t = 0; t < duration && timestamps.length < maxFrames; t += intervalSeconds) {
    timestamps.push(Math.min(t, duration))
  }
  if (timestamps.length === 0) timestamps.push(0)

  const frames = []
  const canvas = document.createElement('canvas')

  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i]
    video.currentTime = t
    await new Promise((resolve, reject) => {
      video.onseeked = resolve
      video.onerror = () => reject(new Error('Seek failed'))
      setTimeout(() => resolve(), 2000)
    })

    if (video.readyState < 2) continue
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const frameId = `frame-extract-${Date.now()}-${i}`
    const timestamp = new Date(sessionStartTimeMs + t * 1000).toISOString()
    const linkedId = findNearestSegmentId(transcriptSegments, t)
    frames.push({
      frame_id: frameId,
      timestamp,
      linked_transcript_segment_id: linkedId,
      visual_description: '',
      dataUrl,
      autoCaptured: true,
    })
  }

  if (revokeUrl) URL.revokeObjectURL(url)
  return frames
}
