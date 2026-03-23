import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PenLine, ChevronRight, MessageSquare } from 'lucide-react'

export default async function FreeBoardPage() {
  const supabase = createClient()

  const { data: posts } = await supabase
    .from('board_posts')
    .select('id, title, author_name, view_count, created_at')
    .eq('board_type', 'free')
    .order('created_at', { ascending: false })

  // 댓글 수 조회
  const postIds = posts?.map(p => p.id) || []
  const { data: commentCounts } = postIds.length > 0
    ? await supabase
        .from('board_comments')
        .select('post_id')
        .in('post_id', postIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  commentCounts?.forEach(c => {
    countMap[c.post_id] = (countMap[c.post_id] || 0) + 1
  })

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">자유 게시판</h1>
          <p className="text-gray-500 mt-1">자유롭게 글을 남기고 이야기 나눠보세요</p>
        </div>
        <Link href="/dashboard/board/free/write" className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <PenLine size={15} />
          글 작성
        </Link>
      </div>

      <div className="card overflow-hidden">
        {!posts || posts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-medium text-gray-500">첫 번째 글을 남겨보세요!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/dashboard/board/free/${post.id}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-brand-600">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{post.author_name}</p>
                </div>
                {(countMap[post.id] || 0) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-brand-500 flex-shrink-0">
                    <MessageSquare size={12} />
                    {countMap[post.id]}
                  </span>
                )}
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(post.created_at).toLocaleDateString('ko-KR')}
                </span>
                <span className="text-xs text-gray-300 flex-shrink-0">조회 {post.view_count}</span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
