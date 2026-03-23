'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Trash2, MessageSquare } from 'lucide-react'

interface Comment {
  id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
}

interface Props {
  postId: string
  initialComments: Comment[]
  currentUserId: string
  currentUserName: string
  isAdmin: boolean
}

export default function CommentSection({ postId, initialComments, currentUserId, currentUserName, isAdmin }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!newComment.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/board/free/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '오류가 발생했습니다.'); return }
      setComments(prev => [...prev, data.comment])
      setNewComment('')
    } catch {
      toast.error('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    const res = await fetch(`/api/board/free/${postId}/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('삭제되었습니다.')
    } else {
      toast.error('삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare size={16} />
        댓글 {comments.length}개
      </h3>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">첫 댓글을 남겨보세요</p>
      ) : (
        <div className="space-y-3 mb-5">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-xs font-bold text-brand-600 flex-shrink-0 mt-0.5">
                {comment.author_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-700">{comment.author_name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  {(comment.author_id === currentUserId || isAdmin) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-300 hover:text-red-400 ml-auto"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <div className="flex gap-3">
          <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-xs font-bold text-brand-600 flex-shrink-0 mt-1">
            {currentUserName[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="input-field resize-none text-sm"
              rows={2}
              placeholder="댓글을 입력하세요"
              onKeyDown={e => {
                if (e.key === 'Enter' && e.ctrlKey) handleSubmit()
              }}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">Ctrl+Enter로 등록</span>
              <button
                onClick={handleSubmit}
                disabled={loading || !newComment.trim()}
                className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50"
              >
                {loading ? <div className="spinner w-4 h-4" /> : '등록'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
