import { createAdminClient } from '@/lib/supabase/server'
import { updateQuestion, deleteQuestion } from '../../actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SUBJECT_GROUPS } from '@/lib/subjects'

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const adminDb = await createAdminClient()
  
  const { data: question } = await adminDb
    .from('questions')
    .select('*')
    .eq('id', id)
    .single()

  if (!question) notFound()

  const updateWithId = updateQuestion.bind(null, id)
  const deleteWithId = deleteQuestion.bind(null, id)

  // Compact layout: every group below carries its own tight marginBottom
  // (inline styles beat the shared `.form-group { margin-bottom: 16px }`
  // rule from globals.css, which every other admin form still uses
  // unchanged) so the whole thing fits on one screen without scrolling on
  // a normal laptop viewport. Fields that don't need a full row (Subject/
  // Difficulty, each option pair, Option E/Correct Answer) are paired up
  // in 2-column grids instead of stacking full-width like the Add Question
  // page does.
  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000000', marginBottom: 2 }}>
            Edit Question
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
            Modify MCQ details or remove it from the bank
          </p>
        </div>
        <form action={deleteWithId}>
          <button
            type="submit"
            className="btn btn-ghost btn-sm"
            style={{ color: '#ef4444' }}
          >
            Delete Question
          </button>
        </form>
      </div>

      <div className="glass" style={{ padding: '18px 20px' }}>
        <form action={updateWithId}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label className="label" htmlFor="subject">Subject *</label>
              <select id="subject" name="subject" required className="input" defaultValue={question.subject}>
                {/* Legacy questions can carry a subject string from before this
                    taxonomy existed (e.g. 'Oncology', 'Neurology') that isn't in
                    SUBJECT_GROUPS -- keep it selectable so saving the form
                    doesn't silently re-tag the question to whatever option is
                    first in the list. */}
                {!SUBJECT_GROUPS.some((g) => g.subjects.includes(question.subject)) && (
                  <option value={question.subject}>{question.subject} (legacy, unlisted)</option>
                )}
                {SUBJECT_GROUPS.map((group) => (
                  <optgroup key={group.name} label={group.name}>
                    {group.subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="difficulty">Difficulty *</label>
              <select id="difficulty" name="difficulty" required className="input" defaultValue={question.difficulty || 'Medium'}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label className="label" htmlFor="question_text">Question Text *</label>
            <textarea
              id="question_text"
              name="question_text"
              required
              rows={3}
              className="input"
              style={{ resize: 'vertical' }}
              defaultValue={question.question_text}
              placeholder="Enter the complete question stem..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            {['A', 'B', 'C', 'D'].map((opt) => (
              <div key={opt}>
                <label className="label" htmlFor={`option_${opt.toLowerCase()}`}>
                  Option {opt} *
                </label>
                <input
                  id={`option_${opt.toLowerCase()}`}
                  name={`option_${opt.toLowerCase()}`}
                  required
                  className="input"
                  defaultValue={question[`option_${opt.toLowerCase()}`]}
                  placeholder={`Option ${opt}...`}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label className="label" htmlFor="option_e">Option E (optional)</label>
              <input
                id="option_e"
                name="option_e"
                className="input"
                defaultValue={question.option_e || ''}
                placeholder="Leave blank for 4-option MCQ"
              />
            </div>

            <div>
              <label className="label" htmlFor="correct_answer">Correct Answer *</label>
              <select id="correct_answer" name="correct_answer" required className="input" defaultValue={question.correct_answer}>
                {['A', 'B', 'C', 'D', 'E'].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label className="label" htmlFor="explanation">Explanation (optional)</label>
            <textarea
              id="explanation"
              name="explanation"
              rows={2}
              className="input"
              style={{ resize: 'vertical' }}
              defaultValue={question.explanation || ''}
              placeholder="Provide a brief explanation for the correct answer..."
            />
          </div>

          {/* Roman Urdu translation -- optional alternate-language copy of
              every field above (see supabase/migrations/20260816000000_
              roman_urdu_translation_support.sql). Never required, never
              re-tags the subject/answer -- purely a display alternative for
              students who read Roman Urdu more comfortably than English.
              Previously only settable through Import/Restore; this is the
              first place an admin can see or edit it on a single question.
              Collapsed behind <details> by default (plain HTML, no JS
              needed -- this stays a server component) so it doesn't push
              the far more commonly-edited English fields above off screen;
              a question that already has a translation still shows it
              once expanded, nothing is hidden or lost. */}
          <details style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #cbd5e1' }}>
            <summary
              style={{
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: 4,
              }}
            >
              Roman Urdu Translation (optional)
            </summary>
            <p style={{ color: '#64748b', fontSize: '0.76rem', margin: '6px 0 12px' }}>
              Urdu written in English/Latin letters. Leave blank to show only the English version to students.
            </p>

            <div style={{ marginBottom: 10 }}>
              <label className="label" htmlFor="roman_urdu_question_text">Question Text (Roman Urdu)</label>
              <textarea
                id="roman_urdu_question_text"
                name="roman_urdu_question_text"
                rows={2}
                className="input"
                style={{ resize: 'vertical' }}
                defaultValue={question.roman_urdu_question_text || ''}
                placeholder="Roman Urdu translation of the question stem..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {['A', 'B', 'C', 'D'].map((opt) => (
                <div key={opt}>
                  <label className="label" htmlFor={`roman_urdu_option_${opt.toLowerCase()}`}>
                    Option {opt} (Roman Urdu)
                  </label>
                  <input
                    id={`roman_urdu_option_${opt.toLowerCase()}`}
                    name={`roman_urdu_option_${opt.toLowerCase()}`}
                    className="input"
                    defaultValue={question[`roman_urdu_option_${opt.toLowerCase()}`] || ''}
                    placeholder={`Option ${opt} in Roman Urdu...`}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 10 }}>
              <label className="label" htmlFor="roman_urdu_option_e">Option E (Roman Urdu)</label>
              <input
                id="roman_urdu_option_e"
                name="roman_urdu_option_e"
                className="input"
                defaultValue={question.roman_urdu_option_e || ''}
                placeholder="Leave blank if this question has no Option E"
              />
            </div>

            <div style={{ marginBottom: 4 }}>
              <label className="label" htmlFor="roman_urdu_explanation">Explanation (Roman Urdu)</label>
              <textarea
                id="roman_urdu_explanation"
                name="roman_urdu_explanation"
                rows={2}
                className="input"
                style={{ resize: 'vertical' }}
                defaultValue={question.roman_urdu_explanation || ''}
                placeholder="Roman Urdu translation of the explanation..."
              />
            </div>
          </details>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="submit" className="btn btn-primary">
              Update Question
            </button>
            <Link href="/admin/questions" className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
