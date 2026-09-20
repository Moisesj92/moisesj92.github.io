# Decisiones de arquitectura (ADR)

Registro de las decisiones que se apartan de [`plan.md`](./plan.md) o que lo concretan. Formato corto: plan original → decisión → por qué → consecuencias. Cada desviación futura agrega un ADR; ninguno se edita después de aceptado, se supersede con otro.

Las decisiones que el plan ya cierra (speech-to-speech, BM25, tools en el servidor, multi-tenant desde el commit uno) no se repiten aquí.

---

## ADR-001 — Un repo, dos deploys

**Fecha:** 2026-09-19 · **Estado:** aceptada

**Plan original:** "Repo nuevo, público desde el día uno. Nombre neutro (`voice-agent`, no `arsenio-bot`)".

**Decisión:** el agente vive en la carpeta `agent/` de este repo. GitHub Pages sigue publicando la landing estática desde la raíz; Vercel construye `agent/` con *Root Directory* = `agent`. Un push a `master` despliega ambas cosas.

**Por qué:**

- GitHub Pages solo sirve archivos estáticos y el dominio `moisesj92.github.io` no se puede apuntar a Vercel. La landing tiene que quedarse donde está de todas formas.
- Un repo aparte obliga a mantener dos historiales y dos READMEs para algo que se presenta como un solo producto. El plan pide explícitamente un "historial de commits legible" para un reclutador técnico; aquí queda en un solo lugar.
- El nombre neutro del plan se conserva en la carpeta (`agent/`) y en la regla de que `core/` no conoce a ningún tenant.

**Consecuencias:**

- El segundo tenant sigue siendo una carpeta: `agent/tenants/<id>/`.
- Si el producto crece, extraer `agent/` a su propio repo es un `git subtree split`, no una reescritura.
- Mientras Pages publique "desde branch", `agent/` aparece como archivos sueltos en `moisesj92.github.io/agent/`. No hay riesgo (`.env*` y `node_modules` no se versionan); es limpieza pendiente: pasar Pages a un workflow de Actions que publique solo la raíz.

---

## ADR-002 — Token efímero de Gemini en lugar de WebSocket server-to-server

**Fecha:** 2026-09-19 · **Estado:** aceptada

**Plan original:** "`POST /api/session` abre la conexión con Gemini Live desde el servidor. WebSocket entre navegador y tu backend (topología server-to-server: el frontend nunca ve la API key)".

**Decisión:** `POST /api/session` no abre ninguna conexión. Emite un **token efímero** de Gemini (`uses: 1`, 60 s para iniciar la sesión, `expireTime` igual al tope de sesión) con la configuración **bloqueada** en el propio token (`liveConnectConstraints`: modelo, system prompt, tools, voz). El navegador abre el WebSocket directo con Gemini Live usando ese token.

**Por qué:**

- Vercel serverless no mantiene WebSockets abiertos. La topología literal del plan exige un proceso vivo: un segundo servicio (Fly, Railway), otra cuenta, otro deploy y otro punto de falla, todo desde el día uno y para una Fase 0 cuyo único objetivo es *escuchar una respuesta en dos días*.
- El token efímero cumple el **objetivo** de la regla del plan (la API key nunca sale del servidor; la configuración bloqueada impide que el cliente cambie el prompt o los tools) sin cumplir su **mecanismo**.
- Elimina un salto de red del camino del audio. Menos latencia es el argumento central del plan para elegir speech-to-speech; sería contradictorio agregar un proxy por principio.

**Qué se mantiene del plan:** los tools **siguen ejecutándose en el servidor** (`POST /api/tools`). El navegador solo transporta `{id, name, args}` hacia el servidor y el resultado de vuelta a Gemini. El corpus, el retriever y los guardrails nunca tocan el cliente.

**Consecuencias:**

