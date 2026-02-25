/**
 * Vision Demo — Mock data for pitch prototype. No real API calls.
 * Used by src/pages/Demo.jsx.
 */

/** Placeholder 1x1 transparent pixel for frame thumbnails (avoids external deps) */
const PLACEHOLDER_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect fill="%231a1a2e" width="320" height="180"/><text x="160" y="95" fill="%23c6a65d" font-family="sans-serif" font-size="14" text-anchor="middle">Clinical Frame</text></svg>'
  )

export const MOCK_TRANSCRIPT = [
  { segment_id: 'seg-1', start_time: 0, end_time: 8, text: 'Patient presents for follow-up of right shoulder arthroscopy. Reports decreased pain since last visit.' },
  { segment_id: 'seg-2', start_time: 8, end_time: 18, text: 'Active range of motion: flexion to 160 degrees, abduction to 150 degrees. External rotation limited to 45 degrees.' },
  { segment_id: 'seg-3', start_time: 18, end_time: 28, text: 'Inspection reveals well-healed portals. No erythema or drainage. Mild swelling over anterolateral portal.' },
  { segment_id: 'seg-4', start_time: 28, end_time: 38, text: 'Strength 5/5 in deltoid, supraspinatus, and infraspinatus. Hawkins and Neer tests negative.' },
]

export const MOCK_FRAMES = [
  {
    frame_id: 'frame-1',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    linked_transcript_segment_id: 'seg-1',
    visual_description: 'Patient seated. Right shoulder visible. No visible deformity. Skin intact over surgical sites.',
    dataUrl: PLACEHOLDER_IMG,
  },
  {
    frame_id: 'frame-2',
    timestamp: new Date(Date.now() - 90000).toISOString(),
    linked_transcript_segment_id: 'seg-2',
    visual_description: 'Active abduction demonstrated. Arm elevated to approximately 150 degrees. Smooth arc of motion.',
    dataUrl: PLACEHOLDER_IMG,
  },
  {
    frame_id: 'frame-3',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    linked_transcript_segment_id: 'seg-3',
    visual_description: 'Close-up of portal sites. Well-healed incisions. Minimal swelling. No signs of infection.',
    dataUrl: PLACEHOLDER_IMG,
  },
]

/** Placeholder for video capture preview (inline SVG for offline demo) */
export const MOCK_VIDEO_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect fill="%231a1a2e" width="640" height="360"/><circle cx="320" cy="180" r="40" fill="none" stroke="%23c6a65d" stroke-width="3"/><polygon fill="%23c6a65d" points="310,165 310,195 335,180"/><text x="320" y="260" fill="%23c6a65d" font-family="sans-serif" font-size="14" text-anchor="middle">Live Capture Preview</text></svg>'
  )

export const MOCK_SUMMARY_SHOULDER = {
  Inspection: 'Well-healed portal incisions. No erythema or drainage. Mild swelling over anterolateral portal. Skin intact.',
  'Active Range of Motion': 'Flexion to 160 degrees. Abduction to 150 degrees. External rotation limited to 45 degrees. Smooth arc of motion.',
  Swelling: 'Mild swelling over anterolateral portal. Otherwise unremarkable.',
  Scarring: 'Portals well-healed. No adhesions or hypertrophic scarring.',
}

export const MOCK_SUMMARY_ORTHOPEDIC = {
  Inspection: 'No visible deformity. Surgical sites well-healed. Skin intact.',
  'Active Range of Motion': 'Full flexion and abduction. External rotation limited to 45 degrees.',
  Swelling: 'Minimal. Confined to portal region.',
  Scarring: 'Portals healed. No complications.',
}

export const MOCK_SUMMARY_SCAR = {
  Inspection: 'Surgical scars visible. Well-healed.',
  'Active Range of Motion': 'N/A for scar assessment.',
  Swelling: 'None noted.',
  Scarring: 'Portals well-healed. No hypertrophic or keloid formation.',
}

export const MOCK_SUMMARY_SOAP = {
  Subjective: 'Patient presents for follow-up of right shoulder arthroscopy. Reports decreased pain and improved function since last visit.',
  Objective: 'Vital signs stable. Active ROM: flexion 160°, abduction 150°, external rotation 45°. Strength 5/5. Hawkins and Neer negative.',
  Assessment: 'Status post shoulder arthroscopy with good progress. No signs of infection or complication.',
  Plan: 'Continue home exercise program. Return in six weeks for re-evaluation.',
}

export function getMockSummaryForTemplate(examType) {
  const map = {
    Shoulder: MOCK_SUMMARY_SHOULDER,
    Orthopedic: MOCK_SUMMARY_ORTHOPEDIC,
    Scar: MOCK_SUMMARY_SCAR,
    SOAP: MOCK_SUMMARY_SOAP,
  }
  return map[examType] ?? MOCK_SUMMARY_SHOULDER
}
