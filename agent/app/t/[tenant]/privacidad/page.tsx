import { PrivacyContent } from '../../../(default)/privacidad/content'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Privacidad' }

export default async function Page({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  return <PrivacyContent tenant={tenant} />
}
