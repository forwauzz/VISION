import request from 'supertest'

// Stub fetch + set env BEFORE dynamic import so OPENAI_KEY is captured correctly
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)
process.env.OPENAI_API_KEY = 'test-key'
process.env.NODE_ENV = 'test'

const { app } = await import('./index.js')

// ─── helpers ────────────────────────────────────────────────────────────────

function whisperOk(segments) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ segments }),
  }
}

function whisperFail(status, body = 'error') {
  return {
    ok: false,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }
}

// ─── POST /api/transcribe ────────────────────────────────────────────────────

describe('POST /api/transcribe', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns {segments:[]} for empty body', async () => {
    const res = await request(app)
      .post('/api/transcribe')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.alloc(0))

    expect(res.status).toBe(200)
    expect(res.body.segments).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('maps Whisper segments to {text, start_time, end_time} shape', async () => {
    mockFetch.mockResolvedValueOnce(
      whisperOk([
        { text: ' Hello world.', start: 0.0, end: 1.5 },
        { text: ' How are you?', start: 1.8, end: 3.2 },
      ])
    )

    const res = await request(app)
      .post('/api/transcribe')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.from('fake audio'))

    expect(res.status).toBe(200)
    expect(res.body.segments).toHaveLength(2)
    expect(res.body.segments[0]).toEqual({ text: 'Hello world.', start_time: 0, end_time: 1.5 })
    expect(res.body.segments[1]).toEqual({ text: 'How are you?', start_time: 1.8, end_time: 3.2 })
  })

  it('sends correct FormData fields and auth header to Whisper', async () => {
    mockFetch.mockResolvedValueOnce(whisperOk([]))

    await request(app)
      .post('/api/transcribe')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.from('audio'))

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/audio/transcriptions')
    expect(opts.method).toBe('POST')
    expect(opts.headers.Authorization).toBe('Bearer test-key')
    expect(opts.body).toBeInstanceOf(FormData)

    // Verify FormData fields
    const form = opts.body
    expect(form.get('model')).toBe('whisper-1')
    expect(form.get('response_format')).toBe('verbose_json')
    expect(form.get('file')).toBeInstanceOf(Blob)
  })

  it('uses webm extension for audio/webm content-type', async () => {
    mockFetch.mockResolvedValueOnce(whisperOk([]))

    await request(app)
      .post('/api/transcribe')
      .set('Content-Type', 'audio/webm;codecs=opus')
      .send(Buffer.from('audio'))

    const form = mockFetch.mock.calls[0][1].body
    const file = form.get('file')
    expect(file.name).toBe('audio.webm')
    expect(file.type).toBe('audio/webm')
  })

  it('uses mp4 extension for video/mp4 content-type', async () => {
    mockFetch.mockResolvedValueOnce(whisperOk([]))

    await request(app)
      .post('/api/transcribe')
      .set('Content-Type', 'video/mp4')
      .send(Buffer.from('video'))

    const form = mockFetch.mock.calls[0][1].body
    const file = form.get('file')
    expect(file.type).toBe('video/mp4')
  })

  it('returns {segments:[]} on Whisper 4xx (bad request)', async () => {
    mockFetch.mockResolvedValueOnce(whisperFail(400, 'bad request'))

    const res = await request(app)
      .post('/api/transcribe')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.from('audio'))

    expect(res.status).toBe(200)
    expect(res.body.segments).toEqual([])
  })

  it('returns {segments:[]} on Whisper 422', async () => {
    mockFetch.mockResolvedValueOnce(whisperFail(422, 'unprocessable'))

    const res = await request(app)
      .post('/api/transcribe')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.from('audio'))

    expect(res.status).toBe(200)
    expect(res.body.segments).toEqual([])
  })

  it('returns 502 WHISPER_ERROR on Whisper 5xx', async () => {
    mockFetch.mockResolvedValueOnce(whisperFail(503, 'service unavailable'))

    const res = await request(app)
      .post('/api/transcribe')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.from('audio'))

    expect(res.status).toBe(502)
    expect(res.body.code).toBe('WHISPER_ERROR')
    expect(res.body.error).toBe('Transcription failed')
  })

  it('returns 502 INVALID_RESPONSE when Whisper returns non-JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => 'not json {{{{',
    })

    const res = await request(app)
      .post('/api/transcribe')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.from('audio'))

    expect(res.status).toBe(502)
    expect(res.body.code).toBe('INVALID_RESPONSE')
  })

  it('filters out whitespace-only and empty text segments', async () => {
    mockFetch.mockResolvedValueOnce(
      whisperOk([
        { text: 'Good segment', start: 0, end: 1 },
        { text: '   ', start: 1, end: 2 },
        { text: '', start: 2, end: 3 },
      ])
    )

    const res = await request(app)
      .post('/api/transcribe')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.from('audio'))

    expect(res.status).toBe(200)
    expect(res.body.segments).toHaveLength(1)
    expect(res.body.segments[0].text).toBe('Good segment')
  })

  it('trims leading/trailing whitespace from segment text', async () => {
    mockFetch.mockResolvedValueOnce(
      whisperOk([{ text: '  Hello world.  ', start: 0, end: 2 }])
    )

    const res = await request(app)
      .post('/api/transcribe')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.from('audio'))

    expect(res.body.segments[0].text).toBe('Hello world.')
  })

  it('returns {segments:[]} when Whisper response has no segments field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ text: 'Hello world' }),  // top-level only, no segments array
    })

    const res = await request(app)
      .post('/api/transcribe')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.from('audio'))

    expect(res.status).toBe(200)
    expect(res.body.segments).toEqual([])
  })
})

// ─── GET /api/health ─────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
