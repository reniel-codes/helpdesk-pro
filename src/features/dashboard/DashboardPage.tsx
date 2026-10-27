import { PageHeader } from '../../components/PageHeader'
import { ROLE_LABELS } from '../../components/layout/navItems'
import { useAuth } from '../auth/AuthContext'

export function DashboardPage() {
  const { profile } = useAuth()
  if (!profile) return null

  return (
    <PageHeader
      title={`Welcome, ${profile.full_name || profile.email}`}
      description={`You are signed in as ${ROLE_LABELS[profile.role]}. Statistics arrive in Week 3.`}
    />
  )
}
