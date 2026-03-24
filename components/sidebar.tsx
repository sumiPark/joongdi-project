'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import NotificationBell from './NotificationBell'
import {
  PenLine,
  Layers,
  History,
  LogOut,
  LayoutDashboard,
  Users,
  ChevronRight,
  FlaskConical,
  BookOpen,
  Megaphone,
  MessageCircle,
  HelpCircle,
  Settings2,
  Globe,
  Share2,
} from 'lucide-react'
import SnsLinks from './SnsLinks'

interface SidebarProps {
  isAdmin?: boolean
  userName?: string
  userId?: string
  featureSettings?: Record<string, boolean>
}

const generateNavItems = [
  { href: '/dashboard/generate', label: '콘텐츠 생성', icon: PenLine, featureKey: 'generate' },
  { href: '/dashboard/bulk', label: '대량 생성', icon: Layers, featureKey: 'bulk' },
  { href: '/dashboard/title-test', label: '제목 A/B 테스트', icon: FlaskConical, featureKey: 'title_test' },
  { href: '/dashboard/series', label: '시리즈 글 생성', icon: BookOpen, featureKey: 'series' },
]

const boardNavItems = [
  { href: '/dashboard/board/notice', label: '공지사항', icon: Megaphone },
  { href: '/dashboard/board/free', label: '자유 게시판', icon: MessageCircle },
  { href: '/dashboard/board/qna', label: 'QnA', icon: HelpCircle },
  { href: '/dashboard/showcase', label: '블로그 쇼케이스', icon: Globe },
]

const adminNavItems = [
  { href: '/admin', label: '관리자 홈', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: '회원 관리', icon: Users, exact: false },
  { href: '/admin/features', label: '기능 관리', icon: Settings2, exact: false },
  { href: '/admin/sns', label: 'SNS 채널 관리', icon: Share2, exact: false },
]

export default function Sidebar({ isAdmin = false, userName, userId, featureSettings }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = isAdmin ? adminNavItems : []

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('로그아웃 되었습니다.')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-brand-950 text-white flex flex-col h-full fixed left-0 top-0 bottom-0 z-40">
      {/* 로고 */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
            ✍️
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">joongdi</p>
            <p className="text-brand-400 text-xs">Content OS</p>
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 p-4 overflow-y-auto space-y-1">
        {isAdmin ? (
          <>
            <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider px-3 mb-3">
              관리자 메뉴
            </div>
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-brand-300 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} className="opacity-60" />}
                </Link>
              )
            })}
            <div className="border-t border-white/10 my-3" />
          </>
        ) : (
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname === '/dashboard'
                ? 'bg-brand-600 text-white'
                : 'text-brand-300 hover:bg-white/10 hover:text-white'
            )}
          >
            <LayoutDashboard size={18} className="flex-shrink-0" />
            <span className="flex-1">대시보드</span>
            {pathname === '/dashboard' && <ChevronRight size={14} className="opacity-60" />}
          </Link>
        )}

        {/* 게시판 */}
        <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider px-3 pt-2 pb-1">
          게시판
        </div>
        {boardNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-brand-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          )
        })}

        {/* 콘텐츠 생성 메뉴 */}
        <div className="border-t border-white/10 my-3" />
        <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider px-3 pb-1">
          콘텐츠 생성
        </div>
        {generateNavItems.map((item) => {
          const enabled = featureSettings ? (featureSettings[item.featureKey] !== false) : true
          if (!enabled && !isAdmin) return null
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                !enabled && isAdmin
                  ? 'opacity-40 text-brand-300 hover:bg-white/10 hover:text-white hover:opacity-70'
                  : isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-brand-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {!enabled && isAdmin
                ? <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-brand-400">OFF</span>
                : isActive && <ChevronRight size={14} className="opacity-60" />
              }
            </Link>
          )
        })}

        <Link
          href="/dashboard/history"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            pathname.startsWith('/dashboard/history')
              ? 'bg-brand-600 text-white'
              : 'text-brand-300 hover:bg-white/10 hover:text-white'
          )}
        >
          <History size={18} className="flex-shrink-0" />
          <span className="flex-1">생성 기록</span>
          {pathname.startsWith('/dashboard/history') && <ChevronRight size={14} className="opacity-60" />}
        </Link>
      </nav>

      {/* SNS 채널 위젯 */}
      <SnsLinks variant="sidebar" />

      {/* 하단 유저 정보 */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {userName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName || '사용자'}</p>
            {isAdmin && <p className="text-xs text-brand-400">관리자</p>}
          </div>
          {userId && <NotificationBell userId={userId} />}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-300 hover:bg-white/10 hover:text-white transition-all duration-150 w-full"
        >
          <LogOut size={18} />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  )
}
