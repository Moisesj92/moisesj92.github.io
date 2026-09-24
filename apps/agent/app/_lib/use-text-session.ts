"use client";

import { useCallback, useState } from "react";
import type { ToolResult } from "@/core/types";
import type { TranscriptLine } from "./use-voice-session";
import { track, trackToolResult } from "./analytics";
import { getOrigin } from "./origin";
import { useUiEffects } from "./use-ui-effects";

interface ChatResponse {
  sessionId: string;
  text: string;
  steps: { name: string; args: unknown; result: ToolResult; ms: number }[];
  sources: string[];
  model: string;
  timing: {
    modelCalls: { model: string; ms: number; result: string }[];
    toolsMs: number;
    totalMs: number;
    guardMs: number;
    serverMs: number;
  };
}

export interface LogEntry {
  t: number;
  msg: string;
}
const MAX_LOG = 60;

/**
 * Fallback a texto con la misma calidad que la voz: mismo prompt, tools y
 * retriever (/api/chat). Tarjetas y descarga aparecen igual. Un
 * reclutador en oficina abierta no le va a hablar a su laptop.
 */
export function useTextSession(tenant?: string) {
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [log, setLog] = useState<LogEntry[]>([]);
  const ui = useUiEffects();
  const { apply } = ui;
  const pushLog = useCallback((msg: string) => {
    setLog((l) => [...l.slice(-(MAX_LOG - 1)), { t: Date.now(), msg }]);
  }, []);

  const send = useCallback(
    async (message: string) => {
      const text = message.trim();
      if (!text || busy) return;
      setBusy(true);
      setError(null);
      const history = transcript.map((l) => ({ role: l.role, text: l.text }));
      setTranscript((t) => [...t, { role: "user", text }]);
      const started = performance.now();
      pushLog(`enviando: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`);
      try {
        let res: Response;
        try {
          res = await fetch("/api/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tenant, sessionId, history, message: text, origin: getOrigin() }),
          });
        } catch {
          throw new Error("Sin conexión. Revisa tu red e inténtalo de nuevo.");
        }
        const body = (await res.json().catch(() => ({}))) as Partial<ChatResponse> & { error?: string };
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        const turn = body as ChatResponse;
        // Solo la primera pregunta de cada conversación: el volumen está en /admin.
        if (!sessionId) track("pregunta-texto");
        setSessionId(turn.sessionId);
        for (const step of turn.steps) {
          apply(step.result.ui);
          trackToolResult(step.name, step.result.ok);
        }
        setTranscript((t) => [...t, { role: "agent", text: turn.text, sources: turn.sources }]);
        // Desglose del tiempo: red, guardián (base de datos), cada llamada al modelo, tools.
        const roundTrip = Math.round(performance.now() - started);
        const tm = turn.timing;
        const network = roundTrip - (tm?.serverMs ?? 0);
        pushLog(`respuesta en ${roundTrip} ms · red+cold start ${network} ms · guardián/base ${tm?.guardMs ?? "?"} ms · tools ${tm?.toolsMs ?? 0} ms`);
        for (const c of tm?.modelCalls ?? []) pushLog(`  modelo ${c.model}: ${c.ms} ms (${c.result === "ok" ? "ok" : `HTTP ${c.result} → siguiente`})`);
        for (const s of turn.steps) pushLog(`  tool ${s.name}: ${s.ms} ms · ${s.result.ok ? `${s.result.sources?.length ?? 0} doc(s)` : s.result.error}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        pushLog(`error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setBusy(false);
      }
    },
    [apply, busy, pushLog, sessionId, tenant, transcript],
  );

  const reset = useCallback(() => {
    setTranscript([]);
    setSessionId(undefined);
    setError(null);
    ui.reset();
  }, [ui]);

  return {
    transcript,
    busy,
    error,
    log,
    cards: ui.cards,
    download: ui.download,
    dismissCard: ui.dismissCard,
    dismissDownload: ui.dismissDownload,
    send,
    reset,
  };
}
