"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { dismissBtn, ProjectCard } from "./_components/project-card";
import { Visualizer } from "./_components/visualizer";
import { useTextSession } from "./_lib/use-text-session";
import { useVoiceSession, type SessionState, type TranscriptLine } from "./_lib/use-voice-session";
import type { DownloadOffer, ShownCard } from "./_lib/use-ui-effects";

const LABEL: Record<SessionState, string> = {
  idle: "Listo",
  "requesting-mic": "Pidiendo micrófono…",
  connecting: "Conectando…",
  listening: "Escuchando",
  speaking: "Hablando",
  error: "Error",
};

interface TenantInfo {
  displayName: string;
  links: { cvPdf?: string };
}

type Mode = "voice" | "text";

export default function Home() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [mode, setMode] = useState<Mode>("voice");
  const voice = useVoiceSession();
  const text = useTextSession();

  useEffect(() => {
    fetch("/api/tenant")
      .then((r) => (r.ok ? r.json() : null))
      .then(setTenant)
      .catch(() => {});
  }, []);

  const switchTo = (m: Mode) => {
    if (m === mode) return;
    if (m === "text" && (voice.state === "listening" || voice.state === "speaking")) void voice.stop();
    setMode(m);
  };

  const session = mode === "voice" ? voice : text;

  return (
    <main>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 4 }}>
          {tenant ? `Habla con el asistente de ${tenant.displayName}` : "Agente de voz"}
        </h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Pregúntale por su experiencia, sus proyectos o déjale un mensaje.
          {tenant?.links.cvPdf && (
            <>
              {" · "}
              <a href={tenant.links.cvPdf} target="_blank" rel="noopener noreferrer">
                CV (PDF)
              </a>
            </>
          )}
        </p>
        <div role="tablist" aria-label="Modo" style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          {(["voice", "text"] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchTo(m)}
              style={{
                border: 0,
                padding: "8px 14px",
                fontSize: 14,
                cursor: "pointer",
                background: mode === m ? "var(--accent)" : "transparent",
                color: mode === m ? "#fff" : "var(--foreground)",
              }}
            >
              {m === "voice" ? "🎙 Voz" : "⌨️ Texto"}
            </button>
          ))}
        </div>
      </header>

      {mode === "voice" ? <VoicePanel voice={voice} onSwitchToText={() => switchTo("text")} /> : <TextPanel text={text} />}

      <Effects
        cards={session.cards}
        download={session.download}
        dismissCard={session.dismissCard}
        dismissDownload={session.dismissDownload}
      />

      <Transcript lines={session.transcript} />

      {mode === "voice" && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: "pointer", color: "var(--muted)", fontSize: 13 }}>
            Eventos técnicos{voice.ttfaMs !== null ? ` · primer audio en ${voice.ttfaMs} ms` : ""}
          </summary>
          <pre style={pre}>
            {voice.log.length === 0
              ? "—"
              : voice.log.map((l) => `${new Date(l.t).toLocaleTimeString()}  ${l.msg}`).join("\n")}
          </pre>
        </details>
      )}

      <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 24 }}>
        <Link href="/debug">Modo depuración</Link>: ver qué documentos respaldan cada respuesta.
      </p>
    </main>
  );
}

