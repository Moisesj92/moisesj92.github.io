import { cookies } from 'next/headers'

import { ADMIN_COOKIE, adminConfigured, isAdminCookie } from '@/core/admin/auth'
import { resolveTenantId } from '@/core/config/load'
import { getKillSwitch } from '@/core/guard/usage'
import { RETENTION_DAYS } from '@/core/observability/turn-log'
import { getMessageStore, getTurnStore, hasDatabase } from '@/core/storage'
import { Section } from '@/components/Section'
import { SimpleLayout } from '@/components/SimpleLayout'
import { Controls } from './controls'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Administración' }

const DAY_MS = 24 * 60 * 60 * 1000

/** Fuera del componente: el compilador de React no quiere Date.now() en el render. */
async function loadDashboard(tenant: string) {
  const turns = getTurnStore()
  const now = Date.now()
  const [week, month, recent, messages, killSwitch] = await Promise.all([
    turns.stats(tenant, new Date(now - 7 * DAY_MS)),
    turns.stats(tenant, new Date(now - RETENTION_DAYS * DAY_MS)),
    turns.listRecent(tenant, 30),
    getMessageStore().listRecent(tenant, 20),
    getKillSwitch(),
  ])
  return { week, month, recent, messages, killSwitch }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">{value}</dd>
    </div>
  )
}

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <SimpleLayout title="Administración" intro="Falta la variable ADMIN_PASSWORD. Sin ella este panel no se puede abrir." />
    )
  }
  const jar = await cookies()
  if (!isAdminCookie(jar.get(ADMIN_COOKIE)?.value)) {
    return (
      <SimpleLayout title="Administración" intro="Panel privado del agente: uso, preguntas, mensajes y kill-switch.">
        <LoginForm />
      </SimpleLayout>
    )
  }

  const tenant = resolveTenantId(null)
  const { week, month, recent, messages, killSwitch } = await loadDashboard(tenant)
  const pct = (x: number) => `${Math.round(x * 100)} %`
  const ms = (x: number | null) => (x == null ? '—' : `${x} ms`)

  return (
    <SimpleLayout
      title="Administración"
      intro={`Tenant ${tenant}. Turnos de los últimos ${RETENTION_DAYS} días (retención automática), sin audio y con correos y teléfonos redactados.${hasDatabase() ? '' : ' Sin base de datos: los datos son de memoria y se pierden al reiniciar.'}`}
    >
      <div className="space-y-20">
        <Section title="Kill-switch">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Aplica al instante (≤ 15 s), sin redeploy. Estado actual: <strong>{killSwitch || 'todo activo'}</strong>
            {process.env.AGENT_KILL_SWITCH ? ` · además AGENT_KILL_SWITCH=${process.env.AGENT_KILL_SWITCH} en el entorno` : ''}.
          </p>
          <Controls killSwitch={killSwitch} />
        </Section>

        <Section title="Últimos 7 días">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <Stat label="Sesiones" value={String(week.sessions)} />
            <Stat label="Turnos" value={String(week.turns)} />
            <Stat label="Tasa de rechazo" value={pct(week.refusalRate)} />
            <Stat label="Duración media de sesión" value={`${Math.round(week.medianSessionSeconds)} s`} />
            <Stat label="Primer audio p50" value={ms(week.ttfaP50Ms)} />
            <Stat label="Primer audio p95" value={ms(week.ttfaP95Ms)} />
          </dl>
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            Por canal: {week.byChannel.map((c) => `${c.channel} ${c.turns}`).join(' · ') || '—'} · Por modelo:{' '}
            {week.byModel.map((m) => `${m.model} ${m.turns}`).join(' · ') || '—'}
          </p>
        </Section>

        <Section title={`Últimos ${RETENTION_DAYS} días`}>
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <Stat label="Sesiones" value={String(month.sessions)} />
            <Stat label="Turnos" value={String(month.turns)} />
            <Stat label="Tasa de rechazo" value={pct(month.refusalRate)} />
          </dl>
        </Section>

        <Section title="Preguntas más frecuentes">
          {month.topQuestions.length === 0 ? (
            <p className="text-sm text-zinc-500">Todavía nada.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {month.topQuestions.map((q) => (
                <li key={q.question} className="flex gap-3">
                  <span className="w-8 flex-none text-right tabular-nums text-zinc-400">{q.count}×</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{q.question}</span>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="Mensajes recibidos">
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-500">Ninguno todavía.</p>
          ) : (
            <ul className="space-y-6 text-sm">
              {messages.map((m) => (
                <li key={m.id}>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-100">
                    {m.name} · <a href={`mailto:${m.email}`} className="text-teal-500 hover:underline">{m.email}</a>
                    <span className="ml-2 font-normal text-zinc-400">{m.createdAt.toLocaleString('es-CL')}</span>
                  </p>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">{m.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Últimos turnos">
          <ol className="space-y-4 text-sm">
            {recent.map((t) => (
              <li key={t.id} className="border-b border-zinc-100 pb-4 dark:border-zinc-700/40">
                <p className="text-xs text-zinc-400">
                  {t.createdAt.toLocaleString('es-CL')} · {t.channel} · {t.model ?? '—'} · {t.ms ?? '—'} ms
                  {t.refused ? ' · rechazo' : ''} · sesión {t.sessionId.slice(0, 8)}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">Visitante: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{t.userText || '—'}</span>
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">Agente: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{t.agentText || '—'}</span>
                </p>
                {(t.tools.length > 0 || t.sources.length > 0) && (
                  <p className="mt-1 text-xs text-zinc-400">
                    {t.tools.map((x) => `${x.name}${x.ok ? '' : ' ✗'}`).join(', ') || 'sin tools'} · fuentes:{' '}
                    {t.sources.join(', ') || '—'}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </SimpleLayout>
  )
}
