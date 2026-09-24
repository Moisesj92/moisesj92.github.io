'use client'

import { useEffect } from 'react'

import { site } from '@/lib/site'

const KEY = 'origen'
/* Mismo juego de caracteres que valida el agente: el valor termina en su /admin. */
const VALID = /^[\w.-]{1,64}$/
const agentOrigin = new URL(site.voiceAgent).origin

function readStored(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

/**
 * Lleva el origen de la visita (utm_source) hasta el agente de voz.
 *
 * Al cargar, guarda el utm_source de la URL para el resto de la pestaña. Al
 * hacer clic en cualquier enlace al agente, le añade utm_source (el guardado,
 * o "portafolio" si se llegó sin él) y utm_medium=portafolio. Se hace en el
 * clic y no al renderizar para no tocar el HTML estático ni la hidratación, y
 * para cubrir cualquier enlace al agente, esté en la página que esté.
 */
export function OriginTracker() {
  useEffect(() => {
    let source = new URLSearchParams(window.location.search).get('utm_source')?.toLowerCase()
    if (source && VALID.test(source)) {
      try {
        sessionStorage.setItem(KEY, source)
      } catch {
        // almacenamiento bloqueado: el origen solo vale para esta página
      }
    } else {
      source = readStored() ?? undefined
    }

    function tag(event: MouseEvent) {
      let link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link || new URL(link.href).origin !== agentOrigin) return
      let url = new URL(link.href)
      url.searchParams.set('utm_source', source ?? readStored() ?? 'portafolio')
      url.searchParams.set('utm_medium', 'portafolio')
      link.href = url.toString()
    }

    document.addEventListener('click', tag, true)
    document.addEventListener('auxclick', tag, true)
    return () => {
      document.removeEventListener('click', tag, true)
      document.removeEventListener('auxclick', tag, true)
    }
  }, [])

  return null
}
