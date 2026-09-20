import type { VoiceProvider } from "./types";

/**
 * Último escalón de la cascada de degradación (Fase 3): Web Speech API del
 * navegador, gratis y sin cuota, con aviso honesto de menor calidad.
 * Existe desde ahora para que la interfaz tenga dos implementaciones
 * previstas y no una sola.
 */
export class WebSpeechProvider implements VoiceProvider {
  async connect(): Promise<void> {
    throw new Error("WebSpeechProvider: no implementado (Fase 3)");
  }
  sendAudio(): void {}
  sendToolResponse(): void {}
  disconnect(): void {}
}
