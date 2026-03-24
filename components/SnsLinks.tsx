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

  /* ── 로그인/가입/대기 화면 상단 - 앱 아이콘 위젯 ── */
  if (variant === 'topbar') {
    return (
      <div className="w-full bg-black/30 backdrop-blur-md border-b border-white/10 py-3 px-4">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {links.map((link) => {
            const p = SNS_PLATFORMS[link.platform] ?? FALLBACK_PLATFORM
            const Icon = p.icon
            const shortLabel = link.label.length > 8 ? link.label.slice(0, 8) : link.label
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                title={link.label}
                className="flex flex-col items-center gap-1 hover:scale-110 transition-transform duration-150"
              >
                <div
                  style={{ backgroundColor: p.bg, color: p.fg }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                >
                  <Icon size={17} />
                </div>
                <span className="text-[9px] text-white/60 font-medium text-center">
                  {shortLabel}
                </span>
              </a>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── 사이드바 - 컬러 pill 버튼 위젯 ── */
  return (
    <div className="mx-3 my-3 rounded-2xl bg-white/5 border border-white/10 p-3">
      <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest mb-2.5 px-1">
        공식 채널
      </p>
      <div className="flex flex-wrap gap-1.5">
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold hover:opacity-85 hover:scale-105 transition-all duration-150 shadow-md"
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
