# Plan de tareas — Agente de voz para portafolio

2026-09-19

---

## Decisiones ya tomadas

Resumen para no volver a discutirlas a mitad del desarrollo.

| Decisión | Elección | Razón corta |
| --- | --- | --- |
| Arquitectura de voz | Speech-to-speech nativo, no pipeline STT→LLM→TTS | ~300ms vs ~1s; barge-in viene incluido |
| Proveedor de voz | Adaptador intercambiable: webspeech / gemini-live / openai-realtime | Permite desarrollar gratis y decidir el pago en la semana 3 |
| Contexto | Dos capas: ficha fija en el system prompt + corpus recuperado por tool | El corpus cabe en 128k; RAG vectorial con 30 docs es over-engineering |
| Recuperación | Filtro por tags + BM25 sobre Markdown plano, detrás de una interfaz estable | Migrar a pgvector después es cambiar el cuerpo de una función |
| Tools | Ejecutados en el servidor, nunca en el navegador | El corpus y la lógica no tocan el cliente |
| Anti-alucinación | Datos y evals, no solo prompt | Un prompt no se testea en CI; una suite de evals sí |
| Contención de abuso | Quitar capacidades, no acumular filtros | Sin tools destructivos, el radio de daño de un jailbreak es cero |
| Multi-tenant | `/core` + `/tenants/<nombre>` desde el commit uno | Un tenant nuevo es una carpeta, no un fork |
| Encuadre | Arsenio es el tenant #1, no el proyecto entero | Reencuadra el demo como producto |

---

## Fase 0 — Setup y walking skeleton

**Objetivo:** hablarle al micrófono y que una voz te conteste. Nada más. Sin contenido tuyo, sin UI.

