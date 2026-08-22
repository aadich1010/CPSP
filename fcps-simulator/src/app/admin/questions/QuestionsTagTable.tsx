'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { bulkTagQuestions, bulkTagBySubject } from './actions';

interface QuestionRow {
  id: string;
  question_text: string;
  subject: string;
  difficulty: string | null;
  correct_answer: string;
  created_at: string;
}

interface ExamOption {
  slug: string;
  display_name: string;
}

interface QuestionsTagTableProps {
  questions: QuestionRow[];
  tagsByQuestion: Record<string, ExamOption[]>;
  examOptions: ExamOption[];
  subject: string;
  filteredCount: number;
}

export default function QuestionsTagTable({
  questions,
  tagsByQuestion,
  examOptions,
  subject,
  filteredCount,
}: QuestionsTagTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [examSlug, setExamSlug] = useState(examOptions[0]?.slug || '');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const examLabel = examOptions.find((e) => e.slug === examSlug)?.display_name || examSlug;
  const allOnPageSelected = questions.length > 0 && questions.every((q) => selected.has(q.id));

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected((prev) => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        questions.forEach((q) => next.delete(q.id));
        return next;
      }
      const next = new Set(prev);
      questions.forEach((q) => next.add(q.id));
      return next;
    });
  }

  function runSelected(action: 'add' | 'remove') {
    if (!examSlug || selected.size === 0) return;
    setMessage(null);
    startTransition(async () => {
      const res = await bulkTagQuestions({ questionIds: Array.from(selected), examSlug, action });
      if (res.error) {
        setMessage({ type: 'error', text: res.error });
      } else {
        setMessage({
          type: 'success',
          text: `${action === 'add' ? 'Tagged' : 'Untagged'} ${res.count} question(s) ${action === 'add' ? 'to' : 'from'} ${examLabel}.`,
        });
        setSelected(new Set());
      }
    });
  }

  function runAllFiltered(action: 'add' | 'remove') {
    if (!examSlug) return;
    const target = subject === 'all' ? `ALL ${filteredCount} questions in the entire bank` : `all ${filteredCount} "${subject}" questions`;
    const confirmed = window.confirm(
      `${action === 'add' ? 'Tag' : 'Untag'} ${target} ${action === 'add' ? 'to' : 'from'} ${examLabel}? This cannot be undone in bulk.`
    );
    if (!confirmed) return;
    setMessage(null);
    startTransition(async () => {
      const res = await bulkTagBySubject({ subject, examSlug, action });
      if (res.error) {
        setMessage({ type: 'error', text: res.error });
      } else {
        setMessage({
          type: 'success',
          text: `${action === 'add' ? 'Tagged' : 'Untagged'} ${res.count} question(s) ${action === 'add' ? 'to' : 'from'} ${examLabel}.`,
        });
      }
    });
  }

  if (examOptions.length === 0) {
    // No non-FCPS exam types active -- render the plain table with no
    // tagging affordances rather than an empty/broken toolbar.
    return (
      <table style={{ minWidth: 800 }}>
        <thead>
          <tr>
            <th style={{ width: '45%' }}>Question</th>
            <th>Subject</th>
            <th>Difficulty</th>
            <th>Answer</th>
            <th>Added</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <QuestionRowView key={q.id} q={q} tags={[]} showCheckbox={false} />
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div>
      {/* Tagging toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          background: 'rgba(13, 148, 136, 0.05)',
          border: '1px solid rgba(13, 148, 136, 0.15)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f766e', whiteSpace: 'nowrap' }}>
          Exam Tagging:
        </span>
        <select
          value={examSlug}
          onChange={(e) => setExamSlug(e.target.value)}
          disabled={isPending}
          style={{
            fontSize: '0.8rem',
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontWeight: 700,
            color: '#1e293b',
          }}
        >
          {examOptions.map((opt) => (
            <option key={opt.slug} value={opt.slug}>
              {opt.display_name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => runSelected('add')}
          disabled={isPending || selected.size === 0}
          className="btn btn-sm"
          style={{
            fontSize: '0.75rem',
            padding: '6px 12px',
            borderRadius: 8,
            background: selected.size === 0 ? '#e2e8f0' : 'linear-gradient(135deg, #0d9488, #0f766e)',
            color: selected.size === 0 ? '#94a3b8' : '#fff',
            fontWeight: 800,
            border: 'none',
            cursor: selected.size === 0 ? 'default' : 'pointer',
          }}
        >
          Tag Selected ({selected.size})
        </button>
        <button
          type="button"
          onClick={() => runSelected('remove')}
          disabled={isPending || selected.size === 0}
          className="btn btn-sm btn-ghost"
          style={{
            fontSize: '0.75rem',
            padding: '6px 12px',
            borderRadius: 8,
            fontWeight: 700,
            border: '1px solid #e2e8f0',
            cursor: selected.size === 0 ? 'default' : 'pointer',
            opacity: selected.size === 0 ? 0.5 : 1,
          }}
        >
          Untag Selected
        </button>

        <div style={{ width: 1, height: 20, background: '#cbd5e1', margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => runAllFiltered('add')}
          disabled={isPending}
          className="btn btn-sm btn-ghost"
          style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: 8, fontWeight: 700, border: '1px solid #e2e8f0' }}
        >
          Tag ALL {subject === 'all' ? 'questions' : `"${subject}"`} ({filteredCount})
        </button>
        <button
          type="button"
          onClick={() => runAllFiltered('remove')}
          disabled={isPending}
          className="btn btn-sm btn-ghost"
          style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: 8, fontWeight: 700, border: '1px solid #e2e8f0' }}
        >
          Untag ALL
        </button>

        {isPending && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Working…</span>}
        {message && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: message.type === 'success' ? '#16a34a' : '#dc2626',
            }}
          >
            {message.text}
          </span>
        )}
      </div>

      <table style={{ minWidth: 900 }}>
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} />
            </th>
            <th style={{ width: '38%' }}>Question</th>
            <th>Subject</th>
            <th>Difficulty</th>
            <th>Answer</th>
            <th>Exam Tags</th>
            <th>Added</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!questions.length ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', color: '#475569', padding: '32px' }}>
                No questions found.
              </td>
            </tr>
          ) : (
            questions.map((q) => (
              <QuestionRowView
                key={q.id}
                q={q}
                tags={tagsByQuestion[q.id] || []}
                showCheckbox
                checked={selected.has(q.id)}
                onToggle={() => toggleRow(q.id)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function QuestionRowView({
  q,
  tags,
  showCheckbox,
  checked,
  onToggle,
}: {
  q: QuestionRow;
  tags: ExamOption[];
  showCheckbox: boolean;
  checked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <tr>
      {showCheckbox && (
        <td>
          <input type="checkbox" checked={!!checked} onChange={onToggle} />
        </td>
      )}
      <td style={{ color: '#1e293b', fontSize: '0.9rem', fontWeight: 500, maxWidth: 500 }}>
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {q.question_text}
        </div>
      </td>
      <td>
        <span
          className="badge"
          style={{ fontSize: '0.7rem', background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', border: '1px solid rgba(13, 148, 136, 0.2)' }}
        >
          {q.subject}
        </span>
      </td>
      <td>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: q.difficulty === 'Easy' ? 'rgba(22, 163, 74, 0.1)' : q.difficulty === 'Hard' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(217, 119, 6, 0.1)',
            color: q.difficulty === 'Easy' ? '#16a34a' : q.difficulty === 'Hard' ? '#dc2626' : '#d97706',
            border: `1px solid ${q.difficulty === 'Easy' ? 'rgba(22, 163, 74, 0.2)' : q.difficulty === 'Hard' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(217, 119, 6, 0.2)'}`,
          }}
        >
          {q.difficulty || 'Medium'}
        </span>
      </td>
      <td>
        <span style={{ fontWeight: 800, color: '#0d9488', fontFamily: 'monospace', fontSize: '1rem' }}>{q.correct_answer}</span>
      </td>
      <td>
        {tags.length === 0 ? (
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>—</span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {tags.map((t) => (
              <span
                key={t.slug}
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '100px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#4f46e5',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.display_name}
              </span>
            ))}
          </div>
        )}
      </td>
      <td style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{new Date(q.created_at).toLocaleDateString()}</td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          <Link href={`/admin/questions/${q.id}/edit`} className="btn btn-sm btn-ghost" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
            Edit
          </Link>
        </div>
      </td>
    </tr>
  );
}
