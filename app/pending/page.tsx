'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PendingPage() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-2xl p-10">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⏳</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">승인 대기 중</h1>
          <p className="text-gray-600 mb-2">
            회원가입이 완료되었습니다.
          </p>
          <p className="text-gray-600 mb-6">
            관리자 승인 후 서비스를 이용하실 수 있습니다.
            승인 완료 시 알림을 드립니다.
          </p>

          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 mb-8">
            <p className="font-semibold mb-1">안내사항</p>
            <ul className="text-left space-y-1 text-blue-600">
              <li>• 승인은 영업일 기준 1-2일 소요됩니다</li>
              <li>• 문의: 관리자에게 직접 연락해주세요</li>
            </ul>
          </div>

          <button
            onClick={handleLogout}
            className="btn-secondary w-full"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
