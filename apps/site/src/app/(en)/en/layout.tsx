import { RootLayout, buildMetadata } from '@/components/RootLayout'

export const metadata = buildMetadata('en')

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootLayout locale="en">{children}</RootLayout>
}
