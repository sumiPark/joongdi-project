'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { MessageSquare, Send } from 'lucide-react'

interface Reply {
  id: string
  admin_id: string
  admin_name: string
  content: string
  created_at: string
}

interface Props {
  postId: string
  initialReply: Reply | null
  isAdmin: boolean
  adminName: string
}

export default function QnaReplySection({ postId, initialReply, isAdmin, adminName }: Props) {
  const [reply, setReply] = useState<Reply | null>(initialReply)
  const [replyContent, setReplyContent] = useState(initialReply?.content || '')
  const [editing, setEditing] = useState(!initialReply && isAdmin)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!replyContent.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/board/qna/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '오류가 발생했습니다.'); return }
      setReply(data.reply)
      setEditing(false)
      toast.success('답변이 등록되었습니다.')
    } catch {
      toast.error('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare size={16} />
        관리자 답변
      </h3>

      {reply && !editing ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {reply.admin_name[0]?.toUpperCase()}
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-700">{reply.admin_name}</span>
              <span className="text-xs text-gray-400 ml-2">
                {new Date(reply.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            {isAdmin && (
              <button
                onClick={() => setEditing(true)}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600"
              >
                수정
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-9">
            {reply.content}
          </p>
        </div>
      ) : isAdmin ? (
        <div>
          <div className="flex gap-3">
            <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-1">
              {adminName[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                className="input-field resize-none text-sm"
                rows={4}
                placeholder="답변을 입력하세요"
              />
              <div className="flex justify-between items-center mt-2">
                {reply && (
                  <button
                    onClick={() => { setEditing(false); setReplyContent(reply.content) }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !replyContent.trim()}
                  className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5 ml-auto disabled:opacity-50"
                >
                  {loading ? <div className="spinner w-4 h-4" /> : <Send size={13} />}
                  {reply ? '수정 완료' : '답변 등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">아직 답변이 등록되지 않았습니다.</p>
      )}
    </div>
  )
}
