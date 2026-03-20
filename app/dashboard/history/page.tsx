'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, STYLE_LABELS, PURPOSE_LABELS, LENGTH_LABELS } from '@/lib/utils'
import { Copy, Trash2, ChevronDown, ChevronRight, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface ContentRow {
  id: string
  keyword: string
  style: string
  purpose: string
  length_option: string
  is_bulk: boolean
  bulk_count: number | null
  created_at: string
  content: {
    title: string
    hook: string
    analysis: string
    pros: string
    cons: string
    target: string
    conclusion: string
  }
}

export default function HistoryPage() {
  const [items, setItems] = useState<ContentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBulk, setFilterBulk] = useState<'all' | 'single' | 'bulk'>('all')

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('generated_content')
      .select('id, keyword, style, purpose, length_option, is_bulk, bulk_count, created_at, content')
      .order('created_at', { ascending: false })
      .limit(200)

    setItems((data as ContentRow[]) || [])
    setLoading(false)
  }

  async function deleteItem(id: string) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return

    const supabase = createClient()
    const { error } = await supabase.from('generated_content').delete().eq('id', id)

    if (error) {
      toast.error('삭제 중 오류가 발생했습니다.')
      return
    }

    setItems(items.filter(item => item.id !== id))
    toast.success('삭제되었습니다.')
  }

  function copyContent(content: ContentRow['content']) {
    const text = `# ${content.title}\n\n${content.hook}\n\n## 제품 분석\n${content.analysis}\n\n## 좋은점\n${content.pros}\n\n## 아쉬운점\n${content.cons}\n\n## 추천 대상\n${content.target}\n\n## 마무리\n${content.conclusion}`
    navigator.clipboard.writeText(text)
    toast.success('복사되었습니다!')
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery ||
      item.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.title?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filterBulk === 'all' ||
      (filterBulk === 'single' && !item.is_bulk) ||
      (filterBulk === 'bulk' && item.is_bulk)

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">생성 기록</h1>
        <p className="text-gray-500 mt-1">이전에 생성한 모든 글을 확인하고 복사할 수 있습니다</p>
      </div>

      {/* 필터 & 검색 */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 text-sm"
            placeholder="키워드 또는 제목 검색..."
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'single', 'bulk'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterBulk(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterBulk === f ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f === 'all' ? '전체' : f === 'single' ? '단일' : '대량'}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-medium text-gray-500">생성 기록이 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">글 생성 페이지에서 콘텐츠를 만들어보세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">총 {filteredItems.length}개</p>
          {filteredItems.map((item) => (
            <div key={item.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.is_bulk && (
                      <span className="badge bg-purple-100 text-purple-700">대량 ({item.bulk_count}개)</span>
                    )}
                    <span className="badge bg-gray-100 text-gray-600">{STYLE_LABELS[item.style]}</span>
                    <span className="badge bg-blue-100 text-blue-600">{PURPOSE_LABELS[item.purpose]}</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {item.content?.title || item.keyword}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    키워드: {item.keyword} &middot; {formatDate(item.created_at)}
                  </p>
                </div>
                {expandedId === item.id ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
              </button>

              {expandedId === item.id && item.content && (
                <div className="border-t border-gray-100">
                  <div className="p-4 space-y-3">
                    <div className="bg-brand-50 rounded-xl p-3 border border-brand-200">
                      <p className="text-xs font-bold text-brand-600 uppercase mb-1">제목</p>
                      <p className="font-bold text-gray-900">{item.content.title}</p>
                    </div>
                    {[
                      { key: 'hook', label: '후킹', color: 'border-l-orange-400' },
                      { key: 'analysis', label: '제품 분석', color: 'border-l-blue-400' },
                      { key: 'pros', label: '좋은점', color: 'border-l-green-400' },
                      { key: 'cons', label: '아쉬운점', color: 'border-l-red-400' },
                      { key: 'target', label: '추천 대상', color: 'border-l-purple-400' },
                      { key: 'conclusion', label: '마무리', color: 'border-l-brand-400' },
                    ].map(({ key, label, color }) => (
                      <div key={key} className={`bg-gray-50 rounded-lg p-3 border-l-4 ${color}`}>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">{label}</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {item.content[key as keyof typeof item.content]}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-100 flex justify-between">
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>
                    <button
                      onClick={() => copyContent(item.content)}
                      className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
                    >
                      <Copy size={14} />
                      복사
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
