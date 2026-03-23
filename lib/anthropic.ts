import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface GenerateOptions {
  keyword: string
  style: string
  purpose: string
  lengthOption: string
  productName?: string
  productFeatures?: string
  productReviewPoints?: string
  targetCustomers?: string
  targetAudience?: string
}

const TARGET_AUDIENCE_GUIDE: Record<string, string> = {
  young_women: '20-30대 여성. 감성적 공감과 트렌드에 민감하며 실용성 중시. 블로그·인스타로 정보 수집. 친근하고 공감 가는 톤이 효과적.',
  health_middle: '건강에 관심 많은 40-60대. 성분·효능 중심 정보를 선호하며 신뢰와 전문성 중시. 과장 없는 담백한 설명이 효과적.',
  mz_beauty: 'MZ세대 뷰티 관심층. 솔직한 리얼 후기와 가성비를 중시. SNS 공유 가능한 비주얼·감성 콘텐츠 선호.',
}

export interface GeneratedContent {
  title: string
  hook: string
  analysis: string
  pros: string
  cons: string
  target: string
  conclusion: string
}

// ────────────────────────────────────────────────
// 문체별 시스템 페르소나 + 작성 규칙
// ────────────────────────────────────────────────
const STYLE_SYSTEM: Record<string, string> = {
  friendly: `당신은 20-30대 독자와 편하게 대화하는 블로그 작가입니다.
- "~했어요", "~거든요", "~더라고요" 같은 구어체 종결어미 사용
- "솔직히 말하면", "근데 진짜로", "이거 완전" 같은 일상 표현 자연스럽게 삽입
- 독자에게 직접 말 거는 느낌: "혹시 ~해본 적 있어요?", "저만 그런 건 아니죠?"
- 긴 문장보다 짧고 리듬감 있는 문장 선호
- 이모지 1-2개 자연스럽게 포함 가능`,

  expert: `당신은 해당 분야 10년 경력의 전문가 칼럼니스트입니다.
- 정확한 수치, 스펙, 데이터를 근거로 설명
- "실제로", "데이터에 따르면", "전문가 관점에서" 같은 표현으로 신뢰도 확보
- 복잡한 내용을 단계별로 논리적으로 설명
- 수동적이고 중립적인 어조: "~것으로 알려져 있습니다", "~확인됩니다"
- 감정적 표현 최소화, 사실 중심 서술`,

  influencer: `당신은 팔로워 10만 명의 라이프스타일 인플루언서입니다.
- 감탄사와 강조 표현 적극 활용: "완전 대박", "이거 진짜 못 참겠다", "올해 최고 발견"
- 비주얼과 감성 중심 묘사: "색감이 너무 예뻐서", "언박싱할 때 설레는 느낌"
- 트렌드 키워드 자연스럽게 삽입
- 개인 라이프스타일과 연결: "요즘 내 루틴에 꼭 필요한"
- 마지막에 공유/저장 유도 뉘앙스 포함`,

  trustworthy: `당신은 과장 없이 솔직한 리뷰로 신뢰를 쌓아온 블로거입니다.
- 좋은 점과 나쁜 점을 균형 있게 서술
- "광고 아닙니다", "실제로 구매해서 써봤어요" 같은 신뢰 표현
- 구체적인 사용 기간, 빈도, 상황을 명시
- 과장된 표현 없이 담백하게 서술
- 결론에서 "이런 분께는 강추, 이런 분께는 비추" 명확히 제시`,

  storytelling: `당신은 개인 경험을 바탕으로 독자를 끌어당기는 스토리텔러입니다.
- 글 전체가 하나의 이야기 흐름으로 연결
- 시작: 문제 상황이나 계기 ("그날 저는 정말 지쳐있었어요...")
- 중간: 해결 과정과 발견 ("그러다 우연히 찾게 된 게...")
- 끝: 변화와 감동 ("지금은 없으면 안 될 것 같아요")
- 독자가 자신의 이야기처럼 느낄 수 있는 공감 포인트 삽입
- 대화체와 내레이션 자연스럽게 혼합`,
}

