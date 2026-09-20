import type { SessionGrant } from "@/core/session/grant";

export type { SessionGrant };

/** Eventos que cualquier proveedor de voz emite hacia la UI. */
export type VoiceEvent =
  | { type: "connected" }
  /** PCM16 mono a 24 kHz */
  | { type: "audio"; pcm: Int16Array }
  /** el usuario habló encima: descartar lo que aún no sonó */
  | { type: "interrupted" }
  | { type: "transcript"; role: "user" | "agent"; text: string; final: boolean }
  | { type: "toolCall"; calls: { id: string; name: string; args: unknown }[] }
  | { type: "turnComplete" }
  | { type: "error"; message: string; recoverable: boolean }
  | { type: "closed"; reason?: string };

/**
 * Contrato de un proveedor de voz speech-to-speech. Corre en el navegador.
 * El core y la UI programan contra esto; gemini-live es una implementación,
 * web-speech (cascada de degradación) será otra.
 */
export interface VoiceProvider {
  connect(grant: SessionGrant, onEvent: (e: VoiceEvent) => void): Promise<void>;
  /** PCM16 mono a 16 kHz */
  sendAudio(pcm16k: Int16Array): void;
  sendToolResponse(id: string, name: string, response: unknown): void;
  disconnect(): void;
}
