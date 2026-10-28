import { type MetadataRoute } from 'next'

import { localePath, locales, type Locale } from '@/i18n'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-static'

const paths = ['/', '/about', '/projects']

/* Con trailingSlash las páginas se sirven en /ruta/; el sitemap debe coincidir con el canonical. */
function pageUrl(locale: Locale, path: string) {
  return absoluteUrl(localePath(locale, path).replace(/\/?$/, '/'))
}

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    paths.map((path) => ({
      url: pageUrl(locale, path),
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, pageUrl(l, path)])),
      },
    })),
  )
}
