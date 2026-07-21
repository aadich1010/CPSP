'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const type = formData.get('type') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  // Check if user profile exists and is active
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Authentication failed.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, subscription_status, subscription_expires_at')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Account not found. Contact admin.' }

  if (type === 'admin' && profile.role !== 'admin') {
    await supabase.auth.signOut()
    return { error: 'Unauthorized. Admin access required for Member Login.' }
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

  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (error) return { error: error.message }

  if (data.user) {
    // Create profile row (subscription defaults to pending)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role: 'student',
      subscription_status: 'pending',
    })

    if (profileError) return { error: profileError.message }
  }

  return { success: 'Account created! Please wait for admin activation before logging in.' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
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
