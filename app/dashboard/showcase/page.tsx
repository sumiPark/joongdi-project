import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ExternalLink, PenLine, Globe, Users } from 'lucide-react'
import ShowcaseDeleteButton from './ShowcaseDeleteButton'

export default async function ShowcasePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin').eq('id', user!.id).single()

  const { data: blogProfiles } = await supabase
    .from('blog_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const myProfile = blogProfiles?.find(p => p.user_id === user!.id)
  const isAdmin = profile?.is_admin ?? false

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">블로그 쇼케이스</h1>
          <p className="text-gray-500 mt-1">멤버들의 블로그를 둘러보고 서로 응원해요</p>
        </div>
        {myProfile ? (
          <Link
            href="/dashboard/showcase/edit"
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
          >
            <PenLine size={15} />
            내 블로그 수정
          </Link>
        ) : (
          <Link
            href="/dashboard/showcase/edit"
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
          >
            <Globe size={15} />
            내 블로그 등록
          </Link>
        )}
      </div>

      {!blogProfiles || blogProfiles.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <p className="text-4xl mb-3">🌐</p>
          <p className="font-medium text-gray-500">첫 번째로 블로그를 등록해보세요!</p>
          <Link href="/dashboard/showcase/edit" className="btn-primary text-sm mt-4 inline-block px-5 py-2">
            블로그 등록하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blogProfiles.map((bp) => {
            const isOwner = bp.user_id === user!.id
            return (
              <div
                key={bp.id}
                className={`card p-5 flex flex-col gap-3 relative ${isOwner ? 'ring-2 ring-brand-400' : ''}`}
              >
                {isOwner && (
                  <span className="absolute top-3 right-3 text-xs bg-brand-100 text-brand-600 font-semibold px-2 py-0.5 rounded-full">
                    내 블로그
                  </span>
                )}

                {/* 작성자 */}
                <div className="flex items-center gap-2.5 pr-16">
                  <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-sm font-bold text-brand-600 flex-shrink-0">
                    {bp.author_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{bp.author_name}</p>
                    <p className="text-xs text-gray-400">{new Date(bp.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                </div>

                {/* 블로그 정보 */}
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{bp.blog_name}</p>
                  {bp.description && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{bp.description}</p>
                  )}
                </div>

                {/* 하단 액션 */}
                <div className="mt-auto pt-3 border-t border-gray-100 space-y-2">
                  {/* 블로그 방문 - 메인 버튼 */}
                  <a
                    href={bp.blog_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center justify-center gap-2 w-full py-2.5 text-sm"
                  >
                    <ExternalLink size={14} />
                    블로그 방문
                  </a>

                  {/* 액션 버튼 (이웃맺기, 구독 등) */}
                  {bp.action_buttons?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {bp.action_buttons.map((btn: { label: string; url: string }, i: number) => (
                        <a
                          key={i}
                          href={btn.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Users size={11} />
                          {btn.label}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* 수정/삭제 */}
                  {(isOwner || isAdmin) && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {isOwner && (
                        <Link
                          href="/dashboard/showcase/edit"
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          수정
                        </Link>
                      )}
                      <ShowcaseDeleteButton isOwner={isOwner} userId={bp.user_id} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
