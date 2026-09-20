# Agente de voz

Agente de voz de dominio cerrado, multi-tenant. Ver [`docs/plan.md`](docs/plan.md) para el plan de trabajo y [`docs/decisions.md`](docs/decisions.md) para las decisiones de arquitectura.

## Correr en local

```bash
nvm use
pnpm install
cp .env.example .env.local   # y poner GEMINI_API_KEY
pnpm dev
```
