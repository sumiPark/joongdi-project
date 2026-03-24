import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('sns_links')
    .select('id, platform, label, url, display_order')
    .eq('enabled', true)
    .order('display_order')
  return NextResponse.json({ links: data || [] })
}
