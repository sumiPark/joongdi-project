'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, RefreshCw } from 'lucide-react'

interface TitleResult {
  title: string
  type: string
  description: string
}

const STYLES = [
  { value: 'trustworthy', label: '신뢰형', emoji: '🤝' },
  { value: 'friendly', label: '친근형', emoji: '😊' },
  { value: 'expert', label: '전문가형', emoji: '🎓' },
  { value: 'influencer', label: '인플루언서형', emoji: '✨' },
  { value: 'storytelling', label: '스토리형', emoji: '📖' },
]

const PURPOSES = [
  { value: 'informative', label: '정보형', emoji: '📋' },
  { value: 'review', label: '후기형', emoji: '⭐' },
  { value: 'comparison', label: '비교형', emoji: '⚖️' },
  { value: 'recommendation', label: '추천형', emoji: '👍' },
  { value: 'experience', label: '체험형', emoji: '🎯' },
  { value: 'conversion', label: '전환형', emoji: '💰' },
]

const COUNT_OPTIONS = [
  { value: 5, label: '5개' },
  { value: 10, label: '10개' },
]

const TYPE_COLORS: Record<string, string> = {
  '숫자형': 'bg-blue-100 text-blue-700',
  '질문형': 'bg-purple-100 text-purple-700',
  '선언형': 'bg-orange-100 text-orange-700',
  '감성형': 'bg-pink-100 text-pink-700',
  '비교형': 'bg-yellow-100 text-yellow-700',
  '호기심형': 'bg-green-100 text-green-700',
  '공감형': 'bg-teal-100 text-teal-700',
  '혜택형': 'bg-red-100 text-red-700',
  '스토리형': 'bg-indigo-100 text-indigo-700',
  '키워드강조형': 'bg-gray-100 text-gray-700',
}

function getTypeColor(type: string): string {
  for (const key of Object.keys(TYPE_COLORS)) {
    if (type.includes(key)) return TYPE_COLORS[key]
  }
  return 'bg-gray-100 text-gray-600'
}

export default function TitleTestPage() {
  const [keyword, setKeyword] = useState('')
  const [style, setStyle] = useState('trustworthy')
  const [purpose, setPurpose] = useState('informative')
  const [count, setCount] = useState(10)
  const [productName, setProductName] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TitleResult[]>([])
  const [lastKeyword, setLastKeyword] = useState('')

  async function handleGenerate() {
    if (!keyword.trim()) {
      toast.error('키워드를 입력해주세요.')
      return
    }

    setLoading(true)
    setResults([])

    try {
      const res = await fetch('/api/title-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          style,
          purpose,
          count,
          productName: productName.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || '제목 생성 중 오류가 발생했습니다.')
        return
      }

      setResults(data.titles || [])
      setLastKeyword(data.keyword)
      toast.success(`${data.titles?.length || 0}개의 제목이 생성되었습니다!`)
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function copyTitle(title: string) {
    navigator.clipboard.writeText(title)
    toast.success('복사되었습니다!')
  }

  function copyAllTitles() {
    const text = results.map((r, i) => `${i + 1}. ${r.title}`).join('\n')
    navigator.clipboard.writeText(text)
    toast.success('전체 제목이 복사되었습니다!')
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">제목 A/B 테스트</h1>
        <p className="text-gray-500 mt-1">같은 키워드로 다양한 유형의 제목을 생성해 CTR을 테스트하세요</p>
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
              placeholder="예: 쿠마랑 흑하랑, 리유 래쉬업 손눈썹 고데기, 착즙 레몬스틱"
            />
          </div>

          {/* 상품명 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              상품명 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="input-field"
              placeholder="예: 리유 브로멜라인 효소"
            />
          </div>

          {/* 문체 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">문체</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className="input-field">
              {STYLES.map((s) => (
                <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>

          {/* 목적 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">글 목적</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="input-field">
              {PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>{p.emoji} {p.label}</option>
              ))}
            </select>
          </div>

          {/* 생성 개수 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">생성 개수</label>
            <div className="flex gap-3">
              {COUNT_OPTIONS.map((c) => (
                <label
                  key={c.value}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 cursor-pointer transition-all font-medium text-sm ${
                    count === c.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    value={c.value}
                    checked={count === c.value}
                    onChange={() => setCount(c.value)}
                    className="sr-only"
                  />
                  {c.label}
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
              <span>제목 생성 중...</span>
            </>
          ) : (
            <>
              <span>🎯</span>
              <span>제목 {count}개 생성하기</span>
            </>
          )}
        </button>
      </div>

      {/* 결과 */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-gray-900 text-lg">생성된 제목 ({results.length}개)</h2>
              <span className="text-sm text-gray-500">키워드: {lastKeyword}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5"
              >
                <RefreshCw size={14} />
                재생성
              </button>
              <button onClick={copyAllTitles} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5">
                <Copy size={14} />
                전체 복사
              </button>
            </div>
          </div>

          {/* 사용 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
            <strong>CTR 테스트 방법:</strong> 포스팅 제목에 각 제목을 번갈아 적용하고 클릭 수를 비교해보세요. 네이버/구글 서치 콘솔에서 CTR을 확인할 수 있습니다.
          </div>

          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="card p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
                <span className="text-sm text-gray-400 font-bold w-7 flex-shrink-0 mt-0.5">#{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getTypeColor(result.type)}`}>
                      {result.type}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 text-base leading-snug mb-1.5">{result.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{result.description}</p>
                </div>
                <button
                  onClick={() => copyTitle(result.title)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  title="복사"
                >
                  <Copy size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {!results.length && !loading && (
        <div className="card p-12 text-center text-gray-400">
          <div className="text-5xl mb-4">🎯</div>
          <p className="font-medium text-gray-500">키워드를 입력하고 제목을 생성해보세요</p>
          <p className="text-sm text-gray-400 mt-1">5~10가지 유형의 클릭률 최적화 제목을 만들어드립니다</p>
        </div>
      )}
    </div>
  )
}
