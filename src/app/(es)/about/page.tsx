import { type Metadata } from 'next'

import { getDictionary } from '@/i18n'
import { AboutPage } from '@/views/AboutPage'

const t = getDictionary('es')

export const metadata: Metadata = {
  title: t.about.metaTitle,
  description: t.about.paragraphs[0],
}

export default function Page() {
  return <AboutPage locale="es" />
}
