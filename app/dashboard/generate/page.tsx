'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface GeneratedContent {
  title: string
  hook: string
  analysis: string
  pros: string
  cons: string
  target: string
  conclusion: string
}

const STYLES = [
  { value: 'trustworthy', label: '신뢰형', desc: '과장 없이 설득력 있는 기본형', emoji: '🤝', recommended: true },
  { value: 'friendly', label: '친근형', desc: '일상 대화 느낌, 편하게 읽히는 스타일', emoji: '😊' },
  { value: 'expert', label: '전문가형', desc: '신뢰 중심, 정보 전달 강조', emoji: '🎓' },
  { value: 'influencer', label: '인플루언서형', desc: '감성 + 추천 중심, SNS 느낌', emoji: '✨' },
  { value: 'storytelling', label: '썰형', desc: '스토리텔링, 경험 기반 전개', emoji: '📖' },
]

const PURPOSES = [
  { value: 'informative', label: '정보형', desc: '제품 설명 중심, 객관적 정보 전달', emoji: '📋' },
  { value: 'review', label: '후기형', desc: '실제 사용 경험 느낌', emoji: '⭐' },
  { value: 'comparison', label: '비교형', desc: '다른 제품과 차이 강조', emoji: '⚖️' },
  { value: 'recommendation', label: '추천형', desc: '구매 유도 중심', emoji: '👍' },
  { value: 'experience', label: '체험형', desc: '과정 중심, 스토리 포함', emoji: '🎯' },
  { value: 'conversion', label: '승인형', desc: '광고/판매 전환 최적화 구조', emoji: '💰' },
]

const LENGTHS = [
  { value: 'short', label: '짧게', desc: 'SNS / 릴스 / 간단 리뷰용', emoji: '📱' },
  { value: 'medium', label: '보통', desc: '블로그 기본 글 (추천)', emoji: '📝', recommended: true },
  { value: 'long', label: '길게', desc: '상세페이지 / SEO용 글', emoji: '📚' },
]

const SECTIONS = [
  { key: 'hook', label: '후킹', color: 'border-l-orange-400' },
  { key: 'analysis', label: '제품 분석', color: 'border-l-blue-400' },
  { key: 'pros', label: '좋은점', color: 'border-l-green-400' },
  { key: 'cons', label: '아쉬운점', color: 'border-l-red-400' },
  { key: 'target', label: '추천 대상', color: 'border-l-purple-400' },
  { key: 'conclusion', label: '마무리', color: 'border-l-brand-400' },
]

