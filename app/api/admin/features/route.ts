import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase.from('feature_settings').select('*').order('key')
  return NextResponse.json({ features: data || [] })
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { key, enabled } = await request.json()
  await adminSupabase
    .from('feature_settings')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('key', key)

  return NextResponse.json({ success: true })
}
