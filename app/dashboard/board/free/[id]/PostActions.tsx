'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  postId: string
}

export default function PostActions({ postId }: Props) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await fetch(`/api/board/free/${postId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('삭제되었습니다.')
      router.push('/dashboard/board/free')
      router.refresh()
    } else {
      toast.error('삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="flex gap-2">
      <a
        href={`/dashboard/board/free/write?id=${postId}`}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        수정
      </a>
      <span className="text-xs text-gray-300">|</span>
      <button
        onClick={handleDelete}
        className="text-xs text-red-400 hover:text-red-600"
      >
        삭제
      </button>
    </div>
  )
}
