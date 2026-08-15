'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { claimDeviceSession, releaseDeviceSession, releaseAllDeviceSessions } from '@/lib/deviceSession/actions'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const type = formData.get('type') as string
  // Raw device fingerprint (User-Agent + screen res + per-login random id),
  // generated client-side in login/page.tsx via generateDeviceFingerprint()
  // and attached to the FormData right before this action is invoked.
  const fingerprint = formData.get('fingerprint') as string | null

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  // Check if user profile exists and is active
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Authentication failed.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, subscription_status, subscription_expires_at, blocked_until')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Account not found. Contact admin.' }

  // Temporary admin-issued block (src/app/admin/user-actions.ts blockUser()).
  // Independent of subscription_status -- checked here so a blocked user is
  // rejected right at login with a clear message, and again in
  // middleware.ts on every request so an already-open session is cut off
  // too, not just new logins.
  if (profile.blocked_until && new Date(profile.blocked_until) > new Date()) {
    await supabase.auth.signOut()
    const until = new Date(profile.blocked_until).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })
    return { error: `Your account is temporarily blocked until ${until}. Contact the admin if you believe this is a mistake.` }
  }

  if (type === 'admin' && profile.role !== 'admin') {
    await supabase.auth.signOut()
    return { error: 'Unauthorized. Admin access required for Member Login.' }
  }

  // ── 1-device-per-account gatekeeper ────────────────────────────────────
  // Runs AFTER credentials + portal-type are confirmed valid, so we never
  // burn a device-limit rejection on a login that was going to fail anyway.
  // On rejection: the Supabase Auth session created by signInWithPassword()
  // above is real and would otherwise leave a valid cookie behind even
  // though we're refusing this login -- sign it back out immediately so
  // this browser is left in exactly the state it was in before the attempt.
  //
  // Admins are deliberately exempt. The rule exists to stop one paid
  // student account being shared across a study group -- that reasoning
  // does not apply to the operator, who legitimately administers the
  // platform from a desktop and a phone. More importantly there is no
  // recovery path: an admin whose slot is stuck (browser closed without
  // signing out, lost device) would be locked out of the very panel used
  // to clear session slots, and only a direct database edit could undo it.
  if (profile.role !== 'admin') {
    if (!fingerprint) {
      await supabase.auth.signOut()
      return { error: 'Missing device fingerprint. Please refresh and try again.' }
    }

    const claim = await claimDeviceSession(fingerprint)
    if (!claim.ok) {
      await supabase.auth.signOut()
      return { error: claim.error, code: claim.code }
    }
  }

  if (profile.role === 'admin') {
    revalidatePath('/', 'layout')
    redirect('/admin')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const email          = formData.get('email') as string
  const password       = formData.get('password') as string
  const fullName       = formData.get('fullName') as string
  const phone          = (formData.get('phone') as string | null)?.trim() || null
  const pmdcNumber     = (formData.get('pmdcNumber') as string | null)?.trim() || null
  const medicalCollege = (formData.get('medicalCollege') as string | null)?.trim() || null

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Picked up by the handle_new_user() trigger (see supabase/migrations/
      // 20260812260000_add_registration_fields_and_blocking.sql), which
      // inserts the profiles row -- the client never inserts into profiles
      // directly (no INSERT policy for authenticated, by design).
      data: {
        full_name: fullName,
        phone,
        pmdc_number: pmdcNumber,
        medical_college: medicalCollege,
      },
    },
  })

  if (error) return { error: error.message }

  // NOTE: profile creation is intentionally NOT done here. The
  // on_auth_user_created trigger (SECURITY DEFINER, see
  // 20260514000000_initial_schema.sql, updated by
  // 20260724000000_demo_account_signup.sql) already inserts the profiles
  // row the instant auth.users gets the new row, with role='student' and
  // subscription_status='demo' -- instant free-trial access, no admin
  // approval needed. Doing it again here from the client was redundant
  // AND broken: `profiles` has no INSERT policy for `authenticated` (by
  // design — only the trigger and admin/service_role should ever create
  // a profile), so this upsert failed RLS on every single signup and
  // showed the user an error message even though their account had
  // already been created successfully by the trigger.

  return { success: 'Account created! You can log in right away with 7 days of full access, free -- no card required.' }
}

export async function logout() {
  // Release this account's device slot BEFORE signing out of Supabase Auth
  // -- releaseDeviceSession() reads auth.uid() from the still-live session,
  // so it has to run first.
  await releaseDeviceSession()

  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * "Logout from all devices" -- releases every active device slot for this
 * account (in steady state, just the caller's own, since the 1-device rule
 * caps it at one) and signs this browser out. Exposed as an explicit,
 * separately-callable action for an account-security "this wasn't me" flow.
 */
export async function logoutAllDevices() {
  await releaseAllDeviceSessions()

  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login?loggedOutAll=1')
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) return { error: 'Please enter your email address.' }

  // Derive origin from the incoming request rather than a hardcoded URL,
  // so this keeps working if a custom domain replaces the vercel.app one.
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`

  // Supabase always returns success here regardless of whether the email
  // exists, by design, so this response never confirms/denies an account.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) return { error: 'Could not send reset email. Please try again in a moment.' }

  return { success: 'If an account exists for that email, a password reset link has been sent.' }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  // Requires an active recovery session, established by /auth/callback
  // after the user clicks the link from requestPasswordReset(). Without
  // that session this fails with an auth error, which the caller surfaces.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'This reset link has expired. Please request a new one.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  return { success: 'Password updated. You can now sign in.' }
}
