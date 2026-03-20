import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PenLine, Layers, History, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user!.id)
    .single()

  const { count: totalCount } = await supabase
    .from('generated_content')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const { count: todayCount } = await supabase
    .from('generated_content')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .gte('created_at', new Date().toISOString().split('T')[0])

  const { data: recentContent } = await supabase
    .from('generated_content')
    .select('id, keyword, style, purpose, created_at, title')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const STYLE_LABELS: Record<string, string> = {
    friendly: '친근형', expert: '전문가형', influencer: '인플루언서형',
    trustworthy: '신뢰형', storytelling: '썰형',
  }
  const PURPOSE_LABELS: Record<string, string> = {
    informative: '정보형', review: '후기형', comparison: '비교형',
    recommendation: '추천형', experience: '체험형', conversion: '승인형',
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          안녕하세요, {profile?.name || '사용자'}님 👋
        </h1>
        <p className="text-gray-500 mt-1">오늘도 좋은 콘텐츠를 만들어 보세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">전체 생성 글</p>
          <p className="text-3xl font-bold text-brand-600">{totalCount || 0}<span className="text-lg font-normal text-gray-400 ml-1">개</span></p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">오늘 생성 글</p>
          <p className="text-3xl font-bold text-green-600">{todayCount || 0}<span className="text-lg font-normal text-gray-400 ml-1">개</span></p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">사용 가능 기능</p>
          <p className="text-3xl font-bold text-purple-600">3<span className="text-lg font-normal text-gray-400 ml-1">가지</span></p>
        </div>
      </div>

      {/* 빠른 접근 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/dashboard/generate" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4">
            <PenLine className="text-brand-600" size={24} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">글 생성</h3>
          <p className="text-sm text-gray-500 mb-4">키워드로 완성형 블로그 글을 즉시 생성합니다</p>
          <div className="flex items-center text-brand-600 text-sm font-medium group-hover:gap-2 gap-1 transition-all">
            시작하기 <ArrowRight size={16} />
          </div>
        </Link>

        <Link href="/dashboard/bulk" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <Layers className="text-purple-600" size={24} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">대량 생성</h3>
          <p className="text-sm text-gray-500 mb-4">30/50/100개의 서로 다른 글을 한 번에 생성합니다</p>
          <div className="flex items-center text-purple-600 text-sm font-medium group-hover:gap-2 gap-1 transition-all">
            시작하기 <ArrowRight size={16} />
          </div>
        </Link>

        <Link href="/dashboard/history" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <History className="text-green-600" size={24} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">생성 기록</h3>
          <p className="text-sm text-gray-500 mb-4">이전에 생성한 모든 글을 다시 확인합니다</p>
          <div className="flex items-center text-green-600 text-sm font-medium group-hover:gap-2 gap-1 transition-all">
            보러가기 <ArrowRight size={16} />
          </div>
        </Link>
      </div>

      {/* 최근 생성 글 */}
      {recentContent && recentContent.length > 0 && (
        <div className="card">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">최근 생성 글</h2>
              <Link href="/dashboard/history" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                전체보기
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {recentContent.map((item) => (
              <div key={item.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {(item.content as any)?.title || item.keyword}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    키워드: {item.keyword} &middot; {STYLE_LABELS[item.style]} &middot; {PURPOSE_LABELS[item.purpose]}
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
