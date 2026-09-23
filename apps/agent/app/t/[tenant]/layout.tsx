import { Layout } from '@/components/Layout'
import { tenantMetadata } from '../../_lib/metadata'
import { loadTenant } from '../../_lib/tenant-server'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  return tenantMetadata(await loadTenant(tenant))
}

/** Cualquier otro tenant, por path: /t/<id>. */
export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: id } = await params
  const tenant = await loadTenant(id)
  return <Layout tenant={tenant}>{children}</Layout>
}
