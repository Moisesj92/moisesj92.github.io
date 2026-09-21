import { RootLayout, buildMetadata } from '@/components/RootLayout'

export const metadata = buildMetadata('es')

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootLayout locale="es">{children}</RootLayout>
}
