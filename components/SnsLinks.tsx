'use client'

import { useEffect, useState } from 'react'

interface SnsLink {
  id: string
  platform: string
  label: string
  url: string
}

export const SNS_PLATFORMS: Record<string, { name: string; bg: string; fg: string; symbol: string }> = {
  instagram: { name: 'Instagram',  bg: '#E1306C', fg: '#fff', symbol: '■' },
  youtube:   { name: 'YouTube',    bg: '#FF0000', fg: '#fff', symbol: '▶' },
  twitter:   { name: 'X (Twitter)',bg: '#000000', fg: '#fff', symbol: 'X' },
  facebook:  { name: 'Facebook',   bg: '#1877F2', fg: '#fff', symbol: 'f' },
  kakao:     { name: 'KakaoTalk',  bg: '#FEE500', fg: '#3B1F1F', symbol: 'K' },
  naver:     { name: 'Naver Blog', bg: '#03C75A', fg: '#fff', symbol: 'N' },
  tiktok:    { name: 'TikTok',     bg: '#010101', fg: '#fff', symbol: '♪' },
  linkedin:  { name: 'LinkedIn',   bg: '#0A66C2', fg: '#fff', symbol: 'in' },
  blog:      { name: '블로그',      bg: '#FF7A00', fg: '#fff', symbol: 'B' },
  discord:   { name: 'Discord',    bg: '#5865F2', fg: '#fff', symbol: 'D' },
  other:     { name: '기타',        bg: '#6B7280', fg: '#fff', symbol: '→' },
}

interface SnsLinksProps {
  /** 'bar' = 로그인/가입 화면 하단, 'sidebar' = 사이드바 하단 소형 아이콘 */
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
          const p = SNS_PLATFORMS[link.platform] ?? SNS_PLATFORMS.other
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              style={{ backgroundColor: p.bg, color: p.fg }}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold hover:opacity-75 transition-opacity flex-shrink-0"
            >
              {p.symbol}
            </a>
          )
        })}
      </div>
    )
  }

  // bar variant: 로그인/가입/대기 화면 하단
  return (
    <div className="mt-6 text-center">
      <p className="text-white/50 text-xs mb-3">팔로우하고 최신 소식을 받아보세요</p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {links.map((link) => {
          const p = SNS_PLATFORMS[link.platform] ?? SNS_PLATFORMS.other
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              style={{ backgroundColor: p.bg, color: p.fg }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:opacity-85 hover:scale-105 transition-all duration-150"
            >
              <span className="text-[11px] font-bold w-4 text-center">{p.symbol}</span>
              <span>{link.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
