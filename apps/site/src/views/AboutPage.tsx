import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

import { Card } from '@repo/ui/Card'
import { Container } from '@repo/ui/Container'
import { Section } from '@repo/ui/Section'
import { GitHubIcon, LinkedInIcon } from '@/components/SocialIcons'
import { getDictionary, type Dictionary, type Locale } from '@/i18n'
import portraitImage from '@/images/portrait.jpg'
import { site } from '@/lib/site'

function SocialLink({
  className,
  href,
  children,
  icon: Icon,
}: {
  className?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <li className={clsx(className, 'flex')}>
      <Link
        href={href}
        className="group flex text-sm font-medium text-zinc-800 transition hover:text-teal-500 dark:text-zinc-200 dark:hover:text-teal-500"
      >
        <Icon className="h-6 w-6 flex-none fill-zinc-500 transition group-hover:fill-teal-500" />
        <span className="ml-4">{children}</span>
      </Link>
    </li>
  )
}

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z"
      />
    </svg>
  )
}

/* Mismo layout que la lista de artículos del template: fecha a la izquierda en md+. */
function Role({ role }: { role: Dictionary['resume'][number] }) {
  let dates = `${role.start.label} — ${role.end.label}`

  return (
    <article className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3">
        <Card.Title as="h3">
          {role.title} · {role.company}
        </Card.Title>
        <Card.Eyebrow as="p" className="md:hidden" decorate>
          {dates}
        </Card.Eyebrow>
        <Card.Description>{role.description}</Card.Description>
      </Card>
      <Card.Eyebrow as="p" className="mt-1 max-md:hidden">
        {dates}
      </Card.Eyebrow>
    </article>
  )
}

export function AboutPage({ locale }: { locale: Locale }) {
  let t = getDictionary(locale)

  return (
    <>
      <Container className="mt-16 sm:mt-32">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-12">
          <div className="lg:pl-20">
            <div className="max-w-xs px-2.5 lg:max-w-none">
              <Image
                src={portraitImage}
                alt=""
                sizes="(min-width: 1024px) 32rem, 20rem"
                className="aspect-square rotate-3 rounded-2xl bg-zinc-100 object-cover dark:bg-zinc-800"
              />
            </div>
          </div>
          <div className="lg:order-first lg:row-span-2">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
              {t.about.title}
            </h1>
            <div className="mt-6 space-y-7 text-base text-zinc-600 dark:text-zinc-400">
              {t.about.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="lg:pl-20">
            <ul role="list">
              <SocialLink href={site.github} icon={GitHubIcon}>
                {t.social.github}
              </SocialLink>
              <SocialLink href={site.linkedin} icon={LinkedInIcon} className="mt-4">
                {t.social.linkedin}
              </SocialLink>
              <SocialLink
                href={`mailto:${site.email}`}
                icon={MailIcon}
                className="mt-8 border-t border-zinc-100 pt-8 dark:border-zinc-700/40"
              >
                {site.email}
              </SocialLink>
            </ul>
          </div>
        </div>
      </Container>

      <Container className="mt-24 sm:mt-32">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
          {t.about.experience}
        </h2>
        <div className="mt-12 md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
          <div className="flex max-w-3xl flex-col space-y-16">
            {t.resume.map((role) => (
              <Role key={role.company} role={role} />
            ))}
          </div>
        </div>
      </Container>

      <Container className="mt-24 sm:mt-32">
        <div className="space-y-20">
          <Section title={t.about.education}>
            <div className="space-y-16">
              {t.educationList.map((item) => (
                <Card as="article" key={item.school}>
                  <Card.Title as="h3">
                    {item.degree} · {item.school}
                  </Card.Title>
                  <Card.Eyebrow decorate>{item.period}</Card.Eyebrow>
                  <Card.Description>{item.description}</Card.Description>
                </Card>
              ))}
            </div>
          </Section>
          <Section title={t.about.languages}>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              {t.about.languageList.map((language) => (
                <li key={language.name}>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    {language.name}:
                  </span>{' '}
                  {language.level}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </Container>
    </>
  )
}
