import { GeminiLiveProvider } from "./gemini-live";
import type { VoiceProvider } from "./types";
import { WebSpeechProvider } from "./web-speech";

export type VoiceProviderName = "gemini-live" | "web-speech";

export function createVoiceProvider(name: VoiceProviderName): VoiceProvider {
  switch (name) {
    case "gemini-live":
      return new GeminiLiveProvider();
    case "web-speech":
      return new WebSpeechProvider();
  }
}

export type { VoiceEvent, VoiceProvider, SessionGrant } from "./types";
