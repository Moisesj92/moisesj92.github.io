'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@repo/ui/Button'

const OPTIONS: { value: '' | 'voice' | 'text' | 'all'; label: string }[] = [
  { value: '', label: 'Todo activo' },
  { value: 'voice', label: 'Apagar voz' },
  { value: 'text', label: 'Apagar texto' },
  { value: 'all', label: 'Apagar todo' },
]

/** Kill-switch instantáneo (base de datos) y cierre de sesión. */
export function Controls({ killSwitch }: { killSwitch: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function set(value: string) {
    setBusy(true)
    await fetch('/api/admin/kill-switch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {OPTIONS.map((o) => (
        <Button key={o.value || 'on'} variant={killSwitch === o.value ? 'primary' : 'secondary'} disabled={busy} onClick={() => set(o.value)} aria-pressed={killSwitch === o.value}>
          {o.label}
        </Button>
      ))}
      <button
        type="button"
        className="ml-auto text-sm text-zinc-400 transition hover:text-zinc-800 dark:hover:text-zinc-100"
        onClick={async () => {
          await fetch('/api/admin/logout', { method: 'POST' })
          router.refresh()
        }}
      >
        Salir
      </button>
    </div>
  )
}
