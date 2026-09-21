import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { resolveTenantId } from '@/core/config/load'
import { RETENTION_DAYS } from '@/core/observability/turn-log'
import { getTurnStore, hasDatabase } from '@/core/storage'
import { Section } from '@/components/Section'
import { SimpleLayout } from '@/components/SimpleLayout'
import { ArchitectureDiagram } from './diagram'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Arquitectura' }

const REPO = 'https://github.com/Moisesj92/moisesj92.github.io/tree/master/agent'
const DAY_MS = 24 * 60 * 60 * 1000

interface EvalsSummary {
  when: string
  total: number
  passed: number
  refusals: number
  refusalsPassed: number
  judge: string
}

/** Resumen del último reporte de evals versionado en el repo. */
async function readEvals(): Promise<EvalsSummary | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), 'evals/reports/latest.json'), 'utf8')
    const data = JSON.parse(raw) as {
      config: { judgeModel: string }
      results: { group: string; pass: boolean }[]
    }
    const md = await readFile(path.join(process.cwd(), 'evals/reports/latest.md'), 'utf8')
    const when = /# Evals — (.+?) UTC/.exec(md)?.[1] ?? ''
    const refusals = data.results.filter((r) => r.group === 'rechazo')
    return {
      when,
      total: data.results.length,
      passed: data.results.filter((r) => r.pass).length,
      refusals: refusals.length,
      refusalsPassed: refusals.filter((r) => r.pass).length,
      judge: data.config.judgeModel,
    }
  } catch {
    return null
  }
}

async function readProduction(tenant: string) {
  if (!hasDatabase()) return null
  try {
    return await getTurnStore().stats(tenant, new Date(Date.now() - RETENTION_DAYS * DAY_MS))
  } catch {
    return null
  }
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-base text-zinc-600 dark:text-zinc-400">{children}</p>
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">{value}</dd>
      {note && <dd className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{note}</dd>}
    </div>
  )
}

