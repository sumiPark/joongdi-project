import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import QnaReplySection from './QnaReplySection'
import QnaPostActions from './QnaPostActions'

export default async function QnaDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin, name').eq('id', user!.id).single()

  const { data: post } = await supabase
    .from('board_posts')
    .select('*')
    .eq('id', params.id)
    .eq('board_type', 'qna')
    .single()

  if (!post) notFound()

  await supabase.from('board_posts')
    .update({ view_count: post.view_count + 1 })
    .eq('id', params.id)

  const { data: reply } = await supabase
    .from('qna_replies').select('*').eq('post_id', params.id).single()

  const isAdmin = profile?.is_admin ?? false
  const isAuthor = post.author_id === user!.id

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <Link href="/dashboard/board/qna" className="text-sm text-gray-400 hover:text-gray-600">
          ← QnA 목록
        </Link>
      </div>

      {/* 문의 내용 */}
      <div className="card p-6 mb-4">
        <div className="border-b border-gray-100 pb-4 mb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 font-medium ${
              reply ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {reply ? '답변완료' : '답변대기'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{post.author_name}</span>
              <span>·</span>
              <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
            {(isAuthor || isAdmin) && (
              <QnaPostActions postId={post.id} hasReply={!!reply} />
            )}
          </div>
        </div>
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      </div>

      {/* 답변 영역 */}
      <QnaReplySection
        postId={params.id}
        initialReply={reply || null}
        isAdmin={isAdmin}
        adminName={profile?.name || '관리자'}
      />
    </div>
  )
}