**Regla de corte:** si al final del día 2 no escuchas una respuesta, el problema es de setup y hay que resolverlo antes de invertir en lo demás. ✅ Cerrada 2026-09-19 (PR #6).

### Setup

- [x] (carpeta `agent/` en este repo, ADR-001) Repo nuevo, público desde el día uno. Nombre neutro (`voice-agent`, no `arsenio-bot`) — es un producto con tenants, no un juguete personal
- [x] Next.js con TypeScript y App Router
- [x] Estructura de carpetas base, vacía pero creada:
  - `/core` — motor: sesión, runtime de tools, recuperación, guardrails
  - `/providers` — adaptadores de voz
  - `/tenants/arsenio` — `agent.yaml` + `corpus/`
  - `/evals` — casos y runner
- [x] Deploy a Vercel con el esqueleto vacío. Despliega antes de tener nada: si dejas el deploy para el final, el final se corre una semana
- [x] Variables de entorno en Vercel, nunca en el repo
- [x] Cuenta en Google AI Studio y API key del free tier

### La rebanada de punta a punta

- [x] (token efímero, ADR-002) Route handler `POST /api/session` que abre la conexión con Gemini Live desde el servidor
- [x] (navegador → Gemini directo con token bloqueado, ADR-002) WebSocket entre navegador y tu backend (topología server-to-server: el frontend nunca ve la API key)
- [x] `getUserMedia` + captura de micrófono, y streaming del audio al backend
- [x] Reproducción del audio de vuelta con `AudioWorklet` (no `<audio>`: necesitas control de buffer para cortar la reproducción al interrumpir)
- [x] Botón de start/stop y manejo del permiso de micrófono denegado
- [x] Verificar que la interrupción funciona: háblale encima mientras responde y confirma que se calla

### Trampas conocidas

- El formato de audio importa: PCM 16-bit, sample rate específico. Si escuchas ruido blanco, es esto, no el modelo. Esta parte sí es un spike: script sucio, timeboxed, código a la basura
- El eco es real: sin `echoCancellation: true` en las constraints, el agente se escucha a sí mismo y se interrumpe solo
- Safari en iOS exige un gesto del usuario para iniciar el `AudioContext`. Pruébalo en móvil ahora, no en la semana 3

---

## Fase 1 — El corpus y el cerebro

**Objetivo:** un agente que responde bien sobre tu carrera **en modo texto**. Sin voz. Acá está el 70% del valor del proyecto y es donde casi todos se saltan el trabajo.

**Todo esto se desarrolla y prueba contra texto con Gemini Flash en free tier. Costo cero.**

### Schema del corpus

- [x] Definir el frontmatter de cada documento: `id`, `empresa`, `periodo`, `rol`, `tags[]`, `tecnologias[]`, `tipo` (situación / proyecto / dato-duro / respuesta-a-pregunta-frecuente)
- [x] Escribir un documento de ejemplo completo y dejarlo como plantilla
- [x] Validación del frontmatter con Zod al cargar: un doc mal formado debe romper el build, no fallar en silencio en producción

### Escribir el contenido (esta es la tarea larga)

- [x] **Capa 0** — ficha de identidad, máximo ~2k tokens: línea de tiempo, empresas, stack, una línea por proyecto, disponibilidad, contacto. Va fija al inicio del system prompt para que entre en caché
- [x] **Capa 1** — 20 a 30 situaciones, ~300 palabras cada una. Formato: contexto, qué hiciste tú específicamente, decisión técnica que tomaste, resultado. Las métricas van literales, nunca redondeadas
- [x] **Los "no"** — un documento por cada pregunta predecible sin respuesta obvia: expectativa de renta, tecnologías que no has usado, años exactos por stack, reubicación, por qué dejaste cada trabajo, el salto entre gestión de planta y desarrollo. Una respuesta redactada vale más que cualquier guardrail
- [x] Revisar que ningún documento contenga datos que no quieras públicos

### El motor

- [x] Cargador del corpus: lee los `.md` del tenant, parsea frontmatter, construye el índice en build time
- [x] Interfaz `Retriever` con un solo método (`buscar(consulta, limite) => Documento[]`). Esta firma no cambia nunca
- [x] Implementación `BM25Retriever` con filtro previo por tags. Sin dependencias pesadas
- [x] System prompt: persona, capa 0, reglas de dominio cerrado, frase exacta de rechazo, regla dura sobre números, instrucción de turnos de 2-3 frases, respuesta en el idioma del visitante
- [x] Runtime de tools en el servidor, con `buscar_experiencia` como primer tool
- [x] Endpoint de chat de texto que ya usa todo lo anterior
- [x] CLI o página `/debug` que muestra qué documentos se recuperaron en cada turno — esto te salva horas

### Criterio de salida de la fase

Conversas por texto 20 minutos, le haces las preguntas más incómodas que se te ocurran, y no inventa nada. ✅ 2026-09-20

---

## Fase 2 — Tools con efecto y UI

**Objetivo:** que deje de ser un chat con voz y pase a ser software. Acá se juntan la Fase 0 y la Fase 1.

### Tools

- [x] `buscar_experiencia(consulta)` — ya existe de la Fase 1, ahora conectado a la sesión de voz
- [ ] `mostrar_proyecto(id)` — la página despliega la tarjeta del proyecto **mientras** el agente lo cuenta. Voz y UI sincronizadas es el efecto que la gente recuerda
- [ ] `descargar_cv()` — dispara la descarga del PDF que ya generas desde el mismo YAML
- [ ] `dejar_mensaje(nombre, email, texto)` — captura el contacto por voz. Este es el único tool con efecto secundario en todo el sistema, y esa restricción es deliberada
- [ ] Validar `dejar_mensaje`: rate limit propio, sanitización, y no reenviar el texto crudo a tu bandeja

### UI

- [ ] Estado visual de la conversación: escuchando / procesando / hablando. Sin esto el usuario no sabe si funciona
- [ ] Visualizador de audio reactivo al micrófono — barato de hacer y hace toda la diferencia en la percepción de "está vivo"
- [ ] Transcripción en vivo en pantalla
- [ ] Atribución visible: cada afirmación muestra de qué documento salió
- [ ] **Fallback a texto**, con la misma calidad de respuesta. No es opcional: un reclutador en oficina abierta no le va a hablar a su laptop
- [ ] Móvil real: probado en iOS y Android, no solo en el responsive del devtools
- [ ] Estados de error con salida digna: micrófono denegado, sin conexión, cuota agotada

### Latencia percibida

- [ ] Precalentar la sesión al hacer hover sobre el botón, no al hacer click
- [ ] Saludo inmediato al conectar, para que el primer audio llegue antes de que el usuario hable
- [ ] Activar preámbulos hablados para cubrir la latencia de los tool calls
- [ ] Instrumentar y registrar el tiempo al primer audio

---

## Fase 3 — Evals, guardrails y producción

**Objetivo:** que sobreviva a internet y que puedas demostrar que funciona, no solo afirmarlo.

### Evals (lo que convierte esto en ingeniería)

- [ ] ~50 casos en YAML: pregunta, comportamiento esperado, documentos que deberían recuperarse
- [ ] De esos, **15 deben terminar en rechazo**: preguntas fuera de dominio, datos que no existen, intentos de usar el agente como LLM general, preguntas capciosas sobre tecnologías que no has usado
- [ ] Runner que corre contra la ruta de texto — barata y determinista
- [ ] LLM como juez, con criterio explícito por caso
- [ ] Umbral de corte: si la tasa de rechazo correcto baja, el build falla
- [ ] GitHub Action en cada PR
- [ ] Reporte de resultados versionado en el repo

### Contención de costo y abuso

- [ ] Turnstile invisible antes de emitir cualquier sesión de voz
- [ ] Token de sesión de un solo uso, TTL de segundos
- [x] Tope duro de sesión en el servidor (5 min) — vía `expireTime` del token (ADR-005); aviso al minuto 4 pendiente
- [ ] Rate limit por IP y por día
- [ ] Contador de presupuesto persistido, con kill-switch
- [ ] Alerta a tu correo al 50% del presupuesto
- [ ] **Cascada de degradación**: texto siempre disponible → voz con el proveedor en cuota → si se agota, `webspeech` con aviso honesto → nunca un error

### Observabilidad

- [ ] Registro estructurado por turno: latencia, documentos recuperados, tools llamados, tokens, costo estimado
- [ ] Transcripciones anonimizadas, sin audio, con correos y teléfonos redactados
- [ ] Retención de 30 días y aviso de privacidad visible antes de activar el micrófono
- [ ] Dashboard simple: sesiones, duración media, preguntas más frecuentes, tasa de rechazo

### Privacidad

- [ ] Revisar los plazos vigentes de la ley de datos personales chilena antes de redactar el aviso — verifícalo, no lo asumas
- [ ] Consentimiento explícito antes de grabar cualquier cosa

---

## Multi-tenant

No es una fase aparte: son cuatro reglas que sigues desde el commit uno para que el segundo tenant sea una carpeta y no un fork.

- [x] **Nada del contenido de Arsenio vive fuera de `/tenants/arsenio/`.** Si aparece tu nombre hardcodeado en `/core`, es un bug
- [x] **`agent.yaml` define todo lo configurable**: persona, voz, idioma, tools habilitados, topes de costo, frase de rechazo, colores de marca
- [x] **Las interfaces son el contrato**: `Retriever`, `VoiceProvider`, `Tool`. El core programa contra ellas, nunca contra una implementación
- [x] **El tenant se resuelve por subdominio o path**, aunque hoy solo haya uno

### La prueba de fuego

- [ ] Desplegar un segundo tenant real. Tu operación de retiro de residuos sirve: un agente que responda consultas de clientes sobre retiros, mismo motor, otro corpus
- [ ] Cronometrarlo. Si te toma más de una tarde, la abstracción está mal y vale la pena arreglarla ahora

Ese segundo tenant demuestra en treinta segundos lo que tres párrafos de README no logran.

---

## Definición de listo y entregables

Que funcione no impresiona a nadie. Lo que impresiona es que puedas explicar las decisiones.

### Entregables

- [ ] **README** con el diagrama de arquitectura y las decisiones justificadas: por qué speech-to-speech y no pipeline, por qué BM25 y no vectores, por qué los tools corren en el servidor, por qué el único tool con efecto secundario es `dejar_mensaje`
- [ ] **Página `/arquitectura`** en el sitio, escrita para un lector técnico que llegó desde tu CV
- [ ] **Métricas reales medidas en producción**, no estimadas: p50 y p95 de tiempo al primer audio, costo promedio por sesión, tasa de rechazo correcto de la suite de evals
- [ ] **Historial de commits legible**. Un reclutador técnico lo va a mirar: commits atómicos con mensajes que explican el porqué

### El agente está listo cuando

- [ ] Responde bien las 50 preguntas de la suite, incluidos los 15 rechazos
- [ ] Sobrevive a que lo interrumpan a media frase
- [ ] Funciona en un iPhone con datos móviles
- [ ] Un visitante sin micrófono tiene una experiencia completa por texto
- [ ] Se lo mostraste a dos personas que no son tú y ninguna se quedó esperando sin saber qué hacer

### Cómo lo presentas

> No construí un chat sobre mí. Construí un agente de voz de dominio cerrado con recuperación trazable, evals en CI y control de costos. Yo soy el primer tenant.

---

## Riesgos y decisiones abiertas

### El riesgo real del plan

No es técnico. Es que la Fase 1 **parece** "solo escribir un prompt" y se salta. El resultado es un demo que habla precioso e inventa que trabajaste con Kubernetes. Dale a esa fase el mismo tiempo que a la UI, y no empieces la Fase 2 hasta cumplir su criterio de salida.

### Otros riesgos

| Riesgo | Señal temprana | Mitigación |
| --- | --- | --- |
| Scope creep hacia features de voz | Te descubres afinando el visualizador de audio en la semana 1 | Las fases están ordenadas por valor; respeta el orden |
| Escribir el corpus se vuelve infinito | Llevas 60 documentos y sigues | 25 documentos buenos superan a 60 mediocres. Corta y escribe los que falten según lo que pregunta la gente real |
| El free tier se agota en una demo en vivo | Falla justo cuando importa | La cascada de degradación existe para esto. Pruébala a propósito antes de mostrarlo |
| Deuda de abstracción multi-tenant | Escribes `if (tenant === 'arsenio')` | Ese `if` es la señal de que algo debe ir al `agent.yaml` |

### Decisiones que tomas sobre la marcha

- [ ] Semana 3: ¿pagas el proveedor premium o te quedas en free tier? Decídelo con el proyecto ya funcionando y el costo por sesión medido
- [ ] ¿El segundo tenant es Bendito Residuo o un tenant de demo ficticio? El real es más convincente pero te obliga a pensar en datos de clientes
- [x] ¿Repo público desde el día uno o al terminar? Público desde el día uno genera historial de commits creíble, pero expone los tropiezos

---

## Apéndice: vocabulario

| Práctica | Origen | El código | Propósito |
| --- | --- | --- | --- |
| **Spike** | Kent Beck, XP | Se bota | Responder una pregunta técnica, reducir incertidumbre |
| **Tracer bullet** | Hunt & Thomas, *The Pragmatic Programmer* | Se queda | Rebanada delgada de punta a punta, que después engordas |
| **Walking skeleton** | Alistair Cockburn | Se queda | Tracer bullet incluyendo el deploy |

La Fase 0 es un walking skeleton. El único spike real está en averiguar el formato de audio.