// ────────────────────────────────────────────────
// 목적별 구조 가이드 + 섹션별 작성 방향
// ────────────────────────────────────────────────
const PURPOSE_GUIDE: Record<string, {
  hook: string
  analysis: string
  pros: string
  cons: string
  target: string
  conclusion: string
}> = {
  informative: {
    hook: '독자가 궁금해할 핵심 정보나 의외의 사실로 시작. "많은 분들이 모르는 ~의 진실" 류의 궁금증 유발',
    analysis: '제품/주제의 스펙, 성분, 원리, 작동 방식을 객관적으로 상세 설명. 수치와 사실 중심',
    pros: '검증된 장점 3-5가지를 근거와 함께 서술. 단순 나열이 아닌 왜 좋은지 설명',
    cons: '실제 한계점이나 아쉬운 점 1-3가지. 신뢰도를 위해 솔직하게',
    target: '이 정보가 특히 유용한 대상을 구체적으로 명시 (나이, 상황, 니즈)',
    conclusion: '핵심 정보 요약 + 더 알아보고 싶은 독자를 위한 자연스러운 안내',
  },
  review: {
    hook: '실제 구매/사용 전 고민했던 상황으로 시작. 독자의 공감을 이끌어내는 현실적 고민',
    analysis: '실제 사용 경험 기반 분석. 처음 받았을 때 느낌, 사용해보니 알게 된 점, 시간이 지나도 변함없는 점',
    pros: '실제 사용에서 느낀 장점. "이 부분이 진짜 좋았던 이유는..." 형식으로 구체적으로',
    cons: '솔직한 불편함이나 아쉬움. 개선됐으면 하는 점도 포함. 이 덕분에 더 신뢰감',
    target: '어떤 사람에게 잘 맞을지, 어떤 사람은 다른 걸 고려하면 좋을지',
    conclusion: '재구매 의향, 지인 추천 여부로 마무리. 실제 사용자의 최종 평가',
  },
  comparison: {
    hook: '비교가 필요한 이유나 선택의 어려움 공감으로 시작. "어떤 걸 살지 고민된다면"',
    analysis: '경쟁 제품/대안과의 핵심 차이점 분석. 가격, 성능, 디자인, 활용도 등 기준별 비교',
    pros: '비교 대상 대비 뚜렷한 우위 3-5가지. 왜 이게 더 나은 선택인지',
    cons: '비교 대상이 더 나은 케이스도 언급. 균형 있는 시각',
    target: '어떤 상황/니즈를 가진 사람에게 이 선택이 최적인지 명확히',
    conclusion: '최종 추천 정리. 상황별 선택 가이드로 마무리',
  },
  recommendation: {
    hook: '독자의 구매 욕구를 자극하는 강렬한 오프닝. 갖고 싶어지는 감정 유발',
    analysis: '제품이 왜 지금 필요한지, 어떤 가치를 제공하는지 설득력 있게 설명',
    pros: '구매해야 할 이유 3-5가지를 임팩트 있게. 실생활 변화 중심으로',
    cons: '가볍게 언급하되 "그럼에도 불구하고" 뉘앙스로 전환',
    target: '이 제품이 꼭 필요한 사람의 프로필. 독자가 "나다!" 느끼도록',
    conclusion: '지금 구매해야 할 이유 (한정, 시즌, 가성비 등) + 자연스러운 행동 유도',
  },
  experience: {
    hook: '체험이 시작된 계기나 첫 만남의 순간. 생생한 묘사로 독자를 현장에 데려가기',
    analysis: '체험 과정을 시간 순서대로 또는 단계별로. 사소한 디테일도 생생하게',
    pros: '체험을 통해 느낀 감동이나 발견. "이걸 알고 나서 삶이 달라진 것들"',
    cons: '체험 중 겪은 어려움이나 아쉬운 순간도 솔직하게',
    target: '이 체험을 추천하고 싶은 사람. 비슷한 상황의 독자에게 직접 말하듯',
    conclusion: '체험 후 달라진 점, 다음에 또 할 의향. 독자도 해보고 싶어지도록',
  },
  conversion: {
    hook: '독자의 핵심 고민이나 욕구를 정확히 짚는 오프닝. "바로 이것 때문에 찾아오셨죠?"',
    analysis: '이 제품/서비스가 그 고민을 해결하는 방식을 명확히. 가치 제안 중심',
    pros: '구매 후 얻게 될 변화와 혜택 3-5가지. 감정적 이득 + 실용적 이득 함께',
    cons: '가볍게만 언급. 바로 "하지만 이런 분께는 이런 이유로 만족도가 높습니다"로 전환',
    target: '구매 결정을 앞둔 독자를 직접 겨냥. "지금 이 글을 보고 있다면 당신이 바로"',
    conclusion: '행동 유도 문구를 자연스럽게. 지금 결정해야 할 이유와 함께 부드럽게 마무리',
  },
}

