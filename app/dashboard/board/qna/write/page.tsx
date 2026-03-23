'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function QnaWritePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!editId) return
    fetch(`/api/board/qna/${editId}`)
      .then(r => r.json())
      .then(data => {
        if (data.post) {
          setTitle(data.post.title)
          setContent(data.post.content)
        }
      })
  }, [editId])

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      const res = editId
        ? await fetch(`/api/board/qna/${editId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content }),
          })
        : await fetch('/api/board/qna', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content }),
          })

      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '오류가 발생했습니다.'); return }

      toast.success(editId ? '수정되었습니다.' : '문의가 등록되었습니다.')
      router.push(editId ? `/dashboard/board/qna/${editId}` : '/dashboard/board/qna')
      router.refresh()
    } catch {
      toast.error('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{editId ? '문의 수정' : '문의 작성'}</h1>
        <p className="text-gray-500 mt-1">QnA 게시판</p>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="input-field"
            placeholder="문의 제목을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">내용 *</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="input-field resize-none"
            rows={10}
            placeholder="문의 내용을 자세히 입력해주세요"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            취소
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="spinner w-4 h-4" /> : null}
            {editId ? '수정 완료' : '문의 등록'}
          </button>
        </div>
      </div>
    </div>
  )
}
