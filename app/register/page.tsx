'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    if (password !== passwordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('이미 등록된 이메일입니다.')
        } else {
          toast.error(error.message)
        }
        return
      }

      toast.success('회원가입이 완료되었습니다!')
      router.push('/pending')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <span className="text-3xl">✍️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">joongdi Content OS</h1>
          <p className="text-brand-300 mt-2 text-sm">가입 후 관리자 승인이 필요합니다</p>
        </div>

        {/* 회원가입 카드 */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">회원가입</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="이름을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="이메일을 입력하세요"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="8자 이상 입력하세요"
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호 확인</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="input-field"
                placeholder="비밀번호를 다시 입력하세요"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 mt-2">
              가입 후 관리자 승인이 완료되면 서비스를 이용할 수 있습니다.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="spinner w-4 h-4" />
                  <span>처리 중...</span>
                </>
              ) : (
                '회원가입'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
