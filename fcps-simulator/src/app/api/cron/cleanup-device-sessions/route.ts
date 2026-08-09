import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Always run fresh -- this is a cron endpoint, never cache it.
export const dynamic = 'force-dynamic'

/**
 * Deactivates any active_sessions row idle for more than 24h, freeing that
 * account's one device slot. Without this, a user who closes their laptop
 * lid mid-session (never hitting "logout") would hold their slot forever.
 *
 * Wired up in vercel.json under `crons` -- Vercel calls this with
 * `Authorization: Bearer $CRON_SECRET` automatically when CRON_SECRET is
 * set as a project environment variable. See:
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 *
 * Uses the service_role admin client because cleanup_stale_device_sessions()
 * operates across ALL users, not just auth.uid() -- it is deliberately not
 * granted to the authenticated/anon roles (see the migration), so only a
 * service_role-authenticated caller can invoke it at all.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.rpc('cleanup_stale_device_sessions', { p_hours: 24 })

    if (error) {
      console.error('[cron/cleanup-device-sessions] RPC error:', error)
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
    }

    return NextResponse.json({ deactivated: data ?? 0 })
  } catch (err) {
    console.error('[cron/cleanup-device-sessions] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
