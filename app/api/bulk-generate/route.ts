import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateContent, type GenerateOptions } from '@/lib/anthropic'

// 대량 생성은 시간이 오래 걸리므로 최대 타임아웃 설정
export const maxDuration = 300 // 5분

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isTopPick(index: number, total: number): boolean {
  const topCount = Math.max(3, Math.floor(total * 0.1))
  return index < topCount
}

// direction별 style/purpose 자동 조합 테이블
const DIRECTION_COMBOS: Record<string, Array<{ style: string; purpose: string }>> = {
  conversion_focus: [
    { style: 'trustworthy', purpose: 'conversion' },
    { style: 'influencer', purpose: 'conversion' },
    { style: 'friendly', purpose: 'recommendation' },
    { style: 'trustworthy', purpose: 'recommendation' },
    { style: 'storytelling', purpose: 'conversion' },
  ],
  review_focus: [
    { style: 'trustworthy', purpose: 'review' },
    { style: 'friendly', purpose: 'review' },
    { style: 'storytelling', purpose: 'experience' },
    { style: 'influencer', purpose: 'review' },
    { style: 'trustworthy', purpose: 'experience' },
  ],
  info_focus: [
    { style: 'expert', purpose: 'informative' },
    { style: 'trustworthy', purpose: 'informative' },
    { style: 'expert', purpose: 'comparison' },
    { style: 'friendly', purpose: 'informative' },
    { style: 'expert', purpose: 'review' },
  ],
  auto: [
    { style: 'trustworthy', purpose: 'review' },
    { style: 'friendly', purpose: 'recommendation' },
    { style: 'expert', purpose: 'informative' },
    { style: 'storytelling', purpose: 'experience' },
    { style: 'influencer', purpose: 'conversion' },
    { style: 'trustworthy', purpose: 'comparison' },
    { style: 'friendly', purpose: 'review' },
    { style: 'expert', purpose: 'comparison' },
  ],
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
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
    const { keyword, direction, count, productName, productFeatures } = body

    if (!keyword || !count) {
      return NextResponse.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 })
    }

    const maxCount = Math.min(count, 20)
    const sessionId = crypto.randomUUID()
    const combos = DIRECTION_COMBOS[direction] || DIRECTION_COMBOS.auto

    // 병렬 생성 (3개씩 배치로 처리)
    const results: { index: number; content: any; isTopPick: boolean }[] = []
    const batchSize = 3

    for (let i = 0; i < maxCount; i += batchSize) {
      const batchIndices = Array.from(
        { length: Math.min(batchSize, maxCount - i) },
        (_, j) => i + j
      )

      const batchResults = await Promise.allSettled(
        batchIndices.map((index) => {
          const combo = combos[index % combos.length]
          const options: GenerateOptions = {
            keyword,
            style: combo.style,
            purpose: combo.purpose,
            lengthOption: 'medium',
            productName,
            productFeatures,
          }
          return generateContent(options, index)
        })
      )

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j]
        const index = batchIndices[j]
        const topPick = isTopPick(index, maxCount)
        const combo = combos[index % combos.length]

        if (result.status === 'fulfilled') {
          results.push({
            index,
            content: result.value,
            isTopPick: topPick,
          })

          // DB 저장
          await supabase.from('generated_content').insert({
            user_id: user.id,
            keyword,
            style: combo.style,
            purpose: combo.purpose,
            length_option: 'medium',
            product_name: productName || null,
            product_features: productFeatures || null,
            title: result.value.title,
            content: result.value,
            is_bulk: true,
            bulk_count: maxCount,
            bulk_session_id: sessionId,
            bulk_index: index,
            is_top_pick: topPick,
          })
        }
      }

      // API 레이트 리밋 방지
      if (i + batchSize < maxCount) {
        await sleep(500)
      }
    }

    // 정렬: TOP 픽 먼저, 그 다음 인덱스 순
    results.sort((a, b) => {
      if (a.isTopPick && !b.isTopPick) return -1
      if (!a.isTopPick && b.isTopPick) return 1
      return a.index - b.index
    })

    return NextResponse.json({
      results,
      sessionId,
      totalGenerated: results.length,
      topPickCount: results.filter(r => r.isTopPick).length,
    })
  } catch (error) {
    console.error('[bulk-generate] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '대량 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
