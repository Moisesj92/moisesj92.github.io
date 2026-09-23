import { notFound } from 'next/navigation'

import { resolveTenantId, TenantNotFoundError } from '@/core/config/load'
import { getTenantRuntime } from '@/core/runtime'
import { tenantPublic, type TenantPublic } from '@/core/tenant/public'

/** Carga lo público de un tenant para un layout o página de servidor; 404 si no existe. */
export async function loadTenant(requested?: string): Promise<TenantPublic> {
  try {
    const id = resolveTenantId(requested ?? null)
    const { config } = await getTenantRuntime(id)
    return tenantPublic(config, id === resolveTenantId(null))
  } catch (err) {
    if (err instanceof TenantNotFoundError) notFound()
    throw err
  }
}
