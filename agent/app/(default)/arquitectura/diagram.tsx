/**
 * Diagrama de arquitectura, SVG inline y sin dependencias. Los colores
 * salen de currentColor y de teal para que funcione en claro y oscuro.
 */
export function ArchitectureDiagram() {
  const box = 'fill-white stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-600'
  const label = 'fill-zinc-800 dark:fill-zinc-100'
  const muted = 'fill-zinc-500 dark:fill-zinc-400'
  const arrow = 'stroke-zinc-400 dark:stroke-zinc-500'
  const accent = 'stroke-teal-500'
  return (
    <svg viewBox="0 0 760 420" role="img" aria-labelledby="arch-title" className="w-full text-xs">
      <title id="arch-title">Navegador, servidor en Vercel, Gemini y datos, con el flujo de una sesión</title>
      <defs>
        <marker id="head" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" className="fill-zinc-400 dark:fill-zinc-500" />
        </marker>
        <marker id="head-accent" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" className="fill-teal-500" />
        </marker>
      </defs>

      {/* Columnas */}
      <text x="90" y="22" textAnchor="middle" className={`${muted} font-semibold uppercase`} style={{ letterSpacing: 1 }}>Navegador</text>
      <text x="380" y="22" textAnchor="middle" className={`${muted} font-semibold uppercase`} style={{ letterSpacing: 1 }}>Vercel · serverless</text>
      <text x="660" y="22" textAnchor="middle" className={`${muted} font-semibold uppercase`} style={{ letterSpacing: 1 }}>Datos</text>

      {/* Navegador */}
      <rect x="20" y="40" width="140" height="60" rx="10" className={box} />
      <text x="90" y="64" textAnchor="middle" className={`${label} font-semibold`}>UI Next.js</text>
      <text x="90" y="82" textAnchor="middle" className={muted}>estados · tarjetas · texto</text>

      <rect x="20" y="130" width="140" height="60" rx="10" className={box} />
      <text x="90" y="154" textAnchor="middle" className={`${label} font-semibold`}>AudioWorklet</text>
      <text x="90" y="172" textAnchor="middle" className={muted}>16 kHz ↑ · 24 kHz ↓ · flush</text>

      <rect x="20" y="220" width="140" height="50" rx="10" className={box} />
      <text x="90" y="241" textAnchor="middle" className={`${label} font-semibold`}>Web Speech</text>
      <text x="90" y="258" textAnchor="middle" className={muted}>último escalón</text>

      {/* Gemini */}
      <rect x="40" y="320" width="120" height="70" rx="35" className="fill-teal-50 stroke-teal-500 dark:fill-teal-950" />
      <text x="100" y="350" textAnchor="middle" className={`${label} font-semibold`}>Gemini Live</text>
      <text x="100" y="368" textAnchor="middle" className={muted}>speech-to-speech</text>

      {/* Servidor */}
      <rect x="260" y="40" width="240" height="60" rx="10" className={box} />
      <text x="380" y="62" textAnchor="middle" className={`${label} font-semibold`}>/api/session</text>
      <text x="380" y="80" textAnchor="middle" className={muted}>Turnstile · rate limit · presupuesto</text>

      <rect x="260" y="120" width="240" height="60" rx="10" className={box} />
      <text x="380" y="142" textAnchor="middle" className={`${label} font-semibold`}>/api/tools · /api/chat</text>
      <text x="380" y="160" textAnchor="middle" className={muted}>tools en el servidor, nunca en el cliente</text>

      <rect x="260" y="200" width="240" height="60" rx="10" className="fill-zinc-50 stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-600" />
      <text x="380" y="222" textAnchor="middle" className={`${label} font-semibold`}>core/</text>
      <text x="380" y="240" textAnchor="middle" className={muted}>prompt · BM25 · registry · guard · storage</text>

      <rect x="260" y="320" width="240" height="70" rx="35" className="fill-teal-50 stroke-teal-500 dark:fill-teal-950" />
      <text x="380" y="350" textAnchor="middle" className={`${label} font-semibold`}>Gemini Flash-Lite</text>
      <text x="380" y="368" textAnchor="middle" className={muted}>ruta de texto · evals · juez</text>

      {/* Datos */}
      <rect x="580" y="120" width="160" height="70" rx="10" className={box} />
      <text x="660" y="144" textAnchor="middle" className={`${label} font-semibold`}>tenants/&lt;id&gt;/</text>
      <text x="660" y="162" textAnchor="middle" className={muted}>agent.yaml · identity.md</text>
      <text x="660" y="178" textAnchor="middle" className={muted}>corpus/*.md</text>

      <rect x="580" y="220" width="160" height="70" rx="10" className={box} />
      <text x="660" y="244" textAnchor="middle" className={`${label} font-semibold`}>Postgres (Neon)</text>
      <text x="660" y="262" textAnchor="middle" className={muted}>turns · messages</text>
      <text x="660" y="278" textAnchor="middle" className={muted}>usage · settings</text>

      {/* Flechas: 1 token */}
      <path d="M160 60 H260" fill="none" className={arrow} strokeWidth="1.5" markerEnd="url(#head)" />
      <text x="210" y="52" textAnchor="middle" className={muted}>① token</text>
      {/* 2 audio directo */}
      <path d="M90 190 V320" fill="none" className={accent} strokeWidth="2" markerEnd="url(#head-accent)" />
      <path d="M115 320 V190" fill="none" className={accent} strokeWidth="2" markerEnd="url(#head-accent)" />
      <text x="140" y="260" textAnchor="start" className={muted}>② audio ↕</text>
      {/* 3 toolCall → tools */}
      <path d="M160 80 C 220 80, 220 150, 260 150" fill="none" className={arrow} strokeWidth="1.5" markerEnd="url(#head)" />
      <text x="205" y="118" textAnchor="middle" className={muted}>③ toolCall</text>
      {/* tools → core → corpus/db */}
      <path d="M380 180 V200" fill="none" className={arrow} strokeWidth="1.5" markerEnd="url(#head)" />
      <path d="M500 150 H580" fill="none" className={arrow} strokeWidth="1.5" markerEnd="url(#head)" />
      <path d="M500 230 H580" fill="none" className={arrow} strokeWidth="1.5" markerEnd="url(#head)" />
      {/* chat → flash */}
      <path d="M380 260 V320" fill="none" className={arrow} strokeWidth="1.5" markerEnd="url(#head)" />
      {/* web speech → chat */}
      <path d="M160 245 C 210 245, 210 170, 260 170" fill="none" className={arrow} strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#head)" />
      {/* session → db */}
      <path d="M500 70 C 560 70, 560 240, 580 240" fill="none" className={arrow} strokeWidth="1" strokeDasharray="2 3" markerEnd="url(#head)" />
    </svg>
  )
}
