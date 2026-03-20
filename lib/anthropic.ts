import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
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

const STYLE_PROMPTS: Record<string, string> = {
  friendly: '친근하고 편안한 일상 대화 느낌의 문체로, 독자와 친구처럼 이야기하듯이 작성해주세요.',
  expert: '전문가적이고 신뢰감 있는 문체로, 정보를 정확하고 명확하게 전달하는 방식으로 작성해주세요.',
  influencer: '감성적이고 트렌디한 인플루언서 문체로, SNS에서 인기 있을 스타일로 작성해주세요.',
  trustworthy: '과장 없이 솔직하고 설득력 있는 신뢰형 문체로 작성해주세요. (기본 추천)',
  storytelling: '개인 경험을 기반으로 한 스토리텔링 "썰" 방식으로, 이야기를 풀어가듯 작성해주세요.',
}

const PURPOSE_PROMPTS: Record<string, string> = {
  informative: '제품에 대한 객관적인 정보와 설명을 중심으로 작성합니다. 구체적 스펙과 특징을 명확히 설명하세요.',
  review: '실제 사용자의 후기 느낌으로 작성합니다. 개인적 경험과 솔직한 의견을 담아주세요.',
  comparison: '다른 유사 제품과의 차이점과 비교 우위를 강조하며 작성합니다.',
  recommendation: '구매를 유도하는 방향으로 작성합니다. 제품의 장점을 부각하고 구매 동기를 강화하세요.',
  experience: '사용 과정과 체험을 중심으로 스토리처럼 작성합니다. 처음부터 끝까지의 경험을 담아주세요.',
  conversion: '광고/판매 전환 최적화 구조로 작성합니다. CTA를 자연스럽게 녹이고 구매 욕구를 극대화하세요.',
}

const LENGTH_TOKENS: Record<string, { min: number; max: number; description: string }> = {
  short: { min: 300, max: 600, description: 'SNS/릴스용 짧은 글 (300-600자)' },
  medium: { min: 800, max: 1500, description: '블로그 기본 글 (800-1500자)' },
  long: { min: 2000, max: 3500, description: 'SEO용 상세 글 (2000-3500자)' },
}

export function buildPrompt(options: GenerateOptions, variation: number = 0): string {
  const styleGuide = STYLE_PROMPTS[options.style] || STYLE_PROMPTS.trustworthy
  const purposeGuide = PURPOSE_PROMPTS[options.purpose] || PURPOSE_PROMPTS.informative
  const lengthInfo = LENGTH_TOKENS[options.lengthOption] || LENGTH_TOKENS.medium

  const variationGuide = variation > 0
    ? `\n\n[변형 #${variation + 1}] 이 글은 다른 글들과 완전히 다른 구조, 후킹, 전개 방식을 사용해야 합니다. 독창적으로 작성하세요.`
    : ''

  const productContext = options.productName ? `
**상품 정보:**
- 상품명: ${options.productName}
${options.productFeatures ? `- 주요 특징: ${options.productFeatures}` : ''}
${options.productReviewPoints ? `- 후기 포인트: ${options.productReviewPoints}` : ''}
${options.targetCustomers ? `- 타겟 고객: ${options.targetCustomers}` : ''}
` : ''

  return `당신은 한국 블로그 콘텐츠 전문 작가입니다. 애드센스/애드포스트 수익화에 최적화된 블로그 글을 작성합니다.

**키워드:** ${options.keyword}
${productContext}
**문체 스타일:** ${styleGuide}
**글 목적:** ${purposeGuide}
**글 길이:** ${lengthInfo.description}${variationGuide}

다음 JSON 형식으로 정확히 반환해주세요 (다른 텍스트 없이 JSON만):

{
  "title": "매력적인 블로그 제목 (30자 이내, 키워드 포함)",
  "hook": "독자를 사로잡는 첫 문단 (2-3문장, 궁금증이나 공감 유발)",
  "analysis": "제품/주제 심층 분석 섹션 (핵심 내용, 데이터, 특징 설명)",
  "pros": "좋은점 섹션 (3-5가지 장점을 구체적으로)",
  "cons": "아쉬운점 섹션 (1-3가지 단점 솔직하게, 신뢰도 향상)",
  "target": "추천 대상 섹션 (누구에게 어울리는지 구체적으로)",
  "conclusion": "마무리 섹션 (자연스러운 마무리 + 부드러운 행동 유도)"
}

주의사항:
- 모든 내용은 한국어로 작성
- 자연스럽고 인간이 쓴 것처럼 작성
- 각 섹션은 완성된 문장으로 구성 (개조식 아닌 문장형)
- JSON 형식 외 다른 텍스트 출력 금지`
}

export async function generateContent(options: GenerateOptions, variation: number = 0): Promise<GeneratedContent> {
  const prompt = buildPrompt(options, variation)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found in response')
    return JSON.parse(jsonMatch[0]) as GeneratedContent
  } catch {
    throw new Error('콘텐츠 파싱 오류: ' + text.slice(0, 200))
  }
}
