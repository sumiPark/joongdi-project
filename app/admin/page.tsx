import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react'

export default async function AdminPage() {
  const supabase = createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('status, is_admin')

  const total = profiles?.length || 0
  const pending = profiles?.filter(p => p.status === 'pending').length || 0
  const approved = profiles?.filter(p => p.status === 'approved').length || 0
  const rejected = profiles?.filter(p => p.status === 'rejected').length || 0

  const { count: totalContent } = await supabase
    .from('generated_content')
    .select('*', { count: 'exact', head: true })

  const { count: todayContent } = await supabase
    .from('generated_content')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date().toISOString().split('T')[0])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-500 mt-1">joongdi Content OS 관리 현황</p>
      </div>

      {/* 회원 통계 */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">회원 현황</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">전체 회원</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">승인 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{pending}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">승인 완료</p>
              <p className="text-2xl font-bold text-green-600">{approved}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">거절</p>
              <p className="text-2xl font-bold text-red-600">{rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 통계 */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">콘텐츠 현황</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-1">전체 생성 글</p>
          <p className="text-3xl font-bold text-brand-600">{totalContent || 0}<span className="text-lg font-normal text-gray-400 ml-1">개</span></p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-1">오늘 생성 글</p>
          <p className="text-3xl font-bold text-green-600">{todayContent || 0}<span className="text-lg font-normal text-gray-400 ml-1">개</span></p>
        </div>
      </div>

      {/* 빠른 링크 */}
      {pending > 0 && (
        <div className="card p-5 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-900">{pending}명의 가입 승인 요청이 있습니다</p>
                <p className="text-sm text-yellow-700">빠른 처리가 필요합니다</p>
              </div>
            </div>
            <Link href="/admin/users" className="btn-primary text-sm py-2 px-4">
              승인 처리하기
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
