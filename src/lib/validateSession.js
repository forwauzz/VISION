/**
 * Vision MVP — Validate session payload against PRD §6 schema (Phase 8).
 * Structured exam is validated against the template headings for the session's examType.
 * @returns {{ valid: boolean, errors: string[] }}
 */
import { getTemplateForExamType } from './examTemplates.js'

/**
 * @param {unknown} obj
 * @param {string[]} [requiredHeadings] — from getTemplateForExamType(session.examType); default if omitted.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStructuredExam(obj, requiredHeadings = ['Inspection', 'Active Range of Motion', 'Swelling', 'Scarring']) {
  const errors = []
  if (obj == null || typeof obj !== 'object') {
    return { valid: false, errors: ['structured_exam must be an object'] }
  }
  const o = /** @type {Record<string, unknown>} */ (obj)
  for (const h of requiredHeadings) {
    if (!(h in o)) errors.push(`structured_exam missing heading: ${h}`)
    else if (typeof o[h] !== 'string') errors.push(`structured_exam["${h}"] must be a string`)
  }
  return { valid: errors.length === 0, errors }
}

/**
 * @param {unknown} session
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSessionPayload(session) {
  const errors = []
  if (session == null || typeof session !== 'object') {
    return { valid: false, errors: ['Session must be an object'] }
  }
  const s = /** @type {Record<string, unknown>} */ (session)
  const required = ['id', 'userId', 'establishmentId', 'examType', 'startedAt', 'status']
  for (const key of required) {
    if (!(key in s) || s[key] === undefined || s[key] === null) {
      errors.push(`Session missing or empty: ${key}`)
    }
  }
  if (Array.isArray(s.audio_transcript)) {
    for (let i = 0; i < s.audio_transcript.length; i++) {
      const seg = s.audio_transcript[i]
      if (seg && typeof seg === 'object' && (!('text' in seg) || !('start_time' in seg) || !('end_time' in seg))) {
        errors.push(`audio_transcript[${i}] missing text, start_time, or end_time`)
      }
    }
  }
  if (Array.isArray(s.frames)) {
    for (let i = 0; i < s.frames.length; i++) {
      const f = s.frames[i]
      if (f && typeof f === 'object') {
        const fr = /** @type {Record<string, unknown>} */ (f)
        if (!('frame_id' in fr) || !('timestamp' in fr) || !('linked_transcript_segment_id' in fr) || !('visual_description' in fr)) {
          errors.push(`frames[${i}] missing frame_id, timestamp, linked_transcript_segment_id, or visual_description`)
        }
      }
    }
  }
  if (s.structured_exam !== undefined) {
    const headings = typeof s.examType === 'string' ? Object.keys(getTemplateForExamType(s.examType)) : ['Inspection', 'Active Range of Motion', 'Swelling', 'Scarring']
    const se = validateStructuredExam(s.structured_exam, headings)
    if (!se.valid) errors.push(...se.errors)
  }
  return { valid: errors.length === 0, errors }
}
