import Link from 'next/link'

import { ContainerInner, ContainerOuter } from '@/components/Container'
import { nav, site } from '@/lib/site'

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="transition hover:text-teal-500 dark:hover:text-teal-400"
    >
      {children}
    </Link>
  )
}

export function Footer() {

  return (
    <footer className="mt-32 flex-none">
      <ContainerOuter>
        <div className="border-t border-zinc-100 pt-10 pb-16 dark:border-zinc-700/40">
          <ContainerInner>
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                <NavLink href={site.url}>{nav.portfolio}</NavLink>
                <NavLink href={`${site.url}/projects`}>{nav.projects}</NavLink>
                <NavLink href="/arquitectura">{nav.architecture}</NavLink>
                <NavLink href="/debug">{nav.debug}</NavLink>
                <NavLink href="/privacidad">{nav.privacy}</NavLink>
              </div>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                &copy; {new Date().getFullYear()} {site.name}. {nav.rights}
              </p>
            </div>
          </ContainerInner>
        </div>
      </ContainerOuter>
    </footer>
  )
}
