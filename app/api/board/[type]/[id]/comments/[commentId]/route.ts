import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string; id: string; commentId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin').eq('id', user.id).single()

  const { data: comment } = await supabase
    .from('board_comments').select('author_id').eq('id', params.commentId).single()
  if (!comment) return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })

  if (comment.author_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
  }

  await supabase.from('board_comments').delete().eq('id', params.commentId)
  return NextResponse.json({ success: true })
}
