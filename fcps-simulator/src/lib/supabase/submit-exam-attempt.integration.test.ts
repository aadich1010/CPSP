import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Integration tests for the submit_exam_attempt() Postgres RPC.
 *
 * WHY THIS IS AN INTEGRATION TEST, NOT A UNIT TEST
 * -------------------------------------------------
 * The grading logic being tested lives entirely inside a SECURITY DEFINER
 * PL/pgSQL function (supabase/migrations/20260720121350_secure_grading_and_indexes.sql
 * + 20260722030000_gate_exam_sessions_by_subscription.sql), not in
 * TypeScript. There is nothing in the JS layer to unit-test with mocks —
 * doing so would only test that we correctly called supabase.rpc(), not
 * that grading, timing, or authorization actually work. So this talks to
 * a real Postgres instance running the real migrations.
 *
 * This is the single highest-risk path in the product: it's the only
 * thing standing between "student sees a score" and "student pays for a
 * mock exam and gets cheated, or cheats it." It deserves a real test
 * against real SQL, not a mock that just proves the RPC name is spelled
 * right.
 *
 * HOW TO RUN THIS
 * ----------------
 * Point it at a disposable Supabase project (a local `supabase start`
 * instance, or a dedicated Supabase "test" project — never production)
 * with all migrations applied, then run:
 *
 *   TEST_SUPABASE_URL=http://127.0.0.1:54321 \
 *   TEST_SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
 *   npm test
 *
 * Without those two env vars, every test in this file is skipped — it
 * will NOT fail `npm test` in an environment with no database (e.g. this
 * sandbox, or a laptop that hasn't run `supabase start`). That's
 * intentional: this suite needs to run somewhere with real Postgres
 * (CI with a Supabase test project, or locally), but must not block
 * everyone else's `npm test` in the meantime.
 *
 * Each test creates its own throwaway user(s)/session and cleans them up
 * afterwards, so this is safe to run repeatedly and safe to run in
 * parallel with other test files (each `it` block uses a fresh random
 * user per session it creates).
 */

const SUPABASE_URL = process.env.TEST_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY
const HAS_DB = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY)

