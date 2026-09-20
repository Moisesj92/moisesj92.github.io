"use client";

import Link from "next/link";
import { useState } from "react";

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
    <main>
      <h1>Debug · chat de texto</h1>
      <p style={{ color: "var(--muted)" }}>
        Mismo prompt, tools y retriever que la voz. Cada turno muestra qué documentos se
        recuperaron. <Link href="/">Volver a la voz</Link>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {turns.map((t, i) => (
          <article key={i} style={box}>
            <p style={{ margin: "0 0 8px" }}>
              <strong>Tú:</strong> {t.user}
            </p>
            {t.steps.map((s, j) => (
              <details key={j} style={{ margin: "4px 0", fontSize: 13 }}>
                <summary style={{ cursor: "pointer", color: "var(--muted)" }}>
                  🔧 {s.name}({JSON.stringify(s.args)}) · {s.ms} ms ·{" "}
                  {s.result.ok ? `${s.result.sources?.length ?? 0} doc(s)` : `error: ${s.result.error}`}
                </summary>
                <pre style={pre}>{JSON.stringify(s.result.data, null, 2)}</pre>
              </details>
            ))}
            {t.agent !== undefined && (
              <p style={{ margin: "8px 0 0" }}>
                <strong>Agente:</strong> {t.agent || <em>(respuesta vacía)</em>}
              </p>
            )}
            {t.error && (
              <p role="alert" style={{ color: "var(--danger)", margin: "8px 0 0" }}>
                {t.error}
              </p>
            )}
            {t.agent === undefined && !t.error && <p style={{ color: "var(--muted)" }}>…</p>}
            {(t.sources.length > 0 || t.ms) && (
              <p style={{ color: "var(--muted)", fontSize: 12, margin: "8px 0 0" }}>
                {t.sources.length > 0 ? `fuentes: ${t.sources.join(", ")}` : "sin fuentes"}
                {t.ms ? ` · ${t.ms} ms` : ""}
              </p>
            )}
          </article>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        style={{ display: "flex", gap: 8, marginTop: 16 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta algo incómodo…"
          disabled={busy}
          autoFocus
          style={{
            flex: 1,
            padding: "10px 12px",
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--background)",
            color: "var(--foreground)",
          }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            padding: "10px 16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {busy ? "…" : "Enviar"}
        </button>
      </form>
    </main>
  );
}

const box: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 12,
};
const pre: React.CSSProperties = {
  fontSize: 12,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  maxHeight: 240,
  overflow: "auto",
  margin: "6px 0 0",
};
