/**
 * Vision MVP — Sessions list read/write (Phase 5). localStorage only.
 */
import { SESSIONS_STORAGE_KEY } from './sessionStorageSchema.js'

function readList() {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeList(list) {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

/**
 * @returns {import('./sessionStorageSchema.js').SessionStub[]}
 */
export function getSessions() {
  return readList()
}

/**
 * Filter sessions by establishment id.
 * @param {string} establishmentId
 * @returns {import('./sessionStorageSchema.js').SessionStub[]}
 */
export function getSessionsByEstablishment(establishmentId) {
  return readList().filter((s) => s.establishmentId === establishmentId)
}

/**
 * Create a new session stub and append to storage.
 * @param {{ userId: string, establishmentId: string, examType: 'Shoulder' | 'Scar' | 'Orthopedic', bodyRegion?: string }} params
 * @returns {import('./sessionStorageSchema.js').SessionStub | null}
 */
export function createSessionStub(params) {
  const { userId, establishmentId, examType, bodyRegion } = params
  if (!userId || !establishmentId || !examType) return null
  const list = readList()
  const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const stub = {
    id,
    userId,
    establishmentId,
    examType,
    ...(bodyRegion ? { bodyRegion } : {}),
    startedAt: new Date().toISOString(),
    status: 'in_progress',
  }
  list.unshift(stub)
  if (!writeList(list)) return null
  return stub
}

/**
 * Get one session by id.
 * @param {string} sessionId
 * @returns {import('./sessionStorageSchema.js').SessionStub | null}
 */
export function getSessionById(sessionId) {
  return readList().find((s) => s.id === sessionId) ?? null
}

/**
 * Update session status (e.g. to 'completed'). Mutates and rewrites list.
 * @param {string} sessionId
 * @param {{ status?: 'in_progress' | 'completed' }} updates
 * @returns {boolean}
 */
export function updateSession(sessionId, updates) {
  const list = readList()
  const idx = list.findIndex((s) => s.id === sessionId)
  if (idx === -1) return false
  if (updates.status) list[idx].status = updates.status
  return writeList(list)
}

/**
 * Save full session payload (Phase 6). Merges transcript, frames, structured_exam, endAt; sets status to completed.
 * @param {string} sessionId
 * @param {{ audio_transcript: import('./sessionStorageSchema.js').TranscriptSegment[], frames: import('./sessionStorageSchema.js').FrameRecord[], structured_exam: import('./sessionStorageSchema.js').StructuredExam }} payload
 * @returns {boolean}
 */
export function saveSessionPayload(sessionId, payload) {
  const list = readList()
  const idx = list.findIndex((s) => s.id === sessionId)
  if (idx === -1) return false
  const s = list[idx]
  s.status = 'completed'
  s.endAt = new Date().toISOString()
  s.audio_transcript = payload.audio_transcript ?? []
  s.frames = payload.frames ?? []
  s.structured_exam = payload.structured_exam ?? {}
  return writeList(list)
}

/**
 * Get full session (stub + payload) for review. Returns null if not found.
 * @param {string} sessionId
 * @returns {import('./sessionStorageSchema.js').SessionStub | null}
 */
export function getSessionPayload(sessionId) {
  return getSessionById(sessionId)
}
