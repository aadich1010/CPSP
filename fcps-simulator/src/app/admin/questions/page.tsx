import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeleteAllButton from './DeleteAllButton'
import SubjectDropdown from './SubjectDropdown'
import BackupRestoreExport from './BackupRestoreExport'

export const dynamic = 'force-dynamic'

const SUBJECTS = [
  'Anatomy', 'Physiology', 'Biochemistry', 'Pathology',
  'Pharmacology', 'Microbiology', 'Forensic Medicine',
  'Community Medicine', 'Surgery', 'Medicine',
  'Obstetrics & Gynecology', 'Pediatrics', 'ENT', 'Ophthalmology',
]

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; page?: string }>
}) {
  const supabase = await createClient()
  const adminDb  = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params  = await searchParams
  const subject = params.subject || 'all'
  const page    = parseInt(params.page || '1')
  const perPage = 20
  const from    = (page - 1) * perPage
  const to      = from + perPage - 1

  let query = adminDb
    .from('questions')
    .select('id, question_text, subject, difficulty, correct_answer, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (subject !== 'all') {
    query = query.eq('subject', subject)
  }

  const { data: questions, count } = await query
  const totalPages = Math.ceil((count ?? 0) / perPage)

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', zIndex: 50 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* REAL CLICK DROPDOWN */}
          <SubjectDropdown currentSubject={subject} subjects={SUBJECTS} />

          <DeleteAllButton />

          {/* Total Questions Count Pill */}
          <div style={{ 
            background: 'rgba(13, 148, 136, 0.1)', 
            color: '#0d9488', 
            padding: '6px 14px', 
            borderRadius: '100px', 
            fontSize: '0.8rem', 
            fontWeight: 800,
            border: '1px solid rgba(13, 148, 136, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 4px rgba(13, 148, 136, 0.05)'
          }}>
            <span style={{ fontSize: '1rem' }}>📊</span>
            <span>{count ?? 0}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 600 }}>QUESTIONS</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <BackupRestoreExport />
          <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
          <Link
            href="/admin/questions/add"
            title="Add Question"
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.75rem',
              height: 32,
              boxShadow: '0 2px 4px rgba(13,148,136,0.15)',
              textDecoration: 'none',
            }}
          >
            + Add Question
          </Link>
          <Link
            href="/admin/questions/import"
            title="AI Import"
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.75rem',
              height: 32,
              boxShadow: '0 2px 4px rgba(13,148,136,0.15)',
              textDecoration: 'none',
            }}
          >
            🤖 AI Import
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
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
            {!questions?.length ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#475569', padding: '32px' }}>
                  No questions found.
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr key={q.id}>
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
                    <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
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
                        border: `1px solid ${q.difficulty === 'Easy' ? 'rgba(22, 163, 74, 0.2)' : q.difficulty === 'Hard' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(217, 119, 6, 0.2)'}`
                      }}
                    >
                      {q.difficulty || 'Medium'}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 800,
                        color: '#0d9488',
                        fontFamily: 'monospace',
                        fontSize: '1rem',
                      }}
                    >
                      {q.correct_answer}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                    {new Date(q.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link
                        href={`/admin/questions/${q.id}/edit`}
                        className="btn btn-sm btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', marginTop: 24, paddingBottom: 16 }}>
          {/* Previous Arrow */}
          <Link
            href={`/admin/questions?${subject !== 'all' ? `subject=${encodeURIComponent(subject)}&` : ''}page=${Math.max(1, page - 1)}`}
            className={`btn btn-sm ${page === 1 ? 'btn-disabled opacity-30' : 'btn-ghost'}`}
            style={{ minWidth: 32, height: 32, border: '1px solid #e2e8f0', borderRadius: 8, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ←
          </Link>

          {/* Smart Chunked Page Numbers (20 at a time) */}
          {(() => {
            const chunkSize = 20;
            const currentChunk = Math.floor((page - 1) / chunkSize);
            const startPage = currentChunk * chunkSize + 1;
            const endPage = Math.min(startPage + chunkSize - 1, totalPages);
            
            const pages = [];
            for (let p = startPage; p <= endPage; p++) {
              pages.push(
                <Link
                  key={p}
                  href={`/admin/questions?${subject !== 'all' ? `subject=${encodeURIComponent(subject)}&` : ''}page=${p}`}
                  className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ 
                    minWidth: 32, 
                    height: 32, 
                    padding: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: 8,
                    border: p === page ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  {p}
                </Link>
              );
            }

            // Add ellipsis and last page if needed
            if (endPage < totalPages) {
              pages.push(<span key="sep" style={{ color: '#94a3b8', fontWeight: 800, margin: '0 2px', fontSize: '0.7rem' }}>...</span>);
              pages.push(
                <Link
                  key={totalPages}
                  href={`/admin/questions?${subject !== 'all' ? `subject=${encodeURIComponent(subject)}&` : ''}page=${totalPages}`}
                  className="btn btn-sm btn-ghost"
                  style={{ 
                    minWidth: 32, 
                    height: 32, 
                    padding: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {totalPages}
                </Link>
              );
            }
            return pages;
          })()}

          {/* Next Arrow */}
          <Link
            href={`/admin/questions?${subject !== 'all' ? `subject=${encodeURIComponent(subject)}&` : ''}page=${Math.min(totalPages, page + 1)}`}
            className={`btn btn-sm ${page === totalPages ? 'btn-disabled opacity-30' : 'btn-ghost'}`}
            style={{ minWidth: 32, height: 32, border: '1px solid #e2e8f0', borderRadius: 8, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            →
          </Link>
        </div>
      )}
    </div>
  )
}
