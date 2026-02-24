import { transcribeAudioChunk, transcribeVideo } from './transcribe.js'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeOkResponse(segments) {
  return {
    ok: true,
    json: async () => ({ segments }),
  }
}

function makeErrorResponse(status, body) {
  return {
    ok: false,
    status,
    json: async () => body,
  }
}

// ─── transcribeAudioChunk ────────────────────────────────────────────────────

describe('transcribeAudioChunk', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns [] for null blob', async () => {
    expect(await transcribeAudioChunk(null)).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns [] for zero-size blob', async () => {
    expect(await transcribeAudioChunk(new Blob([]))).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns segments with correct shape and time offset applied', async () => {
    fetchMock.mockResolvedValueOnce(
      makeOkResponse([
        { text: 'Hello world.', start_time: 0, end_time: 1.5 },
        { text: 'How are you?', start_time: 2.0, end_time: 3.8 },
      ])
    )
    const blob = new Blob(['fake audio'], { type: 'audio/webm' })
    const result = await transcribeAudioChunk(blob, 10)

    expect(result).toHaveLength(2)
    expect(result[0].text).toBe('Hello world.')
    expect(result[0].start_time).toBe(10)    // 0 + offset 10
    expect(result[0].end_time).toBe(11.5)     // 1.5 + offset 10
    expect(result[1].start_time).toBe(12)
    expect(result[1].end_time).toBe(13.8)
    expect(result[0].segment_id).toMatch(/^seg-\d+-0$/)
    expect(result[1].segment_id).toMatch(/^seg-\d+-1$/)
  })

  it('returns [] when server returns empty segments array', async () => {
    fetchMock.mockResolvedValueOnce(makeOkResponse([]))
    const blob = new Blob(['audio'], { type: 'audio/webm' })
    expect(await transcribeAudioChunk(blob)).toEqual([])
  })

  it('POSTs to /api/transcribe with raw binary + correct content-type', async () => {
    fetchMock.mockResolvedValueOnce(makeOkResponse([]))
    const blob = new Blob(['audio'], { type: 'audio/webm;codecs=opus' })
    await transcribeAudioChunk(blob)

    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/transcribe')
    expect(opts.method).toBe('POST')
    expect(opts.headers['Content-Type']).toBe('audio/webm;codecs=opus')
    expect(opts.body).toBeInstanceOf(ArrayBuffer)
  })

  it('throws with OPENAI_API_KEY message on network error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'))
    const blob = new Blob(['audio'], { type: 'audio/webm' })
    await expect(transcribeAudioChunk(blob)).rejects.toThrow(/OPENAI_API_KEY/)
  })

  it('throws with OPENAI_API_KEY message on 503 NO_API_KEY', async () => {
    fetchMock.mockResolvedValueOnce(
      makeErrorResponse(503, { error: 'not configured', code: 'NO_API_KEY' })
    )
    const blob = new Blob(['audio'], { type: 'audio/webm' })
    await expect(transcribeAudioChunk(blob)).rejects.toThrow(/OPENAI_API_KEY/)
  })

  it('throws with OPENAI_API_KEY message on 502 NO_API_KEY code', async () => {
    fetchMock.mockResolvedValueOnce(
      makeErrorResponse(502, { error: 'Transcription failed', code: 'NO_API_KEY' })
    )
    const blob = new Blob(['audio'], { type: 'audio/webm' })
    await expect(transcribeAudioChunk(blob)).rejects.toThrow(/OPENAI_API_KEY/)
  })

  it('throws with error + details on 502 WHISPER_ERROR', async () => {
    fetchMock.mockResolvedValueOnce(
      makeErrorResponse(502, { error: 'Transcription failed', details: 'upstream error', code: 'WHISPER_ERROR' })
    )
    const blob = new Blob(['audio'], { type: 'audio/webm' })
    await expect(transcribeAudioChunk(blob)).rejects.toThrow(/Transcription failed.*upstream error/)
  })

  it('appends details on 400 bad request', async () => {
    fetchMock.mockResolvedValueOnce(
      makeErrorResponse(400, { error: 'Invalid audio', details: 'codec unsupported' })
    )
    const blob = new Blob(['audio'], { type: 'audio/webm' })
    await expect(transcribeAudioChunk(blob)).rejects.toThrow(/codec unsupported/)
  })
})

// ─── transcribeVideo ─────────────────────────────────────────────────────────

describe('transcribeVideo', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns [] for null blob', async () => {
    expect(await transcribeVideo(null)).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns [] for zero-size blob', async () => {
    expect(await transcribeVideo(new Blob([]))).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns segments with correct shape (no time offset)', async () => {
    fetchMock.mockResolvedValueOnce(
      makeOkResponse([
        { text: 'First sentence.', start_time: 0, end_time: 2.1 },
        { text: 'Second sentence.', start_time: 2.5, end_time: 5.0 },
      ])
    )
    const blob = new Blob(['fake video'], { type: 'video/webm' })
    const result = await transcribeVideo(blob)

    expect(result).toHaveLength(2)
    expect(result[0].text).toBe('First sentence.')
    expect(result[0].start_time).toBe(0)
    expect(result[0].end_time).toBe(2.1)
    expect(result[1].start_time).toBe(2.5)
    expect(result[0].segment_id).toMatch(/^seg-\d+-0$/)
  })

  it('POSTs video blob with video/webm content-type', async () => {
    fetchMock.mockResolvedValueOnce(makeOkResponse([]))
    const blob = new Blob(['video'], { type: 'video/webm' })
    await transcribeVideo(blob)

    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/transcribe')
    expect(opts.headers['Content-Type']).toBe('video/webm')
  })

  it('throws with OPENAI_API_KEY message on network error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'))
    const blob = new Blob(['video'], { type: 'video/webm' })
    await expect(transcribeVideo(blob)).rejects.toThrow(/OPENAI_API_KEY/)
  })

  it('throws with OPENAI_API_KEY message on 503 NO_API_KEY', async () => {
    fetchMock.mockResolvedValueOnce(
      makeErrorResponse(503, { error: 'not configured', code: 'NO_API_KEY' })
    )
    const blob = new Blob(['video'], { type: 'video/webm' })
    await expect(transcribeVideo(blob)).rejects.toThrow(/OPENAI_API_KEY/)
  })

  it('throws with OPENAI_API_KEY message on 500 NO_API_KEY code', async () => {
    fetchMock.mockResolvedValueOnce(
      makeErrorResponse(500, { error: 'server error', code: 'NO_API_KEY' })
    )
    const blob = new Blob(['video'], { type: 'video/webm' })
    await expect(transcribeVideo(blob)).rejects.toThrow(/OPENAI_API_KEY/)
  })
})
