"use client";

import { useEffect, useRef } from "react";

/**
 * Barras que reaccionan al micrófono (escuchando) o a la voz del agente
 * (hablando). Barato de hacer y hace toda la diferencia en la percepción
 * de "está vivo". Se anima con rAF para no pasar por React en cada nivel.
 */
export function Visualizer({
  level,
  mode,
  bars = 7,
}: {
  /** RMS 0..1 */
  level: number;
  mode: "idle" | "listening" | "speaking";
  bars?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const current = useRef<number[]>(Array(bars).fill(0.08));

  useEffect(() => {
    target.current = mode === "idle" ? 0 : Math.min(1, level * 5);
  }, [level, mode]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const t = target.current;
        for (let i = 0; i < bars; i++) {
          // Cada barra persigue el nivel con un poco de variación, para que no suban todas iguales.
          const wobble = 0.6 + 0.4 * Math.abs(Math.sin(performance.now() / 180 + i * 1.3));
          const goal = t === 0 ? 0.08 : Math.max(0.08, t * wobble);
          current.current[i] += (goal - current.current[i]) * 0.35;
          const bar = el.children[i] as HTMLElement | undefined;
          if (bar) bar.style.transform = `scaleY(${current.current[i].toFixed(3)})`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [bars]);

  const color = mode === "speaking" ? "var(--accent)" : mode === "listening" ? "var(--foreground)" : "var(--border)";
  return (
    <div
      ref={ref}
      aria-hidden
      style={{ display: "flex", alignItems: "center", gap: 4, height: 36, width: bars * 10 }}
    >
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 36,
            borderRadius: 3,
            background: color,
            transform: "scaleY(0.08)",
            transformOrigin: "center",
            transition: "background 200ms",
            opacity: mode === "idle" ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}