function VoicePanel({
  voice,
  onSwitchToText,
}: {
  voice: ReturnType<typeof useVoiceSession>;
  onSwitchToText: () => void;
}) {
  const { state, error, failure, level, agentLevel, expiresAt, degraded, start, stop, prewarm } = voice;
  const startBtn = useRef<HTMLButtonElement>(null);

  // En móvil no hay hover: cuando el botón entra en pantalla ya hay intención suficiente.
  useEffect(() => {
    const el = startBtn.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          prewarm("botón visible");
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [prewarm]);
  const busy = state === "requesting-mic" || state === "connecting";
  const active = state === "listening" || state === "speaking";
  const vizMode = state === "speaking" ? "speaking" : state === "listening" ? "listening" : "idle";

  return (
    <section style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {active ? (
          <button onClick={stop} style={btn("var(--danger)")}>
            Detener
          </button>
        ) : (
          <button
            ref={startBtn}
            onClick={start}
            onMouseEnter={() => prewarm("hover")}
            onFocus={() => prewarm("foco")}
            onTouchStart={() => prewarm("touchstart")}
            disabled={busy}
            style={btn("var(--accent)")}
          >
            {busy ? LABEL[state] : "Iniciar conversación"}
          </button>
        )}
        <Visualizer level={state === "speaking" ? (degraded ? 0.15 : agentLevel) : level} mode={vizMode} />
        <span
          aria-live="polite"
          style={{
            fontWeight: 600,
            color: state === "error" ? "var(--danger)" : active ? "var(--accent)" : "var(--muted)",
          }}
        >
          {LABEL[state]}
        </span>
      </div>

      {error && (
        <div role="alert" style={{ marginTop: 12, color: "var(--danger)" }}>
          <p style={{ margin: "0 0 8px" }}>{error}</p>
          {(failure === "quota" || failure === "mic" || failure === "insecure") && (
            <button onClick={onSwitchToText} style={{ ...btn("var(--accent)"), padding: "8px 14px", fontSize: 14 }}>
              Seguir por texto
            </button>
          )}
          {failure === "offline" && (
            <button onClick={start} style={{ ...btn("var(--accent)"), padding: "8px 14px", fontSize: 14 }}>
              Reintentar
            </button>
          )}
        </div>
      )}
      {active && degraded === "web-speech" && (
        <p role="status" style={{ margin: "8px 0 0", padding: "8px 12px", borderRadius: 8, background: "rgba(234,179,8,0.15)", fontSize: 13 }}>
          La voz principal no está disponible ahora mismo; estás usando la voz básica del navegador. Funciona por turnos
          (habla, espera la respuesta) y suena peor. El texto tiene la misma calidad de siempre.
        </p>
      )}
      {active && expiresAt && (
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "8px 0 0" }}>
          La sesión se cierra sola a las {new Date(expiresAt).toLocaleTimeString()}. Interrúmpelo cuando quieras.
        </p>
      )}
    </section>
  );
}

function TextPanel({ text }: { text: ReturnType<typeof useTextSession> }) {
  const [input, setInput] = useState("");
  return (
    <section style={{ marginBottom: 20 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void text.send(input);
          setInput("");
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          disabled={text.busy}
          aria-label="Mensaje"
          style={{
            flex: 1,
            padding: "12px 14px",
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--background)",
            color: "var(--foreground)",
          }}
        />
        <button type="submit" disabled={text.busy || !input.trim()} style={btn("var(--accent)")}>
          {text.busy ? "…" : "Enviar"}
        </button>
      </form>
      {text.error && (
        <p role="alert" style={{ color: "var(--danger)", margin: "8px 0 0" }}>
          {text.error}
        </p>
      )}
    </section>
  );
}

function Effects({
  cards,
  download,
  dismissCard,
  dismissDownload,
}: {
  cards: ShownCard[];
  download: DownloadOffer | null;
  dismissCard: (id: string) => void;
  dismissDownload: () => void;
}) {
  return (
    <>
      {download && (
        <div style={{ position: "relative", display: "inline-block", marginBottom: 16, paddingRight: 28 }}>
          <a
            href={download.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...btn("var(--accent)"), display: "inline-block", textDecoration: "none" }}
          >
            ⬇ {download.label}
          </a>
          <button type="button" onClick={dismissDownload} aria-label="Descartar descarga" style={dismissBtn}>
            ×
          </button>
        </div>
      )}
      {cards.length > 0 && (
        <section style={{ display: "grid", gap: 12, marginBottom: 16 }} aria-live="polite">
          {cards.map((c) => (
            <ProjectCard key={c.id} card={c} onDismiss={() => dismissCard(c.id)} />
          ))}
        </section>
      )}
    </>
  );
}

function Transcript({ lines }: { lines: TranscriptLine[] }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, minHeight: 80 }}>
      {lines.length === 0 && <span style={{ color: "var(--muted)" }}>La conversación aparece aquí.</span>}
      {lines.map((line, i) => (
        <p key={i} style={{ margin: "6px 0" }}>
          <strong>{line.role === "user" ? "Tú" : "Agente"}:</strong> {line.text}
          {line.sources && line.sources.length > 0 && (
            <span style={{ display: "block", color: "var(--muted)", fontSize: 12 }}>
              fuentes: {line.sources.join(", ")}
            </span>
          )}
        </p>
      ))}
    </div>
  );
}

function btn(color: string): React.CSSProperties {
  return {
    background: color,
    color: "#fff",
    border: 0,
    borderRadius: 8,
    padding: "12px 20px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  };
}

const pre: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 12,
  fontSize: 12,
  maxHeight: 280,
  overflow: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};
