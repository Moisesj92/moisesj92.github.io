import { Card } from '@/components/Card'
import type { ProjectCard as CardData } from '@/core/types'

/* Captura del sitio vía Microlink (igual que ProjectsPage del portafolio). */
function screenshotUrl(href: string) {
  return `https://api.microlink.io/?url=${encodeURIComponent(href)}&screenshot=true&meta=false&embed=screenshot.url`
}

function CloseIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="m17.25 6.75-10.5 10.5M6.75 6.75l10.5 10.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Tarjeta de proyecto (tool mostrar_proyectos), con el mismo Card que usa el portafolio. */
export function ProjectCard({ card, onDismiss }: { card: CardData; onDismiss?: () => void }) {
  return (
    <Card as="li">
      {card.url && (
        <div className="relative z-10 aspect-video w-full overflow-hidden rounded-xl bg-zinc-100 shadow-md ring-1 shadow-zinc-800/5 ring-zinc-900/5 dark:bg-zinc-800 dark:ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={screenshotUrl(card.url)} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
        </div>
      )}
      {(card.company || card.period) && (
        <Card.Eyebrow as="p" decorate className={card.url ? 'mt-6' : undefined}>
          {[card.company, card.period].filter(Boolean).join(' · ')}
        </Card.Eyebrow>
      )}
      <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
        {card.url ? (
          <Card.Link href={card.url} target="_blank" rel="noopener noreferrer">
            {card.title}
          </Card.Link>
        ) : (
          card.title
        )}
      </h2>
      <Card.Description>{card.summary}</Card.Description>
      {card.technologies.length > 0 && (
        <p className="relative z-10 mt-4 text-sm text-zinc-400 dark:text-zinc-500">{card.technologies.join(' · ')}</p>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Cerrar tarjeta de ${card.title}`}
          className="absolute -top-2 -right-2 z-30 rounded-full bg-white/90 p-1 text-zinc-500 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm transition hover:text-zinc-800 dark:bg-zinc-800/90 dark:text-zinc-400 dark:ring-white/10 dark:hover:text-zinc-100"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
    </Card>
  )
}
