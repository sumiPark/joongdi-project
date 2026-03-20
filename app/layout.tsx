import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'joongdi Content OS',
  description: '데이터 기반 블로그 콘텐츠 자동 생성 플랫폼 - 애드센스/애드포스트 최적화',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              fontSize: '14px',
              fontFamily: 'Pretendard, sans-serif',
            },
            success: {
              iconTheme: { primary: '#4ade80', secondary: '#1f2937' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#1f2937' },
            },
          }}
        />
      </body>
    </html>
  )
}
