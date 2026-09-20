# Agente de voz

Agente de voz de dominio cerrado con recuperación trazable, multi-tenant desde el primer commit. Arsenio es el tenant #1.

- [`docs/plan.md`](docs/plan.md) — plan de trabajo por fases.
- [`docs/decisions.md`](docs/decisions.md) — decisiones de arquitectura (ADR) y por qué la implementación se aparta del plan donde lo hace.

**Estado:** Fase 0 (walking skeleton). Hablas, una voz contesta, puedes interrumpirla. El corpus está vacío a propósito: el agente debe rechazar cualquier pregunta sobre Arsenio hasta la Fase 1.

## Cómo funciona (Fase 0)

```
navegador                              servidor (Vercel)            Gemini Live
─────────                              ─────────────────            ───────────
click Iniciar
  ├─ AudioContext 16 kHz + mic ──┐
  └─ AudioContext 24 kHz ────────┤
POST /api/session ───────────────────▶ loadTenant(agent.yaml)
                                       buildSystemPrompt + tools
                                       authTokens.create ─────────▶ token efímero
◀────────────── { token, model } ──────  (config bloqueada)
WebSocket con el token ────────────────────────────────────────────▶ sesión
PCM16 16 kHz ──────────────────────────────────────────────────────▶
◀──────────────────────────────────────────────────────── PCM16 24 kHz, transcripción
◀──────────────────────────────────────────────────────── toolCall buscar_experiencia
POST /api/tools ─────────────────────▶ registry.run → Retriever
◀────────────── ToolResult
sendToolResponse ──────────────────────────────────────────────────▶
```

La API key nunca sale del servidor. El navegador solo transporta tool calls; el corpus y la lógica no lo tocan. Detalle en [ADR-002](docs/decisions.md#adr-002--token-efímero-de-gemini-en-lugar-de-websocket-server-to-server).

## Estructura

```
app/            UI (Next.js App Router) y route handlers /api/session, /api/tools
core/           motor, TypeScript puro sin Next: config, prompt, retrieval, tools, session
providers/      adaptadores de voz tras la interfaz VoiceProvider (gemini-live, web-speech)
lib/audio/      captura y reproducción PCM con AudioWorklet
public/worklets AudioWorkletProcessors (captura 16 kHz, reproducción 24 kHz con flush)
tenants/<id>/   agent.yaml + corpus/ — todo lo específico de un tenant vive aquí
evals/          casos y runner (Fase 3)
```

Regla: si aparece el nombre de un tenant en `core/`, `providers/`, `lib/` o `app/`, es un bug.

## Correr en local

Requiere Node 22 (hay `.nvmrc`) y pnpm.

```bash
nvm use
pnpm install
cp .env.example .env.local   # poner GEMINI_API_KEY (Google AI Studio, free tier)
pnpm dev
```

Abrir <http://localhost:3000> en Chrome de escritorio, pulsar **Iniciar**, aceptar el micrófono.

## Deploy

Vercel, importando este repo con **Root Directory = `agent`** y las variables `GEMINI_API_KEY` y `DEFAULT_TENANT=arsenio`. La landing estática sigue en GitHub Pages desde la raíz del repo ([ADR-001](docs/decisions.md#adr-001--un-repo-dos-deploys)).

## Verificación de Fase 0

1. `pnpm build` y `pnpm lint` sin errores.
2. `curl -X POST localhost:3000/api/session` devuelve `{ sessionId, token, model, expiresAt }` y no contiene la API key.
3. Iniciar → se escucha el saludo antes de hablar → pregunta → respuesta sin ruido blanco.
4. Hablar encima mientras responde → se calla de inmediato (el log muestra `interrupción: flush`).
5. En silencio, el agente no se interrumpe solo (echo cancellation).
6. Preguntar algo sobre Arsenio → el log muestra `toolCall buscar_experiencia` → `HTTP 200` → el agente responde con la frase de rechazo. No inventa.
7. Denegar el micrófono → estado de error con mensaje, botón vuelve a Iniciar.
8. Con `limits.sessionSeconds: 30` en `agent.yaml`, la sesión se cierra sola y la UI vuelve a Listo.
9. Misma prueba en un iPhone real con la URL de Vercel.
10. `grep -ri arsenio core providers lib app` no devuelve nada.
