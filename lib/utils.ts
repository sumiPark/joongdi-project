import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const STYLE_LABELS: Record<string, string> = {
  friendly: '친근형',
  expert: '전문가형',
  influencer: '인플루언서형',
  trustworthy: '신뢰형',
  storytelling: '스토리형',
}

export const PURPOSE_LABELS: Record<string, string> = {
  informative: '정보형',
  review: '후기형',
  comparison: '비교형',
  recommendation: '추천형',
  experience: '체험형',
  conversion: '전환형',
}

export const LENGTH_LABELS: Record<string, string> = {
  short: '짧게',
  medium: '보통',
  long: '길게',
}