// ────────────────────────────────────────────────
// 길이별 가이드
// ────────────────────────────────────────────────
const LENGTH_GUIDE: Record<string, { tokens: number; guide: string }> = {
  short: {
    tokens: 1200,
    guide: `각 섹션을 간결하게 작성합니다.
- hook: 2문장
- analysis: 3-4문장
- pros: 2-3가지, 각 1-2문장
- cons: 1가지, 1문장
- target: 2문장
- conclusion: 2문장
전체 본문 합산 400-600자 목표`,
  },
  medium: {
    tokens: 2000,
    guide: `각 섹션을 충분히 작성합니다.
- hook: 3-4문장
- analysis: 5-7문장, 소제목 느낌으로 흐름 있게
- pros: 3-4가지, 각 2-3문장
- cons: 2가지, 각 1-2문장
- target: 3-4문장
- conclusion: 3-4문장
전체 본문 합산 900-1400자 목표`,
  },
  long: {
    tokens: 3500,
    guide: `각 섹션을 풍부하고 상세하게 작성합니다.
- hook: 4-5문장, 강력한 도입부
- analysis: 8-12문장, 세부 항목별로 깊이 있게
- pros: 4-5가지, 각 3-4문장으로 근거 포함
- cons: 2-3가지, 각 2-3문장
- target: 4-5문장, 구체적 상황 시나리오 포함
- conclusion: 4-5문장, 풍부한 마무리
전체 본문 합산 2000-3000자 목표`,
  },
}

// ────────────────────────────────────────────────
// 변형용 후킹 패턴 (대량 생성 시 다양성 확보)
// ────────────────────────────────────────────────
const VARIATION_HOOKS = [
  '질문형으로 시작: 독자에게 직접 질문을 던지며 오프닝',
  '반전형으로 시작: 일반적인 통념을 뒤집는 의외의 사실로 오프닝',
  '숫자/통계형으로 시작: 구체적인 수치나 기간으로 신뢰감 있는 오프닝',
  '공감형으로 시작: 독자의 흔한 고민이나 상황을 먼저 언급하는 오프닝',
  '선언형으로 시작: 강한 주장이나 결론을 먼저 던지는 오프닝',
  '스토리형으로 시작: 짧은 에피소드나 장면 묘사로 시작하는 오프닝',
  '비교형으로 시작: "A vs B" 구도를 제시하며 시작하는 오프닝',
  '문제제기형으로 시작: 독자가 겪는 불편함이나 문제를 먼저 짚는 오프닝',
]

const VARIATION_STRUCTURES = [
  '장점을 먼저 나열한 뒤 단점을 솔직하게 고백하는 구조',
  '단점 언급 후 그것을 뛰어넘는 장점으로 반전시키는 구조',
  '사용 전/사용 후 대비 구조로 변화를 강조',
  '가격 대비 가치를 중심 축으로 전개하는 구조',
  '특정 사용 상황/케이스를 중심으로 분석하는 구조',
]

