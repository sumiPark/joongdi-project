'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'

interface EpisodeContent {
  title: string
  hook: string
  analysis: string
  pros: string
  cons: string
  target: string
  conclusion: string
}

interface Episode {
  episode: number
  title: string
  focus: string
  angle: string
  content: EpisodeContent
}

interface SeriesResult {
  seriesTitle: string
  seriesDescription: string
  keyword: string
  episodes: Episode[]
  totalEpisodes: number
}

const STYLES = [
  { value: 'trustworthy', label: '신뢰형', emoji: '🤝', recommended: true },
  { value: 'friendly', label: '친근형', emoji: '😊' },
  { value: 'expert', label: '전문가형', emoji: '🎓' },
  { value: 'influencer', label: '인플루언서형', emoji: '✨' },
  { value: 'storytelling', label: '스토리형', emoji: '📖' },
]

const PURPOSES = [
  { value: 'review', label: '후기형', emoji: '⭐', recommended: true },
  { value: 'informative', label: '정보형', emoji: '📋' },
  { value: 'comparison', label: '비교형', emoji: '⚖️' },
  { value: 'recommendation', label: '추천형', emoji: '👍' },
  { value: 'experience', label: '체험형', emoji: '🎯' },
  { value: 'conversion', label: '전환형', emoji: '💰' },
]

const COUNT_OPTIONS = [
  { value: 3, label: '3편', desc: '핵심만' },
  { value: 4, label: '4편', desc: '균형감' },
  { value: 5, label: '5편', desc: '완전정복', recommended: true },
]

const SECTIONS = [
  { key: 'hook', label: '후킹', color: 'border-l-orange-400' },
  { key: 'analysis', label: '핵심 분석', color: 'border-l-blue-400' },
  { key: 'pros', label: '좋은점', color: 'border-l-green-400' },
  { key: 'cons', label: '아쉬운점', color: 'border-l-red-400' },
  { key: 'target', label: '추천 대상', color: 'border-l-purple-400' },
  { key: 'conclusion', label: '마무리', color: 'border-l-brand-400' },
]

