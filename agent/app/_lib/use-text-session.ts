"use client";

import { useCallback, useState } from "react";
import type { ToolResult } from "@/core/types";
import type { TranscriptLine } from "./use-voice-session";
import { useUiEffects } from "./use-ui-effects";

interface ChatResponse {
  sessionId: string;
  text: string;
  steps: { name: string; args: unknown; result: ToolResult; ms: number }[];
  sources: string[];
  model: string;
}

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
  const ui = useUiEffects();
  const { apply } = ui;

  const send = useCallback(
    async (message: string) => {
      const text = message.trim();
      if (!text || busy) return;
      setBusy(true);
      setError(null);
      const history = transcript.map((l) => ({ role: l.role, text: l.text }));
      setTranscript((t) => [...t, { role: "user", text }]);
      try {
        let res: Response;
        try {
          res = await fetch("/api/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tenant, sessionId, history, message: text }),
          });
        } catch {
          throw new Error("Sin conexión. Revisa tu red e inténtalo de nuevo.");
        }
        const body = (await res.json().catch(() => ({}))) as Partial<ChatResponse> & { error?: string };
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        const turn = body as ChatResponse;
        setSessionId(turn.sessionId);
        for (const step of turn.steps) apply(step.result.ui);
        setTranscript((t) => [...t, { role: "agent", text: turn.text, sources: turn.sources }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [apply, busy, sessionId, tenant, transcript],
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
    cards: ui.cards,
    download: ui.download,
    dismissCard: ui.dismissCard,
    dismissDownload: ui.dismissDownload,
    send,
    reset,
  };
}
