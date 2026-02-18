/**
 * Vision — Batch frame description via OpenAI (post-MVP). DESIGN_FEEDBACK.md.
 * POST /api/vision/describe-frames with session payload; returns frames with visual_description + visibility.
 * Client should send downscaled images (e.g. max 1024px) to reduce payload and cost.
 */

const MAX_FRAME_SIZE = 1024

/**
 * Downscale a data URL image to max MAX_FRAME_SIZE on longest side, JPEG 0.8.
 * @param {string} dataUrl
 * @returns {Promise<string>}
 */
export function downscaleFrameDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const scale = Math.min(1, MAX_FRAME_SIZE / Math.max(w, h))
      const cw = Math.round(w * scale)
      const ch = Math.round(h * scale)
      const canvas = document.createElement('canvas')
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, cw, ch)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = dataUrl
  })
}

/**
 * Call backend to describe frames with OpenAI Vision. Frames without dataUrl or with existing visual_description are passed through.
 * @param {{ examType: string, audio_transcript: Array<{ segment_id?: string, text: string }>, frames: Array<{ frame_id: string, dataUrl?: string, visual_description?: string, [key: string]: unknown }> }} payload
 * @returns {Promise<Array<{ frame_id: string, timestamp: string, linked_transcript_segment_id: string, visual_description: string, visibility?: string, dataUrl?: string, autoCaptured?: boolean }>>}
 */
export async function describeFrames(payload) {
  const { examType, audio_transcript = [], frames = [] } = payload
  const framesWithImages = frames.filter((f) => f.dataUrl)
  const toSend = await Promise.all(
    framesWithImages.map(async (f) => ({
      ...f,
      dataUrl: await downscaleFrameDataUrl(f.dataUrl),
    }))
  )
  const res = await fetch('/api/vision/describe-frames', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examType, audio_transcript, frames: toSend }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const msg = res.status === 503
      ? 'Vision not configured. Add OPENAI_API_KEY to .env and restart server.'
      : res.status === 404
        ? 'Backend not running. Start it with: npm run server'
        : (err.error || 'Frame description failed')
    throw new Error(msg)
  }
  const { frames: updated } = await res.json()
  return updated || frames
}

/**
 * Session summarization: transcript + frame descriptions → structured report sections via OpenAI (text-only).
 * @param {{ examType: string, audio_transcript: Array<{ text: string }>, frames: Array<{ visual_description?: string }>, headings?: string[] }} payload — headings from getTemplateForExamType(examType)
 * @returns {Promise<import('./sessionStorageSchema.js').StructuredExam>}
 */
export async function summarizeSession(payload) {
  const { examType, audio_transcript = [], frames = [], headings } = payload
  const res = await fetch('/api/vision/summarize-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examType, audio_transcript, frames, headings: headings || [] }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const msg = res.status === 503
      ? 'Summarization not configured. Add OPENAI_API_KEY to .env and restart server.'
      : res.status === 404
        ? 'Backend not running. Start it with: npm run server'
        : (err.error || 'Summarization failed')
    throw new Error(msg)
  }
  const { structured_exam } = await res.json()
  return structured_exam || {}
}
