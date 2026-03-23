import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const [{ data: profile }, { data: featureRows }] = await Promise.all([
    adminSupabase.from('profiles').select('status, is_admin, name').eq('id', user.id).single(),
    adminSupabase.from('feature_settings').select('key, enabled'),
  ])

  if (!profile || profile.status !== 'approved') redirect('/pending')

  const featureSettings: Record<string, boolean> = {}
  for (const row of featureRows || []) {
    featureSettings[row.key] = row.enabled
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isAdmin={profile.is_admin} userName={profile.name || user.email} userId={user.id} featureSettings={featureSettings} />
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
