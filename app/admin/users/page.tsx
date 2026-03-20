'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, Shield, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  email: string
  name: string | null
  status: 'pending' | 'approved' | 'rejected'
  is_admin: boolean
  created_at: string
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected'

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, email, name, status, is_admin, created_at')
      .order('created_at', { ascending: false })

    setProfiles((data as Profile[]) || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setProcessingId(id)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, status }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '처리 중 오류가 발생했습니다.')
        return
      }

      setProfiles(profiles.map(p => p.id === id ? { ...p, status } : p))
      toast.success(status === 'approved' ? '승인 완료!' : '거절 처리 완료!')
    } finally {
      setProcessingId(null)
    }
  }

  async function toggleAdmin(id: string, currentIsAdmin: boolean) {
    if (!confirm(currentIsAdmin ? '관리자 권한을 해제하시겠습니까?' : '관리자 권한을 부여하시겠습니까?')) return

    setProcessingId(id)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, isAdmin: !currentIsAdmin }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '처리 중 오류가 발생했습니다.')
        return
      }

      setProfiles(profiles.map(p => p.id === id ? { ...p, is_admin: !currentIsAdmin } : p))
      toast.success(currentIsAdmin ? '관리자 권한 해제 완료!' : '관리자 권한 부여 완료!')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredProfiles = profiles.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter
    const matchesSearch = !searchQuery ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const counts = {
    all: profiles.length,
    pending: profiles.filter(p => p.status === 'pending').length,
    approved: profiles.filter(p => p.status === 'approved').length,
    rejected: profiles.filter(p => p.status === 'rejected').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        <p className="text-gray-500 mt-1">회원 승인/거절 및 권한 관리</p>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as FilterType[]).map((f) => {
          const labels = { all: '전체', pending: '대기', approved: '승인', rejected: '거절' }
          const colors = {
            all: 'bg-gray-600',
            pending: 'bg-yellow-500',
            approved: 'bg-green-600',
            rejected: 'bg-red-600',
          }
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === f ? `${colors[f]} text-white` : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
            >
              {labels[f]}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/20' : 'bg-gray-100'}`}>
                {counts[f]}
              </span>
            </button>
          )
        })}

        {/* 검색 */}
        <div className="relative ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            placeholder="이름 또는 이메일 검색..."
          />
        </div>
      </div>

      {/* 회원 목록 */}
      <div className="card overflow-hidden">
        {filteredProfiles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">조건에 맞는 회원이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">회원 정보</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">가입일</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                          {(profile.name || profile.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-gray-900">{profile.name || '(이름 없음)'}</p>
                            {profile.is_admin && (
                              <span className="badge bg-brand-100 text-brand-700">
                                <Shield size={10} className="mr-1" />
                                관리자
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {profile.status === 'pending' && (
                        <span className="badge-pending flex items-center gap-1 w-fit">
                          <Clock size={11} />
                          대기 중
                        </span>
                      )}
                      {profile.status === 'approved' && (
                        <span className="badge-approved flex items-center gap-1 w-fit">
                          <CheckCircle size={11} />
                          승인됨
                        </span>
                      )}
                      {profile.status === 'rejected' && (
                        <span className="badge-rejected flex items-center gap-1 w-fit">
                          <XCircle size={11} />
                          거절됨
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {formatDate(profile.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {profile.status !== 'approved' && (
                          <button
                            onClick={() => updateStatus(profile.id, 'approved')}
                            disabled={processingId === profile.id}
                            className="flex items-center gap-1.5 text-xs font-semibold bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={13} />
                            승인
                          </button>
                        )}
                        {profile.status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(profile.id, 'rejected')}
                            disabled={processingId === profile.id}
                            className="flex items-center gap-1.5 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <XCircle size={13} />
                            거절
                          </button>
                        )}
                        <button
                          onClick={() => toggleAdmin(profile.id, profile.is_admin)}
                          disabled={processingId === profile.id}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-brand-100 hover:bg-brand-200 text-brand-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Shield size={13} />
                          {profile.is_admin ? '권한 해제' : '관리자'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
