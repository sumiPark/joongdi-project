'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Trash2, Plus, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react'
import { SNS_PLATFORMS } from '@/components/SnsLinks'

interface SnsLink {
  id: string
  platform: string
  label: string
  url: string
  display_order: number
  enabled: boolean
}

const PLATFORM_OPTIONS = Object.entries(SNS_PLATFORMS).map(([key, val]) => ({
  value: key,
  label: val.name,
}))

export default function AdminSnsPage() {
  const [links, setLinks] = useState<SnsLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ platform: 'instagram', label: '', url: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function loadLinks() {
    const res = await fetch('/api/admin/sns')
    const data = await res.json()
    setLinks(data.links || [])
    setLoading(false)
  }

  useEffect(() => { loadLinks() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.label.trim() || !form.url.trim()) {
      toast.error('플랫폼, 이름, URL을 모두 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/sns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: form.platform,
          label: form.label.trim(),
          url: form.url.trim(),
          display_order: links.length,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('SNS가 추가되었습니다.')
      setForm({ platform: 'instagram', label: '', url: '' })
      setShowForm(false)
      loadLinks()
    } catch {
      toast.error('추가 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(link: SnsLink) {
    setTogglingId(link.id)
    try {
      const res = await fetch('/api/admin/sns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: link.id, enabled: !link.enabled }),
      })
      if (!res.ok) throw new Error()
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, enabled: !l.enabled } : l))
    } catch {
      toast.error('변경 중 오류가 발생했습니다.')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    setDeletingId(id)
    try {
      const res = await fetch('/api/admin/sns', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      toast.success('삭제되었습니다.')
      setLinks(prev => prev.filter(l => l.id !== id))
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleMoveOrder(link: SnsLink, direction: 'up' | 'down') {
    const sorted = [...links].sort((a, b) => a.display_order - b.display_order)
    const idx = sorted.findIndex(l => l.id === link.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const a = sorted[idx]
    const b = sorted[swapIdx]
    const newOrderA = b.display_order
    const newOrderB = a.display_order

    await Promise.all([
      fetch('/api/admin/sns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: a.id, display_order: newOrderA }),
      }),
      fetch('/api/admin/sns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id, display_order: newOrderB }),
      }),
    ])
    setLinks(prev => prev.map(l => {
      if (l.id === a.id) return { ...l, display_order: newOrderA }
      if (l.id === b.id) return { ...l, display_order: newOrderB }
      return l
    }))
  }

  const sorted = [...links].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SNS 채널 관리</h1>
          <p className="text-gray-500 mt-1">등록한 SNS는 로그인 화면과 사이드바에 표시됩니다</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          SNS 추가
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <form onSubmit={handleAdd} className="card p-5 mb-4 space-y-3">
          <h2 className="font-semibold text-gray-900">새 SNS 채널 추가</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼</label>
            <select
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
              className="input-field"
            >
              {PLATFORM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">표시 이름</label>
            <input
              type="text"
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              className="input-field"
              placeholder="예: joongdi 인스타그램"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              className="input-field"
              placeholder="https://instagram.com/..."
              required
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <><div className="spinner w-4 h-4" /> 저장 중...</> : '저장'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              취소
            </button>
          </div>
        </form>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="card p-8 text-center text-gray-400">불러오는 중...</div>
      ) : sorted.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          <p className="font-medium">등록된 SNS 채널이 없습니다</p>
          <p className="text-sm mt-1">위의 SNS 추가 버튼을 눌러 채널을 등록해보세요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((link, idx) => {
            const p = SNS_PLATFORMS[link.platform] ?? SNS_PLATFORMS.other
            return (
              <div key={link.id} className={`card p-4 flex items-center gap-3 ${!link.enabled ? 'opacity-60' : ''}`}>
                {/* 순서 조절 */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMoveOrder(link, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed"
                    title="위로"
                  >
                    <GripVertical size={14} className="text-gray-400 rotate-90" />
                  </button>
                  <button
                    onClick={() => handleMoveOrder(link, 'down')}
                    disabled={idx === sorted.length - 1}
                    className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed"
                    title="아래로"
                  >
                    <GripVertical size={14} className="text-gray-400 -rotate-90" />
                  </button>
                </div>

                {/* 플랫폼 뱃지 */}
                <div
                  style={{ backgroundColor: p.bg, color: p.fg }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                >
                  {p.symbol}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{link.label}</p>
                  <p className="text-xs text-gray-400 truncate">{link.url}</p>
                </div>

                {/* 상태 배지 */}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  link.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {link.enabled ? 'ON' : 'OFF'}
                </span>

                {/* 토글 */}
                <button
                  onClick={() => handleToggle(link)}
                  disabled={togglingId === link.id}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  {link.enabled
                    ? <ToggleRight size={28} className="text-brand-600" />
                    : <ToggleLeft size={28} className="text-gray-400" />
                  }
                </button>

                {/* 삭제 */}
                <button
                  onClick={() => handleDelete(link.id)}
                  disabled={deletingId === link.id}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        OFF로 설정하면 해당 SNS가 화면에 표시되지 않습니다. 순서 버튼으로 노출 순서를 조정할 수 있습니다.
      </p>
    </div>
  )
}
