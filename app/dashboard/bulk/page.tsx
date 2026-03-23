'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, Star, ChevronDown, ChevronRight } from 'lucide-react'

interface GeneratedContent {
  title: string
  hook: string
  analysis: string
  pros: string
  cons: string
  target: string
  conclusion: string
}

interface BulkResult {
  index: number
  content: GeneratedContent
  isTopPick: boolean
}

const DIRECTIONS = [
  {
    value: 'auto',
    label: 'AI 자동 믹스',
    desc: '문체·목적을 AI가 자동으로 다양하게 조합 (추천)',
    emoji: '🤖',
    recommended: true,
  },
  {
    value: 'conversion_focus',
    label: '전환·추천 위주',
    desc: '구매 유도, 전환 최적화 중심으로 생성',
    emoji: '💰',
  },
  {
    value: 'review_focus',
    label: '후기·체험 위주',
    desc: '실사용 후기, 경험담 중심으로 생성',
    emoji: '⭐',
  },
  {
    value: 'info_focus',
    label: '정보·비교 위주',
    desc: '전문 정보, 성분·스펙 비교 중심으로 생성',
    emoji: '📋',
  },
]

const BULK_COUNTS = [
  { value: 3, label: '3개', desc: '빠른 테스트' },
  { value: 5, label: '5개', desc: '기본 생성', recommended: true },
  { value: 10, label: '10개', desc: '콘텐츠 묶음 제작' },
  { value: 20, label: '20개', desc: '대량 제작' },
]

