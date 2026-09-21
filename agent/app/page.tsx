'use client'

import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/Button'
import { SimpleLayout } from '@/components/SimpleLayout'
import { ProjectCard } from './_components/project-card'
import { Visualizer } from './_components/visualizer'
import { useTextSession } from './_lib/use-text-session'
import { useVoiceSession, type SessionState, type TranscriptLine } from './_lib/use-voice-session'
import type { DownloadOffer, ShownCard } from './_lib/use-ui-effects'

const LABEL: Record<SessionState, string> = {
  idle: 'Listo',
  'requesting-mic': 'Pidiendo micrófono…',
  connecting: 'Conectando…',
  listening: 'Escuchando',
  speaking: 'Hablando',
  error: 'Error',
}

interface TenantInfo {
  displayName: string
  links: { cvPdf?: string }
}

type Mode = 'voice' | 'text'

export default function Home() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [mode, setMode] = useState<Mode>('voice')
  const voice = useVoiceSession()
  const text = useTextSession()

  useEffect(() => {
    fetch('/api/tenant')
      .then((r) => (r.ok ? r.json() : null))
      .then(setTenant)
      .catch(() => {})
  }, [])

  const switchTo = (m: Mode) => {
    if (m === mode) return
    if (m === 'text' && (voice.state === 'listening' || voice.state === 'speaking')) void voice.stop()
    setMode(m)
  }

  const session = mode === 'voice' ? voice : text

  return (
    <SimpleLayout
      title={tenant ? `Habla con el asistente de ${tenant.displayName}` : 'Asistente de voz'}
      intro="Pregúntale por su experiencia, sus proyectos o déjale un mensaje. Responde solo con información verificada y te dice de dónde la saca."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button variant={mode === 'voice' ? 'primary' : 'secondary'} onClick={() => switchTo('voice')} aria-pressed={mode === 'voice'}>
          Voz
        </Button>
        <Button variant={mode === 'text' ? 'primary' : 'secondary'} onClick={() => switchTo('text')} aria-pressed={mode === 'text'}>
          Texto
        </Button>
        {tenant?.links.cvPdf && (
          <Button variant="secondary" href={tenant.links.cvPdf} target="_blank" rel="noopener noreferrer">
            CV (PDF)
          </Button>
        )}
      </div>

      <div className="mt-10">
        {mode === 'voice' ? <VoicePanel voice={voice} onSwitchToText={() => switchTo('text')} /> : <TextPanel text={text} />}
      </div>

      <Effects
        cards={session.cards}
        download={session.download}
        dismissCard={session.dismissCard}
        dismissDownload={session.dismissDownload}
      />

      <Transcript lines={session.transcript} />

      {mode === 'voice' && (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm text-zinc-400 dark:text-zinc-500">
            Eventos técnicos{voice.ttfaMs !== null ? ` · primer audio en ${voice.ttfaMs} ms` : ''}
          </summary>
          <pre className="mt-3 max-h-72 overflow-auto rounded-2xl border border-zinc-100 p-4 text-xs whitespace-pre-wrap text-zinc-600 dark:border-zinc-700/40 dark:text-zinc-400">
            {voice.log.length === 0 ? '—' : voice.log.map((l) => `${new Date(l.t).toLocaleTimeString()}  ${l.msg}`).join('\n')}
          </pre>
        </details>
      )}
    </SimpleLayout>
  )
}

