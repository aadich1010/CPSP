// Pure validation logic, deliberately kept out of actions.ts.
//
// actions.ts has 'use server' at the top, and Next.js requires every
// export from a 'use server' file to be an async Server Action — a plain
// synchronous function like this one isn't allowed to live there. Rather
// than making this needlessly async just to satisfy that constraint,
// it's split into its own ordinary module, which also makes it trivially
// unit-testable without mocking Supabase or Next.js internals.

import { SUBJECTS } from '@/lib/subjects'

export type QuestionInput = {
  question_text:  string
  option_a:       string
  option_b:       string
  option_c:       string
  option_d:       string
  option_e?:      string | null
  correct_answer: string
  explanation?:   string | null
  subject:        string
  difficulty?:    string | null
  // Optional Roman Urdu (Urdu language, English/Latin letters) versions --
  // never required by validation, purely a display-language alternative.
  roman_urdu_question_text?: string | null
  roman_urdu_option_a?:      string | null
  roman_urdu_option_b?:      string | null
  roman_urdu_option_c?:      string | null
  roman_urdu_option_d?:      string | null
  roman_urdu_option_e?:      string | null
  roman_urdu_explanation?:   string | null
}

const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard']

// submit_exam_attempt() grades by comparing the student's chosen letter
// straight against `correct_answer`. If this is ever malformed (blank,
// lowercase, "AA", pointing at an empty option_e, or a value like "1"
// left over from a spreadsheet) every student silently gets that
// question wrong forever -- there's no error, no crash, just quietly
// wrong grading nobody notices until a student complains. Validate at
// import/restore time instead of trusting the input.
export function validateQuestion(q: QuestionInput, index?: number): string | null {
  const where = index !== undefined ? `Row ${index + 1}` : 'Question'

  if (!q.question_text?.trim()) return `${where}: question text is required.`
  if (!q.option_a?.trim() || !q.option_b?.trim() || !q.option_c?.trim() || !q.option_d?.trim()) {
    return `${where}: options A-D are all required.`
  }
  if (!q.subject?.trim()) return `${where}: subject is required.`
  // Every screen that lists/filters/counts questions (dashboard cards, exam
  // setup, admin list, get_subject_question_counts()) matches `subject`
  // against this exact list of strings. A subject that's almost right --
  // extra/missing whitespace, a typo, a slash instead of ' / ', a name that
  // isn't on the list at all -- doesn't error here or anywhere downstream;
  // it just silently never appears to a student under any subject. That's
  // exactly how ~1,860 questions (an 'Oncology' vs 'Oncology / Medical
  // Oncology' split, a whole untagged 'General' bucket, several subjects
  // like 'Endocrinology' with no matching card at all, ...) went missing
  // from the app in August 2026 despite being in the database the whole
  // time. Reject anything that isn't byte-for-byte one of SUBJECTS instead
  // of letting it through and failing invisibly later.
  if (!(SUBJECTS as readonly string[]).includes(q.subject.trim())) {
    return `${where}: "${q.subject}" is not a recognized subject. Pick one from the subject dropdown, or add it to src/lib/subjects.ts first if it's a genuinely new subject.`
  }

  const answer = q.correct_answer?.trim().toUpperCase()
  if (!answer || !['A', 'B', 'C', 'D', 'E'].includes(answer)) {
    return `${where}: correct_answer must be A, B, C, D, or E (got "${q.correct_answer}").`
  }
  if (answer === 'E' && !q.option_e?.trim()) {
    return `${where}: correct_answer is E but option_e is empty.`
  }

  if (q.difficulty && !VALID_DIFFICULTIES.includes(q.difficulty)) {
    return `${where}: difficulty must be Easy, Medium, or Hard (got "${q.difficulty}").`
  }

  return null
}
