import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agente de voz",
  description: "Agente de voz de dominio cerrado con recuperación trazable.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
