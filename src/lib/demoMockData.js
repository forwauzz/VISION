/**
 * Vision Demo — Mock data for pitch prototype. No real API calls.
 * Used by src/pages/Demo.jsx.
 * Mock images from Unsplash (medical/clinical, free to use).
 */

const IMG = (id, w, h) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`

/** Video capture preview — CLLC clinic orthopedic exam (main screen for Step 4) */
export const MOCK_VIDEO_PLACEHOLDER = '/demo/recording-main.png'

/** Key frame images — CLLC clinic doctor-patient exams (leg, back, arm/shoulder, knee) */
const FRAME_IMAGES = [
  '/demo/frame-1.png',
  '/demo/frame-2.png',
  '/demo/frame-3.png',
  '/demo/frame-4.png',
  '/demo/frame-5.png',
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
    visual_description: 'Practitioner assessing patient\'s back. Patient indicates lower back discomfort. CLLC clinic setting.',
    dataUrl: FRAME_IMAGES[0],
  },
  {
    frame_id: 'frame-2',
    timestamp: new Date(Date.now() - 105000).toISOString(),
    linked_transcript_segment_id: 'seg-1',
    visual_description: 'Practitioner examining patient\'s arm and shoulder. Patient seated on examination table.',
    dataUrl: FRAME_IMAGES[1],
  },
  {
    frame_id: 'frame-3',
    timestamp: new Date(Date.now() - 90000).toISOString(),
    linked_transcript_segment_id: 'seg-2',
    visual_description: 'Knee examination. Practitioner hands on patient\'s right knee. Anatomical charts visible.',
    dataUrl: FRAME_IMAGES[2],
  },
  {
    frame_id: 'frame-4',
    timestamp: new Date(Date.now() - 75000).toISOString(),
    linked_transcript_segment_id: 'seg-2',
    visual_description: 'Arm and shoulder assessment. Practitioner palpating patient\'s upper arm.',
    dataUrl: FRAME_IMAGES[3],
  },
  {
    frame_id: 'frame-5',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    linked_transcript_segment_id: 'seg-3',
    visual_description: 'Back assessment. Practitioner palpating mid-back. Patient indicating lower back area.',
    dataUrl: FRAME_IMAGES[4],
  },
]

export const MOCK_SUMMARY_SHOULDER = {
  Inspection: 'Well-healed portal incisions over anterior and posterior aspects. No erythema, warmth, or drainage. Mild swelling over anterolateral portal. Skin intact with normal color and temperature. No visible deformity. Deltoid contour symmetric bilaterally.',
  'Active Range of Motion': 'Flexion to 160 degrees. Abduction to 150 degrees. External rotation limited to 45 degrees with smooth arc of motion. Internal rotation to T12. No crepitus or guarding. Patient reports mild discomfort at end range.',
  Swelling: 'Mild swelling localized to anterolateral portal. No effusion. Soft tissue contours otherwise within normal limits.',
  Scarring: 'Portals well-healed with minimal induration. No adhesions, hypertrophic scarring, or keloid formation. Incision sites nontender to palpation.',
}

export const MOCK_SUMMARY_ORTHOPEDIC = {
  'Referring Physician': 'Dr. Smith',
  'Reason for Referral': 'Persistent right knee pain following workplace injury',
  'Chief Complaint': 'Right knee pain, persistent for 4 months following twisting injury at work.',
  'History of Present Illness': 'Mr. Doe is a 40-year-old male who sustained a right knee injury on October 18, 2025 while lifting a heavy box and pivoting to the left. He reports immediate medial knee pain with mild swelling within 12 hours. Since the injury: persistent medial knee pain (rated 6/10 baseline, 8/10 with stairs); mechanical symptoms: intermittent clicking, no true locking, occasional giving way sensation; swelling after prolonged standing (>2 hours). He completed 8 sessions of physiotherapy (partial improvement), NSAIDs intermittently, activity modification. No prior history of right knee injury.',
  'Functional Limitations': 'Patient reports difficulty with: prolonged standing (>30 minutes), climbing stairs, squatting, kneeling, carrying loads >15 kg. Currently working modified duties.',
  'Past Medical History': 'No prior knee injuries. No inflammatory arthritis. No diabetes. No previous surgeries.',
  'Medications': 'Naproxen PRN. Acetaminophen PRN.',
  'Physical Examination': 'General: Well appearing male, no acute distress, normal gait with mild protective pattern. Inspection: Mild right knee effusion. No erythema. No deformity. Palpation: Tenderness over medial joint line. Range of Motion: Flexion 0–125° (pain beyond 110°), Extension full. Stability Testing: Lachman negative, Anterior drawer negative, Posterior drawer negative, Varus/Valgus stress stable. Meniscal Testing: McMurray positive medially (pain + click), Thessaly positive. Neurovascular exam intact.',
  'Imaging': 'MRI (January 2026): Medial meniscus posterior horn complex tear. Mild joint effusion. No ligamentous injury. Mild chondral thinning medial compartment.',
  'Assessment': 'Right medial meniscus tear (posterior horn, complex pattern). Mild early medial compartment chondropathy. Persistent functional limitation despite conservative management. The clinical findings correlate with MRI imaging and mechanism of injury. The patient\'s symptoms and examination are consistent with a medial meniscal tear.',
  'Treatment Plan': 'Discussed continued conservative care vs arthroscopic intervention. Given persistent symptoms >4 months and functional limitations, patient is a candidate for arthroscopic partial meniscectomy. Risks, benefits, and alternatives explained. Continue physiotherapy focusing on quadriceps strengthening. NSAIDs as needed. Work restrictions maintained (no heavy lifting, no kneeling, no squatting). Surgical consultation booked.',
  'Prognosis': 'Prognosis is favorable with surgical treatment. Expected recovery timeline post-arthroscopy: 6–12 weeks. If untreated, ongoing mechanical symptoms likely to persist.',
  'Work Status': 'Modified duties recommended. Avoid prolonged standing >30 minutes. No squatting or kneeling. Reassessment in 6 weeks.',
}

export const MOCK_SUMMARY_PLASTIC_SURGERY = {
  'Preoperative Assessment': 'Patient evaluated for elective procedure. Medical optimization complete. Consents obtained. Marking and photography documented. No contraindications identified.',
  'Surgical Site': 'Clean, dry, intact. No signs of infection. Incision lines marked and confirmed with patient. Anatomic landmarks identified.',
  'Postoperative Plan': 'Dressing protocol reviewed. Follow-up scheduled at 1 week, 2 weeks, and 6 weeks. Activity restrictions and wound care instructions provided. Emergency contact information confirmed.',
}

export const MOCK_SUMMARY_SOAP = {
  Subjective: 'Patient presents for follow-up of right shoulder arthroscopy performed 8 weeks ago. Chief complaint: mild residual stiffness. Reports decreased pain since last visit. Denies numbness, tingling, or weakness. Sleep improved. ADLs largely unrestricted. No new trauma or injury.',
  Objective: 'Vital signs: BP 118/72, HR 72, RR 14, SpO2 98% on room air. Alert and oriented. Active ROM: flexion 160°, abduction 150°, external rotation 45°. Strength 5/5 deltoid, supraspinatus, infraspinatus. Hawkins and Neer tests negative. O\'Brien test negative. Well-healed portals. No effusion.',
  Assessment: 'Status post right shoulder arthroscopy with good progress. No signs of infection, instability, or complication. Mild residual stiffness consistent with healing phase.',
  Plan: 'Continue home exercise program focusing on ROM and strengthening. Return to full activity as tolerated. Follow-up in six weeks. Patient instructed on red-flag symptoms and when to call.',
}

export const MOCK_SUMMARY_NEW_CONSULTATION = {
  'Chief Complaint': 'Right shoulder pain and limited motion, 6 weeks post-injury.',
  'History of Present Illness': 'Patient reports mechanism of fall onto outstretched arm. Initial X-rays negative. Conservative management with sling and PT for 4 weeks. Pain improved but persistent stiffness and occasional clicking. No prior shoulder surgery. Medical history noncontributory. Allergies: NKDA. Current medications: none.',
  'Physical Examination': 'Inspection: no deformity. Palpation: mild tenderness over rotator cuff. ROM: flexion 140°, abduction 130°, external rotation 30°. Strength: 4+/5 supraspinatus. Special tests: Hawkins positive, Neer positive. Neurovascular intact.',
  'Assessment and Plan': 'Clinical picture consistent with rotator cuff tendinopathy versus partial tear. MRI ordered to evaluate. Continue PT. NSAIDs as needed. Follow-up after imaging with orthopedics.',
}

export const MOCK_SUMMARY_FOLLOW_UP = {
  'Interval History': 'Patient returns for scheduled follow-up. Reports continued improvement. Pain reduced from 5/10 to 2/10. ROM improving. No new concerns. Compliance with home exercises good.',
  'Examination': 'Portals well-healed. ROM: flexion 165°, abduction 155°, external rotation 50°. Strength 5/5. No instability. No effusion.',
  'Progress': 'Meeting expected milestones. Wound healing complete. Functional goals on track.',
  'Plan': 'Advance to full activity. Discontinue formal PT. Follow-up PRN. Return for final visit in 4 weeks or sooner if concerns.',
}

export const MOCK_SUMMARY_SCAR = {
  Inspection: 'Surgical scars visible at anterior, lateral, and posterior portal sites. Well-healed with minimal pigment change.',
  'Active Range of Motion': 'N/A for scar assessment. ROM evaluated separately.',
  Swelling: 'None noted. Scars flat and supple.',
  Scarring: 'Portals well-healed. No hypertrophic or keloid formation. Scars mature, nontender. No adhesions to underlying structures. Scar massage and silicone gel discussed for cosmesis.',
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

/** Template options for Step 8 dropdown — Orthopedic, Plastic Surgery, SOAP, etc. */
export const TEMPLATE_OPTIONS = [
  { id: 'orthopedic', label: 'Orthopedic Exam' },
  { id: 'plastic-surgery', label: 'Plastic Surgery' },
  { id: 'soap', label: 'SOAP Notes' },
  { id: 'new-consultation', label: 'New Consultation' },
  { id: 'follow-up', label: 'Follow-up' },
  { id: 'shoulder', label: 'Shoulder Exam' },
  { id: 'scar', label: 'Scar Assessment' },
]

export function getMockSummaryForTemplate(templateId) {
  const map = {
    shoulder: MOCK_SUMMARY_SHOULDER,
    orthopedic: MOCK_SUMMARY_ORTHOPEDIC,
    'plastic-surgery': MOCK_SUMMARY_PLASTIC_SURGERY,
    soap: MOCK_SUMMARY_SOAP,
    'new-consultation': MOCK_SUMMARY_NEW_CONSULTATION,
    'follow-up': MOCK_SUMMARY_FOLLOW_UP,
    scar: MOCK_SUMMARY_SCAR,
  }
  return map[templateId] ?? MOCK_SUMMARY_ORTHOPEDIC
}
