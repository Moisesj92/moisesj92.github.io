import { Layout } from '@/components/Layout'
import { tenantMetadata } from '../_lib/metadata'
import { loadTenant } from '../_lib/tenant-server'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return tenantMetadata(await loadTenant())
}

/** Tenant por defecto (DEFAULT_TENANT) en la raíz del sitio. */
export default async function DefaultTenantLayout({ children }: { children: React.ReactNode }) {
  const tenant = await loadTenant()
  return <Layout tenant={tenant}>{children}</Layout>
}
