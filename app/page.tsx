import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('status, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'approved') {
    redirect('/pending')
  }

  if (profile.is_admin) {
    redirect('/admin')
  }

  redirect('/dashboard')
}
