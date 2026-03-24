'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface ActionButton {
  label: string
  url: string
}

const PRESET_LABELS = ['이웃맺기', '서로이웃', '구독', '팔로우', '직접 입력']

export default function ShowcaseEditPage() {
  const router = useRouter()
  const [blogName, setBlogName] = useState('')
  const [blogUrl, setBlogUrl] = useState('')
  const [description, setDescription] = useState('')
  const [actionButtons, setActionButtons] = useState<ActionButton[]>([])
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
          setActionButtons(data.profile.action_buttons || [])
          setIsEdit(true)
        }
      })
  }, [])

  function addActionButton() {
    if (actionButtons.length >= 4) {
      toast.error('액션 버튼은 최대 4개까지 추가할 수 있습니다.')
      return
    }
    setActionButtons(prev => [...prev, { label: '이웃맺기', url: '' }])
  }

  function updateActionButton(idx: number, field: keyof ActionButton, value: string) {
    setActionButtons(prev => prev.map((btn, i) => i === idx ? { ...btn, [field]: value } : btn))
  }

  function removeActionButton(idx: number) {
    setActionButtons(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    if (!blogName.trim() || !blogUrl.trim()) {
      toast.error('블로그 이름과 URL을 입력해주세요.')
      return
    }
    if (!/^https?:\/\/.+/.test(blogUrl.trim())) {
      toast.error('URL은 http:// 또는 https://로 시작해야 합니다.')
      return
    }
    for (const btn of actionButtons) {
      if (!btn.label.trim() || !btn.url.trim()) {
        toast.error('액션 버튼의 이름과 URL을 모두 입력해주세요.')
        return
      }
      if (!/^https?:\/\/.+/.test(btn.url.trim())) {
        toast.error(`'${btn.label}' 버튼의 URL이 올바르지 않습니다.`)
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blog_name: blogName,
          blog_url: blogUrl,
          description,
          action_buttons: actionButtons.map(b => ({ label: b.label.trim(), url: b.url.trim() })),
        }),
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

        {/* 액션 버튼 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700">액션 버튼</label>
              <p className="text-xs text-gray-400 mt-0.5">이웃맺기, 구독 등 방문자가 바로 클릭할 수 있는 버튼을 추가하세요</p>
            </div>
            <button
              type="button"
              onClick={addActionButton}
              disabled={actionButtons.length >= 4}
              className="flex items-center gap-1.5 text-xs text-brand-600 font-semibold hover:text-brand-800 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Plus size={14} />
              버튼 추가
            </button>
          </div>

          {actionButtons.length === 0 ? (
            <div
              onClick={addActionButton}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors"
            >
              <p className="text-sm text-gray-400">+ 이웃맺기, 구독 버튼을 추가해보세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {actionButtons.map((btn, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                  <div className="flex-1 space-y-2">
                    <select
                      value={PRESET_LABELS.includes(btn.label) ? btn.label : '직접 입력'}
                      onChange={e => {
                        const val = e.target.value
                        if (val !== '직접 입력') updateActionButton(idx, 'label', val)
                        else updateActionButton(idx, 'label', '')
                      }}
                      className="input-field text-sm py-2"
                    >
                      {PRESET_LABELS.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    {(!PRESET_LABELS.slice(0, -1).includes(btn.label)) && (
                      <input
                        type="text"
                        value={btn.label}
                        onChange={e => updateActionButton(idx, 'label', e.target.value)}
                        className="input-field text-sm py-2"
                        placeholder="버튼 이름"
                        maxLength={10}
                      />
                    )}
                    <input
                      type="url"
                      value={btn.url}
                      onChange={e => updateActionButton(idx, 'url', e.target.value)}
                      className="input-field text-sm py-2"
                      placeholder="https://..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeActionButton(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
