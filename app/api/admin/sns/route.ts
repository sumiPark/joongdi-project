import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? adminSupabase : null
}

export async function GET() {
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('sns_links')
    .select('*')
    .order('display_order')
  return NextResponse.json({ links: data || [] })
}

export async function POST(request: NextRequest) {
  const db = await requireAdmin()
  if (!db) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { platform, label, url, display_order } = await request.json()
  if (!platform || !label || !url) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
  }

  const { data, error } = await db
    .from('sns_links')
    .insert({ platform, label, url, display_order: display_order ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ link: data })
}

export async function PATCH(request: NextRequest) {
  const db = await requireAdmin()
  if (!db) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { id, ...fields } = await request.json()
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })

  const { error } = await db
    .from('sns_links')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const db = await requireAdmin()
  if (!db) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })

  const { error } = await db.from('sns_links').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
