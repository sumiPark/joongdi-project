'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ToggleLeft, ToggleRight } from 'lucide-react'

interface FeatureSetting {
  key: string
  label: string
  enabled: boolean
}

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  generate: '키워드로 완성형 블로그 글 1개를 즉시 생성하는 기능',
  bulk: '한 번에 최대 20개의 서로 다른 글을 대량 생성하는 기능',
  title_test: '같은 키워드로 다양한 유형의 제목을 생성해 CTR을 테스트하는 기능',
  series: '하나의 키워드로 연결된 시리즈 블로그 글을 생성하는 기능',
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<FeatureSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/features')
      .then(r => r.json())
      .then(data => setFeatures(data.features || []))
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(key: string, current: boolean) {
    setToggling(key)
    try {
      const res = await fetch('/api/admin/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled: !current }),
      })
      if (!res.ok) throw new Error()
      setFeatures(prev => prev.map(f => f.key === key ? { ...f, enabled: !current } : f))
      toast.success(`${features.find(f => f.key === key)?.label} ${!current ? '활성화' : '비활성화'}되었습니다.`)
    } catch {
      toast.error('변경 중 오류가 발생했습니다.')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">기능 관리</h1>
        <p className="text-gray-500 mt-1">사용자에게 노출할 콘텐츠 생성 기능을 on/off 할 수 있습니다</p>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-400">불러오는 중...</div>
      ) : (
        <div className="space-y-3">
          {features.map((feature) => (
            <div key={feature.key} className="card p-5 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">{feature.label}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    feature.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {feature.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{FEATURE_DESCRIPTIONS[feature.key]}</p>
              </div>
              <button
                onClick={() => handleToggle(feature.key, feature.enabled)}
                disabled={toggling === feature.key}
                className="flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                {feature.enabled ? (
                  <ToggleRight size={36} className="text-brand-600" />
                ) : (
                  <ToggleLeft size={36} className="text-gray-400" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        OFF로 설정하면 사용자 사이드바에서 해당 메뉴가 숨겨집니다.
      </p>
    </div>
  )
}
