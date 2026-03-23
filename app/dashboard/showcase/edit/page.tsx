'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ShowcaseEditPage() {
  const router = useRouter()
  const [blogName, setBlogName] = useState('')
  const [blogUrl, setBlogUrl] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  useEffect(() => {
    fetch('/api/showcase/me')
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          setBlogName(data.profile.blog_name)
          setBlogUrl(data.profile.blog_url)
          setDescription(data.profile.description || '')
          setIsEdit(true)
        }
      })
  }, [])

  async function handleSubmit() {
    if (!blogName.trim() || !blogUrl.trim()) {
      toast.error('블로그 이름과 URL을 입력해주세요.')
      return
    }
    if (!/^https?:\/\/.+/.test(blogUrl.trim())) {
      toast.error('URL은 http:// 또는 https://로 시작해야 합니다.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blog_name: blogName, blog_url: blogUrl, description }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '오류가 발생했습니다.'); return }
      toast.success(isEdit ? '수정되었습니다.' : '블로그가 등록되었습니다!')
      router.push('/dashboard/showcase')
      router.refresh()
    } catch {
      toast.error('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? '내 블로그 수정' : '블로그 등록'}</h1>
        <p className="text-gray-500 mt-1">멤버들에게 내 블로그를 소개해보세요</p>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">블로그 이름 *</label>
          <input
            type="text"
            value={blogName}
            onChange={e => setBlogName(e.target.value)}
            className="input-field"
            placeholder="예: 리유언니의 뷰티로그"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">블로그 URL *</label>
          <input
            type="url"
            value={blogUrl}
            onChange={e => setBlogUrl(e.target.value)}
            className="input-field"
            placeholder="https://myblog.tistory.com"
          />
          <p className="text-xs text-gray-400 mt-1">https:// 포함한 전체 주소를 입력해주세요</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">한줄 소개</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={80}
            className="input-field"
            placeholder="예: 건강식품·뷰티 디바이스 솔직 리뷰"
          />
          <p className="text-xs text-gray-400 mt-1">{description.length}/80자</p>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            취소
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="spinner w-4 h-4" /> : null}
            {isEdit ? '수정 완료' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
