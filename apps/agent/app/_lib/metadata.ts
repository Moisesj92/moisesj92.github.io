import type { Metadata } from 'next'

import type { TenantPublic } from '@/core/tenant/public'

/** Título, descripción y Open Graph de un tenant. */
export function tenantMetadata(tenant: TenantPublic): Metadata {
  const title = `Asistente de voz — ${tenant.displayName}`
  return {
    title: { template: `%s — ${tenant.displayName}`, default: title },
    description: tenant.intro,
    openGraph: { type: 'website', siteName: title, locale: 'es_CL', title, description: tenant.intro },
    twitter: { card: 'summary_large_image', title, description: tenant.intro },
  }
}
