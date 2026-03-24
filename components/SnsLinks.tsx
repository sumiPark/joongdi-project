'use client'

import { useEffect, useState } from 'react'
import {
  FaInstagram, FaYoutube, FaFacebook, FaTiktok,
  FaLinkedin, FaDiscord, FaBlogger,
} from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { SiNaver, SiKakaotalk } from 'react-icons/si'
import type { IconType } from 'react-icons'

interface SnsLink {
  id: string
  platform: string
  label: string
  url: string
}

interface PlatformConfig {
  name: string
  icon: IconType
  bg: string
  fg: string
}

export const SNS_PLATFORMS: Record<string, PlatformConfig> = {
  instagram: { name: 'Instagram',   icon: FaInstagram, bg: '#E1306C', fg: '#fff' },
  youtube:   { name: 'YouTube',     icon: FaYoutube,   bg: '#FF0000', fg: '#fff' },
  twitter:   { name: 'X (Twitter)', icon: FaXTwitter,  bg: '#000000', fg: '#fff' },
  facebook:  { name: 'Facebook',    icon: FaFacebook,  bg: '#1877F2', fg: '#fff' },
  kakao:     { name: 'KakaoTalk',   icon: SiKakaotalk, bg: '#FEE500', fg: '#3B1F1F' },
  naver:     { name: 'Naver Blog',  icon: SiNaver,     bg: '#03C75A', fg: '#fff' },
  tiktok:    { name: 'TikTok',      icon: FaTiktok,    bg: '#010101', fg: '#fff' },
  linkedin:  { name: 'LinkedIn',    icon: FaLinkedin,  bg: '#0A66C2', fg: '#fff' },
  blog:      { name: '블로그',       icon: FaBlogger,   bg: '#FF7A00', fg: '#fff' },
  discord:   { name: 'Discord',     icon: FaDiscord,   bg: '#5865F2', fg: '#fff' },
}

export const FALLBACK_PLATFORM: PlatformConfig = {
  name: '링크',
  icon: FaBlogger,
  bg: '#6B7280',
  fg: '#fff',
}

interface SnsLinksProps {
  /** topbar: 로그인/가입 상단 배너 | sidebar: 사이드바 채널 목록 */
  variant?: 'topbar' | 'sidebar'
}

export default function SnsLinks({ variant = 'topbar' }: SnsLinksProps) {
  const [links, setLinks] = useState<SnsLink[]>([])

  useEffect(() => {
    fetch('/api/sns')
      .then(r => r.json())
      .then(data => setLinks(data.links || []))
      .catch(() => {})
  }, [])

  if (links.length === 0) return null

  /* ── 로그인/가입/대기 화면 상단 - SNS 가로 카드 ── */
  if (variant === 'topbar') {
    return (
      <div className="w-full bg-black/25 backdrop-blur-md border-b border-white/10 py-2.5 px-4">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-white/35 text-[10px] font-semibold tracking-widest uppercase mr-1">
            팔로우
          </span>
          {links.map((link) => {
            const p = SNS_PLATFORMS[link.platform] ?? FALLBACK_PLATFORM
            const Icon = p.icon
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/25 rounded-xl px-3 py-2 transition-all duration-200 hover:scale-105 shadow-md"
              >
                <div
                  style={{ backgroundColor: p.bg, color: p.fg }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                >
                  <Icon size={14} />
                </div>
                <span className="text-white/75 group-hover:text-white text-xs font-semibold transition-colors whitespace-nowrap">
                  {link.label}
                </span>
              </a>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── 사이드바 - 수평 스크롤 pill 위젯 ── */
  return (
    <div className="mx-3 my-3 rounded-2xl bg-white/5 border border-white/10 p-3">
      <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest mb-2.5 px-1">
        공식 채널
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {links.map((link) => {
          const p = SNS_PLATFORMS[link.platform] ?? FALLBACK_PLATFORM
          const Icon = p.icon
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: p.bg, color: p.fg }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold hover:opacity-85 transition-opacity flex-shrink-0 shadow-md"
            >
              <Icon size={11} />
              <span>{link.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
