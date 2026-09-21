'use client'

import Link from 'next/link'

import { Button } from '@/components/Button'

/**
 * Consentimiento explícito antes de activar el micrófono. Se muestra una
 * vez por navegador; la aceptación se recuerda en localStorage.
 */
export function ConsentNotice({ retentionDays, onAccept }: { retentionDays: number; onAccept: () => void }) {
  return (
    <div role="dialog" aria-labelledby="consent-title" className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
      <h2 id="consent-title" className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
        Antes de activar el micrófono
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Tu voz se transmite en tiempo real a Google Gemini para transcribirla y responder; el audio no se guarda. La
        transcripción de la conversación (sin correos ni teléfonos) se conserva {retentionDays} días para mejorar el
        asistente y luego se borra. Detalles en{' '}
        <Link href="/privacidad" className="text-teal-500 hover:underline">
          privacidad
        </Link>
        .
      </p>
      <div className="mt-4">
        <Button onClick={onAccept}>Entiendo, iniciar conversación</Button>
      </div>
    </div>
  )
}

const KEY = 'agent-consent-v1'

export function hasConsent(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function rememberConsent(): void {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // modo privado o almacenamiento bloqueado: se vuelve a preguntar la próxima vez
  }
}
