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
    .from('board_comments')
    .select('*')
    .eq('post_id', params.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ comments: data || [] })
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
    .from('profiles').select('name, status').eq('id', user.id).single()

  if (!profile || profile.status !== 'approved') {
    return NextResponse.json({ error: '승인된 사용자만 이용할 수 있습니다.' }, { status: 403 })
  }

  const { content } = await request.json()
  if (!content?.trim()) {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
  }

  const { data, error } = await supabase.from('board_comments').insert({
    post_id: params.id,
    author_id: user.id,
    author_name: profile.name || user.email?.split('@')[0] || '익명',
    content: content.trim(),
  }).select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
}
