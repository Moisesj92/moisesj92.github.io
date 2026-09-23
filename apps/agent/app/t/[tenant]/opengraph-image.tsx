import { OG_SIZE, renderOgImage } from '../../_lib/og-image'

export const dynamic = 'force-dynamic'
export const alt = 'Asistente de voz'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function OpenGraphImage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  return renderOgImage(tenant)
}
