"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProjectCard, ToolUiEffect } from "@/core/types";

/** Una tarjeta acompaña lo que se está diciendo; pasado esto, estorba. */
const CARD_TTL_MS = 30_000;
const MAX_CARDS = 3;

export interface ShownCard extends ProjectCard {
  shownAt: number;
}

export interface DownloadOffer {
  url: string;
  label: string;
}

/**
 * Efectos de UI que producen los tools (tarjetas, descarga), comunes a la
 * voz y al texto: aparecen, caducan solas y se pueden descartar.
 */
export function useUiEffects() {
  const [cards, setCards] = useState<ShownCard[]>([]);
  const [download, setDownload] = useState<DownloadOffer | null>(null);

  const apply = useCallback((ui: ToolUiEffect | undefined) => {
    if (!ui) return;
    if (ui.kind === "project-cards") {
      const now = Date.now();
      const ids = new Set(ui.cards.map((c) => c.id));
      setCards((cs) =>
        [...ui.cards.map((c) => ({ ...c, shownAt: now })), ...cs.filter((c) => !ids.has(c.id))].slice(0, MAX_CARDS),
      );
    } else if (ui.kind === "download") {
      setDownload({ url: ui.url, label: ui.label });
    }
  }, []);

  const dismissCard = useCallback((id: string) => setCards((cs) => cs.filter((c) => c.id !== id)), []);
  const dismissDownload = useCallback(() => setDownload(null), []);
  const reset = useCallback(() => {
    setCards([]);
    setDownload(null);
  }, []);

  useEffect(() => {
    if (cards.length === 0) return;
    const t = setInterval(() => {
      const cutoff = Date.now() - CARD_TTL_MS;
      setCards((cs) => (cs.some((c) => c.shownAt < cutoff) ? cs.filter((c) => c.shownAt >= cutoff) : cs));
    }, 1000);
    return () => clearInterval(t);
  }, [cards.length]);

  return { cards, download, apply, dismissCard, dismissDownload, reset };
}
