import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeleteAllButton from './DeleteAllButton'
import SubjectDropdown from './SubjectDropdown'
import BackupRestoreExport from './BackupRestoreExport'
import QuestionsTagTable from './QuestionsTagTable'
import Icon from '@/design-system/Icon';
import { SUBJECTS } from '@/lib/subjects'

export const dynamic = 'force-dynamic'

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

  // ── Exam tagging data (question_exam_tags) ────────────────────────────
  // Non-FCPS exam types the admin can tag questions into, plus this page's
  // existing tags, so QuestionsTagTable can render checkboxes/badges and
  // run bulk tag/untag actions without any extra client-side fetch. FCPS
  // itself is excluded here -- FCPS questions are already filtered by the
  // `subject` column, not by question_exam_tags.
  const { data: examTypesData } = await adminDb
    .from('exam_types')
    .select('slug, display_name')
    .eq('is_active', true)
    .neq('slug', 'fcps-part1')
    .order('display_name')
  const examOptions = examTypesData ?? []

  const questionIds = (questions ?? []).map((q) => q.id)
  const tagsByQuestion: Record<string, { slug: string; display_name: string }[]> = {}
  if (questionIds.length > 0) {
    const { data: tagRows } = await adminDb
      .from('question_exam_tags')
      .select('question_id, exam_types(slug, display_name)')
      .in('question_id', questionIds)

    type TagRow = { question_id: string; exam_types: { slug: string; display_name: string } | { slug: string; display_name: string }[] | null }
    ;(tagRows as TagRow[] | null)?.forEach((row) => {
      const examType = Array.isArray(row.exam_types) ? row.exam_types[0] : row.exam_types
      if (!examType) return
      if (!tagsByQuestion[row.question_id]) tagsByQuestion[row.question_id] = []
      tagsByQuestion[row.question_id].push(examType)
    })
  }

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
            <span style={{ fontSize: '1rem' }}><Icon name="analytics" /></span>
            <span>{count ?? 0}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 600 }}>QUESTIONS</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <BackupRestoreExport subject={subject} />
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
            <Icon name="ai" /> AI Import
          </Link>
        </div>
      </div>

      {/* Table + exam tagging */}
      <div className="table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
        <QuestionsTagTable
          questions={questions ?? []}
          tagsByQuestion={tagsByQuestion}
          examOptions={examOptions}
          subject={subject}
          filteredCount={count ?? 0}
        />
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
