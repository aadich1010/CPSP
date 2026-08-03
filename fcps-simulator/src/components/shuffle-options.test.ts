import { describe, it, expect } from 'vitest'
import { shuffleOptions, type Question } from './ExamEngine'

// The whole point of these tests: a shuffle that reorders option TEXT but
// doesn't carry the answer key along with it silently marks every student
// wrong, with no error anywhere. That's the exact failure mode we're
// guarding against, so the round-trip is asserted directly.

function makeQuestion(over: Partial<Question> = {}): Question {
  return {
    id: 'q-1',
    question_text: 'Which vessel drains the liver?',
    option_a: 'Hepatic vein',
    option_b: 'Portal vein',
    option_c: 'Hepatic artery',
    option_d: 'Splenic vein',
    option_e: null,
    correct_answer: 'A',
    explanation: 'The hepatic veins drain into the IVC.',
    subject: 'Anatomy',
    ...over,
  }
}

describe('shuffleOptions', () => {
  it('preserves the full set of option texts', () => {
    for (let run = 0; run < 200; run++) {
      const q = makeQuestion()
      const { display } = shuffleOptions(q)
      const before = [q.option_a, q.option_b, q.option_c, q.option_d].sort()
      const after = [
        display.option_a, display.option_b, display.option_c, display.option_d,
      ].sort()
      expect(after).toEqual(before)
    }
  })

  it('points the remapped key at the same option TEXT as the original', () => {
    for (let run = 0; run < 200; run++) {
      const q = makeQuestion()
      const { display } = shuffleOptions(q)
      const texts: Record<string, string | null | undefined> = {
        A: display.option_a, B: display.option_b,
        C: display.option_c, D: display.option_d, E: display.option_e,
      }
      // Original key was 'A' -> 'Hepatic vein'. Wherever it landed, the
      // display key must still resolve to that same string.
      expect(texts[display.correct_answer!]).toBe('Hepatic vein')
    }
  })

  it('round-trips a display pick back to the original letter', () => {
    for (let run = 0; run < 200; run++) {
      const q = makeQuestion()
      const { toOriginal, toDisplay } = shuffleOptions(q)
      for (const displayLetter of ['A', 'B', 'C', 'D']) {
        const original = toOriginal[displayLetter]
        expect(toDisplay[original]).toBe(displayLetter)
      }
    }
  })

  it('grades a correct pick as correct after translation', () => {
    for (let run = 0; run < 200; run++) {
      const q = makeQuestion()
      const { display, toOriginal } = shuffleOptions(q)
      // Student clicks whatever the screen shows as correct...
      const studentPick = display.correct_answer!
      // ...which is what gets sent to submit_exam_attempt().
      expect(toOriginal[studentPick]).toBe(q.correct_answer)
    }
  })

  it('never assigns a key to an option that does not exist (4-option question)', () => {
    for (let run = 0; run < 200; run++) {
      const q = makeQuestion({ option_e: null })
      const { display } = shuffleOptions(q)
      expect(display.option_e).toBeNull()
      expect(display.correct_answer).not.toBe('E')
    }
  })

  it('handles 5-option questions including a correct E', () => {
    for (let run = 0; run < 200; run++) {
      const q = makeQuestion({ option_e: 'Renal vein', correct_answer: 'E' })
      const { display, toOriginal } = shuffleOptions(q)
      const texts: Record<string, string | null | undefined> = {
        A: display.option_a, B: display.option_b, C: display.option_c,
        D: display.option_d, E: display.option_e,
      }
      expect(texts[display.correct_answer!]).toBe('Renal vein')
      expect(toOriginal[display.correct_answer!]).toBe('E')
    }
  })

  it('leaves the key untranslated in exam mode, where it is absent', () => {
    // get_exam_questions() returns correct_answer = null for mode 'exam';
    // the key only arrives later via reveal_exam_answers().
    const q = makeQuestion({ correct_answer: undefined, explanation: null })
    const { display, toDisplay } = shuffleOptions(q)
    expect(display.correct_answer).toBeUndefined()
    // The mapping still exists so the revealed key can be translated later.
    expect(Object.keys(toDisplay).sort()).toEqual(['A', 'B', 'C', 'D'])
  })

  it('actually changes the order sometimes (not a no-op)', () => {
    let changed = 0
    for (let run = 0; run < 200; run++) {
      const q = makeQuestion()
      const { display } = shuffleOptions(q)
      if (display.option_a !== q.option_a) changed++
    }
    expect(changed).toBeGreaterThan(0)
  })
})
