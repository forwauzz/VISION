/**
 * Vision MVP — Exam templates per PRD §5.6 (Phase 8). JSON templates; merge logic into structured_exam.
 */
import shoulderTemplate from '../../templates/shoulder.json'
import scarTemplate from '../../templates/scar.json'
import orthopedicTemplate from '../../templates/orthopedic.json'

const TEMPLATES = {
  Shoulder: shoulderTemplate,
  Scar: scarTemplate,
  Orthopedic: orthopedicTemplate,
}

const DEFAULT_HEADINGS = ['Inspection', 'Active Range of Motion', 'Swelling', 'Scarring']

/**
 * @param {'Shoulder' | 'Scar' | 'Orthopedic'} examType
 * @returns {import('./sessionStorageSchema.js').StructuredExam} Empty structured_exam with template headings (and optional placeholder hints in values).
 */
export function getTemplateForExamType(examType) {
  const t = TEMPLATES[examType]
  const headings = t?.headings ?? DEFAULT_HEADINGS
  return headings.reduce((acc, h) => ({ ...acc, [h]: t?.placeholders?.[h] ?? '' }), {})
}

export function getEmptyStructuredExam() {
  return DEFAULT_HEADINGS.reduce((acc, h) => ({ ...acc, [h]: '' }), {})
}

/**
 * Returns an empty structured_exam for the given exam type — headings present, all values blank.
 * Use this to initialize the report UI before any content is generated.
 * @param {'Shoulder' | 'Scar' | 'Orthopedic'} examType
 * @returns {import('./sessionStorageSchema.js').StructuredExam}
 */
export function getEmptyExamForType(examType) {
  const t = TEMPLATES[examType]
  const headings = t?.headings ?? DEFAULT_HEADINGS
  return headings.reduce((acc, h) => ({ ...acc, [h]: '' }), {})
}

// Sections filled from transcript speech (clinician/patient verbal findings)
const TRANSCRIPT_SECTIONS = new Set(['Palpation', 'Strength', 'Special Tests', 'Neurovascular'])
// Sections filled from frame visual descriptions (visual-only findings)
const VISUAL_SECTIONS = new Set(['Swelling/Effusion', 'Swelling', 'Skin/Scarring', 'Scarring'])
// Sections that prefer frames but fall back to transcript (ROM, Inspection = hybrid)

/**
 * Merge transcript and frames into structured_exam per PRD §5.6. Uses "Not visually assessable" when no content.
 * Section source logic:
 *   TRANSCRIPT_SECTIONS → transcriptText || placeholder
 *   VISUAL_SECTIONS     → frameDescriptions || placeholder
 *   Inspection          → transcriptText || frameDescriptions || placeholder
 *   Hybrid (ROM, etc.)  → frameDescriptions || transcriptText || placeholder
 * @param {{ text: string }[]} transcript
 * @param {{ visual_description?: string }[]} frames
 * @param {import('./sessionStorageSchema.js').StructuredExam} template empty or placeholder object (headings only)
 * @returns {import('./sessionStorageSchema.js').StructuredExam}
 */
export function mergeTranscriptAndFramesIntoStructuredExam(transcript, frames, template) {
  const headings = Object.keys(template)
  const transcriptText = (transcript || []).map((s) => s.text).filter(Boolean).join(' ').trim()
  const frameDescriptions = (frames || []).map((f) => f.visual_description).filter(Boolean).join(' ').trim()
  const notAssessable = 'Not visually assessable'

  const result = {}
  for (const h of headings) {
    const placeholder = template[h] || notAssessable
    if (h === 'Inspection') {
      result[h] = transcriptText || frameDescriptions || placeholder
    } else if (TRANSCRIPT_SECTIONS.has(h)) {
      result[h] = transcriptText || placeholder
    } else if (VISUAL_SECTIONS.has(h)) {
      result[h] = frameDescriptions || placeholder
    } else {
      // Hybrid (ROM sections, Passive ROM, etc.): prefer frames, fall back to transcript
      result[h] = frameDescriptions || transcriptText || placeholder
    }
  }
  return result
}

/**
 * Serialize structured_exam to a single text string (## Heading + content per section) for one-textarea UI.
 * @param {import('./sessionStorageSchema.js').StructuredExam} structuredExam
 * @param {import('./sessionStorageSchema.js').StructuredExam} template template with keys in display order
 * @returns {string}
 */
export function structuredExamToSingleText(structuredExam, template) {
  const templateKeys = Object.keys(template || {})
  const extraKeys = Object.keys(structuredExam || {}).filter((k) => !templateKeys.includes(k))
  const keys = templateKeys.length ? [...templateKeys, ...extraKeys] : extraKeys
  if (keys.length === 0) return ''
  return keys.map((k) => `## ${k}\n\n${String(structuredExam?.[k] ?? '').trim()}`).join('\n\n')
}

/**
 * Parse single-textarea content back into structured_exam object. Preserves existing keys; parses ## Headers.
 * @param {string} text
 * @param {import('./sessionStorageSchema.js').StructuredExam} template keys used for ordering in UI
 * @param {import('./sessionStorageSchema.js').StructuredExam} [current] current exam to merge into (keeps keys not in text)
 * @returns {import('./sessionStorageSchema.js').StructuredExam}
 */
export function singleTextToStructuredExam(text, template, current) {
  const base = { ...(current || template || {}) }
  if (!text || !String(text).trim()) return base
  const parts = String(text).split(/(?=##\s)/).filter((p) => p.trim())
  for (const p of parts) {
    const m = p.match(/^##\s+([^\n]+)\n([\s\S]*)/)
    if (m) base[m[1].trim()] = m[2].trim()
  }
  return base
}
