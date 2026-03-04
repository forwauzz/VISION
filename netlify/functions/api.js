/**
 * Vision API — Netlify Function. Handles /api/health, /api/transcribe, /api/vision/*.
 * Set OPENAI_API_KEY in Netlify env. Request body limit: 6MB (Netlify default).
 */

const OPENAI_KEY = process.env.OPENAI_API_KEY
const MAX_BODY_BYTES = 6 * 1024 * 1024 // 6MB Netlify limit
const MAX_VISION_FRAMES = 20

export function corsHeaders(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function jsonResponse(statusCode, data, origin) {
  return {
    statusCode,
    headers: corsHeaders(origin),
    body: JSON.stringify(data),
  }
}

function buildBodyContext(examType, bodyRegion) {
  const base = examType === 'Shoulder' ? 'Orthopedic shoulder exam'
    : examType === 'Scar' ? 'Scar / wound assessment'
    : examType === 'Orthopedic' ? 'Orthopedic physical exam'
    : `${examType} exam`
  return bodyRegion ? `${base} – ${bodyRegion}` : base
}

/** GET /api/health */
export function handleHealth(origin) {
  return jsonResponse(200, { ok: true, service: 'vision-api' }, origin)
}

/** POST /api/transcribe — raw audio body (base64 when binary). */
export async function handleTranscribe(event) {
  const origin = event.headers?.origin
  if (!OPENAI_KEY) {
    return jsonResponse(503, { error: 'Transcription not configured (missing OPENAI_API_KEY)', code: 'NO_API_KEY' }, origin)
  }
  let body
  try {
    const raw = event.body || ''
    body = event.isBase64Encoded ? Buffer.from(raw, 'base64') : Buffer.from(raw, 'utf8')
  } catch (e) {
    return jsonResponse(400, { error: 'Invalid request body', code: 'BAD_BODY' }, origin)
  }
  if (body.length > MAX_BODY_BYTES) {
    return jsonResponse(413, { error: 'Request body too large (max 6MB on Netlify)', code: 'TOO_LARGE' }, origin)
  }
  if (body.length === 0) {
    return jsonResponse(200, { segments: [] }, origin)
  }
  const contentType = (event.headers?.['content-type'] || '').split(';')[0].trim() || 'audio/webm'
  const ext = contentType.includes('mp4') ? 'mp4' : contentType.includes('wav') ? 'wav' : 'webm'
  const formData = new FormData()
  formData.append('file', new Blob([body], { type: contentType }), `audio.${ext}`)
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'verbose_json')
  try {
    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: formData,
    })
    const resText = await whisperRes.text()
    if (!whisperRes.ok) {
      if (whisperRes.status >= 400 && whisperRes.status < 500) {
        return jsonResponse(200, { segments: [] }, origin)
      }
      return jsonResponse(502, { error: 'Transcription failed', details: resText.slice(0, 500), code: 'WHISPER_ERROR' }, origin)
    }
    const data = JSON.parse(resText)
    const whisperSegments = data?.segments ?? []
    const segments = whisperSegments
      .map(s => ({ text: (s.text || '').trim(), start_time: s.start ?? 0, end_time: s.end ?? 0 }))
      .filter(s => s.text)
    return jsonResponse(200, { segments }, origin)
  } catch (e) {
    return jsonResponse(500, { error: 'Transcription error', details: e.message, code: 'SERVER_ERROR' }, origin)
  }
}

