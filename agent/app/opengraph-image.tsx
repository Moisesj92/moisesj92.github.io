import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

import { resolveTenantId } from '@/core/config/load'
import { getTenantRuntime } from '@/core/runtime'

export const dynamic = 'force-dynamic'
export const alt = 'Asistente de voz'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Vista previa al compartir el agente. Mismo diseño que la del portafolio, con el nombre del tenant. */
export default async function OpenGraphImage() {
  const { config } = await getTenantRuntime(resolveTenantId(null))
  const avatar = await readFile(path.join(process.cwd(), 'images/avatar.jpg'))
  const avatarSrc = `data:image/jpeg;base64,${avatar.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '72px 88px',
          background: '#fafafa',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 20 }}>
          <div style={{ fontSize: 30, color: '#14b8a6', fontWeight: 600, letterSpacing: 1 }}>&lt;AJ/&gt; · asistente de voz</div>
          <div style={{ fontSize: 66, fontWeight: 700, color: '#27272a', lineHeight: 1.05, letterSpacing: -2 }}>
            {`Habla con el asistente de ${config.displayName}`}
          </div>
          <div style={{ fontSize: 34, color: '#52525b', lineHeight: 1.3 }}>
            Pregúntale por su experiencia y sus proyectos. Responde solo con información verificada.
          </div>
          <div style={{ marginTop: 24, fontSize: 28, color: '#71717a' }}>
            {(process.env.NEXT_PUBLIC_AGENT_URL ?? 'https://voice-agent-flax-six.vercel.app').replace(/^https?:\/\//, '')}
          </div>
        </div>
        <img
          src={avatarSrc}
          alt=""
          width={300}
          height={300}
          style={{ borderRadius: 150, objectFit: 'cover', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
        />
      </div>
    ),
    size,
  )
}
