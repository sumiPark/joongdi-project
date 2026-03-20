import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// 승인/거절 처리
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 관리자 확인
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { userId, status } = await request.json()

    if (!userId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: '올바르지 않은 요청입니다.' }, { status: 400 })
    }

    // service role로 업데이트 (RLS 우회)
    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/approve] Error:', error)
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 관리자 권한 토글
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { userId, isAdmin } = await request.json()

    if (!userId || typeof isAdmin !== 'boolean') {
      return NextResponse.json({ error: '올바르지 않은 요청입니다.' }, { status: 400 })
    }

    // 자기 자신의 관리자 권한 해제 방지
    if (userId === user.id && !isAdmin) {
      return NextResponse.json({ error: '자신의 관리자 권한은 해제할 수 없습니다.' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from('profiles')
      .update({ is_admin: isAdmin, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/approve PATCH] Error:', error)
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
