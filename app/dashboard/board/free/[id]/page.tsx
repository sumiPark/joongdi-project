import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CommentSection from './CommentSection'
import PostActions from './PostActions'

export default async function FreePostDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin, name').eq('id', user!.id).single()

  const { data: post } = await supabase
    .from('board_posts')
    .select('*')
    .eq('id', params.id)
    .eq('board_type', 'free')
    .single()

  if (!post) notFound()

  await supabase.from('board_posts')
    .update({ view_count: post.view_count + 1 })
    .eq('id', params.id)

  const { data: comments } = await supabase
    .from('board_comments')
    .select('*')
    .eq('post_id', params.id)
    .order('created_at', { ascending: true })

  const isAuthor = post.author_id === user!.id
  const isAdmin = profile?.is_admin ?? false

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <Link href="/dashboard/board/free" className="text-sm text-gray-400 hover:text-gray-600">
          ← 자유 게시판
        </Link>
      </div>

      <div className="card p-6 mb-4">
        <div className="border-b border-gray-100 pb-4 mb-5">
          <h1 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{post.author_name}</span>
              <span>·</span>
              <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
              <span>·</span>
              <span>조회 {post.view_count + 1}</span>
            </div>
            {(isAuthor || isAdmin) && (
              <PostActions postId={post.id} />
            )}
          </div>
        </div>
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      </div>

      <CommentSection
        postId={params.id}
        initialComments={comments || []}
        currentUserId={user!.id}
        currentUserName={profile?.name || '익명'}
        isAdmin={isAdmin}
      />
    </div>
  )
}
