/**
 * Vision MVP — Transcription proxy (Phase 6) + Vision describe-frames (post-MVP).
 * POST /api/transcribe: body = raw audio; returns { segments }.
 * POST /api/vision/describe-frames: body = { examType, audio_transcript, frames }; returns { frames } with visual_description + visibility.
 */
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = Number(process.env.TRANSCRIPTION_PORT) || 3009
const OPENAI_KEY = process.env.OPENAI_API_KEY

const MAX_VISION_FRAMES = 20

app.use(cors({ origin: true }))

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'vision-api' }))

// Vision: JSON body. Transcribe: raw body (see route below).
function buildBodyContext(examType, bodyRegion) {
  const base = examType === 'Shoulder' ? 'Orthopedic shoulder exam'
    : examType === 'Scar' ? 'Scar / wound assessment'
    : examType === 'Orthopedic' ? 'Orthopedic physical exam'
    : `${examType} exam`
  return bodyRegion ? `${base} – ${bodyRegion}` : base
}

app.post('/api/vision/describe-frames', express.json({ limit: '20mb' }), async (req, res) => {
  if (!OPENAI_KEY) {
    return res.status(503).json({ error: 'Vision not configured (missing OPENAI_API_KEY)' })
  }
  const { examType, audio_transcript = [], frames = [], bodyRegion = '' } = req.body || {}
  if (!examType || !Array.isArray(frames) || frames.length === 0) {
    return res.status(400).json({ error: 'Missing examType or frames' })
  }
  const toProcess = frames
    .filter((f) => f.dataUrl && (!f.visual_description || !f.visual_description.trim()))
    .slice(0, MAX_VISION_FRAMES)
  if (toProcess.length === 0) {
    return res.json({ frames: frames.map((f) => ({ ...f })) })
  }
  const transcriptBySegmentId = (audio_transcript || []).reduce((acc, s) => {
    if (s.segment_id) acc[s.segment_id] = s.text || ''
    return acc
  }, {})

  const bodyContext = buildBodyContext(examType, bodyRegion)
  const systemPrompt = `You are assisting with documentation of physical examination findings for medico-legal orthopedic and surgical records.

OBSERVATION GUIDELINES:
- If a patient is moving a limb, estimate and describe the range of motion in degrees (e.g., "shoulder flexion to approximately 90°", "knee flexion to approximately 110°")
- Describe movement quality: smooth, guarded, antalgic, asymmetric, restricted
- Note visible signs: swelling (localized/diffuse), muscle atrophy, deformity (valgus/varus/angular/rotational), surgical scars, skin changes
- Describe patient posture and weight-bearing if visible
- If a clinician is performing a test, describe the patient's position and visible response

STRICT RULES:
- Only describe what is directly visible in the image. Do not diagnose or infer cause.
- Forbidden: "likely", "consistent with", "suggestive of", severity grading, measurements not visible
- No markdown, hashtags, or bullet points. Plain sentences only.
- If image quality is insufficient: visibility "not_assessable", description "Image insufficient for clinical description."
- Respond with valid JSON only: {"frame_id":"...","visual_description":"1-3 sentences, max 250 chars","visibility":"ok"|"obscured"|"not_assessable"}`

  function cleanDescription(text) {
    if (!text || typeof text !== 'string') return ''
    return text
      .replace(/#+\s*/g, '')
      .replace(/\s*#\w+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500)
  }

  const results = await Promise.all(
    toProcess.map(async (frame) => {
      const transcriptExcerpt = transcriptBySegmentId[frame.linked_transcript_segment_id] || '(no transcript excerpt)'
      const userPrompt = `Exam context: ${bodyContext}.\nTranscript at this moment: "${transcriptExcerpt}".\n\nUsing physical examination terminology appropriate for this exam, describe what you observe.\nIf the patient is demonstrating range of motion, estimate the degrees visible.\nDescribe posture, movement quality, visible anatomical findings, and any observable clinical signs.\nRespond with JSON: {"frame_id":"${frame.frame_id}","visual_description":"...","visibility":"ok"|"obscured"|"not_assessable"}.`
      const imagePart = frame.dataUrl.startsWith('data:') ? frame.dataUrl : `data:image/jpeg;base64,${frame.dataUrl}`
      try {
        const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_tokens: 200,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  { type: 'text', text: userPrompt },
                  { type: 'image_url', image_url: { url: imagePart } },
                ],
              },
            ],
          }),
        })
        if (!oaiRes.ok) {
          const err = await oaiRes.text()
          return { ...frame, visual_description: '', visibility: 'not_assessable' }
        }
        const data = await oaiRes.json()
        const content = data?.choices?.[0]?.message?.content?.trim() || '{}'
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
        const desc = cleanDescription(parsed.visual_description || '')
        const vis = ['ok', 'obscured', 'not_assessable'].includes(parsed.visibility) ? parsed.visibility : 'ok'
        return { ...frame, visual_description: desc, visibility: vis }
      } catch (e) {
        return { ...frame, visual_description: '', visibility: 'not_assessable' }
      }
    })
  )

  const byId = new Map(results.map((r) => [r.frame_id, r]))
  const merged = frames.map((f) => byId.get(f.frame_id) || f)
  res.json({ frames: merged })
})

