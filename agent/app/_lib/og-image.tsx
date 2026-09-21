import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

import { resolveTenantId } from '@/core/config/load'
import { getTenantRuntime } from '@/core/runtime'

export const OG_SIZE = { width: 1200, height: 630 }

const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml' }

/** Vista previa al compartir. Mismo diseño que la del portafolio, con nombre, intro y avatar del tenant. */
export async function renderOgImage(requested?: string) {
  const id = resolveTenantId(requested ?? null)
  const { config } = await getTenantRuntime(id)
  const file = config.brand.avatar
  const avatar = file ? await readFile(path.join(process.cwd(), 'tenants', id, file)) : await readFile(path.join(process.cwd(), 'images/avatar.jpg'))
  const mime = MIME[(file ?? 'avatar.jpg').split('.').pop() ?? 'jpg'] ?? 'image/jpeg'
  const avatarSrc = `data:${mime};base64,${avatar.toString('base64')}`
  const domain = (process.env.NEXT_PUBLIC_AGENT_URL ?? 'https://voice-agent-flax-six.vercel.app').replace(/^https?:\/\//, '')

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
          <div style={{ fontSize: 30, color: config.brand.primaryColor, fontWeight: 600, letterSpacing: 1 }}>asistente de voz</div>
          <div style={{ fontSize: 66, fontWeight: 700, color: '#27272a', lineHeight: 1.05, letterSpacing: -2 }}>
            {`Habla con el asistente de ${config.displayName}`}
          </div>
          <div style={{ fontSize: 34, color: '#52525b', lineHeight: 1.3 }}>{config.ui.intro}</div>
          <div style={{ marginTop: 24, fontSize: 28, color: '#71717a' }}>{domain}</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renderiza HTML plano, no React DOM */}
        <img
          src={avatarSrc}
          alt=""
          width={300}
          height={300}
          style={{ borderRadius: 150, objectFit: 'cover', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
        />
      </div>
    ),
    OG_SIZE,
  )
}
