/**
 * Vision MVP — Transcription proxy (Phase 6) + Vision describe-frames (post-MVP).
 * POST /api/transcribe: body = raw audio; returns { segments }.
 * POST /api/vision/describe-frames: body = { examType, audio_transcript, frames }; returns { frames } with visual_description + visibility.
 */
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = Number(process.env.TRANSCRIPTION_PORT) || 3009
const DEEPGRAM_KEY = process.env.DEEPGRAM_API_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY

const MAX_VISION_FRAMES = 20

app.use(cors({ origin: true }))

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'vision-api' }))

// Vision: JSON body. Transcribe: raw body (see route below).
app.post('/api/vision/describe-frames', express.json({ limit: '20mb' }), async (req, res) => {
  if (!OPENAI_KEY) {
    return res.status(503).json({ error: 'Vision not configured (missing OPENAI_API_KEY)' })
  }
  const { examType, audio_transcript = [], frames = [] } = req.body || {}
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

  const bodyContext = examType === 'Shoulder' ? 'Orthopedic shoulder exam' : examType === 'Scar' ? 'Scar / wound assessment' : examType === 'Orthopedic' ? 'Orthopedic physical exam' : `${examType} exam`
  const systemPrompt = `You assist with documentation of visual findings for medico-legal purposes. Only describe what is directly visible. Do not diagnose, infer cause, or prognosis. Use neutral, objective language. No speculation. If image quality is insufficient, respond with visibility "not_assessable" and visual_description "Image insufficient for clinical description." Forbidden: measurements, severity grading unless visually obvious, "likely", "consistent with", "suggestive of". Do not use hashtags, markdown, or bullet symbols in visual_description. Use clean, professional prose only (plain sentences). Respond with valid JSON only: {"frame_id":"...","visual_description":"1-3 sentences, max 200 chars","visibility":"ok"|"obscured"|"not_assessable"}.`

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
      const userPrompt = `Exam context: ${bodyContext}. Transcript excerpt for this moment: "${transcriptExcerpt}". Describe only what is visible in this image. Respond with JSON: {"frame_id":"${frame.frame_id}","visual_description":"...","visibility":"ok"|"obscured"|"not_assessable"}.`
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
  const { examType, audio_transcript = [], frames = [] } = req.body || {}
  if (!examType) {
    return res.status(400).json({ error: 'Missing examType' })
  }
  const transcriptText = (audio_transcript || []).map((s) => s.text || '').filter(Boolean).join(' ').trim()
  const frameDescriptions = (frames || []).map((f) => f.visual_description || '').filter(Boolean).join('\n')
  const bodyContext = examType === 'Shoulder' ? 'Orthopedic shoulder exam' : examType === 'Scar' ? 'Scar / wound assessment' : examType === 'Orthopedic' ? 'Orthopedic physical exam' : `${examType} exam`
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
  if (!DEEPGRAM_KEY) {
    return res.status(503).json({ error: 'Transcription not configured (missing DEEPGRAM_API_KEY)' })
  }
  if (!req.body || req.body.length === 0) {
    return res.json({ segments: [] })
  }
  const contentType = req.headers['content-type'] || 'audio/webm'
  try {
    const dgRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true', {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_KEY}`,
        'Content-Type': contentType,
      },
      body: req.body,
    })
    if (!dgRes.ok) {
      const errText = await dgRes.text()
      console.warn('[transcribe] Deepgram error', dgRes.status, errText.slice(0, 200))
      if (dgRes.status >= 400 && dgRes.status < 500) {
        return res.json({ segments: [] })
      }
      return res.status(dgRes.status).json({ error: 'Transcription failed', details: errText })
    }
    const data = await dgRes.json()
    const channel = data?.results?.channels?.[0]
    const alternative = channel?.alternatives?.[0]
    const words = alternative?.words ?? []
    // Group words into sentence-like segments (end on . ! ? or after many words) for readable display
    const segments = []
    let current = { text: [], start_time: null, end_time: null }
    const flush = () => {
      if (current.text.length === 0) return
      segments.push({
        text: current.text.join(' ').replace(/\s+/g, ' ').trim(),
        start_time: current.start_time,
        end_time: current.end_time,
      })
      current = { text: [], start_time: null, end_time: null }
    }
    for (const w of words) {
      const text = (w.punctuated_word ?? w.word ?? '').trim()
      if (!text) continue
      if (current.start_time == null) current.start_time = w.start ?? 0
      current.end_time = w.end ?? current.end_time
      current.text.push(text)
      const endsSentence = /[.!?]$/.test(text)
      if (endsSentence || current.text.length >= 12) flush()
    }
    flush()
    res.json({ segments })
  } catch (e) {
    res.status(500).json({ error: 'Transcription error', details: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`Vision transcription proxy on http://localhost:${PORT}`)
})
