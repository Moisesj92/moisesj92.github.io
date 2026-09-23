// i18n para export estático (GitHub Pages): sin middleware ni detección de
// idioma. Español vive en la raíz (/) e inglés bajo /en, cada uno con su
// propio root layout (route groups `(es)` y `(en)` en src/app).
export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'es'

/** Prefija una ruta interna con el locale cuando no es el default. */
export function localePath(locale: Locale, path: string) {
  if (locale === defaultLocale) return path
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

/** Locale de un pathname (usePathname) y la misma ruta sin prefijo. */
export function parsePathname(pathname: string): { locale: Locale; path: string } {
  for (let locale of locales) {
    if (locale === defaultLocale) continue
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      let path = pathname.slice(locale.length + 1) || '/'
      return { locale, path: path.length > 1 ? path.replace(/\/$/, '') : path }
    }
  }
  let path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
  return { locale: defaultLocale, path }
}
