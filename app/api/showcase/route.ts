import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data } = await supabase
    .from('blog_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json({ profiles: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('name, status').eq('id', user.id).single()
  if (!profile || profile.status !== 'approved') {
    return NextResponse.json({ error: '승인된 사용자만 이용할 수 있습니다.' }, { status: 403 })
  }

  const { blog_name, blog_url, description } = await request.json()
  if (!blog_name?.trim() || !blog_url?.trim()) {
    return NextResponse.json({ error: '블로그 이름과 URL을 입력해주세요.' }, { status: 400 })
  }

  const urlPattern = /^https?:\/\/.+/
  if (!urlPattern.test(blog_url.trim())) {
    return NextResponse.json({ error: 'URL은 http:// 또는 https://로 시작해야 합니다.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('blog_profiles')
    .upsert({
      user_id: user.id,
      author_name: profile.name || user.email?.split('@')[0] || '익명',
      blog_name: blog_name.trim(),
      blog_url: blog_url.trim(),
      description: description?.trim() || null,
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { error } = await supabase
    .from('blog_profiles')
    .delete()
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
