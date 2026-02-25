/**
 * Vision Demo — Mock data for pitch prototype. No real API calls.
 * Used by src/pages/Demo.jsx.
 * Mock images from Unsplash (medical/clinical, free to use).
 */

const IMG = (id, w, h) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`

/** Video capture preview — orthopedic exam / doctor-patient context */
export const MOCK_VIDEO_PLACEHOLDER = IMG('1579684385127-1ef15d508118', 640, 360)

/** Frame mock images — orthopedic doctor-patient exam, not surgery room */
const FRAME_IMAGES = [
  IMG('1607619056574-b059194b8c1e', 320, 180),
  IMG('1612349317158-e41353167632', 320, 180),
  IMG('1576092764391-7b43d4d2c944', 320, 180),
]

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
    dataUrl: FRAME_IMAGES[0],
  },
  {
    frame_id: 'frame-2',
    timestamp: new Date(Date.now() - 90000).toISOString(),
    linked_transcript_segment_id: 'seg-2',
    visual_description: 'Active abduction demonstrated. Arm elevated to approximately 150 degrees. Smooth arc of motion.',
    dataUrl: FRAME_IMAGES[1],
  },
  {
    frame_id: 'frame-3',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    linked_transcript_segment_id: 'seg-3',
    visual_description: 'Close-up of portal sites. Well-healed incisions. Minimal swelling. No signs of infection.',
    dataUrl: FRAME_IMAGES[2],
  },
]

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

/** Visit type cards for Demo Step 2 — Select Visit Type. Images match design: slit lamp, surgical tools, recovery, office+laptop. */
export const VISIT_TYPE_CARDS = [
  {
    id: 'initial-consultation',
    title: 'Initial Consultation',
    description: 'A comprehensive baseline evaluation including advanced diagnostics and vision history profiling.',
    icon: 'add_circle',
    imageUrl: IMG('1579684385127-1ef15d508118', 320, 140),
  },
  {
    id: 'pre-op-assessment',
    title: 'Pre-Op Assessment',
    description: 'Rigorous clinical screening and physical preparation protocols prior to surgical procedures.',
    icon: 'microscope',
    imageUrl: IMG('1551076805-e1869033e561', 320, 140),
  },
  {
    id: 'post-op-followup',
    title: 'Post-Op Follow-up',
    description: 'Detailed monitoring of recovery progression and post-surgical outcome verification.',
    icon: 'healing',
    imageUrl: IMG('1581595220892-b0739db3ba8', 320, 140),
  },
  {
    id: 'routine-checkup',
    title: 'Routine Check-up',
    description: 'Annual wellness checks focused on preventative care and prescription maintenance.',
    icon: 'event',
    imageUrl: IMG('1559839734-2b71ea197ec2', 320, 140),
  },
]

export function getMockSummaryForTemplate(examType) {
  const map = {
    Shoulder: MOCK_SUMMARY_SHOULDER,
    Orthopedic: MOCK_SUMMARY_ORTHOPEDIC,
    Scar: MOCK_SUMMARY_SCAR,
    SOAP: MOCK_SUMMARY_SOAP,
  }
  return map[examType] ?? MOCK_SUMMARY_SHOULDER
}
