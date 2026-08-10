/**
 * subjects.ts
 * -----------------------------------------------------------------------------
 * Canonical subject list -- the single source of truth for every subject
 * picker/dropdown/filter/card grid in the app (student dashboard "Practice by
 * Subject" grid, exam setup, and the admin Add/Edit/Import/List question
 * screens).
 *
 * Before this file existed, the same ~16-subject array was hand-copied into
 * six different files. A subject added in one place (e.g. the dashboard
 * cards) silently would not appear in another (e.g. the admin "Add Question"
 * form's dropdown) -- so it could be shown as a card but never actually get
 * any content, or vice versa. One list now, imported everywhere.
 *
 * Grouped by FCPS paper for readability only -- nothing in the app currently
 * enforces the grouping, subjects are just flat strings matched exactly
 * against questions.subject (see get_exam_questions() in
 * supabase/migrations/20260805010000_demo_3_attempts_and_no_option_shuffle.sql).
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

  // ── Paper II — Specialty / Clinical ───────────────────────────────────
  'Surgery',
  'General Surgery',
  'Anesthesia',
  'Medicine',
  'Obstetrics & Gynecology',
  'Pediatrics',
  'ENT',
  'Ophthalmology',
  'Immunology',
  'Radiology (Imaging Basics)',
  'Dermatology (Basic Sciences)',
  'Emergency Medicine / Critical Care Basics',
] as const

export type Subject = (typeof SUBJECTS)[number]