function cleanDescription(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/#+\s*/g, '')
    .replace(/\s*#\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

/** POST /api/vision/describe-frames */
export async function handleDescribeFrames(event) {
  const origin = event.headers?.origin
  if (!OPENAI_KEY) {
    return jsonResponse(503, { error: 'Vision not configured (missing OPENAI_API_KEY)' }, origin)
  }
  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' }, origin)
  }
  const { examType, audio_transcript = [], frames = [], bodyRegion = '' } = body
  if (!examType || !Array.isArray(frames) || frames.length === 0) {
    return jsonResponse(400, { error: 'Missing examType or frames' }, origin)
  }
  const toProcess = frames
    .filter((f) => f.dataUrl && (!f.visual_description || !f.visual_description.trim()))
    .slice(0, MAX_VISION_FRAMES)
  if (toProcess.length === 0) {
    return jsonResponse(200, { frames: frames.map((f) => ({ ...f })) }, origin)
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

  const results = await Promise.all(
    toProcess.map(async (frame) => {
      const transcriptExcerpt = transcriptBySegmentId[frame.linked_transcript_segment_id] || '(no transcript excerpt)'
      const userPrompt = `Exam context: ${bodyContext}.\nTranscript at this moment: "${transcriptExcerpt}".\n\nUsing physical examination terminology appropriate for this exam, describe what you observe.\nIf the patient is demonstrating range of motion, estimate the degrees visible.\nDescribe posture, movement quality, visible anatomical findings, and any observable clinical signs.\nRespond with JSON: {"frame_id":"${frame.frame_id}","visual_description":"...","visibility":"ok"|"obscured"|"not_assessable"}.`
      const imagePart = frame.dataUrl.startsWith('data:') ? frame.dataUrl : `data:image/jpeg;base64,${frame.dataUrl}`
      try {
        const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_tokens: 200,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: [{ type: 'text', text: userPrompt }, { type: 'image_url', image_url: { url: imagePart } }] },
            ],
          }),
        })
        if (!oaiRes.ok) return { ...frame, visual_description: '', visibility: 'not_assessable' }
        const data = await oaiRes.json()
        const content = data?.choices?.[0]?.message?.content?.trim() || '{}'
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
        const desc = cleanDescription(parsed.visual_description || '')
        const vis = ['ok', 'obscured', 'not_assessable'].includes(parsed.visibility) ? parsed.visibility : 'ok'
        return { ...frame, visual_description: desc, visibility: vis }
      } catch {
        return { ...frame, visual_description: '', visibility: 'not_assessable' }
      }
    })
  )
  const byId = new Map(results.map((r) => [r.frame_id, r]))
  const merged = frames.map((f) => byId.get(f.frame_id) || f)
  return jsonResponse(200, { frames: merged }, origin)
}

/** POST /api/vision/summarize-session */
export async function handleSummarizeSession(event) {
  const origin = event.headers?.origin
  if (!OPENAI_KEY) {
    return jsonResponse(503, { error: 'Summarization not configured (missing OPENAI_API_KEY)' }, origin)
  }
  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' }, origin)
  }
  const { examType, audio_transcript = [], frames = [], bodyRegion = '' } = body
  if (!examType) return jsonResponse(400, { error: 'Missing examType' }, origin)
  const transcriptText = (audio_transcript || []).map((s) => s.text || '').filter(Boolean).join(' ').trim()
  const frameDescriptions = (frames || []).map((f) => f.visual_description || '').filter(Boolean).join('\n')
  const bodyContext = buildBodyContext(examType, bodyRegion)
  const headings = Array.isArray(body.headings) && body.headings.length > 0 ? body.headings : ['Inspection', 'Active Range of Motion', 'Swelling', 'Scarring']
  const keysList = headings.map((h) => `"${h}"`).join(', ')
  const systemPrompt = `You assist with documentation for medico-legal purposes. Using only the transcript and frame descriptions provided, generate structured report sections. Do not diagnose, infer cause, or prognosis. Do not invent findings not supported by the transcript or descriptions. Use neutral, objective language. Output valid JSON only with keys: ${keysList}. Each value is a string (1–4 sentences). Use "Not visually assessable" where there is no relevant content.`
  const exampleJson = headings.reduce((acc, h) => ({ ...acc, [h]: '...' }), {})
  const userPrompt = `Exam context: ${bodyContext}.\n\nTranscript:\n${transcriptText || '(none)'}\n\nFrame descriptions:\n${frameDescriptions || '(none)'}\n\nRespond with JSON: ${JSON.stringify(exampleJson)}.`
  try {
    const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 800,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
    const resText = await oaiRes.text()
    if (!oaiRes.ok) {
      return jsonResponse(oaiRes.status >= 500 ? 502 : oaiRes.status, { error: 'Summarization failed', details: resText.slice(0, 400), code: 'OPENAI_ERROR' }, origin)
    }
    let data
    try {
      data = JSON.parse(resText)
    } catch {
      return jsonResponse(502, { error: 'Summarization failed', details: 'Invalid response from OpenAI', code: 'INVALID_RESPONSE' }, origin)
    }
    const content = data?.choices?.[0]?.message?.content?.trim() || '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    let structured_exam = {}
    if (jsonMatch) {
      try {
        structured_exam = JSON.parse(jsonMatch[0])
      } catch {
        structured_exam = {}
      }
    }
    const normalized = {}
    for (const h of headings) {
      normalized[h] = typeof structured_exam[h] === 'string' ? structured_exam[h].slice(0, 2000) : ''
    }
    return jsonResponse(200, { structured_exam: normalized }, origin)
  } catch (e) {
    return jsonResponse(500, { error: 'Summarization error', details: e.message || String(e), code: 'SUMMARIZE_ERROR' }, origin)
  }
}

// Route handlers are exported above. Netlify redirects /api/* to individual function files.
