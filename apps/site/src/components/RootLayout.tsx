import { type Metadata } from 'next'
import Script from 'next/script'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { OriginTracker } from '@/components/OriginTracker'
import { defaultLocale, getDictionary, localePath, locales, type Locale } from '@/i18n'
import { absoluteUrl, ogImage, site } from '@/lib/site'

import '@/styles/tailwind.css'

/** Canonical propio de la ruta y sus hreflang (x-default apunta al español). */
function alternates(locale: Locale, path: string): Metadata['alternates'] {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, localePath(l, path)])),
      'x-default': localePath(defaultLocale, path),
    },
  }
}

function social(locale: Locale, path: string, title: string, description: string): Metadata {
  return {
    openGraph: {
      type: 'website',
      siteName: site.name,
      title,
      description,
      url: localePath(locale, path),
      locale: locale === 'es' ? 'es_CL' : 'en_US',
      images: [{ ...ogImage, alt: `${site.name} — ${getDictionary(locale).meta.role}` }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage.url] },
  }
}

/** Metadata base por locale (portada); las demás páginas usan `pageMetadata`. */
export function buildMetadata(locale: Locale): Metadata {
  let t = getDictionary(locale)
  return {
    metadataBase: new URL(site.url),
    title: { template: t.meta.titleTemplate, default: t.meta.title },
    description: t.meta.description,
    alternates: alternates(locale, '/'),
    ...social(locale, '/', t.meta.title, t.meta.description),
    /* Propiedad "Prefijo de URL" en Search Console (github.io no admite verificación por DNS). */
    verification: { google: 'qpZqWOHEU-7hmVAnN6e-pWBnixbo9NiGv_mzKS7RXVg' },
  }
}

/**
 * Metadata de una subpágina. Sin esto heredaría el canonical de la portada
 * y Google la trataría como duplicada.
 */
export function pageMetadata(
  locale: Locale,
  path: string,
  { title, description }: { title: string; description: string },
): Metadata {
  let t = getDictionary(locale)
  return {
    title,
    description,
    alternates: alternates(locale, path),
    ...social(locale, path, t.meta.titleTemplate.replace('%s', title), description),
  }
}

/** Datos estructurados de la persona: nombre, rol y perfiles para Google. */
function personJsonLd(locale: Locale) {
  let t = getDictionary(locale)
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': absoluteUrl('/#person'),
    name: site.name,
    url: absoluteUrl(localePath(locale, '/')),
    image: absoluteUrl(ogImage.url),
    jobTitle: 'Software Engineer',
    description: t.meta.description,
    alumniOf: { '@type': 'CollegeOrUniversity', name: t.educationList[0].school },
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'degree',
      name: t.educationList[0].degree,
    },
    address: { '@type': 'PostalAddress', addressLocality: 'Santiago', addressCountry: 'CL' },
    knowsLanguage: ['es', 'en'],
    knowsAbout: t.home.stack.split(' · '),
    sameAs: [site.github, site.linkedin],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(locale)) }}
        />
        <OriginTracker />
        {/* Sin cookies ni IPs. data-domains evita contar las visitas de localhost. */}
        <Script
          src={site.analytics.src}
          data-website-id={site.analytics.websiteId}
          data-domains={site.analytics.domain}
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
