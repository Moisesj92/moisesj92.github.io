import { type Metadata } from 'next'
import Script from 'next/script'

import { Providers } from '@/components/Providers'

import '@/styles/tailwind.css'

/** Lo que no depende del tenant. Título, descripción y Open Graph los pone cada layout de tenant. */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_AGENT_URL ?? 'https://voice-agent-flax-six.vercel.app'),
  title: 'Asistente de voz',
  description: 'Agente de voz de dominio cerrado con recuperación trazable.',
}

/** Solo html/body y providers. El marco (header, footer) lo pone cada grupo de rutas según el tenant. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-zinc-50 dark:bg-black">
        <Providers>
          <div className="flex w-full">{children}</div>
        </Providers>
        {/* Umami autoalojado: sin cookies ni IPs. data-domains deja fuera localhost y los previews. */}
        <Script
          src="https://umami-ivory-one.vercel.app/stats"
          data-website-id="1e39de10-4e2b-4b91-8918-c77f1b40ed5f"
          data-domains="voice-agent-flax-six.vercel.app"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
