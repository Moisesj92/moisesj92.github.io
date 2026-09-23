"use client";

import { useState } from "react";

import { Button } from "@repo/ui/Button";
import { SimpleLayout } from "@repo/ui/SimpleLayout";

interface Step {
  name: string;
  args: unknown;
  result: { ok: boolean; data?: unknown; error?: string; sources?: string[] };
  ms: number;
}
interface Turn {
  user: string;
  agent?: string;
  steps: Step[];
  sources: string[];
  error?: string;
  ms?: number;
}

/**
 * Chat de texto que enseña qué hizo el agente en cada turno: tools
 * llamados, latencia y documentos recuperados. Es la herramienta para
 * escribir y afinar el corpus sin gastar cuota de voz.
 */
export default function DebugPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    const history = turns
      .filter((t) => t.agent)
      .flatMap((t) => [
        { role: "user" as const, text: t.user },
        { role: "agent" as const, text: t.agent! },
      ]);
    setTurns((ts) => [...ts, { user: message, steps: [], sources: [] }]);
    const started = performance.now();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, history, message }),
      });
      const body = await res.json();
      const ms = Math.round(performance.now() - started);
      setTurns((ts) => {
        const last = { ...ts[ts.length - 1], ms };
        if (!res.ok) last.error = body.error ?? `HTTP ${res.status}`;
        else {
          last.agent = body.text;
          last.steps = body.steps;
          last.sources = body.sources;
          setSessionId(body.sessionId);
        }
        return [...ts.slice(0, -1), last];
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SimpleLayout
      title="Depuración"
      intro="Mismo prompt, tools y retriever que la voz. Cada turno muestra qué documentos se recuperaron, qué tools se llamaron y cuánto tardó."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta algo incómodo…"
          disabled={busy}
          autoFocus
          aria-label="Pregunta"
          className="min-w-0 flex-auto appearance-none rounded-md border border-zinc-900/10 bg-white px-3 py-[calc(--spacing(2)-1px)] shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-hidden sm:text-sm dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10"
        />
        <Button type="submit" disabled={busy || !input.trim()} className="flex-none">
          {busy ? "…" : "Enviar"}
        </Button>
      </form>

      <div className="mt-10 space-y-6">
        {turns.map((t, i) => (
          <article key={i} className="rounded-2xl border border-zinc-100 p-6 text-sm dark:border-zinc-700/40">
            <p>
              <span className="font-semibold text-zinc-800 dark:text-zinc-100">Tú: </span>
              <span className="text-zinc-600 dark:text-zinc-400">{t.user}</span>
            </p>
            {t.steps.map((s, j) => (
              <details key={j} className="mt-3 text-xs">
                <summary className="cursor-pointer text-zinc-400 dark:text-zinc-500">
                  🔧 {s.name}({JSON.stringify(s.args)}) · {s.ms} ms ·{" "}
                  {s.result.ok ? `${s.result.sources?.length ?? 0} doc(s)` : `error: ${s.result.error}`}
                </summary>
                <pre className="mt-2 max-h-60 overflow-auto rounded-xl bg-zinc-50 p-3 whitespace-pre-wrap text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">
                  {JSON.stringify(s.result.data, null, 2)}
                </pre>
              </details>
            ))}
            {t.agent !== undefined && (
              <p className="mt-3">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">Agente: </span>
                <span className="text-zinc-600 dark:text-zinc-400">{t.agent || <em>(respuesta vacía)</em>}</span>
              </p>
            )}
            {t.error && (
              <p role="alert" className="mt-3 text-red-600 dark:text-red-400">
                {t.error}
              </p>
            )}
            {t.agent === undefined && !t.error && <p className="mt-3 text-zinc-400">…</p>}
            {(t.sources.length > 0 || t.ms) && (
              <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                {t.sources.length > 0 ? `fuentes: ${t.sources.join(", ")}` : "sin fuentes"}
                {t.ms ? ` · ${t.ms} ms` : ""}
              </p>
            )}
          </article>
        ))}
      </div>
    </SimpleLayout>
  );
}
