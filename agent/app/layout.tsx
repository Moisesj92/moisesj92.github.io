import { type Metadata } from 'next'

import { Layout } from '@/components/Layout'
import { Providers } from '@/components/Providers'
import { site } from '@/lib/site'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  title: { template: `%s — ${site.name}`, default: `Asistente de voz — ${site.name}` },
  description: 'Agente de voz de dominio cerrado con recuperación trazable.',
}

/** Misma estructura que RootLayout del portafolio, sin locales. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-zinc-50 dark:bg-black">
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
