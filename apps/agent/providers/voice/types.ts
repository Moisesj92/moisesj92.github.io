import type { SessionGrant } from "@/core/session/grant";
import type { ToolResult } from "@/core/types";

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
  /** tools ya ejecutados en el servidor (proveedores que pasan por /api/chat) */
  | { type: "toolResult"; name: string; result: ToolResult }
  /** proveedores que manejan su propio audio avisan cuándo hablan */
  | { type: "agentSpeaking"; speaking: boolean }
  | { type: "turnComplete" }
  | { type: "error"; message: string; recoverable: boolean }
  | { type: "closed"; reason?: string };

/**
 * Contrato de un proveedor de voz speech-to-speech. Corre en el navegador.
 * El core y la UI programan contra esto; gemini-live es una implementación,
 * web-speech (cascada de degradación) será otra.
 */
export interface VoiceProvider {
  /** true: el proveedor captura y reproduce por su cuenta; la UI no crea mic ni player */
  readonly handlesAudio: boolean;
  connect(grant: SessionGrant, onEvent: (e: VoiceEvent) => void): Promise<void>;
  /** PCM16 mono a 16 kHz */
  sendAudio(pcm16k: Int16Array): void;
  sendToolResponse(id: string, name: string, response: unknown): void;
  disconnect(): void;
}
