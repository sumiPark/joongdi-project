'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
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

  /* ── 로그인/가입/대기 화면 상단 배너 ── */
  if (variant === 'topbar') {
    return (
      <div className="w-full bg-black/20 backdrop-blur-sm border-b border-white/10 py-2 px-4">
        <div className="flex items-center justify-center gap-x-4 gap-y-1.5 flex-wrap">
          <span className="text-white/40 text-[11px] font-semibold tracking-widest uppercase">
            공식 채널
          </span>
          <div className="w-px h-3 bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {links.map((link) => {
              const p = SNS_PLATFORMS[link.platform] ?? FALLBACK_PLATFORM
              const Icon = p.icon
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-all duration-150"
                >
                  <span
                    style={{ backgroundColor: p.bg, color: p.fg }}
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  >
                    <Icon size={9} />
                  </span>
                  <span className="text-white/70 text-[11px] font-medium group-hover:text-white transition-colors">
                    {link.label}
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  /* ── 사이드바 채널 목록 ── */
  return (
    <div className="px-4 pb-2">
      <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider px-3 pt-3 pb-2">
        공식 채널
      </div>
      <div className="space-y-0.5">
        {links.map((link) => {
          const p = SNS_PLATFORMS[link.platform] ?? FALLBACK_PLATFORM
          const Icon = p.icon
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-300 hover:bg-white/10 hover:text-white transition-all duration-150 group"
            >
              <span
                style={{ backgroundColor: p.bg, color: p.fg }}
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              >
                <Icon size={12} />
              </span>
              <span className="flex-1 text-sm font-medium">{link.label}</span>
              <ExternalLink size={12} className="opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
            </a>
          )
        })}
      </div>
    </div>
  )
}
