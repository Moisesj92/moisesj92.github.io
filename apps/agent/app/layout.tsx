import { type Metadata } from 'next'

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
      </body>
    </html>
  )
}
