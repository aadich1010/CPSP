import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserManagementClient from './UserManagementClient'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const adminDb  = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await adminDb
    .from('profiles')
    .select('id, full_name, email, role, subscription_status, subscription_expires_at, created_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })

  return <UserManagementClient profiles={profiles ?? []} />
}
