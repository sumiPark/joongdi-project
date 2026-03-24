import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('status, is_admin, name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'approved') redirect('/pending')
  if (!profile.is_admin) redirect('/dashboard')

  const { data: featureRows } = await adminSupabase.from('feature_settings').select('key, enabled')
  const featureSettings: Record<string, boolean> = {}
  for (const row of featureRows || []) {
    featureSettings[row.key] = row.enabled
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isAdmin={true} userName={profile.name || user.email} userId={user.id} featureSettings={featureSettings} />
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
