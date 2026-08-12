/**
 * subjects.ts
 * -----------------------------------------------------------------------------
 * Canonical subject list -- the single source of truth for every subject
 * picker/dropdown/filter/card grid in the app (student dashboard "Practice by
 * Subject" grid, exam setup wizard, and the admin Add/Edit/Import/List
 * question screens).
 *
 * Before this file existed, the same ~16-subject array was hand-copied into
 * six different files. A subject added in one place (e.g. the dashboard
 * cards) silently would not appear in another (e.g. the admin "Add Question"
 * form's dropdown) -- so it could be shown as a card but never actually get
 * any content, or vice versa. One list now, imported everywhere.
 *
 * SUBJECTS stays a flat array (for exact-string matching against
 * questions.subject -- see get_exam_questions() in supabase/migrations/
 * 20260805010000_demo_3_attempts_and_no_option_shuffle.sql, and
 * get_subject_question_counts() in 20260806010000_add_subject_question_counts_rpc.sql).
 * SUBJECT_GROUPS layers a Paper I / Paper II / Clinical Practice grouping on
 * top of the same strings, for any UI that wants to render section headers
 * instead of one flat grid (dashboard cards, exam setup wizard).
 *
 * The former 'Medicine' bucket (~1705 questions, all auto-tagged from the
 * original import with no real subject) was manually reclassified in
 * batches -- see 20260811030000_pilot_classify_medicine_subjects.sql through
 * 20260811230000_classify_medicine_batch_22.sql. 1611 of those questions
 * were basic-science recall and moved into the matching Applied/Clinical
 * Anatomy/specialty bucket below. The 94 that remain are genuine clinical
 * case-vignettes (patient presentation -> diagnosis/management, no clean
 * basic-science fit) plus a few corrupted/garbled source rows -- renamed to
 * 'Medicine (Clinical Vignettes)' (see 20260811240000_rename_medicine_to_
 * clinical_vignettes.sql) and placed in their own "Clinical Practice" group
 * rather than forced into a Paper I/II basic-science card.
 */
export const SUBJECTS = [
  // ── Paper I — General Basic Sciences ──────────────────────────────────
  'Anatomy',
  'Physiology',
  'Biochemistry',
  'Pathology',
  'Pharmacology',
  'Microbiology',
  'Forensic Medicine',
  'Community Medicine',
  'Behavioral Sciences',
  'Medical Ethics & Professionalism',
  'Epidemiology & Biostatistics',

  // ── Paper II — Applied & Specialty ────────────────────────────────────
  'Surgery',
  'General Surgery',
  'Anesthesia',
  'Applied Physiology',
  'Applied Pathology',
  'Applied Pharmacology',
  'Applied Biochemistry',
  'Clinical Anatomy',
  'Obstetrics & Gynecology',
  'Pediatrics',
  'ENT',
  'Ophthalmology',
  'Immunology',
  'Radiology (Imaging Basics)',
  'Dermatology (Basic Sciences)',
  'Emergency Medicine / Critical Care Basics',
  'Cardiology',
  'Neurology',
  'Pulmonology',
  'Gastroenterology',
  'Nephrology',
  'Oncology / Medical Oncology',

  // ── Clinical Practice — Case-Based Reasoning ──────────────────────────
  'Medicine (Clinical Vignettes)',
] as const

export type Subject = (typeof SUBJECTS)[number]

export interface SubjectGroup {
  name: string
  description: string
  subjects: Subject[]
}

export const SUBJECT_GROUPS: SubjectGroup[] = [
  {
    name: 'Paper I — Basic Sciences',
    description: 'Core basic-science recall, tested in FCPS Part 1 Paper I.',
    subjects: [
      'Anatomy',
      'Physiology',
      'Biochemistry',
      'Pathology',
      'Pharmacology',
      'Microbiology',
      'Forensic Medicine',
      'Community Medicine',
      'Behavioral Sciences',
      'Medical Ethics & Professionalism',
      'Epidemiology & Biostatistics',
    ],
  },
  {
    name: 'Paper II — Applied & Specialty',
    description: 'Basic science applied to a clinical specialty, tested in FCPS Part 1 Paper II.',
    subjects: [
      'Surgery',
      'General Surgery',
      'Anesthesia',
      'Applied Physiology',
      'Applied Pathology',
      'Applied Pharmacology',
      'Applied Biochemistry',
      'Clinical Anatomy',
      'Obstetrics & Gynecology',
      'Pediatrics',
      'ENT',
      'Ophthalmology',
      'Immunology',
      'Radiology (Imaging Basics)',
      'Dermatology (Basic Sciences)',
      'Emergency Medicine / Critical Care Basics',
      'Cardiology',
      'Neurology',
      'Pulmonology',
      'Gastroenterology',
      'Nephrology',
      'Oncology / Medical Oncology',
    ],
  },
  {
    name: 'Clinical Practice',
    description: 'Case vignettes requiring diagnostic and management reasoning, not single-fact recall.',
    subjects: ['Medicine (Clinical Vignettes)'],
  },
]
