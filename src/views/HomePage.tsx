import Link from 'next/link'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Container } from '@/components/Container'
import { GitHubIcon, LinkedInIcon } from '@/components/SocialIcons'
import { getDictionary, type Dictionary, type Locale } from '@/i18n'
import { site } from '@/lib/site'

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

function MicIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect
        x="8.75"
        y="2.75"
        width="6.5"
        height="12.5"
        rx="3.25"
        className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500"
      />
      <path
        d="M5.75 11.25a6.25 6.25 0 0 0 12.5 0M12 17.5v3.75m-3.25 0h6.5"
        className="stroke-zinc-400 dark:stroke-zinc-500"
      />
    </svg>
  )
}

function BriefcaseIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2.75 9.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z"
        className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500"
      />
      <path
        d="M3 14.25h6.249c.484 0 .952-.002 1.316.319l.777.682a.996.996 0 0 0 1.316 0l.777-.682c.364-.32.832-.319 1.316-.319H21M8.75 6.5V4.75a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2V6.5"
        className="stroke-zinc-400 dark:stroke-zinc-500"
      />
    </svg>
  )
}

function SocialLink({
  icon: Icon,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & {
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link className="group -m-1 p-1" {...props}>
      <Icon className="h-6 w-6 fill-zinc-500 transition group-hover:fill-zinc-600 dark:fill-zinc-400 dark:group-hover:fill-zinc-300" />
    </Link>
  )
}

function SkillGroup({ group }: { group: Dictionary['home']['skills'][number] }) {
  return (
    <Card as="article">
      <Card.Title as="h3">{group.title}</Card.Title>
      <ul className="relative z-10 mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
        {group.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Card>
  )
}

function VoiceAgent({ t }: { t: Dictionary }) {
  return (
    <div className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
      <h2 className="flex text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <MicIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">{t.home.agent.title}</span>
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {t.home.agent.description}
      </p>
      <Button
        href={site.voiceAgent}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 w-full"
      >
        {t.home.agent.cta}
      </Button>
    </div>
  )
}

function Role({ role }: { role: Dictionary['resume'][number] }) {
  return (
    <li className="flex gap-4">
      <div className="relative mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-semibold text-zinc-500 shadow-md ring-1 shadow-zinc-800/5 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-0">
        {role.company.charAt(0)}
      </div>
      <dl className="flex flex-auto flex-wrap gap-x-2">
        <dt className="sr-only">Company</dt>
        <dd className="w-full flex-none text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {role.company}
        </dd>
        <dt className="sr-only">Role</dt>
        <dd className="text-xs text-zinc-500 dark:text-zinc-400">
          {role.title}
        </dd>
        <dt className="sr-only">Date</dt>
        <dd className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
          <time dateTime={role.start.dateTime}>{role.start.label}</time>{' '}
          <span aria-hidden="true">—</span>{' '}
          <time dateTime={role.end.dateTime}>{role.end.label}</time>
        </dd>
      </dl>
    </li>
  )
}

function Resume({ t }: { t: Dictionary }) {
  return (
    <div className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
      <h2 className="flex text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <BriefcaseIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">{t.home.work}</span>
      </h2>
      <ol className="mt-6 space-y-4">
        {t.resume.map((role) => (
          <Role key={role.company} role={role} />
        ))}
      </ol>
      <Button
        href={site.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        variant="secondary"
        className="group mt-6 w-full"
      >
        {t.home.workCta}
      </Button>
    </div>
  )
}

export function HomePage({ locale }: { locale: Locale }) {
  let t = getDictionary(locale)

  return (
    <>
      <Container className="mt-9">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
            {t.home.title}
          </h1>
          <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
            {t.home.intro}
          </p>
          <div className="mt-6 flex gap-6">
            <SocialLink
              href={site.github}
              aria-label={t.social.github}
              icon={GitHubIcon}
            />
            <SocialLink
              href={site.linkedin}
              aria-label={t.social.linkedin}
              icon={LinkedInIcon}
            />
            <SocialLink
              href={`mailto:${site.email}`}
              aria-label={t.social.email}
              icon={MailIcon}
            />
          </div>
        </div>
      </Container>
      <Container className="mt-24 md:mt-28">
        <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
          <div className="flex flex-col gap-16">
            <h2 className="sr-only">{t.home.skillsHeading}</h2>
            {t.home.skills.map((group) => (
              <SkillGroup key={group.title} group={group} />
            ))}
            <Card as="article">
              <Card.Title as="h3">{t.home.stackTitle}</Card.Title>
              <Card.Description>{t.home.stack}</Card.Description>
            </Card>
          </div>
          <div className="space-y-10 lg:pl-16 xl:pl-24">
            <VoiceAgent t={t} />
            <Resume t={t} />
          </div>
        </div>
      </Container>
    </>
  )
}
