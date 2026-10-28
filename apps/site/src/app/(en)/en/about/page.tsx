import { pageMetadata } from '@/components/RootLayout'
import { getDictionary } from '@/i18n'
import { AboutPage } from '@/views/AboutPage'

const t = getDictionary('en')

export const metadata = pageMetadata('en', '/about', {
  title: t.about.metaTitle,
  description: t.about.metaDescription,
})

export default function Page() {
  return <AboutPage locale="en" />
}
