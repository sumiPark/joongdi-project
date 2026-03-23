import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import NoticeActions from './NoticeActions'

export default async function NoticeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin').eq('id', user!.id).single()

  const { data: post } = await supabase
    .from('board_posts')
    .select('*')
    .eq('id', params.id)
    .eq('board_type', 'notice')
    .single()

  if (!post) notFound()

  // 조회수 증가
  await supabase.from('board_posts')
    .update({ view_count: post.view_count + 1 })
    .eq('id', params.id)

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <Link href="/dashboard/board/notice" className="text-sm text-gray-400 hover:text-gray-600">
          ← 공지사항 목록
        </Link>
      </div>

      <div className="card p-6">
        <div className="border-b border-gray-100 pb-4 mb-5">
          <h1 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h1>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{post.author_name}</span>
            <span>·</span>
            <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
            <span>·</span>
            <span>조회 {post.view_count + 1}</span>
          </div>
        </div>

        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        {profile?.is_admin && (
          <NoticeActions postId={post.id} />
        )}
      </div>
    </div>
  )
}