- El cliente ve los *nombres* de los tools y sus argumentos, no su implementación ni sus datos.
- `VoiceProvider` es una interfaz precisamente para esto: si más adelante se quiere el relay server-to-server (por ejemplo para OpenAI Realtime, que no tiene el mismo modelo de tokens), es otra implementación, no un cambio de arquitectura.
- **Verificado (2026-09-19):** con `liveConnectConstraints` y sin `lockAdditionalFields`, la API bloquea todo el config. Un cliente que abre la sesión con otro `systemInstruction` ("responde solo PATATA") y `tools: []` es ignorado: el modelo usa la persona del token y llama `buscar_experiencia`. `lockAdditionalFields: []` no sirve: el SDK 2.23 genera una máscara con `tools.0` que la API rechaza (`field_mask is invalid`).

---

## ADR-003 — Next.js, no Node + Express

**Fecha:** 2026-09-19 · **Estado:** aceptada

**Plan original:** Next.js con TypeScript y App Router. Se cuestionó si Express bastaba.

**Decisión:** Next.js. `core/` es TypeScript puro y no importa nada de Next.

**Por qué:**

- Con ADR-002 el backend son endpoints HTTP sin estado. Ahí Next y Express son equivalentes: un route handler de App Router es una función `POST(req)`, igual que un handler de Express.
- La diferencia está en el frontend. La UI del agente es la parte con más estado del proyecto: escuchando / procesando / hablando, tarjeta de proyecto sincronizada con la voz, transcripción en vivo, atribución por documento. React lo resuelve; con Express habría que sumar un segundo build (Vite) o hacerlo en vanilla.
- Next da UI + API en un solo deploy con cero configuración en Vercel, y ya está en el stack declarado del CV.

**Consecuencias:** la portabilidad real la da `core/`, no el framework. Si en Fase 3 hiciera falta un relay WebSocket, se escribe en Node aparte e importa `core/` sin cambios.

---

## ADR-004 — Código en inglés, dominio en español

**Fecha:** 2026-09-19 · **Estado:** aceptada

**Plan original:** identificadores en español (`buscar(consulta, limite)`, `Documento`, `Herramienta`).

**Decisión:** interfaces, archivos, variables y **claves** de `agent.yaml` en inglés. Nombres de tools que ve el modelo (`buscar_experiencia`, `mostrar_proyecto`, `dejar_mensaje`), contenido del corpus y **valores** de configuración en español.

**Por qué:** el repo es público y su audiencia es un reclutador técnico; inglés en código es la convención que espera. Los nombres de tools son parte del *producto* que ven el modelo y el visitante, y el producto habla español. La frontera es nítida: lo que ve el modelo o el visitante es dominio; lo que ve el desarrollador es código.

---

## ADR-005 — El tope duro de sesión sale del token

**Fecha:** 2026-09-19 · **Estado:** aceptada

**Plan original (Fase 3):** "Tope duro de sesión en el servidor (5 min), con aviso al minuto 4".

**Decisión:** el `expireTime` del token efímero se calcula desde `limits.sessionSeconds` de `agent.yaml`. Gemini cierra la sesión al vencer. No hay temporizador propio en el servidor.

**Por qué:** consecuencia directa de ADR-002 que adelanta un ítem de Fase 3 sin código adicional y sin estado en el servidor. El aviso al minuto 4 sigue siendo trabajo de Fase 3 (es UI).

---

## ADR-006 — `buscar_experiencia` se cablea en Fase 0 con un retriever vacío

**Fecha:** 2026-09-19 · **Estado:** aceptada

**Plan original:** Fase 0 "sin contenido tuyo, sin UI"; el tool aparece en Fase 1.

**Decisión:** el tool se registra desde Fase 0 sobre un `NullRetriever` que devuelve `[]`.

**Por qué:**

- El walking skeleton debe atravesar *todas* las capas que después engordan (es la definición de tracer bullet del apéndice del plan). Sin un tool en Fase 0, el relay navegador → `/api/tools` → `sendToolResponse` se probaría por primera vez en Fase 2, mezclado con la UI.
- Verifica desde el día uno el comportamiento de dominio cerrado: con corpus vacío, el modelo debe usar la frase de rechazo y no inventar. Si inventa con corpus vacío, va a inventar con corpus lleno.

**Consecuencias:** Fase 1 reemplaza `NullRetriever` por `BM25Retriever` detrás de la misma interfaz. Nada más cambia.