export default function BulkGeneratePage() {
  const [keyword, setKeyword] = useState('')
  const [direction, setDirection] = useState('auto')
  const [count, setCount] = useState(5)
  const [productName, setProductName] = useState('')
  const [productFeatures, setProductFeatures] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<BulkResult[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showTopOnly, setShowTopOnly] = useState(false)

  async function handleBulkGenerate() {
    if (!keyword.trim()) {
      toast.error('키워드를 입력해주세요.')
      return
    }

    setLoading(true)
    setProgress(0)
    setResults([])
    setExpandedId(null)

    try {
      const res = await fetch('/api/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          direction,
          count,
          productName: productName.trim() || undefined,
          productFeatures: productFeatures.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || '대량 생성 중 오류가 발생했습니다.')
        return
      }

      setResults(data.results)
      setProgress(100)
      toast.success(`${data.results.length}개의 글이 생성되었습니다!`)
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function copyContent(content: GeneratedContent) {
    const text = `# ${content.title}\n\n${content.hook}\n\n## 제품 분석\n${content.analysis}\n\n## 좋은점\n${content.pros}\n\n## 아쉬운점\n${content.cons}\n\n## 추천 대상\n${content.target}\n\n## 마무리\n${content.conclusion}`
    navigator.clipboard.writeText(text)
    toast.success('복사되었습니다!')
  }

  function copyAllTitles() {
    const titles = (showTopOnly ? results.filter(r => r.isTopPick) : results)
      .map((r, i) => `${i + 1}. ${r.content.title}`)
      .join('\n')
    navigator.clipboard.writeText(titles)
    toast.success('전체 제목이 복사되었습니다!')
  }

  const displayResults = showTopOnly ? results.filter(r => r.isTopPick) : results
  const topPickCount = results.filter(r => r.isTopPick).length

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대량 생성</h1>
        <p className="text-gray-500 mt-1">한 번의 입력으로 서로 다른 구조의 글을 대량으로 생성합니다</p>
      </div>

      {/* 설정 카드 */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 키워드 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">키워드 *</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input-field"
              placeholder="예: 쿠마랑 흑하랑, 리유 브로멜라인 효소, 쿠마 진저레몬샷"
            />
          </div>

          {/* 상품명 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">상품명 <span className="text-gray-400 font-normal">(선택)</span></label>
            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="input-field" placeholder="예: 리유 래쉬업 손눈썹 고데기" />
          </div>

          {/* 상품 특징 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">핵심 특징 <span className="text-gray-400 font-normal">(선택)</span></label>
            <input type="text" value={productFeatures} onChange={(e) => setProductFeatures(e.target.value)} className="input-field" placeholder="예: 열 없이 스타일링, 손상 없음" />
          </div>

          {/* 생성 방향 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">생성 방향</label>
            <div className="grid grid-cols-2 gap-2">
              {DIRECTIONS.map((d) => (
                <label key={d.value} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${direction === d.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value={d.value} checked={direction === d.value} onChange={() => setDirection(d.value)} className="sr-only" />
                  <span className="text-xl flex-shrink-0">{d.emoji}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-gray-900">{d.label}</span>
                      {d.recommended && <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">추천</span>}
                    </div>
                    <p className="text-xs text-gray-500 leading-tight mt-0.5">{d.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 생성 개수 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">생성 개수</label>
            <div className="grid grid-cols-4 gap-2">
              {BULK_COUNTS.map((c) => (
                <label key={c.value} className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${count === c.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value={c.value} checked={count === c.value} onChange={() => setCount(c.value)} className="sr-only" />
                  <span className="font-bold text-lg text-gray-900">{c.label}</span>
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    <span className="text-xs text-gray-500">{c.desc}</span>
                    {c.recommended && <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">추천</span>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleBulkGenerate}
          disabled={loading}
          className="btn-primary w-full mt-5 flex items-center justify-center gap-2 py-3.5 text-base"
        >
          {loading ? (
            <>
              <div className="spinner w-5 h-5" />
              <span>AI가 {count}개의 글을 작성 중... (최대 3-5분)</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>{count}개 글 대량 생성하기</span>
            </>
          )}
        </button>

        {loading && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>생성 중...</span>
              <span>잠시만 기다려주세요</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-brand-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}
      </div>

      {/* 결과 */}
      {results.length > 0 && (
        <div>
          {/* 결과 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-gray-900 text-lg">생성 결과 ({results.length}개)</h2>
              {topPickCount > 0 && (
                <span className="badge bg-yellow-100 text-yellow-800">
                  <Star size={11} className="mr-1" />
                  TOP {topPickCount}개
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {topPickCount > 0 && (
                <button
                  onClick={() => setShowTopOnly(!showTopOnly)}
                  className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${showTopOnly ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                >
                  {showTopOnly ? '전체 보기' : '⭐ TOP만 보기'}
                </button>
              )}
              <button onClick={copyAllTitles} className="btn-secondary text-sm py-1.5 px-3">
                제목 전체 복사
              </button>
            </div>
          </div>

          {/* TOP 픽 요약 */}
          {topPickCount > 0 && !showTopOnly && (
            <div className="card mb-4 p-4 bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <Star size={16} className="fill-yellow-500 text-yellow-500" />
                추천 TOP {topPickCount} 제목 모음
              </h3>
              <div className="space-y-1">
                {results.filter(r => r.isTopPick).map((r) => (
                  <p key={r.index} className="text-sm text-yellow-900">
                    <span className="font-medium">#{r.index + 1}</span> {r.content.title}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 개별 결과 */}
          <div className="space-y-3">
            {displayResults.map((result) => (
              <div key={result.index} className={`card overflow-hidden ${result.isTopPick ? 'ring-2 ring-yellow-400' : ''}`}>
                <button
                  onClick={() => setExpandedId(expandedId === result.index ? null : result.index)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-400 font-medium w-8 flex-shrink-0">#{result.index + 1}</span>
                  {result.isTopPick && <Star size={16} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />}
                  <p className="flex-1 font-semibold text-gray-900 text-sm">{result.content.title}</p>
                  {expandedId === result.index ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </button>

                {expandedId === result.index && (
                  <div className="border-t border-gray-100">
                    <div className="p-4 space-y-3">
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
                            {result.content[key as keyof GeneratedContent]}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => copyContent(result.content)}
                        className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
                      >
                        <Copy size={14} />
                        이 글 복사
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
