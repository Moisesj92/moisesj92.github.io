import { pageMetadata } from '@/components/RootLayout'
import { getDictionary } from '@/i18n'
import { ProjectsPage } from '@/views/ProjectsPage'

const t = getDictionary('en')

export const metadata = pageMetadata('en', '/projects', {
  title: t.projects.metaTitle,
  description: t.projects.intro,
})

export default function Page() {
  return <ProjectsPage locale="en" />
}
