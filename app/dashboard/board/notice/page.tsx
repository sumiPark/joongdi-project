import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Pin, PenLine, ChevronRight } from 'lucide-react'

export default async function NoticePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin').eq('id', user!.id).single()

  const { data: posts } = await supabase
    .from('board_posts')
    .select('id, title, is_pinned, view_count, created_at')
    .eq('board_type', 'notice')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
          <p className="text-gray-500 mt-1">중요 공지 및 업데이트 소식을 확인하세요</p>
        </div>
        {profile?.is_admin && (
          <Link href="/dashboard/board/notice/write" className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
            <PenLine size={15} />
            공지 작성
          </Link>
        )}
      </div>

      <div className="card overflow-hidden">
        {!posts || posts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium text-gray-500">등록된 공지사항이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/dashboard/board/notice/${post.id}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                {post.is_pinned && (
                  <Pin size={14} className="text-brand-500 flex-shrink-0" />
                )}
                <p className={`flex-1 text-sm font-medium truncate ${post.is_pinned ? 'text-brand-700' : 'text-gray-800'} group-hover:text-brand-600`}>
                  {post.title}
                </p>
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
