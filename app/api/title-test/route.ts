import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { openai } from '@/lib/anthropic'

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
    const { keyword, style, purpose, count, productName } = body

    if (!keyword || !style || !purpose) {
      return NextResponse.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 })
    }

    const titleCount = Math.min(Math.max(count || 10, 5), 10)

    const STYLE_LABELS: Record<string, string> = {
      trustworthy: '신뢰형 (과장 없이 솔직한 톤)',
      friendly: '친근형 (구어체, 대화하듯)',
      expert: '전문가형 (정보 중심, 신뢰감)',
      influencer: '인플루언서형 (감성적, 트렌디)',
      storytelling: '스토리형 (경험 기반, 감성적)',
    }

    const PURPOSE_LABELS: Record<string, string> = {
      informative: '정보 전달 중심',
      review: '실제 사용 후기 느낌',
      comparison: '비교/차별화 강조',
      recommendation: '구매 추천 유도',
      experience: '체험/경험 중심',
      conversion: '광고 전환 최적화',
    }

    const prompt = `당신은 한국 블로그 SEO 전문가이자 카피라이터입니다.
키워드에 맞는 클릭률(CTR)이 높은 블로그 제목을 ${titleCount}개 생성해주세요.

**키워드:** ${keyword}
${productName ? `**상품명:** ${productName}` : ''}
**문체:** ${STYLE_LABELS[style] || style}
**목적:** ${PURPOSE_LABELS[purpose] || purpose}

**제목 유형 가이드 (각 유형을 골고루 사용):**
1. 숫자형: 구체적 수치로 신뢰감 ("7가지 이유", "3개월 사용 후기")
2. 질문형: 독자 고민을 직접 묻는 형식 ("이거 써봤어요?")
3. 선언형: 강한 주장으로 시작 ("솔직히 말하면...")
4. 감성형: 감정/경험에 호소하는 제목
5. 비교형: "vs" 또는 차이 강조
6. 호기심형: 의외성/반전으로 클릭 유도 ("의외로 몰랐던")
7. 공감형: 독자 상황에 공감 ("나만 그런 게 아니었어")
8. 혜택형: 얻을 수 있는 이득 강조
9. 스토리형: 경험담 느낌 ("그때 그걸 샀더라면")
10. 키워드강조형: SEO 키워드를 자연스럽게 강조

**필수 규칙:**
- 각 제목은 20-35자 이내
- 키워드를 자연스럽게 포함
- 클릭하고 싶어지는 매력적인 제목
- 각 제목은 완전히 다른 유형과 각도로 접근
- 스팸성 과장 표현 금지 ("대박", "충격" 남발 금지)

다음 JSON 형식으로만 반환:
{
  "titles": [
    { "title": "제목 텍스트", "type": "유형명 (예: 숫자형)", "description": "이 제목의 CTR 전략 한 줄 설명" }
  ]
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      temperature: 0.9,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.choices[0]?.message?.content || ''

    let parsed: { titles: { title: string; type: string; description: string }[] }
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON not found')
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      throw new Error('제목 파싱 오류: ' + text.slice(0, 200))
    }

    return NextResponse.json({ titles: parsed.titles, keyword })
  } catch (error) {
    console.error('[title-test] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '제목 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
