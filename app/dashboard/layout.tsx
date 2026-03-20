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
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('status, is_admin, name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'approved') redirect('/pending')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isAdmin={profile.is_admin} userName={profile.name || user.email} />
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
