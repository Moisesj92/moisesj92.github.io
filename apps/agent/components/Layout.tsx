import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import type { TenantPublic } from '@/core/tenant/public'

export function Layout({ tenant, children }: { tenant: TenantPublic; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 flex justify-center sm:px-8">
        <div className="flex w-full max-w-7xl lg:px-8">
          <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
        </div>
      </div>
      <div className="relative flex w-full flex-col">
        <Header tenant={tenant} />
        <main className="flex-auto">{children}</main>
        <Footer tenant={tenant} />
      </div>
    </>
  )
}
