'use server'

import { createAdminClient, requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validateQuestion, type QuestionInput } from './validate-question'

export async function addQuestion(formData: FormData) {
  await requireAdmin()
  const adminDb = await createAdminClient()

  const question_text    = formData.get('question_text')    as string
  const option_a         = formData.get('option_a')         as string
  const option_b         = formData.get('option_b')         as string
  const option_c         = formData.get('option_c')         as string
  const option_d         = formData.get('option_d')         as string
  const option_e         = formData.get('option_e')         as string | null
  const correct_answer   = (formData.get('correct_answer') as string || '').trim().toUpperCase()
  const explanation      = formData.get('explanation')      as string | null
  const subject          = formData.get('subject')          as string
  const difficulty       = formData.get('difficulty')       as string || 'Medium'

  const validationError = validateQuestion({
    question_text, option_a, option_b, option_c, option_d, option_e,
    correct_answer, explanation, subject, difficulty,
  })
  if (validationError) throw new Error(validationError)

  const { error } = await adminDb.from('questions').insert({
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    option_e: option_e || null,
    correct_answer,
    explanation: explanation || null,
    subject,
    difficulty,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/admin/questions')
  redirect('/admin/questions')
}

export async function importQuestionsBulk(questions: QuestionInput[]) {
  try {
    await requireAdmin()
    const adminDb = await createAdminClient()

    // Validate every row before touching the database. Collect all
    // failures at once so the admin can fix a whole spreadsheet's worth
    // of mistakes in one pass instead of one-error-at-a-time.
    const invalidRows: string[] = []
    questions.forEach((q, i) => {
      const err = validateQuestion(q, i)
      if (err) invalidRows.push(err)
    })
    if (invalidRows.length > 0) {
      return {
        error: `${invalidRows.length} row(s) failed validation, nothing was imported:\n` +
          invalidRows.slice(0, 20).join('\n') +
          (invalidRows.length > 20 ? `\n...and ${invalidRows.length - 20} more.` : ''),
      }
    }

    // Normalize correct_answer to uppercase so grading comparisons in
    // submit_exam_attempt() are consistent regardless of how it was typed
    // in the source spreadsheet.
    const normalizedQuestions = questions.map(q => ({
      ...q,
      correct_answer: q.correct_answer.trim().toUpperCase(),
    }))

    // De-duplicate within the array to prevent ON CONFLICT errors
    const uniqueQuestions = Array.from(
      new Map(normalizedQuestions.map(q => [q.question_text.trim(), q])).values()
    )

    console.log(`[Import] Processing ${uniqueQuestions.length} unique questions out of ${questions.length} total.`)

    if (uniqueQuestions.length === 0) {
      console.warn('[Import] No unique questions found after de-duplication.')
      return { count: 0, newCount: 0, updatedCount: 0 }
    }

    // Check which ones already exist to provide better feedback
    const { data: existing, error: fetchError } = await adminDb
      .from('questions')
      .select('question_text')
      .in('question_text', uniqueQuestions.map(q => q.question_text))

    if (fetchError) console.error('[Import] Error fetching existing:', fetchError)

    const existingTexts = new Set(existing?.map(e => e.question_text) || [])
    const newCount = uniqueQuestions.filter(q => !existingTexts.has(q.question_text)).length
    const updatedCount = uniqueQuestions.length - newCount

    const { error, data } = await adminDb
      .from('questions')
      .upsert(uniqueQuestions, { onConflict: 'question_text' })
      .select('id')

    if (error) {
      console.error('Bulk Import Database Error:', error)
      return { error: error.message }
    }

    console.log(`[Import] Successfully upserted ${data?.length} rows.`)

    revalidatePath('/admin')
    revalidatePath('/admin/questions')
    return { 
      count: data?.length ?? 0, 
      newCount, 
      updatedCount, 
      inputCount: questions.length, 
      uniqueCount: uniqueQuestions.length 
    }
  } catch (err: any) {
    console.error('Uncaught Bulk Import Error:', err)
    return { error: err.message || 'An unexpected error occurred during import' }
  }
}

export async function updateQuestion(id: string, formData: FormData) {
  await requireAdmin()
  const adminDb = await createAdminClient()

  const question_text    = formData.get('question_text')    as string
  const option_a         = formData.get('option_a')         as string
  const option_b         = formData.get('option_b')         as string
  const option_c         = formData.get('option_c')         as string
  const option_d         = formData.get('option_d')         as string
  const option_e         = formData.get('option_e')         as string | null
  const correct_answer   = formData.get('correct_answer')   as string
  const explanation      = formData.get('explanation')      as string | null
  const subject          = formData.get('subject')          as string
  const difficulty       = formData.get('difficulty')       as string || 'Medium'

  const { error } = await adminDb.from('questions').update({
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    option_e: option_e || null,
    correct_answer,
    explanation: explanation || null,
    subject,
    difficulty,
  }).eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/questions')
  redirect('/admin/questions')
}

export async function deleteQuestion(id: string) {
  await requireAdmin()
  const adminDb = await createAdminClient()
  const { error } = await adminDb.from('questions').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/questions')
  redirect('/admin/questions')
}

export async function deleteAllQuestions() {
  await requireAdmin()
  const adminDb = await createAdminClient()
  const { error } = await adminDb.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
  if (error) throw new Error(error.message)
  revalidatePath('/admin/questions')
  return { success: true }
}

export async function backupQuestions() {
  try {
    await requireAdmin()
    const adminDb = await createAdminClient()
    let allQuestions: any[] = []
    let from = 0
    const limit = 1000

    while (true) {
      const { data, error } = await adminDb
        .from('questions')
        .select('question_text, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, subject, difficulty')
        .order('created_at', { ascending: true })
        .range(from, from + limit - 1)

      if (error) throw new Error(error.message)
      if (!data || data.length === 0) break

      allQuestions = allQuestions.concat(data)
      if (data.length < limit) break
      from += limit
    }

    return { data: allQuestions }
  } catch (err: any) {
    return { error: err.message || 'Error backing up questions' }
  }
}

export async function restoreQuestions(questions: any[]) {
  try {
    await requireAdmin()
    const adminDb = await createAdminClient()

    // Row-level validation up front, same messages as importQuestionsBulk,
    // so the admin gets a readable error before anything happens at all.
    // The database function below re-validates independently — this
    // check exists purely to give a fast, friendly error message; it is
    // not the safety net (see the migration for why).
    if (!Array.isArray(questions) || questions.length === 0) {
      return { error: 'Restore file contains no questions. Nothing was deleted.' }
    }
    const invalidRows: string[] = []
    questions.forEach((q, i) => {
      const err = validateQuestion(q, i)
      if (err) invalidRows.push(err)
    })
    if (invalidRows.length > 0) {
      return {
        error: `${invalidRows.length} row(s) failed validation, nothing was deleted or restored:\n` +
          invalidRows.slice(0, 20).join('\n') +
          (invalidRows.length > 20 ? `\n...and ${invalidRows.length - 20} more.` : ''),
      }
    }

    // delete + insert both happen inside restore_questions_bulk()'s
    // single PL/pgSQL transaction, so a mid-restore failure (a bad row
    // the DB-side check catches, a unique-constraint hit, a dropped
    // connection) rolls the whole thing back instead of leaving the
    // question bank half-deleted. See
    // supabase/migrations/20260723000000_atomic_restore_questions.sql.
    const { data: count, error } = await adminDb.rpc('restore_questions_bulk', {
      p_questions: questions,
    })
    if (error) throw new Error(error.message)

    revalidatePath('/admin')
    revalidatePath('/admin/questions')
    return { success: true, count: count ?? questions.length }
  } catch (err: any) {
    return { error: err.message || 'Error restoring questions' }
  }
}
