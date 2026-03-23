import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const VALID_TYPES = ['notice', 'free', 'qna']

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  const { type } = params
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: '잘못된 게시판 유형입니다.' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 15
  const from = (page - 1) * limit

  const { data, count } = await supabase
    .from('board_posts')
    .select('id, title, author_name, view_count, is_pinned, created_at', { count: 'exact' })
    .eq('board_type', type)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  return NextResponse.json({ posts: data || [], total: count || 0, page, limit })
}

export async function POST(request: NextRequest, { params }: { params: { type: string } }) {
  const { type } = params
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: '잘못된 게시판 유형입니다.' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('name, is_admin, status').eq('id', user.id).single()

  if (!profile || profile.status !== 'approved') {
    return NextResponse.json({ error: '승인된 사용자만 이용할 수 있습니다.' }, { status: 403 })
  }

  if (type === 'notice' && !profile.is_admin) {
    return NextResponse.json({ error: '공지사항은 관리자만 작성할 수 있습니다.' }, { status: 403 })
  }

  const { title, content, is_pinned } = await request.json()
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
  }

  const { data, error } = await supabase.from('board_posts').insert({
    board_type: type,
    title: title.trim(),
    content: content.trim(),
    author_id: user.id,
    author_name: profile.name || user.email?.split('@')[0] || '익명',
    is_pinned: type === 'notice' ? (is_pinned ?? false) : false,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
