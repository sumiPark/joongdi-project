import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateContent, type GenerateOptions } from '@/lib/anthropic'

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 승인 여부 확인 (RLS 우회)
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
    const { keyword, style, purpose, lengthOption, productName, productFeatures, productReviewPoints, targetCustomers } = body

    if (!keyword || !style || !purpose || !lengthOption) {
      return NextResponse.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 })
    }

    const options: GenerateOptions = {
      keyword,
      style,
      purpose,
      lengthOption,
      productName,
      productFeatures,
      productReviewPoints,
      targetCustomers,
    }

    // Claude API 호출
    const content = await generateContent(options)

    // DB에 저장
    await supabase.from('generated_content').insert({
      user_id: user.id,
      keyword,
      style,
      purpose,
      length_option: lengthOption,
      product_name: productName || null,
      product_features: productFeatures || null,
      product_review_points: productReviewPoints || null,
      target_customers: targetCustomers || null,
      title: content.title,
      content,
      is_bulk: false,
    })

    return NextResponse.json({ content })
  } catch (error) {
    console.error('[generate] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '글 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