export default async function ArchitecturePage() {
  const tenant = resolveTenantId(null)
  const [evals, prod] = await Promise.all([readEvals(), readProduction(tenant)])
  const ms = (x: number | null | undefined) => (x == null ? '—' : `${x} ms`)

  return (
    <SimpleLayout
      title="Cómo está hecho"
      intro="No es un chat sobre una persona. Es un agente de voz de dominio cerrado con recuperación trazable, evals en CI y control de costos; la persona es el primer tenant. Esta página es para quien llega desde el CV y quiere ver las decisiones, no el demo."
    >
      <div className="space-y-20">
        <Section title="Flujo">
          <ArchitectureDiagram />
          <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              El navegador pide un <strong className="text-zinc-800 dark:text-zinc-100">token efímero</strong> de Gemini. El servidor lo
              emite con la configuración del tenant bloqueada dentro del token (system prompt, tools, voz): el cliente no puede cambiarla y la API
              key nunca sale del servidor.
            </li>
            <li>
              El audio va <strong className="text-zinc-800 dark:text-zinc-100">directo del navegador a Gemini Live</strong>. Speech-to-speech
              nativo: ~300 ms al primer audio, interrupción incluida.
            </li>
            <li>
              Cuando el modelo necesita un dato, emite un <code>toolCall</code>. El navegador solo lo transporta: el tool corre en el servidor, contra
              el corpus. <strong className="text-zinc-800 dark:text-zinc-100">El corpus nunca toca el cliente.</strong>
            </li>
            <li>El resultado vuelve al modelo, que responde citando los documentos que lo respaldan.</li>
          </ol>
        </Section>

        <Section title="Speech-to-speech, no pipeline">
          <P>
            Un pipeline STT → LLM → TTS suma tres latencias en serie (alrededor de un segundo) y la interrupción hay que construirla a mano.
            Gemini Live devuelve audio a ~300 ms y trae la interrupción de fábrica. La reproducción usa un AudioWorklet con <code>flush()</code>{' '}
            en lugar de <code>&lt;audio&gt;</code>: interrumpir exige vaciar lo que aún no sonó. El plan original proponía un relay WebSocket
            propio; Vercel serverless no lo mantiene, y un token efímero con configuración bloqueada cumple el objetivo (la key no sale del
            servidor) sin un segundo servicio.
          </P>
        </Section>

        <Section title="BM25, no vectores">
          <P>
            El corpus son unos 25 documentos Markdown con frontmatter; cabe entero en el contexto. Un índice vectorial añadiría un servicio, un
            modelo de embeddings y un coste para un problema que un BM25 de 80 líneas resuelve con un test determinista: &ldquo;esta consulta
            debe recuperar este documento&rdquo;. Las coincidencias con tags, tecnologías o empresa refuerzan la puntuación; no filtran (un filtro
            excluyente dejaba fuera al documento correcto cuando un token casual era tag de otro). La interfaz{' '}
            <code>Retriever.search(query, limit)</code> no cambia: migrar a vectores es cambiar el cuerpo de una clase.
          </P>
        </Section>

        <Section title="Los tools corren en el servidor">
          <P>
            El navegador ve nombres y argumentos, nunca la implementación ni los datos. Los argumentos se validan con Zod, y el mismo schema
            genera la declaración que ve el modelo: una sola fuente de verdad. Argumentos inválidos vuelven como <code>ok: false</code> con el
            detalle, para que el modelo corrija, no como un 500.
          </P>
        </Section>

        <Section title="Un solo tool con efecto">
          <P>
            <code>dejar_mensaje</code> es el único tool que escribe algo. Sin tools destructivos, el radio de daño de un jailbreak es cero: lo peor
            que puede hacer un visitante hostil es dejar un mensaje, y ese tool tiene rate limit por IP, sanitización e idempotencia (el modelo a
            veces vuelve a llamarlo tras un &ldquo;sí, guárdalo&rdquo;). La contención es quitar capacidades, no acumular filtros.
          </P>
        </Section>

        <Section title="Anti-alucinación">
          <P>
            Datos y evals, no solo prompt. Capa 0: una ficha de ~2k tokens fija al inicio del prompt. Capa 1: el corpus, con un documento por cada
            pregunta predecible sin respuesta obvia (renta, por qué dejó cada trabajo, tecnologías que no ha usado): una respuesta redactada vale
            más que cualquier guardrail. Y una suite de evals que corre contra la ruta de texto con reglas deterministas y un modelo distinto como
            juez, con umbral: si un rechazo falla, el build falla.
          </P>
          {evals && (
            <dl className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
              <Metric label="Casos" value={`${evals.passed}/${evals.total}`} note={`último run ${evals.when} UTC`} />
              <Metric label="Rechazos correctos" value={`${evals.refusalsPassed}/${evals.refusals}`} note="umbral: 100 %" />
              <Metric label="Juez" value={evals.judge} note="distinto al modelo que responde" />
            </dl>
          )}
        </Section>

        <Section title="Métricas de producción">
          {prod && prod.sessions > 0 ? (
            <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              <Metric label="Sesiones" value={String(prod.sessions)} note={`últimos ${RETENTION_DAYS} días`} />
              <Metric label="Turnos" value={String(prod.turns)} />
              <Metric label="Tasa de rechazo" value={`${Math.round(prod.refusalRate * 100)} %`} note="turnos en que dijo que no tenía el dato" />
              <Metric label="Primer audio p50" value={ms(prod.ttfaP50Ms)} note="desde el click hasta oír al agente" />
              <Metric label="Primer audio p95" value={ms(prod.ttfaP95Ms)} />
              <Metric label="Duración media" value={`${Math.round(prod.medianSessionSeconds)} s`} note="mediana por sesión" />
            </dl>
          ) : (
            <P>Todavía no hay sesiones suficientes en los últimos {RETENTION_DAYS} días. Las métricas se miden en producción, no se estiman.</P>
          )}
        </Section>

        <Section title="Contención y privacidad">
          <P>
            Turnstile invisible antes de emitir tokens de voz; rate limit por IP y día; presupuesto diario por tenant que cierra el canal solo y
            avisa por correo al 50 % y al 100 %; kill-switch desde el panel, sin redeploy. Cascada de degradación: Gemini Live → voz del navegador
            (con aviso) → texto; nunca un error. Los turnos se guardan sin audio y con correos y teléfonos redactados, {RETENTION_DAYS} días. El
            micrófono solo se activa tras consentimiento explícito.
          </P>
        </Section>

        <Section title="Multi-tenant">
          <P>
            Nada de la persona vive fuera de <code>tenants/&lt;id&gt;/</code>: configuración, ficha y corpus. El motor programa contra las
            interfaces <code>Retriever</code>, <code>Tool</code> y <code>VoiceProvider</code>. Un segundo tenant es una carpeta, no un fork.
          </P>
        </Section>

        <Section title="Código">
          <P>
            Todo es público:{' '}
            <a href={REPO} className="text-teal-500 hover:underline" target="_blank" rel="noopener noreferrer">
              el repositorio
            </a>
            , con el plan de trabajo, siete registros de decisión (ADR) que explican dónde y por qué la implementación se apartó del plan, y un
            historial de commits que cuenta el porqué de cada cambio.
          </P>
        </Section>
      </div>
    </SimpleLayout>
  )
}
