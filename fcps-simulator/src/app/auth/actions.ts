'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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