export default function GeneratePage() {
  const [keyword, setKeyword] = useState('')
  const [style, setStyle] = useState('trustworthy')
  const [purpose, setPurpose] = useState('informative')
  const [lengthOption, setLengthOption] = useState('medium')
  const [showProductData, setShowProductData] = useState(false)
  const [productName, setProductName] = useState('')
  const [productFeatures, setProductFeatures] = useState('')
  const [productReviewPoints, setProductReviewPoints] = useState('')
  const [targetCustomers, setTargetCustomers] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedContent | null>(null)

  async function handleGenerate() {
    if (!keyword.trim()) {
      toast.error('키워드를 입력해주세요.')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          style,
          purpose,
          lengthOption,
          productName: productName.trim() || undefined,
          productFeatures: productFeatures.trim() || undefined,
          productReviewPoints: productReviewPoints.trim() || undefined,
          targetCustomers: targetCustomers.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || '글 생성 중 오류가 발생했습니다.')
        return
      }

      setResult(data.content)
      toast.success('글이 생성되었습니다!')
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function copyFullContent() {
    if (!result) return
    const text = `# ${result.title}\n\n${result.hook}\n\n## 제품 분석\n${result.analysis}\n\n## 좋은점\n${result.pros}\n\n## 아쉬운점\n${result.cons}\n\n## 추천 대상\n${result.target}\n\n## 마무리\n${result.conclusion}`
    navigator.clipboard.writeText(text)
    toast.success('전체 내용이 복사되었습니다!')
  }

  function copySection(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} 복사 완료!`)
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">글 생성</h1>
        <p className="text-gray-500 mt-1">키워드를 입력하고 스타일을 선택하면 완성형 블로그 글을 생성합니다</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 폼 */}
        <div className="space-y-5">
          {/* 키워드 */}
          <div className="card p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">키워드 *</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input-field"
              placeholder="예: 다이슨 에어랩, 나이키 운동화, 강남 맛집"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>

          {/* 문체 선택 */}
          <div className="card p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">문체 선택</label>
            <div className="space-y-2">
              {STYLES.map((s) => (
                <label key={s.value} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${style === s.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value={s.value} checked={style === s.value} onChange={(e) => setStyle(e.target.value)} className="sr-only" />
                  <span className="text-xl">{s.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">{s.label}</span>
                      {s.recommended && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">추천</span>}
                    </div>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 글 목적 */}
          <div className="card p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">글 목적</label>
            <div className="grid grid-cols-2 gap-2">
              {PURPOSES.map((p) => (
                <label key={p.value} className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${purpose === p.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value={p.value} checked={purpose === p.value} onChange={(e) => setPurpose(e.target.value)} className="sr-only" />
                  <span>{p.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{p.label}</p>
                    <p className="text-xs text-gray-500 leading-tight">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 글 길이 */}
          <div className="card p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">글 길이</label>
            <div className="grid grid-cols-3 gap-2">
              {LENGTHS.map((l) => (
                <label key={l.value} className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${lengthOption === l.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value={l.value} checked={lengthOption === l.value} onChange={(e) => setLengthOption(e.target.value)} className="sr-only" />
                  <span className="text-xl">{l.emoji}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm text-gray-900">{l.label}</span>
                    {l.recommended && <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">추천</span>}
                  </div>
                  <p className="text-xs text-gray-500 leading-tight">{l.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* 상품 데이터 (선택) */}
          <div className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setShowProductData(!showProductData)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div>
                <span className="font-semibold text-gray-700">상품 데이터 입력</span>
                <span className="text-xs text-gray-400 ml-2">(선택사항)</span>
              </div>
              {showProductData ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {showProductData && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-100">
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">상품명</label>
                  <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="input-field text-sm" placeholder="예: 다이슨 에어랩 멀티 스타일러" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">주요 특징 / 핵심 포인트</label>
                  <textarea value={productFeatures} onChange={(e) => setProductFeatures(e.target.value)} className="input-field text-sm h-20 resize-none" placeholder="예: 열 없이 머리카락 손상 없음, 코안다 효과 활용..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">후기 포인트</label>
                  <textarea value={productReviewPoints} onChange={(e) => setProductReviewPoints(e.target.value)} className="input-field text-sm h-20 resize-none" placeholder="예: 가격 대비 성능 좋음, 헤어 볼륨 살아남..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">타겟 고객</label>
                  <input type="text" value={targetCustomers} onChange={(e) => setTargetCustomers(e.target.value)} className="input-field text-sm" placeholder="예: 20-30대 여성, 헤어 케어에 관심 있는 분" />
                </div>
              </div>
            )}
          </div>

          {/* 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
          >
            {loading ? (
              <>
                <div className="spinner w-5 h-5" />
                <span>AI가 글을 작성하고 있습니다...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>글 생성하기</span>
              </>
            )}
          </button>
        </div>

        {/* 결과 영역 */}
        <div>
          {!result && !loading && (
            <div className="card h-full min-h-64 flex items-center justify-center p-8">
              <div className="text-center text-gray-400">
                <div className="text-5xl mb-4">✍️</div>
                <p className="font-medium text-gray-500">키워드를 입력하고</p>
                <p className="font-medium text-gray-500">글 생성 버튼을 클릭하세요</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card h-full min-h-64 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="spinner w-12 h-12 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">AI가 글을 작성하고 있습니다</p>
                <p className="text-gray-400 text-sm mt-1">잠시만 기다려주세요...</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">생성 완료</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3"
                    title="다시 생성"
                  >
                    <RefreshCw size={14} />
                    재생성
                  </button>
                  <button
                    onClick={copyFullContent}
                    className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3"
                  >
                    <Copy size={14} />
                    전체 복사
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* 제목 */}
                <div className="bg-brand-50 rounded-xl p-4 border border-brand-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-600 uppercase tracking-wide">제목</span>
                    <button onClick={() => copySection(result.title, '제목')} className="text-brand-400 hover:text-brand-600">
                      <Copy size={13} />
                    </button>
                  </div>
                  <p className="font-bold text-gray-900 text-lg leading-snug">{result.title}</p>
                </div>

                {/* 섹션들 */}
                {SECTIONS.map(({ key, label, color }) => (
                  <div key={key} className={`bg-gray-50 rounded-lg p-4 border-l-4 ${color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
                      <button onClick={() => copySection(result[key as keyof GeneratedContent], label)} className="text-gray-300 hover:text-gray-500">
                        <Copy size={13} />
                      </button>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {result[key as keyof GeneratedContent]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
