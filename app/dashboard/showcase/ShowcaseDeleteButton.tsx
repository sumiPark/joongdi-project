'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  isOwner: boolean
  userId: string
}

export default function ShowcaseDeleteButton({ isOwner, userId }: Props) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('블로그 등록을 취소하시겠습니까?')) return

    const url = isOwner ? '/api/showcase' : `/api/showcase/admin/${userId}`
    const res = await fetch(url, { method: 'DELETE' })
    if (res.ok) {
      toast.success('삭제되었습니다.')
      router.refresh()
    } else {
      toast.error('삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-red-400 hover:text-red-600"
    >
      삭제
    </button>
  )
}
