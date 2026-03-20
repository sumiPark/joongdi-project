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
    const { keyword, style, purpose, count, productName, productFeatures } = body

    if (!keyword || !style || !purpose || !count) {
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

    const PURPOSE_LABELS: Record<string, string> = {
      informative: '정보형',
      review: '후기형',
      comparison: '비교형',
      recommendation: '추천형',
      experience: '체험형',
      conversion: '전환형',
    }

    // Step 1: 시리즈 기획안 생성
    const planPrompt = `당신은 한국 블로그 콘텐츠 전략가입니다.
아래 키워드로 블로그 시리즈를 기획해주세요.

**키워드:** ${keyword}
${productName ? `**상품명:** ${productName}` : ''}
${productFeatures ? `**주요 특징:** ${productFeatures}` : ''}
**문체:** ${STYLE_LABELS[style] || style}
**목적:** ${PURPOSE_LABELS[purpose] || purpose}
**편수:** ${episodeCount}편

**기획 원칙:**
- 각 편이 독립적으로도 읽힐 수 있지만, 전체 흐름이 자연스럽게 연결
- 편마다 완전히 다른 각도와 주제로 접근
- 독자가 1편부터 읽고 싶어지는 흐름 구성
- 전형적인 시리즈 구성 예시 (키워드에 맞게 변형):
  - 3편: 도입/분석 → 상세후기 → 총정리
  - 4편: 도입 → 상세후기 → 비교/대안 → 총정리
  - 5편: 도입/개봉기 → 사용후기 → 장단점 → 비교/대안 → 구매가이드

다음 JSON 형식으로만 반환:
{
  "seriesTitle": "시리즈 전체 제목 (예: 다이슨 에어랩 완전정복 시리즈)",
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
          const options: GenerateOptions = {
            keyword,
            style,
            purpose,
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
