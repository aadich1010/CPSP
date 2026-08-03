import { describe, it, expect } from 'vitest'
import { buildRecommendation, type PrintableReportProps } from './PrintableReport'

function base(over: Partial<PrintableReportProps> = {}): PrintableReportProps {
  return {
    subject: 'Mixed (All Subjects)', mode: 'exam',
    correct: 31, wrong: 15, skipped: 4, total: 50, pct: 62, pass: true, accuracy: 67,
    subjectData: [{ name: 'Anatomy', pct: 82, correct: 14, total: 17 }],
    subjectDataReliable: true,
    ...over,
  }
}

describe('buildRecommendation', () => {
  it('bands on percentage', () => {
    expect(buildRecommendation(base({ pct: 20 })).band).toBe('FOUNDATION STAGE')
    expect(buildRecommendation(base({ pct: 49 })).band).toBe('FOUNDATION STAGE')
    expect(buildRecommendation(base({ pct: 50 })).band).toBe('CONSOLIDATION STAGE')
    expect(buildRecommendation(base({ pct: 74 })).band).toBe('CONSOLIDATION STAGE')
    expect(buildRecommendation(base({ pct: 75 })).band).toBe('EXAM-READY STAGE')
    expect(buildRecommendation(base({ pct: 96 })).band).toBe('EXAM-READY STAGE')
  })

  it('never exceeds five bullets, so the panel cannot overflow the sheet', () => {
    for (const pct of [0, 25, 49, 50, 60, 74, 75, 90, 100]) {
      const r = buildRecommendation(base({
        pct, skipped: 40, total: 100, accuracy: 95,
        weakest: { name: 'Biochemistry', pct: 10 },
        strongest: { name: 'Anatomy', pct: 90 },
      }))
      expect(r.points.length).toBeGreaterThan(0)
      expect(r.points.length).toBeLessThanOrEqual(5)
    }
  })

  it('names the weakest subject and its resource', () => {
    const r = buildRecommendation(base({ weakest: { name: 'Biochemistry', pct: 30 } }))
    const joined = r.points.join(' ')
    expect(joined).toContain('Biochemistry')
    expect(joined).toContain('Lippincott')
  })

  it('stays silent about subjects when the answer key was unavailable', () => {
    const r = buildRecommendation(base({
      subjectDataReliable: false,
      weakest: { name: 'Biochemistry', pct: 0 },
      strongest: { name: 'Anatomy', pct: 90 },
    }))
    const joined = r.points.join(' ')
    expect(joined).not.toContain('Biochemistry')
    expect(joined).not.toContain('Anatomy')
  })

  it('calls out a high skip rate, since there is no negative marking', () => {
    const r = buildRecommendation(base({ skipped: 30, total: 100, pct: 40 }))
    expect(r.points.join(' ')).toContain('no negative marking')
  })

  it('distinguishes a timing problem from a knowledge problem', () => {
    // Strong on what was attempted, but far fewer attempted than available.
    const r = buildRecommendation(base({ pct: 55, accuracy: 90, skipped: 5, total: 100 }))
    expect(r.points.join(' ')).toContain('Time management')
  })

  it('handles a zero-question edge case without dividing by zero', () => {
    const r = buildRecommendation(base({ correct: 0, wrong: 0, skipped: 0, total: 0, pct: 0, accuracy: 0 }))
    expect(r.band).toBe('FOUNDATION STAGE')
    expect(r.points.every((p) => !p.includes('NaN'))).toBe(true)
  })
})
