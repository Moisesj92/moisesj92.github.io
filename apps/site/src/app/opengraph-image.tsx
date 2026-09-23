import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

import { site } from '@/lib/site'

export const alt = 'Arsenio Jiménez — Desarrollador Full Stack'
export const dynamic = 'force-static'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Vista previa al compartir el enlace (LinkedIn, WhatsApp, X). Se genera
 * en el build: avatar, nombre, rol y dominio sobre la paleta del sitio.
 */
export default async function OpenGraphImage() {
  const avatar = await readFile(path.join(process.cwd(), 'src/images/avatar.jpg'))
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
          <div style={{ fontSize: 30, color: '#14b8a6', fontWeight: 600, letterSpacing: 1 }}>&lt;AJ/&gt;</div>
          <div style={{ fontSize: 74, fontWeight: 700, color: '#27272a', lineHeight: 1.05, letterSpacing: -2 }}>{site.name}</div>
          <div style={{ fontSize: 36, color: '#52525b', lineHeight: 1.3 }}>
            Desarrollador Full Stack · Node.js · React / Next.js · Ruby on Rails · Laravel
          </div>
          <div style={{ marginTop: 28, fontSize: 28, color: '#71717a' }}>{site.url.replace(/^https?:\/\//, '')}</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renderiza HTML plano */}
        <img
          src={avatarSrc}
          alt=""
          width={320}
          height={320}
          style={{ borderRadius: 160, objectFit: 'cover', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
        />
      </div>
    ),
    size,
  )
}
