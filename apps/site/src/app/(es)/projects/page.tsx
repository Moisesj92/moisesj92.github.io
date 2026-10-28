import { pageMetadata } from '@/components/RootLayout'
import { getDictionary } from '@/i18n'
import { ProjectsPage } from '@/views/ProjectsPage'

const t = getDictionary('es')

export const metadata = pageMetadata('es', '/projects', {
  title: t.projects.metaTitle,
  description: t.projects.intro,
})

export default function Page() {
  return <ProjectsPage locale="es" />
}
