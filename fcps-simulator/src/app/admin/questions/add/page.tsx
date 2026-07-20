import { addQuestion } from '../actions'
import Link from 'next/link'

const SUBJECTS = [
  'Anatomy', 'Physiology', 'Biochemistry', 'Pathology',
  'Pharmacology', 'Microbiology', 'Forensic Medicine',
  'Community Medicine', 'Surgery', 'Medicine',
  'Obstetrics & Gynecology', 'Pediatrics', 'ENT', 'Ophthalmology',
]

export default function AddQuestionPage() {
  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
          Add Question
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Add a single MCQ to the question bank
        </p>
      </div>

      <div className="glass" style={{ padding: '28px 24px' }}>
        <form action={addQuestion}>
          <div className="form-group">
            <label className="label" htmlFor="subject">Subject *</label>
            <select id="subject" name="subject" required className="input">
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="difficulty">Difficulty *</label>
            <select id="difficulty" name="difficulty" required className="input" defaultValue="Medium">
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="question_text">Question Text *</label>
            <textarea
              id="question_text"
              name="question_text"
              required
              rows={4}
              className="input"
              style={{ resize: 'vertical' }}
              placeholder="Enter the complete question stem..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {['A', 'B', 'C', 'D'].map((opt) => (
              <div key={opt} className="form-group">
                <label className="label" htmlFor={`option_${opt.toLowerCase()}`}>
                  Option {opt} *
                </label>
                <input
                  id={`option_${opt.toLowerCase()}`}
                  name={`option_${opt.toLowerCase()}`}
                  required
                  className="input"
                  placeholder={`Option ${opt}...`}
                />
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="label" htmlFor="option_e">Option E (optional)</label>
            <input
              id="option_e"
              name="option_e"
              className="input"
              placeholder="Leave blank for 4-option MCQ"
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="correct_answer">Correct Answer *</label>
            <select id="correct_answer" name="correct_answer" required className="input">
              {['A', 'B', 'C', 'D', 'E'].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="explanation">Explanation (optional)</label>
            <textarea
              id="explanation"
              name="explanation"
              rows={3}
              className="input"
              style={{ resize: 'vertical' }}
              placeholder="Provide a brief explanation for the correct answer..."
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary">
              Save Question
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
