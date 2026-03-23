'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function NoticeWritePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!editId) return
    fetch(`/api/board/notice/${editId}`)
      .then(r => r.json())
      .then(data => {
        if (data.post) {
          setTitle(data.post.title)
          setContent(data.post.content)
          setIsPinned(data.post.is_pinned)
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
        ? await fetch(`/api/board/notice/${editId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, is_pinned: isPinned }),
          })
        : await fetch('/api/board/notice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, is_pinned: isPinned }),
          })

      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '오류가 발생했습니다.'); return }

      toast.success(editId ? '수정되었습니다.' : '공지가 등록되었습니다.')
      router.push(editId ? `/dashboard/board/notice/${editId}` : '/dashboard/board/notice')
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
        <h1 className="text-2xl font-bold text-gray-900">{editId ? '공지 수정' : '공지 작성'}</h1>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="input-field"
            placeholder="공지 제목을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">내용 *</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="input-field resize-none"
            rows={12}
            placeholder="공지 내용을 입력하세요"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={e => setIsPinned(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">상단 고정</span>
        </label>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? <div className="spinner w-4 h-4" /> : null}
            {editId ? '수정 완료' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
