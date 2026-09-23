import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { getDictionary, localePath, locales, type Locale } from '@/i18n'
import { site } from '@/lib/site'

import '@/styles/tailwind.css'

/** Metadata base por locale; cada página añade su `title`/`description`. */
export function buildMetadata(locale: Locale): Metadata {
  let t = getDictionary(locale)
  return {
    metadataBase: new URL(site.url),
    title: { template: t.meta.titleTemplate, default: t.meta.title },
    description: t.meta.description,
    alternates: {
      canonical: localePath(locale, '/'),
      languages: Object.fromEntries(locales.map((l) => [l, localePath(l, '/')])),
    },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title: t.meta.title,
      description: t.meta.description,
      url: localePath(locale, '/'),
      locale: locale === 'es' ? 'es_CL' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: t.meta.title,
      description: t.meta.description,
    },
  }
}

export function RootLayout({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return (
    <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-zinc-50 dark:bg-black">
        <Providers>
          <div className="flex w-full">
            <Layout locale={locale}>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
