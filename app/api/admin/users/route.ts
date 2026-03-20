import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    // 요청자가 관리자인지 확인
    const { data: requester } = await adminSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!requester?.is_admin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    // 전체 프로필 조회
    const { data: profiles, error } = await adminSupabase
      .from('profiles')
      .select('id, email, name, status, is_admin, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('[admin/users] Error:', error)
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
