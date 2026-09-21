import { Home } from '../../_components/home'

export default async function Page({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  return <Home tenant={tenant} />
}
