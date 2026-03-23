import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data } = await supabase
    .from('qna_replies').select('*').eq('post_id', params.id).single()
  return NextResponse.json({ reply: data || null })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin, name').eq('id', user.id).single()
  if (!profile?.is_admin) {
    return NextResponse.json({ error: '관리자만 답변할 수 있습니다.' }, { status: 403 })
  }

  const { content } = await request.json()
  if (!content?.trim()) {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('qna_replies').select('id').eq('post_id', params.id).single()

  if (existing) {
    await supabase.from('qna_replies')
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq('post_id', params.id)
  } else {
    await supabase.from('qna_replies').insert({
      post_id: params.id,
      admin_name: profile.name || '관리자',
      content: content.trim(),
    })
  }

  return NextResponse.json({ success: true })
}
