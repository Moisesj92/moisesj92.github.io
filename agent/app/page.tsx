"use client";

import { ProjectCard } from "./_components/project-card";
import { useVoiceSession, type SessionState } from "./_lib/use-voice-session";

const LABEL: Record<SessionState, string> = {
  idle: "Listo",
  "requesting-mic": "Pidiendo micrófono…",
  connecting: "Conectando…",
  listening: "Escuchando",
  speaking: "Hablando",
  error: "Error",
};

export default function Home() {
  const { state, error, level, transcript, log, expiresAt, cards, download, start, stop } =
    useVoiceSession();
  const busy = state === "requesting-mic" || state === "connecting";
  const active = state === "listening" || state === "speaking";

  return (
    <main>
      <h1>Agente de voz</h1>
      <p style={{ color: "var(--muted)" }}>
        Fase 0: walking skeleton. Habla y escucha la respuesta; interrúmpelo a media frase.
      </p>

      <section style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0" }}>
        {active ? (
          <button onClick={stop} style={btn("var(--danger)")}>
            Detener
          </button>
        ) : (
          <button onClick={start} disabled={busy} style={btn("var(--accent)")}>
            {busy ? LABEL[state] : "Iniciar"}
          </button>
        )}
        <span
          aria-live="polite"
          style={{
            fontWeight: 600,
            color: state === "error" ? "var(--danger)" : active ? "var(--accent)" : "inherit",
          }}
        >
          {LABEL[state]}
        </span>
        <span
          aria-hidden
          title="nivel de micrófono"
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "var(--accent)",
            opacity: 0.2 + Math.min(1, level * 6) * 0.8,
            transform: `scale(${1 + Math.min(1, level * 6)})`,
            transition: "transform 60ms, opacity 60ms",
          }}
        />
      </section>

      {error && (
        <p role="alert" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      {active && expiresAt && (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          La sesión se cierra sola a las {new Date(expiresAt).toLocaleTimeString()}.
        </p>
      )}

      {download && (
        <a
          href={download.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btn("var(--accent)"), display: "inline-block", textDecoration: "none", marginBottom: 16 }}
        >
          ⬇ {download.label}
        </a>
      )}
      {cards.length > 0 && (
        <section style={{ display: "grid", gap: 12, marginBottom: 16 }} aria-live="polite">
          {cards.map((c) => (
            <ProjectCard key={c.id} card={c} />
          ))}
        </section>
      )}

      <h2 style={{ fontSize: 16 }}>Transcripción</h2>
      <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, minHeight: 80 }}>
        {transcript.length === 0 && <span style={{ color: "var(--muted)" }}>—</span>}
        {transcript.map((line, i) => (
          <p key={i} style={{ margin: "4px 0" }}>
            <strong>{line.role === "user" ? "Tú" : "Agente"}:</strong> {line.text}
            {line.sources && line.sources.length > 0 && (
              <span style={{ display: "block", color: "var(--muted)", fontSize: 12 }}>
                fuentes: {line.sources.join(", ")}
              </span>
            )}
          </p>
        ))}
      </div>

      <h2 style={{ fontSize: 16 }}>Eventos</h2>
      <pre
        style={{
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 12,
          fontSize: 12,
          maxHeight: 280,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {log.length === 0
          ? "—"
          : log.map((l) => `${new Date(l.t).toLocaleTimeString()}  ${l.msg}`).join("\n")}
      </pre>
    </main>
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
