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

const FALLBACK: PlatformConfig = {
  name: '링크',
  icon: FaBlogger,
  bg: '#6B7280',
  fg: '#fff',
}

interface SnsLinksProps {
  variant?: 'bar' | 'sidebar'
}

export default function SnsLinks({ variant = 'bar' }: SnsLinksProps) {
  const [links, setLinks] = useState<SnsLink[]>([])

  useEffect(() => {
    fetch('/api/sns')
      .then(r => r.json())
      .then(data => setLinks(data.links || []))
      .catch(() => {})
  }, [])

  if (links.length === 0) return null

  if (variant === 'sidebar') {
    return (
      <div className="flex items-center gap-1.5 flex-wrap px-1">
        {links.map((link) => {
          const p = SNS_PLATFORMS[link.platform] ?? FALLBACK
          const Icon = p.icon
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              style={{ backgroundColor: p.bg, color: p.fg }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-75 hover:scale-110 transition-all duration-150 flex-shrink-0"
            >
              <Icon size={14} />
            </a>
          )
        })}
      </div>
    )
  }

  // bar variant: 로그인/가입/대기 화면 하단
  return (
    <div className="mt-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="h-px w-12 bg-white/20" />
        <p className="text-white/40 text-xs">팔로우하기</p>
        <div className="h-px w-12 bg-white/20" />
      </div>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {links.map((link) => {
          const p = SNS_PLATFORMS[link.platform] ?? FALLBACK
          const Icon = p.icon
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              style={{ backgroundColor: p.bg, color: p.fg }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold hover:opacity-90 hover:scale-105 transition-all duration-150 shadow-sm"
            >
              <Icon size={14} />
              <span>{link.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
