import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: post } = await supabase
    .from('board_posts')
    .select('*')
    .eq('id', params.id)
    .eq('board_type', params.type)
    .single()

  if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

  await supabase
    .from('board_posts')
    .update({ view_count: post.view_count + 1 })
    .eq('id', params.id)

  return NextResponse.json({ post })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin').eq('id', user.id).single()

  const { data: post } = await supabase
    .from('board_posts').select('author_id').eq('id', params.id).single()
  if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

  if (post.author_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
  }

  const { title, content, is_pinned } = await request.json()
  await supabase.from('board_posts').update({
    ...(title ? { title: title.trim() } : {}),
    ...(content ? { content: content.trim() } : {}),
    ...(profile?.is_admin && is_pinned !== undefined ? { is_pinned } : {}),
    updated_at: new Date().toISOString(),
  }).eq('id', params.id)

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin').eq('id', user.id).single()

  const { data: post } = await supabase
    .from('board_posts').select('author_id').eq('id', params.id).single()
  if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

  if (post.author_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
  }

  await supabase.from('board_posts').delete().eq('id', params.id)
  return NextResponse.json({ success: true })
}
