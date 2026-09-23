import Link from 'next/link'

import { ContainerInner, ContainerOuter } from '@repo/ui/Container'
import { getDictionary, localePath, type Locale } from '@/i18n'
import { site } from '@/lib/site'

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

export function Footer({ locale }: { locale: Locale }) {
  let t = getDictionary(locale)

  return (
    <footer className="mt-32 flex-none">
      <ContainerOuter>
        <div className="border-t border-zinc-100 pt-10 pb-16 dark:border-zinc-700/40">
          <ContainerInner>
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                <NavLink href={localePath(locale, '/about')}>{t.nav.about}</NavLink>
                <NavLink href={localePath(locale, '/projects')}>{t.nav.projects}</NavLink>
              </div>
              <div className="text-center text-sm text-zinc-400 md:text-right dark:text-zinc-500">
                <p>
                  &copy; {new Date().getFullYear()} {site.name}. {t.footer.rights}
                </p>
                <p className="mt-1 text-xs">
                  {t.footer.photos}{' '}
                  {site.photoCredits.map((c, i) => (
                    <span key={c.url}>
                      <a href={c.url} className="transition hover:text-teal-500" target="_blank" rel="noopener noreferrer">
                        {c.name}
                      </a>
                      {i < site.photoCredits.length - 1 ? ', ' : ' '}
                    </span>
                  ))}
                  {t.footer.on}{' '}
                  <a href="https://unsplash.com" className="transition hover:text-teal-500" target="_blank" rel="noopener noreferrer">
                    Unsplash
                  </a>
                </p>
              </div>
            </div>
          </ContainerInner>
        </div>
      </ContainerOuter>
    </footer>
  )
}