function VoicePanel({ voice, onSwitchToText }: { voice: ReturnType<typeof useVoiceSession>; onSwitchToText: () => void }) {
  const { state, error, failure, level, agentLevel, expiresAt, degraded, start, stop, prewarm } = voice
  // El Button del template no reenvía ref; el observador mira el contenedor.
  const startBtn = useRef<HTMLDivElement>(null)

  // En móvil no hay hover: cuando el botón entra en pantalla ya hay intención suficiente.
  useEffect(() => {
    const el = startBtn.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          prewarm('botón visible')
          io.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [prewarm])
  const busy = state === 'requesting-mic' || state === 'connecting'
  const active = state === 'listening' || state === 'speaking'
  const vizMode = state === 'speaking' ? 'speaking' : state === 'listening' ? 'listening' : 'idle'

  return (
    <section>
      <div className="flex flex-wrap items-center gap-4">
        {active ? (
          <Button onClick={stop}>Detener</Button>
        ) : (
          <div ref={startBtn} className="contents">
            <Button
              onClick={start}
              onMouseEnter={() => prewarm('hover')}
              onFocus={() => prewarm('foco')}
              onTouchStart={() => prewarm('touchstart')}
              disabled={busy}
            >
              {busy ? LABEL[state] : 'Iniciar conversación'}
            </Button>
          </div>
        )}
        <Visualizer level={state === 'speaking' ? (degraded ? 0.15 : agentLevel) : level} mode={vizMode} />
        <span
          aria-live="polite"
          className={clsx(
            'text-sm font-medium',
            state === 'error' && 'text-red-600 dark:text-red-400',
            active && 'text-teal-500 dark:text-teal-400',
            !active && state !== 'error' && 'text-zinc-400 dark:text-zinc-500',
          )}
        >
          {LABEL[state]}
        </span>
      </div>

      {error && (
        <div role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          <p>{error}</p>
          <div className="mt-3">
            {(failure === 'quota' || failure === 'mic' || failure === 'insecure') && (
              <Button variant="secondary" onClick={onSwitchToText}>
                Seguir por texto
              </Button>
            )}
            {failure === 'offline' && (
              <Button variant="secondary" onClick={start}>
                Reintentar
              </Button>
            )}
          </div>
        </div>
      )}
      {active && degraded === 'web-speech' && (
        <p role="status" className="mt-4 rounded-2xl border border-zinc-100 p-4 text-sm text-zinc-600 dark:border-zinc-700/40 dark:text-zinc-400">
          La voz principal no está disponible ahora mismo; estás usando la voz básica del navegador. Funciona por turnos
          (habla, espera la respuesta) y suena peor. El texto tiene la misma calidad de siempre.
        </p>
      )}
      {active && expiresAt && (
        <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">
          La sesión se cierra sola a las {new Date(expiresAt).toLocaleTimeString()}. Interrúmpelo cuando quieras.
        </p>
      )}
    </section>
  )
}

function TextPanel({ text }: { text: ReturnType<typeof useTextSession> }) {
  const [input, setInput] = useState('')
  return (
    <section>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void text.send(input)
          setInput('')
        }}
        className="flex gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          disabled={text.busy}
          aria-label="Mensaje"
          autoFocus
          className="min-w-0 flex-auto appearance-none rounded-md border border-zinc-900/10 bg-white px-3 py-[calc(--spacing(2)-1px)] shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-hidden sm:text-sm dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10"
        />
        <Button type="submit" disabled={text.busy || !input.trim()} className="flex-none">
          {text.busy ? '…' : 'Enviar'}
        </Button>
      </form>
      {text.error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {text.error}
        </p>
      )}
    </section>
  )
}

function Effects({
  cards,
  download,
  dismissCard,
  dismissDownload,
}: {
  cards: ShownCard[]
  download: DownloadOffer | null
  dismissCard: (id: string) => void
  dismissDownload: () => void
}) {
  if (!download && cards.length === 0) return null
  return (
    <div className="mt-10">
      {download && (
        <div className="flex items-center gap-3">
          <Button href={download.url} target="_blank" rel="noopener noreferrer">
            ⬇ {download.label}
          </Button>
          <button
            type="button"
            onClick={dismissDownload}
            className="text-sm text-zinc-400 transition hover:text-zinc-800 dark:hover:text-zinc-100"
          >
            Descartar
          </button>
        </div>
      )}
      {cards.length > 0 && (
        <ul
          role="list"
          aria-live="polite"
          className={clsx('grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3', download && 'mt-10')}
        >
          {cards.map((c) => (
            <ProjectCard key={c.id} card={c} onDismiss={() => dismissCard(c.id)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function Transcript({ lines }: { lines: TranscriptLine[] }) {
  return (
    <div className="mt-10 rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
      {lines.length === 0 && <p className="text-sm text-zinc-400 dark:text-zinc-500">La conversación aparece aquí.</p>}
      <ol className="space-y-4">
        {lines.map((line, i) => (
          <li key={i} className="text-sm">
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">{line.role === 'user' ? 'Tú' : 'Agente'}: </span>
            <span className="text-zinc-600 dark:text-zinc-400">{line.text}</span>
            {line.sources && line.sources.length > 0 && (
              <span className="mt-1 block text-xs text-zinc-400 dark:text-zinc-500">fuentes: {line.sources.join(', ')}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
