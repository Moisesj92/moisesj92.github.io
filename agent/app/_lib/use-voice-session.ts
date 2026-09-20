"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectCard, ToolResult, ToolUiEffect } from "@/core/types";
import { MicCapture, MicDeniedError } from "@/lib/audio/capture";
import { PcmPlayer } from "@/lib/audio/playback";
import {
  createVoiceProvider,
  type SessionGrant,
  type VoiceEvent,
  type VoiceProvider,
} from "@/providers/voice";

export type SessionState =
  | "idle"
  | "requesting-mic"
  | "connecting"
  | "listening"
  | "speaking"
  | "error";

export interface TranscriptLine {
  role: "user" | "agent";
  text: string;
  /** ids de los documentos que respaldaron este turno (solo agente) */
  sources?: string[];
}

export interface DownloadOffer {
  url: string;
  label: string;
}

export interface LogEntry {
  t: number;
  msg: string;
}

const MAX_LOG = 60;

/**
 * Orquesta una sesión de voz: micrófono → proveedor → parlantes, y el
 * relay de tool calls hacia el servidor. Toda la política de estados
 * visibles vive aquí; la página solo la pinta.
 */
export function useVoiceSession(tenant?: string) {
  const [state, setState] = useState<SessionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [cards, setCards] = useState<ProjectCard[]>([]);
  const [download, setDownload] = useState<DownloadOffer | null>(null);

  const mic = useRef<MicCapture | null>(null);
  const player = useRef<PcmPlayer | null>(null);
  const provider = useRef<VoiceProvider | null>(null);
  const grant = useRef<SessionGrant | null>(null);
  const playing = useRef(false);
  /** lo que va pasando en el turno actual, para atribución y para el log */
  const turn = useRef<{ user: string; agent: string; sources: Set<string>; tools: { name: string; ok: boolean; ms: number }[]; startedAt: number }>({
    user: "",
    agent: "",
    sources: new Set(),
    tools: [],
    startedAt: 0,
  });

  const pushLog = useCallback((msg: string) => {
    setLog((l) => [...l.slice(-(MAX_LOG - 1)), { t: Date.now(), msg }]);
  }, []);

  const appendTranscript = useCallback((role: "user" | "agent", text: string) => {
    if (role === "user") turn.current.user += text;
    else turn.current.agent += text;
    setTranscript((lines) => {
      const last = lines[lines.length - 1];
      // Las transcripciones llegan en fragmentos; se acumulan por turno.
      if (last && last.role === role) {
        return [...lines.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...lines, { role, text }];
    });
  }, []);

  const applyUi = useCallback((ui: ToolUiEffect | undefined) => {
    if (!ui) return;
    if (ui.kind === "project-card") {
      setCards((cs) => [ui.card, ...cs.filter((c) => c.id !== ui.card.id)].slice(0, 3));
    } else if (ui.kind === "download") {
      setDownload({ url: ui.url, label: ui.label });
    }
  }, []);

  /** Cierra el turno: atribución en pantalla y registro en el servidor (sin audio). */
  const closeTurn = useCallback(() => {
    const t = turn.current;
    if (!t.user && !t.agent) return;
    const sources = [...t.sources];
    if (sources.length) {
      setTranscript((lines) => {
        const i = lines.length - 1;
        if (i < 0 || lines[i].role !== "agent") return lines;
        return [...lines.slice(0, i), { ...lines[i], sources }];
      });
    }
    void fetch("/api/log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tenant,
        sessionId: grant.current?.sessionId,
        user: t.user,
        agent: t.agent,
        tools: t.tools,
        sources,
        ms: t.startedAt ? Math.round(performance.now() - t.startedAt) : undefined,
      }),
      keepalive: true,
    }).catch(() => {});
    turn.current = { user: "", agent: "", sources: new Set(), tools: [], startedAt: performance.now() };
  }, [tenant]);

  const teardown = useCallback(async () => {
    // Se toman y anulan las refs antes de cerrar nada: disconnect() emite
    // "closed", que vuelve a entrar aquí, y no debe cerrar dos veces.
    const p = provider.current;
    const m = mic.current;
    const pl = player.current;
    provider.current = null;
    mic.current = null;
    player.current = null;
    grant.current = null;
    playing.current = false;
    setLevel(0);
    p?.disconnect();
    await m?.stop();
    await pl?.close();
  }, []);

  const fail = useCallback(
    (message: string) => {
      setError(message);
      setState("error");
      pushLog(`error: ${message}`);
      void teardown();
    },
    [pushLog, teardown],
  );

  const runTool = useCallback(
    async (call: { id: string; name: string; args: unknown }) => {
      const started = performance.now();
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenant, sessionId: grant.current?.sessionId, call }),
      });
      const result = (await res.json()) as ToolResult;
      const ms = Math.round(performance.now() - started);
      pushLog(`tool ${call.name} → HTTP ${res.status} en ${ms} ms: ${JSON.stringify(result).slice(0, 160)}`);
      turn.current.tools.push({ name: call.name, ok: result.ok === true, ms });
      for (const s of result.sources ?? []) turn.current.sources.add(s);
      applyUi(result.ui);
      // El modelo no necesita el efecto de UI.
      const forModel: ToolResult = { ...result };
      delete forModel.ui;
      provider.current?.sendToolResponse(call.id, call.name, forModel);
    },
    [applyUi, pushLog, tenant],
  );

  const onEvent = useCallback(
    (e: VoiceEvent) => {
      switch (e.type) {
        case "connected":
          pushLog("conectado a Gemini Live");
          setState("listening");
          break;
        case "audio":
          player.current?.push(e.pcm);
          break;
        case "interrupted":
          pushLog("interrupción: flush de reproducción");
          player.current?.flush();
          break;
        case "transcript":
          appendTranscript(e.role, e.text);
          break;
        case "toolCall":
          for (const call of e.calls) {
            pushLog(`toolCall ${call.name} ${JSON.stringify(call.args)}`);
            void runTool(call);
          }
          break;
        case "turnComplete":
          pushLog("turno completo");
          closeTurn();
          break;
        case "error":
          if (e.recoverable) pushLog(`aviso: ${e.message}`);
          else fail(e.message);
          break;
        case "closed":
          pushLog(`sesión cerrada (${e.reason ?? "sin motivo"})`);
          void teardown();
          setState("idle");
          break;
      }
    },
    [appendTranscript, closeTurn, fail, pushLog, runTool, teardown],
  );

  const start = useCallback(async () => {
    setError(null);
    setTranscript([]);
    setCards([]);
    setDownload(null);
    turn.current = { user: "", agent: "", sources: new Set(), tools: [], startedAt: performance.now() };
    setState("requesting-mic");
    try {
      // Ambos contextos se crean ahora, dentro del gesto del usuario (iOS).
      const playerP = PcmPlayer.start((isPlaying) => {
        playing.current = isPlaying;
        setState((s) =>
          s === "listening" || s === "speaking" ? (isPlaying ? "speaking" : "listening") : s,
        );
      });
      const micP = MicCapture.start(({ pcm, level }) => {
        setLevel(level);
        provider.current?.sendAudio(pcm);
      });
      player.current = await playerP;
      mic.current = await micP;
      pushLog(`micrófono listo (contexto a ${mic.current.sampleRate} Hz)`);

      setState("connecting");
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenant }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      grant.current = (await res.json()) as SessionGrant;
      setExpiresAt(grant.current.expiresAt);
      pushLog(`token recibido, modelo ${grant.current.model}, vence ${grant.current.expiresAt}`);

      provider.current = createVoiceProvider("gemini-live");
      await provider.current.connect(grant.current, onEvent);
    } catch (err) {
      if (err instanceof MicDeniedError) {
        fail("Necesito el micrófono para conversar. Puedes habilitarlo en el candado de la barra de direcciones.");
      } else {
        fail(err instanceof Error ? err.message : String(err));
      }
    }
  }, [fail, onEvent, pushLog, tenant]);

  const stop = useCallback(async () => {
    await teardown();
    setState("idle");
    pushLog("detenido por el usuario");
  }, [pushLog, teardown]);

  useEffect(() => {
    return () => {
      void teardown();
    };
  }, [teardown]);

  return { state, error, level, transcript, log, expiresAt, cards, download, start, stop };
}