app.post('/api/vision/summarize-session', express.json({ limit: '2mb' }), async (req, res) => {
  if (!OPENAI_KEY) {
    return res.status(503).json({ error: 'Summarization not configured (missing OPENAI_API_KEY)' })
  }
  const { examType, audio_transcript = [], frames = [], bodyRegion = '' } = req.body || {}
  if (!examType) {
    return res.status(400).json({ error: 'Missing examType' })
  }
  const transcriptText = (audio_transcript || []).map((s) => s.text || '').filter(Boolean).join(' ').trim()
  const frameDescriptions = (frames || []).map((f) => f.visual_description || '').filter(Boolean).join('\n')
  const bodyContext = buildBodyContext(examType, bodyRegion)
  const headings = Array.isArray(req.body.headings) && req.body.headings.length > 0 ? req.body.headings : ['Inspection', 'Active Range of Motion', 'Swelling', 'Scarring']
  const keysList = headings.map((h) => `"${h}"`).join(', ')
  const systemPrompt = `You assist with documentation for medico-legal purposes. Using only the transcript and frame descriptions provided, generate structured report sections. Do not diagnose, infer cause, or prognosis. Do not invent findings not supported by the transcript or descriptions. Use neutral, objective language. Output valid JSON only with keys: ${keysList}. Each value is a string (1–4 sentences). Use "Not visually assessable" where there is no relevant content.`
  const exampleJson = headings.reduce((acc, h) => ({ ...acc, [h]: '...' }), {})
  const userPrompt = `Exam context: ${bodyContext}.\n\nTranscript:\n${transcriptText || '(none)'}\n\nFrame descriptions:\n${frameDescriptions || '(none)'}\n\nRespond with JSON: ${JSON.stringify(exampleJson)}.`
  try {
    const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 800,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
    if (!oaiRes.ok) {
      const errText = await oaiRes.text()
      return res.status(oaiRes.status).json({ error: 'Summarization failed', details: errText })
    }
    const data = await oaiRes.json()
    const content = data?.choices?.[0]?.message?.content?.trim() || '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const structured_exam = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    const normalized = {}
    for (const h of headings) {
      normalized[h] = typeof structured_exam[h] === 'string' ? structured_exam[h].slice(0, 2000) : ''
    }
    res.json({ structured_exam: normalized })
  } catch (e) {
    res.status(500).json({ error: 'Summarization error', details: e.message })
  }
})

app.post('/api/transcribe', express.raw({ type: () => true, limit: '50mb' }), async (req, res) => {
  if (!OPENAI_KEY) {
    return res.status(503).json({ error: 'Transcription not configured (missing OPENAI_API_KEY)', code: 'NO_API_KEY' })
  }
  let body = null
  try {
    body = Buffer.isBuffer(req.body) ? req.body : (req.body ? Buffer.from(req.body) : null)
  } catch (bodyErr) {
    console.error('[transcribe] Invalid request body', bodyErr.message)
    return res.status(400).json({ error: 'Invalid request body', code: 'BAD_BODY' })
  }
  if (!body || body.length === 0) {
    return res.json({ segments: [] })
  }
  const contentType = (req.headers['content-type'] || '').split(';')[0].trim() || 'audio/webm'
  try {
    const ext = contentType.includes('mp4') ? 'mp4' : contentType.includes('wav') ? 'wav' : 'webm'
    const formData = new FormData()
    formData.append('file', new Blob([body], { type: contentType }), `audio.${ext}`)
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'verbose_json')
    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: formData,
    })
    const resText = await whisperRes.text()
    if (!whisperRes.ok) {
      console.warn('[transcribe] Whisper error', whisperRes.status, resText.slice(0, 300))
      if (whisperRes.status >= 400 && whisperRes.status < 500) {
        return res.json({ segments: [] })
      }
      return res.status(502).json({ error: 'Transcription failed', details: resText.slice(0, 500), code: 'WHISPER_ERROR' })
    }
    let data
    try {
      data = JSON.parse(resText)
    } catch (parseErr) {
      console.error('[transcribe] Whisper response not JSON', parseErr.message)
      return res.status(502).json({ error: 'Invalid response from transcription service', details: parseErr.message, code: 'INVALID_RESPONSE' })
    }
    const whisperSegments = data?.segments ?? []
    const segments = whisperSegments
      .map(s => ({ text: (s.text || '').trim(), start_time: s.start ?? 0, end_time: s.end ?? 0 }))
      .filter(s => s.text)
    res.json({ segments })
  } catch (e) {
    console.error('[transcribe] Error', e.message)
    res.status(500).json({ error: 'Transcription error', details: e.message, code: 'SERVER_ERROR' })
  }
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Vision transcription proxy on http://localhost:${PORT}`)
  })
}

export { app }
