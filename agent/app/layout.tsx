import { type Metadata } from 'next'

import { Layout } from '@/components/Layout'
import { Providers } from '@/components/Providers'
import { site } from '@/lib/site'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_AGENT_URL ?? 'https://voice-agent-flax-six.vercel.app'),
  title: { template: `%s — ${site.name}`, default: `Asistente de voz — ${site.name}` },
  description: 'Habla con el asistente de voz de Arsenio Jiménez: responde sobre su experiencia y sus proyectos solo con información verificada.',
  openGraph: {
    type: 'website',
    siteName: `Asistente de voz — ${site.name}`,
    locale: 'es_CL',
  },
  twitter: { card: 'summary_large_image' },
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
