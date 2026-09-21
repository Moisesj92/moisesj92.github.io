import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** Icono al guardar el sitio en la pantalla de inicio (iOS/Android). Mismo monograma que el favicon. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#18181b',
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 72,
          fontWeight: 700,
          color: '#14b8a6',
        }}
      >
        &lt;<span style={{ color: '#fafafa' }}>AJ</span>/&gt;
      </div>
    ),
    size,
  )
}
