import { describe, it, expect } from 'vitest'
import { validateQuestion } from './validate-question'

// validateQuestion is the single gate that stops two different kinds of
// bad data from reaching the database:
//   1. importQuestionsBulk() — a malformed row would grade silently
//      wrong forever (see the comment above validateQuestion itself).
//   2. restoreQuestions() — a corrupt/truncated backup file must be
//      rejected BEFORE the existing question bank is deleted, since that
//      delete has no rollback.
// Both call sites share this one function, so testing it here covers
// both paths at once.

function validQuestion(overrides: Partial<Parameters<typeof validateQuestion>[0]> = {}) {
  return {
    question_text: 'What is the powerhouse of the cell?',
    option_a: 'Nucleus',
    option_b: 'Mitochondria',
    option_c: 'Ribosome',
    option_d: 'Golgi apparatus',
    option_e: 'Lysosome',
    correct_answer: 'B',
    explanation: 'Mitochondria produce ATP.',
    subject: 'Physiology',
    difficulty: 'Medium',
    ...overrides,
  }
}

describe('validateQuestion', () => {
  it('accepts a well-formed question', () => {
    expect(validateQuestion(validQuestion())).toBeNull()
  })

  it('rejects blank/whitespace-only question text', () => {
    expect(validateQuestion(validQuestion({ question_text: '   ' }))).toMatch(/question text is required/i)
  })

  it('rejects when any of options A-D is missing', () => {
    expect(validateQuestion(validQuestion({ option_c: '' }))).toMatch(/options A-D are all required/i)
  })

  it('does not require option_e', () => {
    expect(
      validateQuestion(validQuestion({ option_e: undefined, correct_answer: 'A' }))
    ).toBeNull()
  })

  it('rejects a missing subject', () => {
    expect(validateQuestion(validQuestion({ subject: '' }))).toMatch(/subject is required/i)
  })

  // Regression coverage for the August 2026 incident: ~1,860 questions were
  // sitting in the database under subject strings that didn't byte-for-byte
  // match src/lib/subjects.ts (typos, missing spaces around '/', genuinely
  // new subjects never added to the list, or a plain 'General' catch-all),
  // and every one of them was invisible to students on every subject
  // card/filter despite being fully graded, explained content. This gate is
  // what stops that from happening again silently.
  it.each([
    'Oncology',                    // missing '/ Medical Oncology' half
    'Oncology/Medical Oncology',   // missing spaces around the slash
    'Obstetrics',                  // missing '& Gynecology'
    'General',                     // not a real subject at all
    'Anaesthesia',                 // British spelling, not the canonical entry
  ])('rejects a subject not in the canonical list: %j', (bad) => {
    expect(validateQuestion(validQuestion({ subject: bad }))).toMatch(/not a recognized subject/i)
  })

  it('trims incidental whitespace before checking the subject, same as other fields', () => {
    expect(validateQuestion(validQuestion({ subject: '  Anatomy  ' }))).toBeNull()
  })

  it('accepts every subject in the canonical list, including the newly added specialty ones', () => {
    expect(validateQuestion(validQuestion({ subject: 'Endocrinology' }))).toBeNull()
    expect(validateQuestion(validQuestion({ subject: 'Urology' }))).toBeNull()
    expect(validateQuestion(validQuestion({ subject: 'Orthopedics' }))).toBeNull()
    expect(validateQuestion(validQuestion({ subject: 'Oncology / Medical Oncology' }))).toBeNull()
  })

  it.each(['', 'F', '1', 'AA'])(
    'rejects correct_answer %j when it is not A-E',
    (bad) => {
      expect(validateQuestion(validQuestion({ correct_answer: bad }))).toMatch(
        /correct_answer must be A, B, C, D, or E/i
      )
    }
  )

  it('accepts a lowercase correct_answer and trims whitespace (normalized upstream at import time)', () => {
    expect(validateQuestion(validQuestion({ correct_answer: ' b ' }))).toBeNull()
  })

  it('rejects correct_answer E when option_e is empty', () => {
    expect(
      validateQuestion(validQuestion({ correct_answer: 'E', option_e: '' }))
    ).toMatch(/correct_answer is E but option_e is empty/i)
  })

  it('accepts correct_answer E when option_e is present', () => {
    expect(validateQuestion(validQuestion({ correct_answer: 'E', option_e: 'Lysosome' }))).toBeNull()
  })

  it('rejects an invalid difficulty', () => {
    expect(validateQuestion(validQuestion({ difficulty: 'Extreme' }))).toMatch(
      /difficulty must be Easy, Medium, or Hard/i
    )
  })

  it('allows a missing difficulty (defaults applied by the caller, not this validator)', () => {
    expect(validateQuestion(validQuestion({ difficulty: null }))).toBeNull()
  })

  it('prefixes the error with a 1-indexed row number when importing a batch', () => {
    const err = validateQuestion(validQuestion({ subject: '' }), 4)
    expect(err).toMatch(/^Row 5:/)
  })
})
