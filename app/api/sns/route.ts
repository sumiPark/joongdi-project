import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('sns_links')
    .select('id, platform, label, url, display_order, enabled')
    .order('display_order')
  return NextResponse.json({ links: data || [], error: error?.message ?? null })
}
