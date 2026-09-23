import { GeminiLiveProvider } from "./gemini-live";
import type { VoiceProvider } from "./types";
import { WebSpeechProvider, webSpeechAvailable } from "./web-speech";

export type VoiceProviderName = "gemini-live" | "web-speech";

export function createVoiceProvider(name: VoiceProviderName, opts?: { tenant?: string; lang?: string }): VoiceProvider {
  switch (name) {
    case "gemini-live":
      return new GeminiLiveProvider();
    case "web-speech":
      return new WebSpeechProvider(opts);
  }
}

export { webSpeechAvailable };
export type { VoiceEvent, VoiceProvider, SessionGrant } from "./types";
