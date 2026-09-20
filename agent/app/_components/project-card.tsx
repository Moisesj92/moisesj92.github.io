import type { ProjectCard as Card } from "@/core/types";

/** Tarjeta que aparece mientras el agente habla del proyecto (tool mostrar_proyectos). */
export function ProjectCard({ card, onDismiss }: { card: Card; onDismiss?: () => void }) {
  const screenshot = card.url
    ? `https://api.microlink.io/?url=${encodeURIComponent(card.url)}&screenshot=true&meta=false&embed=screenshot.url`
    : null;
  return (
    <article
      style={{
        border: "1px solid var(--border)",
        borderLeft: "4px solid var(--accent)",
        borderRadius: 8,
        padding: 12,
        display: "grid",
        gridTemplateColumns: screenshot ? "120px 1fr" : "1fr",
        gap: 12,
        animation: "card-in 240ms ease-out",
        position: "relative",
      }}
    >
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Cerrar tarjeta de ${card.title}`}
          style={dismissBtn}
        >
          ×
        </button>
      )}
      {screenshot && (
        // eslint-disable-next-line @next/next/no-img-element -- captura externa, sin optimizar
        <img
          src={screenshot}
          alt={`Captura de ${card.title}`}
          loading="lazy"
          style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 4, background: "var(--border)" }}
        />
      )}
      <div style={{ minWidth: 0 }}>
        <h3 style={{ margin: 0, fontSize: 15, paddingRight: 24 }}>
          {card.url ? (
            <a href={card.url} target="_blank" rel="noopener noreferrer">
              {card.title}
            </a>
          ) : (
            card.title
          )}
        </h3>
        <p style={{ margin: "2px 0 6px", color: "var(--muted)", fontSize: 12 }}>
          {[card.company, card.period].filter(Boolean).join(" · ")}
        </p>
        <p style={{ margin: 0, fontSize: 13 }}>{card.summary}</p>
        {card.technologies.length > 0 && (
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted)" }}>{card.technologies.join(" · ")}</p>
        )}
      </div>
    </article>
  );
}

export const dismissBtn: React.CSSProperties = {
  position: "absolute",
  top: 6,
  right: 6,
  width: 24,
  height: 24,
  border: 0,
  borderRadius: 12,
  background: "transparent",
  color: "var(--muted)",
  fontSize: 18,
  lineHeight: "24px",
  cursor: "pointer",
};
