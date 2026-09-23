import { OG_SIZE, renderOgImage } from '../_lib/og-image'

export const dynamic = 'force-dynamic'
export const alt = 'Asistente de voz'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return renderOgImage()
}
