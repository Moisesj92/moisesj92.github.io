import { type Locale } from '@/i18n/config'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'

export type Dictionary = typeof es

const dictionaries: Record<Locale, Dictionary> = { es, en }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}

export * from '@/i18n/config'
