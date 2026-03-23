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

  const { data: existing } = await adminSupabase
    .from('qna_replies').select('id').eq('post_id', params.id).single()

  const adminName = profile.name || '관리자'
  const { data: post } = await adminSupabase
    .from('board_posts').select('author_id, title').eq('id', params.id).single()

  let reply
  if (existing) {
    const { data, error } = await adminSupabase.from('qna_replies')
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq('post_id', params.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: '답변 수정 중 오류가 발생했습니다.' }, { status: 500 })
    reply = data
  } else {
    const { data, error } = await adminSupabase.from('qna_replies').insert({
      post_id: params.id,
      admin_id: user.id,
      admin_name: adminName,
      content: content.trim(),
    }).select().single()
    if (error) return NextResponse.json({ error: '답변 등록 중 오류가 발생했습니다.' }, { status: 500 })
    reply = data

    // 신규 답변일 때만 알림 발송
    if (post && post.author_id !== user.id) {
      await adminSupabase.from('notifications').insert({
        user_id: post.author_id,
        type: 'reply',
        post_id: params.id,
        post_title: post.title,
        actor_name: adminName,
      })
    }
  }

  return NextResponse.json({ reply })
}
