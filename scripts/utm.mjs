#!/usr/bin/env node
/**
 * Enlaces con UTM para una postulación: `pnpm utm "Acme Corp"`.
 *
 * utm_source identifica a quién se envió (la empresa); utm_medium, por dónde
 * (postulacion por defecto). Con eso, Umami muestra qué empresa abrió el
 * portafolio y /admin del agente, qué origen habló con él y qué preguntó.
 *
 *   pnpm utm "Acme Corp"                  # postulación
 *   pnpm utm "Acme Corp" --medio linkedin # mensaje por LinkedIn
 */

const SITE = 'https://moisesj92.github.io'
const AGENT = 'https://voice-agent-flax-six.vercel.app'
const MEDIOS = ['postulacion', 'linkedin', 'correo', 'cv']

const args = process.argv.slice(2)
const medioAt = args.indexOf('--medio')
const medio = medioAt >= 0 ? args[medioAt + 1] : 'postulacion'
const nombre = (medioAt >= 0 ? args.filter((_, i) => i !== medioAt && i !== medioAt + 1) : args).join(' ').trim()

if (!nombre) {
  console.error('Uso: pnpm utm "Nombre de la empresa" [--medio postulacion|linkedin|correo|cv]')
  process.exit(1)
}
if (!MEDIOS.includes(medio)) {
  console.error(`Medio desconocido: ${medio}. Usa uno de: ${MEDIOS.join(', ')}`)
  process.exit(1)
}

// El agente solo acepta [\w.-]{1,64}: sin tildes, espacios ni símbolos.
const slug = nombre
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 64)

if (!slug) {
  console.error(`"${nombre}" no deja caracteres válidos para un utm_source`)
  process.exit(1)
}

const query = `?utm_source=${slug}&utm_medium=${medio}`
console.log(`origen: ${slug}\n`)
console.log(`Portafolio (ES)  ${SITE}/${query}`)
console.log(`Portafolio (EN)  ${SITE}/en/${query}`)
console.log(`Agente directo   ${AGENT}/${query}`)