describe.skipIf(!HAS_DB)('submit_exam_attempt() RPC', () => {
  let admin: SupabaseClient
  const createdUserIds: string[] = []
  const createdQuestionIds: string[] = []

  // A student account with a fresh Supabase JS client authenticated as
  // them (RLS applies, exactly like the real app).
  async function createStudent(opts: { subscriptionActive: boolean; expiresAt?: string | null }) {
    const email = `test-${crypto.randomUUID()}@example.com`
    const password = 'test-password-123!'

    const { data: userRes, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createErr || !userRes.user) throw createErr ?? new Error('failed to create user')
    createdUserIds.push(userRes.user.id)

    const { error: profileErr } = await admin
      .from('profiles')
      .update({
        role: 'student',
        subscription_status: opts.subscriptionActive ? 'active' : 'inactive',
        subscription_expires_at: opts.expiresAt ?? null,
      })
      .eq('id', userRes.user.id)
    if (profileErr) throw profileErr

    const studentClient = createClient(SUPABASE_URL!, process.env.TEST_SUPABASE_ANON_KEY!)
    const { error: signInErr } = await studentClient.auth.signInWithPassword({ email, password })
    if (signInErr) throw signInErr

    return { userId: userRes.user.id, client: studentClient }
  }

  async function seedQuestions(count: number) {
    const rows = Array.from({ length: count }, (_, i) => ({
      question_text: `Test question ${i}`,
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D',
      option_e: 'E',
      correct_answer: 'B',
      explanation: 'Because B.',
      subject: 'Anatomy',
    }))
    const { data, error } = await admin.from('questions').insert(rows).select('id')
    if (error) throw error
    const ids = data!.map((r) => r.id as string)
    createdQuestionIds.push(...ids)
    return ids
  }

  async function createSession(opts: {
    userId: string
    questionIds: string[]
    timeLimitSeconds: number
    startedAt?: string
  }) {
    const { data, error } = await admin
      .from('exam_sessions')
      .insert({
        user_id: opts.userId,
        subject: 'Anatomy',
        mode: 'exam',
        question_ids: opts.questionIds,
        time_limit_seconds: opts.timeLimitSeconds,
        started_at: opts.startedAt ?? new Date().toISOString(),
      })
      .select('id')
      .single()
    if (error) throw error
    return data.id as string
  }

  beforeAll(() => {
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!)
  })

  afterAll(async () => {
    if (createdQuestionIds.length) {
      await admin.from('questions').delete().in('id', createdQuestionIds)
    }
    for (const id of createdUserIds) {
      await admin.auth.admin.deleteUser(id)
    }
  })

  it('scores correct answers and ignores wrong/missing ones', async () => {
    const { userId, client } = await createStudent({ subscriptionActive: true })
    const questionIds = await seedQuestions(4)
    const sessionId = await createSession({ userId, questionIds, timeLimitSeconds: 3600 })

    // correct_answer is 'B' for every seeded question.
    const answers = { 0: 'B', 1: 'B', 2: 'A', 3: null }

    const { data, error } = await client.rpc('submit_exam_attempt', {
      p_session_id: sessionId,
      p_answers: answers,
    })

    expect(error).toBeNull()
    const result = data![0]
    expect(result.score).toBe(2)
    expect(result.total_questions).toBe(4)
    expect(result.late_submission).toBe(false)
  })

  it('rejects a second submission for the same session', async () => {
    const { userId, client } = await createStudent({ subscriptionActive: true })
    const questionIds = await seedQuestions(2)
    const sessionId = await createSession({ userId, questionIds, timeLimitSeconds: 3600 })

    await client.rpc('submit_exam_attempt', { p_session_id: sessionId, p_answers: { 0: 'B' } })
    const { error } = await client.rpc('submit_exam_attempt', {
      p_session_id: sessionId,
      p_answers: { 0: 'B' },
    })

    expect(error?.message).toContain('ALREADY_SUBMITTED')
  })

  it("rejects submitting a session that belongs to a different user", async () => {
    const owner = await createStudent({ subscriptionActive: true })
    const attacker = await createStudent({ subscriptionActive: true })
    const questionIds = await seedQuestions(1)
    const sessionId = await createSession({
      userId: owner.userId,
      questionIds,
      timeLimitSeconds: 3600,
    })

    const { error } = await attacker.client.rpc('submit_exam_attempt', {
      p_session_id: sessionId,
      p_answers: { 0: 'B' },
    })

    expect(error?.message).toContain('FORBIDDEN')
  })

  it('flags late_submission based on server-side elapsed time, not the timer the client reports', async () => {
    const { userId, client } = await createStudent({ subscriptionActive: true })
    const questionIds = await seedQuestions(1)
    // started_at backdated well past the time limit — simulates a student
    // who kept the tab open past their allotted time. The RPC must derive
    // "late" from now() - started_at, never from anything the client sends.
    const startedAt = new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    const sessionId = await createSession({
      userId,
      questionIds,
      timeLimitSeconds: 60,
      startedAt,
    })

    const { data, error } = await client.rpc('submit_exam_attempt', {
      p_session_id: sessionId,
      p_answers: { 0: 'B' },
    })

    expect(error).toBeNull()
    expect(data![0].late_submission).toBe(true)
  })

  it('rejects submission from a student whose subscription is not active', async () => {
    const { userId, client } = await createStudent({ subscriptionActive: false })
    const questionIds = await seedQuestions(1)
    const sessionId = await admin
      .from('exam_sessions')
      .insert({
        user_id: userId,
        subject: 'Anatomy',
        mode: 'exam',
        question_ids: questionIds,
        time_limit_seconds: 3600,
      })
      .select('id')
      .single()
      .then((r) => {
        if (r.error) throw r.error
        return r.data.id as string
      })

    const { error } = await client.rpc('submit_exam_attempt', {
      p_session_id: sessionId,
      p_answers: { 0: 'B' },
    })

    expect(error?.message).toContain('SUBSCRIPTION_INACTIVE')
  })

  it('rejects submission once an active subscription has expired', async () => {
    const { userId, client } = await createStudent({
      subscriptionActive: true,
      expiresAt: new Date(Date.now() - 1000).toISOString(), // expired 1s ago
    })
    const questionIds = await seedQuestions(1)
    const sessionId = await createSession({ userId, questionIds, timeLimitSeconds: 3600 })

    const { error } = await client.rpc('submit_exam_attempt', {
      p_session_id: sessionId,
      p_answers: { 0: 'B' },
    })

    expect(error?.message).toContain('SUBSCRIPTION_INACTIVE')
  })
})
