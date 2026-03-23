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
    const { keyword, platform, appeal, count, productName } = body

    if (!keyword) {
      return NextResponse.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 })
    }

    const titleCount = Math.min(Math.max(count || 10, 5), 10)

    const PLATFORM_GUIDE: Record<string, string> = {
      naver: '네이버 블로그 최적화. 검색 시 클릭되는 제목. 키워드를 앞부분에 배치하고 정보성을 강조. 네이버 사용자는 실용적인 정보를 기대함.',
      google: '구글 SEO 최적화. 검색 의도를 명확히 매칭하는 제목. 브랜드/신뢰감을 주는 명확한 정보 전달. 영문 혼용 가능.',
      sns: 'SNS/인스타그램용. 감성적이고 짧으며 임팩트 있는 제목. 이모지 1-2개 자연스럽게 활용 가능. 공유하고 싶어지는 느낌.',
    }

    const APPEAL_GUIDE: Record<string, string> = {
      info_seeker: '정보를 탐색 중인 독자 공략. "무엇인가", "어떻게", "왜", "방법" 형태의 제목이 효과적. 궁금증을 자극하는 방향.',
      purchase_ready: '구매 결정 단계의 독자 공략. 확신을 주는 제목, 비교·추천·후기 형태. "진짜", "솔직히", "결론" 류의 표현 효과적.',
      emotional: '감성/공감 소구. 독자의 감정에 직접 닿는 공감형·스토리형 제목. 경험담, 고민 해결, 변화 스토리 중심.',
      data_driven: '숫자와 팩트 소구. 구체적 수치, 기간, 비율이 들어간 신뢰형 제목. "N일 사용", "N가지 이유", "N% 효과" 형태.',
    }

    const platformKey = platform && PLATFORM_GUIDE[platform] ? platform : 'naver'
    const appealKey = appeal && APPEAL_GUIDE[appeal] ? appeal : 'info_seeker'

    const prompt = `당신은 한국 블로그 SEO 전문가이자 카피라이터입니다.
키워드에 맞는 클릭률(CTR)이 높은 블로그 제목을 ${titleCount}개 생성해주세요.

**키워드:** ${keyword}
${productName ? `**상품명:** ${productName}` : ''}
**검색 플랫폼:** ${PLATFORM_GUIDE[platformKey]}
**클릭 소구 방향:** ${APPEAL_GUIDE[appealKey]}

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
- 위에 설정된 플랫폼과 소구 방향을 반드시 반영
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

    return NextResponse.json({ titles: parsed.titles, keyword, platform: platformKey, appeal: appealKey })
  } catch (error) {
    console.error('[title-test] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '제목 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
