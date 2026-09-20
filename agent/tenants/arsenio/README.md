# Tenant arsenio

Los documentos del corpus viven en `corpus/`.

Cada `.md` es un documento con frontmatter YAML y un cuerpo en Markdown plano. El cargador valida el frontmatter con Zod y rompe el arranque si algo falta.

```yaml
---
id: alseco-ecommerce-b2b        # único, minúsculas y guiones
title: E-commerce B2B en Alseco
type: situation                 # situation | project | hard-fact | faq
company: Alseco                 # opcional
period: 07/2022 – 06/2024       # opcional
role: Desarrollador Full Stack  # opcional
tags: [e-commerce, pagos, b2b]  # al menos uno; alimentan el filtro previo del retriever
technologies: [React, Ruby on Rails, Transbank, ETPay]
---
Contexto. Qué hizo él específicamente. Decisión técnica que tomó. Resultado.
```

Reglas:

- **Métricas literales**, nunca redondeadas. Si el dato no existe, no se inventa: se escribe un documento `faq` que diga qué se sabe y qué no.
- Archivos y carpetas que empiezan con `_` son borradores y **no se cargan**. Úsalo para escribir un documento nuevo sin publicarlo todavía.
- Los `faq-*` son los "no": preguntas predecibles sin respuesta obvia en el CV (renta, reubicación, por qué terminó cada trabajo). Una respuesta redactada vale más que cualquier guardrail.
- Nada que no quieras público. El agente lo dice en voz alta a quien pregunte.
- 25 documentos buenos superan a 60 mediocres.

La capa 0 (ficha fija, ~2k tokens) vive en `identity.md` y va al inicio del system prompt.
