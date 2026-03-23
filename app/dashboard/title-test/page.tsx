'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, RefreshCw } from 'lucide-react'

interface TitleResult {
  title: string
  type: string
  description: string
}

const PLATFORMS = [
  { value: 'naver', label: '네이버 블로그', desc: '키워드 앞배치, 정보성 강조', emoji: '🟢', recommended: true },
  { value: 'google', label: '구글 SEO', desc: '검색 의도 매칭, 신뢰감', emoji: '🔵' },
  { value: 'sns', label: 'SNS / 인스타', desc: '짧고 감성적, 이모지 활용', emoji: '📸' },
]

const APPEALS = [
  { value: 'info_seeker', label: '정보 탐색', desc: '"무엇인가", "어떻게" 형태', emoji: '🔍', recommended: true },
  { value: 'purchase_ready', label: '구매 결정', desc: '확신·추천·후기 중심', emoji: '🛍️' },
  { value: 'emotional', label: '감성 공감', desc: '경험담·공감·스토리 중심', emoji: '💬' },
  { value: 'data_driven', label: '숫자 팩트', desc: 'N일·N가지·수치 신뢰형', emoji: '📊' },
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
  const [platform, setPlatform] = useState('naver')
  const [appeal, setAppeal] = useState('info_seeker')
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
          platform,
          appeal,
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

          {/* 검색 플랫폼 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">검색 플랫폼</label>
            <div className="space-y-1.5">
              {PLATFORMS.map((p) => (
                <label key={p.value} className={`flex items-center gap-3 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${platform === p.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value={p.value} checked={platform === p.value} onChange={() => setPlatform(p.value)} className="sr-only" />
                  <span className="text-lg">{p.emoji}</span>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm text-gray-900">{p.label}</span>
                      {p.recommended && <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">추천</span>}
                    </div>
                    <p className="text-xs text-gray-500">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 클릭 소구 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">클릭 소구</label>
            <div className="space-y-1.5">
              {APPEALS.map((a) => (
                <label key={a.value} className={`flex items-center gap-3 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${appeal === a.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value={a.value} checked={appeal === a.value} onChange={() => setAppeal(a.value)} className="sr-only" />
                  <span className="text-lg">{a.emoji}</span>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm text-gray-900">{a.label}</span>
                      {a.recommended && <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">추천</span>}
                    </div>
                    <p className="text-xs text-gray-500">{a.desc}</p>
                  </div>
                </label>
              ))}
            </div>
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
