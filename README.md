# moisesj92.github.io

Portfolio personal de Arsenio Jimenez (AJ) — desarrollador full stack. Este repo contiene el sitio estático en HTML/CSS, bilingüe (español/inglés), enfocado en proyectos recientes, perfil profesional orientado a resultados, y branding personal.

## Características

- **Diseño:** template [Spotlight](https://tailwindcss.com/plus/templates/spotlight) de Tailwind Plus (Next.js 15 + Tailwind CSS 4), con modo claro/oscuro.
- **Bilingüe:** español en `/` e inglés en `/en`, con switch ES/EN en el header. Contenido en diccionarios tipados (`src/i18n/dictionaries/`).
- **Páginas:** Inicio (intro, skills, CTA al asistente de voz, experiencia), Sobre mí (bio, experiencia detallada, educación, idiomas) y Proyectos (preview automático vía Microlink).
- **SEO / Social:** metadata por idioma (`hreflang`, canonical), Open Graph y Twitter Card con `public/images/avatar2.jpg`.
- **Deploy:** export estático (`pnpm --filter site build` → `apps/site/out/`) publicado en GitHub Pages por el workflow `pages.yml`.

## Agente de voz

En [`apps/agent/`](apps/agent/) vive un agente de voz de dominio cerrado (Next.js + Gemini Live) que responde sobre la experiencia de Arsenio a partir de un corpus verificado. Se despliega en Vercel desde este mismo repo; la landing sigue en GitHub Pages. Plan, decisiones y cómo correrlo: [`agent/README.md`](agent/README.md).

## Estructura

El repo es un **workspace de pnpm** con dos aplicaciones que se despliegan por separado:

```
apps/site/     portafolio (Next 15, export estático) → GitHub Pages
apps/agent/    agente de voz (Next 16, API + Postgres) → Vercel (Root Directory: apps/agent)
packages/ui/   componentes del template Spotlight que usan las dos
```

Un solo `pnpm install` en la raíz instala todo; `pnpm build` construye ambas y `pnpm --filter <app> <script>` va a una sola. Las dos apps no se pueden fusionar en un único build: el sitio necesita `output: 'export'` para Pages y el agente necesita servidor.

- `apps/agent/` — agente de voz (ver su [README](apps/agent/README.md))
- `apps/site/src/app/(es)/` — rutas en español (raíz): `/`, `/about`, `/projects`, 404
- `apps/site/src/app/(en)/en/` — las mismas rutas en inglés. Cada grupo tiene su root layout (`<html lang>`), compartiendo `src/components/RootLayout.tsx`
- `apps/site/src/views/` — las páginas reales (`HomePage`, `AboutPage`, `ProjectsPage`), reciben `locale`
- `apps/site/src/i18n/` — locales, helpers (`localePath`, `parsePathname`) y diccionarios `es.ts` / `en.ts`
- `apps/site/src/components/` — componentes del template Spotlight (Header, Footer, Card, Container, Button…)
- `apps/site/src/lib/site.ts` — URLs y datos de contacto
- `apps/site/src/images/` — avatar y retrato; `public/images/` — imagen para redes sociales
- `.github/workflows/pages.yml` — build + deploy a GitHub Pages

## Cómo correr en local

```bash
nvm use && pnpm install && pnpm dev            # apps/site en :3000
# pnpm dev:agent                              # apps/agent en :3000 (usa otro puerto si el sitio corre)
```

Abre <http://localhost:3000>. `pnpm --filter site build` genera el sitio estático en `apps/site/out/`; `pnpm build` construye las dos apps.

Para añadir o cambiar textos, edita `apps/site/src/i18n/dictionaries/es.ts` y `en.ts` (el tipo de `en` se deriva de `es`, así que TypeScript avisa si falta una clave).

## Cómo contribuir

1. Crea un branch:
   ```bash
   git checkout -b feat/nueva-funcion
   ```
2. Haz tu cambio, commit con Conventional Commit:
   ```bash
   git commit -m "feat: agrega sección de certificaciones"
   ```
3. Haz push y abre PR:
   ```bash
   git push origin feat/nueva-funcion
   ```
4. Espera revisión y merge.

## Licencia

El contenido (textos, imágenes) es personal. El diseño usa el template Spotlight bajo la [licencia de Tailwind Plus](LICENSE.md): puedes leer el código, pero no reutilizar los componentes del template en otro sitio sin tu propia licencia.
