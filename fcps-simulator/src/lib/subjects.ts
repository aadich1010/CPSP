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
 *
 * 2026-08-15 cleanup: a second, larger 'General' bucket (809 questions, same
 * shape as the old 'Medicine' bucket -- an unsorted grab-bag spanning every
 * specialty) was read question-by-question and reassigned to the subject its
 * content actually matches. Six severely OCR-garbled rows were left tagged
 * 'General' because their text is unreadable, not because they lack a
 * subject -- see the admin question list filtered to 'General' to find and
 * fix/delete them by hand.
 *
 * The same pass found ~20 near-duplicate/typo'd subject strings already
 * sitting in the questions table that never matched any entry in this file
 * (e.g. 'Oncology' and 'Oncology/Medical Oncology' next to this file's
 * 'Oncology / Medical Oncology', or 'Obstetrics' next to 'Obstetrics &
 * Gynecology') -- because get_exam_questions() and every dropdown/card here
 * match on the *exact* string, those questions were invisible to students no
 * matter which subject they picked. All were folded into their matching
 * canonical entry below (narrow anaesthesia-subspecialty tags folded into
 * 'Anesthesia', narrow basic-science splits like Histology/Embryology/
 * Neuroanatomy folded into 'Anatomy', Cell Biology/Genetics into
 * 'Biochemistry', Neurophysiology into 'Physiology', Trauma into 'Emergency
 * Medicine / Critical Care Basics', Vascular Surgery into 'General Surgery').
 * Endocrinology, Urology, and Orthopedics had real, substantial question
 * banks (120-150+ each) with no reasonable existing home -- comparable in
 * size to Cardiology/Neurology/ENT/Ophthalmology, which already have their
 * own cards -- so they were added below as first-class subjects instead of
 * being force-merged into an unrelated bucket.
 *
 * TAKEAWAY FOR FUTURE IMPORTS: any question inserted with a `subject` value
 * that is not byte-for-byte one of the strings in SUBJECTS below will render
 * nowhere in the student-facing app (not on the dashboard cards, not in the
 * exam-setup subject picker, not in get_subject_question_counts()) even
 * though it's sitting in the database. Validate new `subject` values against
 * this file at insert time -- see validate-question.ts -- rather than
 * discovering the mismatch later as a phantom 'General' bucket.
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
  // 'Surgery' and 'General Surgery' were originally two separate cards --
  // merged into one per explicit request (they were confusingly similar
  // on the dashboard). See 20260817000000_merge_surgery_subjects.sql for
  // the matching DB migration that moved every existing question over.
  'Surgery & Allied',
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
  'Endocrinology',
  'Urology',
  'Orthopedics',
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
      'Surgery & Allied',
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
      'Endocrinology',
      'Urology',
      'Orthopedics',
      'Oncology / Medical Oncology',
    ],
  },
  {
    name: 'Clinical Practice',
    description: 'Case vignettes requiring diagnostic and management reasoning, not single-fact recall.',
    subjects: ['Medicine (Clinical Vignettes)'],
  },
]
