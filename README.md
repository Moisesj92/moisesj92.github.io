# moisesj92.github.io

Portfolio personal de Arsenio Jimenez (AJ) — desarrollador full stack. Este repo contiene el sitio estático en HTML/CSS, bilingüe (español/inglés), enfocado en proyectos recientes, perfil profesional orientado a resultados, y branding personal.

## Características
- **Diseño:** template [Spotlight](https://tailwindcss.com/plus/templates/spotlight) de Tailwind Plus (Next.js 15 + Tailwind CSS 4), con modo claro/oscuro.
- **Bilingüe:** español en `/` e inglés en `/en`, con switch ES/EN en el header. Contenido en diccionarios tipados (`src/i18n/dictionaries/`).
- **Páginas:** Inicio (intro, skills, CTA al asistente de voz, experiencia), Sobre mí (bio, experiencia detallada, educación, idiomas) y Proyectos (preview automático vía Microlink).
- **SEO / Social:** metadata por idioma (`hreflang`, canonical), Open Graph y Twitter Card con `public/images/avatar2.jpg`.
- **Deploy:** export estático (`pnpm build` → `out/`) publicado en GitHub Pages por el workflow `pages.yml`.

## Agente de voz

En [`agent/`](agent/) vive un agente de voz de dominio cerrado (Next.js + Gemini Live) que responde sobre la experiencia de Arsenio a partir de un corpus verificado. Se despliega en Vercel desde este mismo repo; la landing sigue en GitHub Pages. Plan, decisiones y cómo correrlo: [`agent/README.md`](agent/README.md).

## Estructura
- `agent/` — agente de voz (Next.js, desplegado en Vercel; proyecto independiente con su propio `package.json`)
- `src/app/(es)/` — rutas en español (raíz): `/`, `/about`, `/projects`, 404
- `src/app/(en)/en/` — las mismas rutas en inglés. Cada grupo tiene su root layout (`<html lang>`), compartiendo `src/components/RootLayout.tsx`
- `src/views/` — las páginas reales (`HomePage`, `AboutPage`, `ProjectsPage`), reciben `locale`
- `src/i18n/` — locales, helpers (`localePath`, `parsePathname`) y diccionarios `es.ts` / `en.ts`
- `src/components/` — componentes del template Spotlight (Header, Footer, Card, Container, Button…)
- `src/lib/site.ts` — URLs y datos de contacto
- `src/images/` — avatar y retrato; `public/images/` — imagen para redes sociales
- `.github/workflows/pages.yml` — build + deploy a GitHub Pages

## Cómo correr en local

```bash
nvm use && pnpm install && pnpm dev
```

Abre <http://localhost:3000>. `pnpm build` genera el sitio estático en `out/`.

Para añadir o cambiar textos, edita `src/i18n/dictionaries/es.ts` y `en.ts` (el tipo de `en` se deriva de `es`, así que TypeScript avisa si falta una clave).

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

---
_Mantenimiento automatizado por Maca 🌿_

_(Actualización: 2026-09-20)_
