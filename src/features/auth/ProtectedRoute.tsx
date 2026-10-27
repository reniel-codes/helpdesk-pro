import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth, type Role } from './AuthContext'

type Props = {
  /** Leave out to allow any logged-in user. */
  allowedRoles?: readonly Role[]
}

/**
 * Guards a group of routes in the UI.
 * Reminder: this only controls what the screen shows. The database's RLS
 * policies are what actually stop a user from reading or changing data.
 */
export function ProtectedRoute({ allowedRoles }: Props) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <CenteredMessage title="Loading…" />
  }

  if (!session) {
    // Remember where they were going so login can send them back there.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!profile) {
    return (
      <CenteredMessage
        title="Profile not found"
        detail="Your account is missing a profile. Please contact an administrator."
      />
    )
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <CenteredMessage
        title="Access denied"
        detail="You don't have permission to view this page."
      />
    )
  }

  return <Outlet />
}

function CenteredMessage({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      {detail && <p className="mt-2 text-slate-600">{detail}</p>}
    </div>
  )
}
