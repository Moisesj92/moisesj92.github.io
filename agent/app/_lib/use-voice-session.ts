"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolResult } from "@/core/types";
import { InsecureContextError, MicCapture, MicDeniedError } from "@/lib/audio/capture";
import { PcmPlayer } from "@/lib/audio/playback";
import {
  createVoiceProvider,
  type SessionGrant,
  type VoiceEvent,
  type VoiceProvider,
} from "@/providers/voice";
import { useUiEffects } from "./use-ui-effects";

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

export interface LogEntry {
  t: number;
  msg: string;
}

/** Por qué falló, para que la página ofrezca la salida correcta. */
export type FailureKind = "mic" | "insecure" | "quota" | "offline" | "other";

/** Con menos de esto por delante, un token precalentado no se usa. */
const PREWARM_MIN_LEFT_MS = 10_000;
/** Tokens precalentados por carga de página: un visitante que solo lee no genera tokens en bucle. */
const PREWARM_MAX = 3;

const MAX_LOG = 60;

/**
 * Orquesta una sesión de voz: micrófono → proveedor → parlantes, y el
 * relay de tool calls hacia el servidor. Toda la política de estados
 * visibles vive aquí; la página solo la pinta.
 */
export function useVoiceSession(tenant?: string) {
  const [state, setState] = useState<SessionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [failure, setFailure] = useState<FailureKind | null>(null);
  const [level, setLevel] = useState(0);
  const [agentLevel, setAgentLevel] = useState(0);
  const [ttfaMs, setTtfaMs] = useState<number | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const ui = useUiEffects();

  const mic = useRef<MicCapture | null>(null);
  const player = useRef<PcmPlayer | null>(null);
  const provider = useRef<VoiceProvider | null>(null);
  const grant = useRef<SessionGrant | null>(null);
  /** token pedido por adelantado, listo para usar si aún sirve */
  const prewarmed = useRef<Promise<SessionGrant> | null>(null);
  const prewarmCount = useRef(0);
  const playing = useRef(false);
  const clickedAt = useRef(0);
  const firstAudioLogged = useRef(false);
  /** lo que va pasando en el turno actual, para atribución y para el log */
  const turn = useRef<{
    user: string;
    agent: string;
    sources: Set<string>;
    tools: { name: string; ok: boolean; ms: number }[];
    startedAt: number;
    first: boolean;
  }>({ user: "", agent: "", sources: new Set(), tools: [], startedAt: 0, first: true });
  const ttfa = useRef<number | null>(null);

  const applyUi = ui.apply;
  const resetUi = ui.reset;

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
        ttfaMs: t.first ? ttfa.current ?? undefined : undefined,
      }),
      keepalive: true,
    }).catch(() => {});
    turn.current = { user: "", agent: "", sources: new Set(), tools: [], startedAt: performance.now(), first: false };
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
    (message: string, kind: FailureKind = "other") => {
      setError(message);
      setFailure(kind);
      setState("error");
      pushLog(`error (${kind}): ${message}`);
      void teardown();
    },
    [pushLog, teardown],
  );

  /** Pide el token al servidor. Lanza con el tipo de fallo ya clasificado. */
  const fetchGrant = useCallback(async (): Promise<SessionGrant> => {
    let res: Response;
    try {
      res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenant }),
      });
    } catch {
      throw Object.assign(new Error("Sin conexión. Revisa tu red e inténtalo de nuevo."), { kind: "offline" as FailureKind });
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string; reason?: string };
      const kind: FailureKind = body.reason === "quota" || res.status === 503 ? "quota" : "other";
      throw Object.assign(new Error(body.error ?? `HTTP ${res.status}`), { kind });
    }
    return (await res.json()) as SessionGrant;
  }, [tenant]);

  /**
   * Precalentar antes del click: el token tarda ~1 s en emitirse y eso se lo
   * ahorra el primer audio. En escritorio la señal es el hover; en móvil no
   * hay hover, así que también vale la primera interacción con la página o
   * que el botón entre en pantalla (ver usePrewarmSignals). Si el token
   * anterior ya venció sin usarse, se pide otro, hasta PREWARM_MAX.
   */
  const prewarm = useCallback(
    (why: string) => {
      if (state !== "idle" && state !== "error") return;
      const request = () => {
        if (prewarmCount.current >= PREWARM_MAX) {
          pushLog(`precalentado: tope de ${PREWARM_MAX} por página alcanzado (${why})`);
          return;
        }
        prewarmCount.current += 1;
        const n = prewarmCount.current;
        const started = performance.now();
        prewarmed.current = fetchGrant()
          .then((g) => {
            pushLog(`precalentado: token ${n}/${PREWARM_MAX} listo en ${Math.round(performance.now() - started)} ms (${why}), sirve hasta ${new Date(g.connectBy).toLocaleTimeString()}`);
            return g;
          })
          .catch((err) => {
            prewarmed.current = null;
            pushLog(`precalentado: falló (${err instanceof Error ? err.message : String(err)})`);
            throw err;
          });
      };
      if (!prewarmed.current) {
        request();
        return;
      }
      // ¿sigue sirviendo el que ya tenemos? Si venció sin usarse, se pide otro.
      void prewarmed.current.then(
        (g) => {
          if (Date.parse(g.connectBy) - Date.now() < PREWARM_MIN_LEFT_MS) {
            pushLog(`precalentado: el token anterior venció sin usarse; pidiendo otro (${why})`);
            prewarmed.current = null;
            request();
          }
        },
        () => {},
      );
    },
    [fetchGrant, pushLog, state],
  );

  // Señales de intención que no dependen del hover: primera interacción con
  // la página (scroll o toque en cualquier parte). Se registran una vez.
  useEffect(() => {
    const onIntent = (e: Event) => prewarm(`interacción: ${e.type}`);
    const opts = { once: true, passive: true } as const;
    window.addEventListener("pointerdown", onIntent, opts);
    window.addEventListener("scroll", onIntent, opts);
    window.addEventListener("keydown", onIntent, opts);
    return () => {
      window.removeEventListener("pointerdown", onIntent);
      window.removeEventListener("scroll", onIntent);
      window.removeEventListener("keydown", onIntent);
    };
  }, [prewarm]);

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
          if (!firstAudioLogged.current) {
            firstAudioLogged.current = true;
            const ms = Math.round(performance.now() - clickedAt.current);
            ttfa.current = ms;
            setTtfaMs(ms);
            pushLog(`primer audio a los ${ms} ms desde el click`);
          }
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
          else fail(e.message, navigator.onLine ? "other" : "offline");
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
    setFailure(null);
    setTranscript([]);
    setTtfaMs(null);
    resetUi();
    clickedAt.current = performance.now();
    firstAudioLogged.current = false;
    turn.current = { user: "", agent: "", sources: new Set(), tools: [], startedAt: performance.now(), first: true };
    ttfa.current = null;
    setState("requesting-mic");
    try {
      // Ambos contextos se crean ahora, dentro del gesto del usuario (iOS).
      const playerP = PcmPlayer.start(
        (isPlaying) => {
          playing.current = isPlaying;
          if (!isPlaying) setAgentLevel(0);
          setState((s) =>
            s === "listening" || s === "speaking" ? (isPlaying ? "speaking" : "listening") : s,
          );
        },
        setAgentLevel,
      );
      const micP = MicCapture.start(({ pcm, level }) => {
        setLevel(level);
        provider.current?.sendAudio(pcm);
      });
      player.current = await playerP;
      mic.current = await micP;
      pushLog(`micrófono listo (contexto a ${mic.current.sampleRate} Hz)`);

      setState("connecting");
      let g: SessionGrant | null = null;
      if (prewarmed.current) {
        g = await prewarmed.current.catch(() => null);
        prewarmed.current = null;
        if (g && Date.parse(g.connectBy) - Date.now() < PREWARM_MIN_LEFT_MS) g = null;
        if (g) pushLog("usando token precalentado: el click no espera al servidor");
        else pushLog("el token precalentado ya no servía; pidiendo uno nuevo");
      }
      grant.current = g ?? (await fetchGrant());
      setExpiresAt(grant.current.expiresAt);
      pushLog(`token recibido, modelo ${grant.current.model}, vence ${grant.current.expiresAt}`);

      provider.current = createVoiceProvider("gemini-live");
      await provider.current.connect(grant.current, onEvent);
    } catch (err) {
      if (err instanceof MicDeniedError) {
        fail("Necesito el micrófono para conversar. Puedes habilitarlo en el candado de la barra de direcciones.", "mic");
      } else if (err instanceof InsecureContextError) {
        fail(err.message, "insecure");
      } else {
        const kind = (err as { kind?: FailureKind }).kind ?? (navigator.onLine ? "other" : "offline");
        fail(err instanceof Error ? err.message : String(err), kind);
      }
    }
  }, [fail, fetchGrant, onEvent, pushLog, resetUi]);

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

  return {
    state,
    error,
    failure,
    level,
    agentLevel,
    ttfaMs,
    prewarm,
    transcript,
    log,
    expiresAt,
    cards: ui.cards,
    download: ui.download,
    dismissCard: ui.dismissCard,
    dismissDownload: ui.dismissDownload,
    start,
    stop,
  };
}
