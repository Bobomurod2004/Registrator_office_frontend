import type { Locale } from '@/i18n/messages'

export function formatDateTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === 'RU' ? 'ru-RU' : 'en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
