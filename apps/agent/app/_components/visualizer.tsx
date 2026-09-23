'use client'

import clsx from 'clsx'
import { useEffect, useRef } from 'react'

/**
 * Barras que reaccionan al micrófono (escuchando) o a la voz del agente
 * (hablando). Se anima con rAF para no pasar por React en cada nivel.
 */
export function Visualizer({
  level,
  mode,
  bars = 7,
}: {
  /** RMS 0..1 */
  level: number
  mode: 'idle' | 'listening' | 'speaking'
  bars?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const target = useRef(0)
  const current = useRef<number[]>(Array(bars).fill(0.08))

  useEffect(() => {
    target.current = mode === 'idle' ? 0 : Math.min(1, level * 5)
  }, [level, mode])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const el = ref.current
      if (el) {
        const t = target.current
        for (let i = 0; i < bars; i++) {
          const wobble = 0.6 + 0.4 * Math.abs(Math.sin(performance.now() / 180 + i * 1.3))
          const goal = t === 0 ? 0.08 : Math.max(0.08, t * wobble)
          current.current[i] += (goal - current.current[i]) * 0.35
          const bar = el.children[i] as HTMLElement | undefined
          if (bar) bar.style.transform = `scaleY(${current.current[i].toFixed(3)})`
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [bars])

  return (
    <div ref={ref} aria-hidden className="flex h-9 items-center gap-1" style={{ width: bars * 10 }}>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={clsx(
            'h-9 w-1.5 origin-center rounded-full transition-colors',
            mode === 'speaking' && 'bg-teal-500 dark:bg-teal-400',
            mode === 'listening' && 'bg-zinc-800 dark:bg-zinc-100',
            mode === 'idle' && 'bg-zinc-200 dark:bg-zinc-700',
          )}
          style={{ transform: 'scaleY(0.08)' }}
        />
      ))}
    </div>
  )
}
