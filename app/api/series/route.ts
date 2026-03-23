import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { openai } from '@/lib/anthropic'
import { buildPrompt, type GenerateOptions } from '@/lib/anthropic'

export const maxDuration = 300

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface EpisodePlan {
  episode: number
  title: string
  focus: string
  angle: string
}

interface EpisodeContent {
  episode: number
  title: string
  focus: string
  angle: string
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

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()

    if (!profile || profile.status !== 'approved') {
      return NextResponse.json({ error: '승인된 사용자만 이용할 수 있습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const { keyword, style, seriesType, count, productName, productFeatures } = body

    if (!keyword || !style || !count) {
      return NextResponse.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 })
    }

    const episodeCount = Math.min(Math.max(Number(count), 3), 5)

    const STYLE_LABELS: Record<string, string> = {
      trustworthy: '신뢰형',
      friendly: '친근형',
      expert: '전문가형',
      influencer: '인플루언서형',
      storytelling: '스토리형',
    }

    // seriesType별 기획 가이드 및 편당 목적 매핑
    const SERIES_TYPE_CONFIG: Record<string, {
      label: string
      planGuide: string
      structures: Record<number, string>
      episodePurposes: string[]
    }> = {
      purchase_journey: {
        label: '구매 여정형',
        planGuide: '독자가 제품에 처음 관심 갖고 → 비교/고민 → 최종 구매 결정까지의 흐름으로 구성. 각 편이 구매 깔때기의 다른 단계를 커버하며 자연스럽게 구매 의사결정을 유도.',
        structures: {
          3: '1편: 제품 소개/관심 유발 → 2편: 비교/대안 탐색 → 3편: 구매 가이드/최종 추천',
          4: '1편: 제품 소개 → 2편: 실사용 후기/검증 → 3편: 비교/대안 → 4편: 구매 결정 가이드',
          5: '1편: 관심 계기/소개 → 2편: 제품 심층 분석 → 3편: 실사용 후기 → 4편: 비교/대안 → 5편: 최종 구매 추천',
        },
        episodePurposes: ['informative', 'review', 'comparison', 'recommendation', 'conversion'],
      },
      usage_diary: {
        label: '사용기 연재형',
        planGuide: '제품 개봉부터 장기 사용까지 시간 순서로 연재. 독자가 함께 써보는 것 같은 간접 체험 구성. 각 편은 다른 시점(개봉→초기→장기)의 솔직한 기록.',
        structures: {
          3: '1편: 개봉기/첫인상 → 2편: 1-2주 사용기 → 3편: 장기 사용 최종 후기',
          4: '1편: 개봉기 → 2편: 초기 사용 (1주) → 3편: 중간 점검 (1개월) → 4편: 장기 사용 최종',
          5: '1편: 개봉/첫인상 → 2편: 초기 사용기 → 3편: 중간 점검 → 4편: 비교 분석 → 5편: 장기 사용 최종 후기',
        },
        episodePurposes: ['experience', 'review', 'review', 'comparison', 'review'],
      },
      info_deep: {
        label: '성분/정보 심화형',
        planGuide: '제품의 성분·원리·효과를 단계별로 심화 분석. 각 편이 다른 전문적 측면을 깊이 있게 다루는 정보 시리즈. 전문성과 신뢰감이 핵심.',
        structures: {
          3: '1편: 제품 개요/소개 → 2편: 핵심 성분/원리 분석 → 3편: 효과 검증/총정리',
          4: '1편: 제품 소개 → 2편: 성분/스펙 분석 → 3편: 효과/연구 검증 → 4편: 비교 분석',
          5: '1편: 제품 개요 → 2편: 핵심 성분 분석 → 3편: 효과/연구 → 4편: 타 제품 비교 → 5편: 활용 가이드 총정리',
        },
        episodePurposes: ['informative', 'informative', 'comparison', 'informative', 'recommendation'],
      },
      free: {
        label: '자유 구성',
        planGuide: 'AI가 키워드에 가장 적합한 시리즈 구조를 자유롭게 기획. 각 편이 독립적으로도 가치 있고 전체 흐름도 자연스럽게 연결되도록 구성.',
        structures: {
          3: '3편: 도입/분석 → 상세 후기 → 총정리',
          4: '4편: 도입 → 상세 후기 → 비교/대안 → 총정리',
          5: '5편: 도입/개봉기 → 사용 후기 → 장단점 → 비교/대안 → 구매 가이드',
        },
        episodePurposes: ['informative', 'review', 'comparison', 'recommendation', 'conversion'],
      },
    }

    const typeKey = seriesType && SERIES_TYPE_CONFIG[seriesType] ? seriesType : 'free'
    const typeConfig = SERIES_TYPE_CONFIG[typeKey]

    // Step 1: 시리즈 기획안 생성
    const planPrompt = `당신은 한국 블로그 콘텐츠 전략가입니다.
아래 키워드로 블로그 시리즈를 기획해주세요.

**키워드:** ${keyword}
${productName ? `**상품명:** ${productName}` : ''}
${productFeatures ? `**주요 특징:** ${productFeatures}` : ''}
**문체:** ${STYLE_LABELS[style] || style}
**시리즈 유형:** ${typeConfig.label}
**편수:** ${episodeCount}편

**시리즈 유형 기획 원칙:**
${typeConfig.planGuide}

**${episodeCount}편 구성 가이드:**
${typeConfig.structures[episodeCount as 3 | 4 | 5] || typeConfig.structures[5]}

다음 JSON 형식으로만 반환:
{
  "seriesTitle": "시리즈 전체 제목 (예: 쿠마랑 흑하랑 완전정복 시리즈)",
  "seriesDescription": "시리즈 한 줄 소개",
  "episodes": [
    {
      "episode": 1,
      "title": "이 편의 블로그 제목",
      "focus": "이 편의 핵심 주제 (예: 첫인상과 개봉기)",
      "angle": "이 편의 접근 각도와 작성 방향 (2-3문장)"
    }
  ]
}`

    const planResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1200,
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: planPrompt }],
    })

    const planText = planResponse.choices[0]?.message?.content || ''
    let plan: { seriesTitle: string; seriesDescription: string; episodes: EpisodePlan[] }

    try {
      const match = planText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Plan JSON not found')
      plan = JSON.parse(match[0])
    } catch {
      throw new Error('시리즈 기획 파싱 오류')
    }

    // Step 2: 각 편 본문 생성 (2개씩 병렬)
    const episodes: EpisodeContent[] = []
    const batchSize = 2

    for (let i = 0; i < plan.episodes.length; i += batchSize) {
      const batch = plan.episodes.slice(i, i + batchSize)

      const batchResults = await Promise.allSettled(
        batch.map(async (ep) => {
          const episodePurpose = typeConfig.episodePurposes[ep.episode - 1] || typeConfig.episodePurposes[0]
          const options: GenerateOptions = {
            keyword,
            style,
            purpose: episodePurpose,
            lengthOption: 'medium',
            productName,
            productFeatures,
          }

          const basePrompt = buildPrompt(options, ep.episode)

          const seriesContext = `
**[시리즈 정보 - 반드시 반영]**
- 시리즈명: ${plan.seriesTitle}
- 전체 편수: ${episodeCount}편 중 ${ep.episode}편
- 이 편의 핵심 주제: ${ep.focus}
- 이 편의 작성 방향: ${ep.angle}
- 제목은 반드시 "${ep.title}" 그대로 사용
- 이 편에서만 다루는 내용에 집중, 다른 편과 중복 최소화
- 글 마지막(conclusion)에 자연스럽게 다음 편 예고 또는 시리즈 안내 한 줄 포함`

          const fullPrompt = basePrompt.replace(
            '**[필수 준수 사항]**',
            `${seriesContext}\n\n**[필수 준수 사항]**`
          )

          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 2000,
            temperature: 0.75,
            response_format: { type: 'json_object' },
            messages: [{ role: 'user', content: fullPrompt }],
          })

          const text = response.choices[0]?.message?.content || ''
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (!jsonMatch) throw new Error('Content JSON not found')
          const content = JSON.parse(jsonMatch[0])

          return {
            episode: ep.episode,
            title: ep.title,
            focus: ep.focus,
            angle: ep.angle,
            content: { ...content, title: ep.title },
          } as EpisodeContent
        })
      )

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          episodes.push(result.value)
        }
      }

      if (i + batchSize < plan.episodes.length) {
        await sleep(500)
      }
    }

    episodes.sort((a, b) => a.episode - b.episode)

    return NextResponse.json({
      seriesTitle: plan.seriesTitle,
      seriesDescription: plan.seriesDescription,
      keyword,
      episodes,
      totalEpisodes: episodes.length,
    })
  } catch (error) {
    console.error('[series] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '시리즈 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
