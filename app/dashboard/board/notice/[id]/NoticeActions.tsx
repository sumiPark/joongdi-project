'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function NoticeActions({ postId }: { postId: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await fetch(`/api/board/notice/${postId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('삭제되었습니다.')
      router.push('/dashboard/board/notice')
      router.refresh()
    } else {
      toast.error('삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="flex gap-2 mt-6 pt-5 border-t border-gray-100 justify-end">
      <a
        href={`/dashboard/board/notice/write?id=${postId}`}
        className="btn-secondary text-sm py-1.5 px-3"
      >
        수정
      </a>
      <button
        onClick={handleDelete}
        className="text-sm py-1.5 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
      >
        삭제
      </button>
    </div>
  )
}