export function buildPrompt(options: GenerateOptions, variation: number = 0): string {
  const styleSystem = STYLE_SYSTEM[options.style] || STYLE_SYSTEM.trustworthy
  const purposeGuide = PURPOSE_GUIDE[options.purpose] || PURPOSE_GUIDE.informative
  const lengthGuide = LENGTH_GUIDE[options.lengthOption] || LENGTH_GUIDE.medium

  const productContext = options.productName ? `
**상품 정보 (반드시 반영):**
- 상품명: ${options.productName}
${options.productFeatures ? `- 주요 특징/스펙: ${options.productFeatures}` : ''}
${options.productReviewPoints ? `- 실제 후기 포인트: ${options.productReviewPoints}` : ''}
${options.targetCustomers ? `- 주요 타겟: ${options.targetCustomers}` : ''}
` : ''

  const audienceContext = options.targetAudience && TARGET_AUDIENCE_GUIDE[options.targetAudience]
    ? `\n**타겟 독자:** ${TARGET_AUDIENCE_GUIDE[options.targetAudience]}\n`
    : ''

  const variationGuide = variation > 0 ? `
**[변형 지시 - 반드시 준수]**
- 후킹 패턴: ${VARIATION_HOOKS[variation % VARIATION_HOOKS.length]}
- 전개 구조: ${VARIATION_STRUCTURES[variation % VARIATION_STRUCTURES.length]}
- 제목 형식도 이전 글들과 완전히 다르게 (숫자형/질문형/선언형 중 아직 안 쓴 것)
- 같은 키워드라도 완전히 다른 각도에서 접근할 것` : ''

  return `${styleSystem}

---

당신은 지금 애드센스/애드포스트 수익화에 최적화된 한국 블로그 글을 작성합니다.

**키워드:** ${options.keyword}
${productContext}${audienceContext}

**[섹션별 작성 가이드]**

■ title (제목):
- 30자 이내, 키워드 반드시 포함
- 클릭을 유도하는 매력적인 제목
- 위에 설정된 문체 스타일에 맞는 제목 톤

■ hook (후킹 도입부):
${purposeGuide.hook}

■ analysis (핵심 분석):
${purposeGuide.analysis}

■ pros (좋은점):
${purposeGuide.pros}

■ cons (아쉬운점):
${purposeGuide.cons}

■ target (추천 대상):
${purposeGuide.target}

■ conclusion (마무리):
${purposeGuide.conclusion}

**[길이 가이드]**
${lengthGuide.guide}
${variationGuide}

**[필수 준수 사항]**
- 모든 내용은 자연스러운 한국어로 작성 (AI 티 나지 않게)
- 각 섹션은 완성된 문장형으로 작성 (개조식 금지)
- 위에 설정된 문체 페르소나를 글 전체에 일관되게 유지
- 각 섹션의 내용이 서로 자연스럽게 연결되도록

다음 JSON 형식으로만 반환 (다른 텍스트 없이):
{
  "title": "제목",
  "hook": "후킹 도입부",
  "analysis": "핵심 분석",
  "pros": "좋은점",
  "cons": "아쉬운점",
  "target": "추천 대상",
  "conclusion": "마무리"
}`
}

export async function generateContent(options: GenerateOptions, variation: number = 0): Promise<GeneratedContent> {
  const prompt = buildPrompt(options, variation)
  const lengthGuide = LENGTH_GUIDE[options.lengthOption] || LENGTH_GUIDE.medium

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: lengthGuide.tokens,
    temperature: variation > 0 ? 0.9 : 0.7,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const text = response.choices[0]?.message?.content || ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found in response')
    return JSON.parse(jsonMatch[0]) as GeneratedContent
  } catch {
    throw new Error('콘텐츠 파싱 오류: ' + text.slice(0, 200))
  }
}
