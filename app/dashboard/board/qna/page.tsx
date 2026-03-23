import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PenLine, ChevronRight, CheckCircle, Clock } from 'lucide-react'

export default async function QnaPage() {
  const supabase = createClient()

  const { data: posts } = await supabase
    .from('board_posts')
    .select('id, title, author_name, view_count, created_at')
    .eq('board_type', 'qna')
    .order('created_at', { ascending: false })

  const postIds = posts?.map(p => p.id) || []
  const { data: replies } = postIds.length > 0
    ? await supabase.from('qna_replies').select('post_id').in('post_id', postIds)
    : { data: [] }

  const repliedSet = new Set(replies?.map(r => r.post_id) || [])

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QnA</h1>
          <p className="text-gray-500 mt-1">궁금한 점을 남기면 관리자가 답변드립니다</p>
        </div>
        <Link href="/dashboard/board/qna/write" className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <PenLine size={15} />
          문의 작성
        </Link>
      </div>

      <div className="card overflow-hidden">
        {!posts || posts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">❓</p>
            <p className="font-medium text-gray-500">첫 문의를 남겨보세요!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => {
              const answered = repliedSet.has(post.id)
              return (
                <Link
                  key={post.id}
                  href={`/dashboard/board/qna/${post.id}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group"
                >
                  {answered ? (
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <Clock size={14} className="text-yellow-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-brand-600">
                      {post.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{post.author_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    answered ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {answered ? '답변완료' : '답변대기'}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
