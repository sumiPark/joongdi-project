import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('status, is_admin, name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'approved') redirect('/pending')
  if (!profile.is_admin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isAdmin={true} userName={profile.name || user.email} />
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