export default function SeriesPage() {
  const [keyword, setKeyword] = useState('')
  const [style, setStyle] = useState('trustworthy')
  const [purpose, setPurpose] = useState('review')
  const [count, setCount] = useState(5)
  const [productName, setProductName] = useState('')
  const [productFeatures, setProductFeatures] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SeriesResult | null>(null)
  const [expandedEp, setExpandedEp] = useState<number | null>(null)

  async function handleGenerate() {
    if (!keyword.trim()) {
      toast.error('키워드를 입력해주세요.')
      return
    }

    setLoading(true)
    setResult(null)
    setExpandedEp(null)

    try {
      const res = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          style,
          purpose,
          count,
          productName: productName.trim() || undefined,
          productFeatures: productFeatures.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || '시리즈 생성 중 오류가 발생했습니다.')
        return
      }

      setResult(data)
      setExpandedEp(1)
      toast.success(`${data.totalEpisodes}편 시리즈가 생성되었습니다!`)
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function copyEpisode(ep: Episode) {
    const c = ep.content
    const text = `# [${ep.episode}편] ${ep.title}\n\n${c.hook}\n\n## 핵심 분석\n${c.analysis}\n\n## 좋은점\n${c.pros}\n\n## 아쉬운점\n${c.cons}\n\n## 추천 대상\n${c.target}\n\n## 마무리\n${c.conclusion}`
    navigator.clipboard.writeText(text)
    toast.success(`${ep.episode}편 복사 완료!`)
  }

  function copyAllTitles() {
    if (!result) return
    const text = result.episodes.map(ep => `${ep.episode}편. ${ep.title}`).join('\n')
    navigator.clipboard.writeText(text)
    toast.success('전체 목차가 복사되었습니다!')
  }

  function copyAllEpisodes() {
    if (!result) return
    const text = result.episodes.map(ep => {
      const c = ep.content
      return `# [${ep.episode}편] ${ep.title}\n\n${c.hook}\n\n## 핵심 분석\n${c.analysis}\n\n## 좋은점\n${c.pros}\n\n## 아쉬운점\n${c.cons}\n\n## 추천 대상\n${c.target}\n\n## 마무리\n${c.conclusion}`
    }).join('\n\n---\n\n')
    navigator.clipboard.writeText(text)
    toast.success('전체 시리즈 복사 완료!')
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">시리즈 글 생성</h1>
        <p className="text-gray-500 mt-1">하나의 키워드로 연결된 시리즈 블로그 글을 한 번에 생성합니다</p>
      </div>

      {/* 입력 카드 */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 키워드 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">키워드 *</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              className="input-field"
              placeholder="예: 다이슨 에어랩, 나이키 페가수스, 제주도 여행"
            />
          </div>

          {/* 상품명 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              상품명 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="input-field"
              placeholder="예: 다이슨 에어랩 멀티 스타일러"
            />
          </div>

          {/* 핵심 특징 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              핵심 특징 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={productFeatures}
              onChange={(e) => setProductFeatures(e.target.value)}
              className="input-field"
              placeholder="예: 열 없이 스타일링, 코안다 효과"
            />
          </div>

          {/* 문체 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">문체</label>
            <div className="grid grid-cols-5 gap-1.5">
              {STYLES.map((s) => (
                <label
                  key={s.value}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 cursor-pointer transition-all text-center ${
                    style === s.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" value={s.value} checked={style === s.value} onChange={() => setStyle(s.value)} className="sr-only" />
                  <span className="text-lg">{s.emoji}</span>
                  <span className="text-xs font-medium text-gray-700 leading-tight">{s.label}</span>
                  {s.recommended && <span className="text-xs bg-brand-100 text-brand-700 px-1 rounded-full">추천</span>}
                </label>
              ))}
            </div>
          </div>

          {/* 목적 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">글 목적</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PURPOSES.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                    purpose === p.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" value={p.value} checked={purpose === p.value} onChange={() => setPurpose(p.value)} className="sr-only" />
                  <span className="text-sm">{p.emoji}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-gray-700">{p.label}</span>
                    {p.recommended && <span className="text-xs bg-brand-100 text-brand-700 px-1 rounded-full">추천</span>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 편수 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">시리즈 편수</label>
            <div className="grid grid-cols-3 gap-2">
              {COUNT_OPTIONS.map((c) => (
                <label
                  key={c.value}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                    count === c.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
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
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary w-full mt-5 flex items-center justify-center gap-2 py-3.5 text-base"
        >
          {loading ? (
            <>
              <div className="spinner w-5 h-5" />
              <span>AI가 {count}편 시리즈를 작성 중... (최대 3-5분)</span>
            </>
          ) : (
            <>
              <BookOpen size={18} />
              <span>{count}편 시리즈 생성하기</span>
            </>
          )}
        </button>

        {loading && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-brand-600 h-2 rounded-full animate-pulse" style={{ width: '50%' }} />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">시리즈 기획 → 각 편 본문 순서로 생성됩니다</p>
          </div>
        )}
      </div>

      {/* 결과 */}
      {result && (
        <div>
          {/* 시리즈 헤더 */}
          <div className="card p-5 mb-4 bg-brand-50 border-brand-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={16} className="text-brand-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">시리즈</span>
                </div>
                <h2 className="font-bold text-gray-900 text-lg leading-snug mb-1">{result.seriesTitle}</h2>
                <p className="text-sm text-gray-500">{result.seriesDescription}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={copyAllTitles} className="btn-secondary text-xs py-1.5 px-2.5">
                  목차 복사
                </button>
                <button onClick={copyAllEpisodes} className="btn-primary text-xs py-1.5 px-2.5">
                  전체 복사
                </button>
              </div>
            </div>

            {/* 목차 */}
            <div className="mt-4 pt-4 border-t border-brand-200 space-y-1.5">
              {result.episodes.map((ep) => (
                <button
                  key={ep.episode}
                  onClick={() => setExpandedEp(expandedEp === ep.episode ? null : ep.episode)}
                  className="w-full flex items-center gap-3 text-left hover:bg-brand-100 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <span className="text-xs font-bold text-brand-500 w-8 flex-shrink-0">{ep.episode}편</span>
                  <span className="text-sm text-gray-700 flex-1">{ep.title}</span>
                  <span className="text-xs text-brand-400 flex-shrink-0">{ep.focus}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 개별 편 */}
          <div className="space-y-3">
            {result.episodes.map((ep) => (
              <div key={ep.episode} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedEp(expandedEp === ep.episode ? null : ep.episode)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50"
                >
                  <span className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {ep.episode}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{ep.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ep.focus}</p>
                  </div>
                  {expandedEp === ep.episode
                    ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                    : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                  }
                </button>

                {expandedEp === ep.episode && (
                  <div className="border-t border-gray-100">
                    <div className="p-4 space-y-3">
                      {SECTIONS.map(({ key, label, color }) => (
                        <div key={key} className={`bg-gray-50 rounded-lg p-3 border-l-4 ${color}`}>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">{label}</p>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {ep.content[key as keyof EpisodeContent]}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => copyEpisode(ep)}
                        className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
                      >
                        <Copy size={14} />
                        {ep.episode}편 복사
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {!result && !loading && (
        <div className="card p-12 text-center text-gray-400">
          <div className="text-5xl mb-4">📚</div>
          <p className="font-medium text-gray-500">키워드를 입력하고 시리즈를 생성해보세요</p>
          <p className="text-sm text-gray-400 mt-1">3~5편의 연결된 블로그 시리즈를 한 번에 만들어드립니다</p>
        </div>
      )}
    </div>
  )
}
