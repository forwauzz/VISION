/**
 * Vision MVP — Sessions storage schema (Phase 5 + Phase 6)
 * Single source of truth for localStorage key and session list shape.
 *
 * Key: VISION_SESSIONS
 * Value (JSON): array of SessionStub (with optional full payload when completed)
 *
 * SessionStub (minimal, Phase 5):
 * { id, userId, establishmentId, examType, startedAt, status }
 *
 * Full session (Phase 6): stub + optional:
 *   timestamps.end (ISO), audio_transcript[], frames[], structured_exam
 * PRD §6: audio_transcript[] { text, start_time, end_time }; frames[] { frame_id, timestamp, linked_transcript_segment_id, visual_description }; structured_exam { Inspection, Active Range of Motion, Swelling, Scarring }
 */

export const SESSIONS_STORAGE_KEY = 'VISION_SESSIONS'

/** @typedef {'Shoulder' | 'Scar' | 'Orthopedic'} ExamType */
/** @typedef {'in_progress' | 'completed'} SessionStatus */

/** @typedef {{ text: string, start_time: number, end_time: number, segment_id?: string }} TranscriptSegment */
/** @typedef {'ok' | 'obscured' | 'not_assessable'} FrameVisibility */
/** @typedef {{ frame_id: string, timestamp: string, linked_transcript_segment_id: string, visual_description: string, visibility?: FrameVisibility, autoCaptured?: boolean, dataUrl?: string }} FrameRecord */
/** @typedef {{ Inspection?: string, 'Active Range of Motion'?: string, Swelling?: string, Scarring?: string }} StructuredExam */

/** @typedef {{ id: string, userId: string, establishmentId: string, examType: ExamType, bodyRegion?: string, startedAt: string, status: SessionStatus, endAt?: string, audio_transcript?: TranscriptSegment[], frames?: FrameRecord[], structured_exam?: StructuredExam }} SessionStub */
