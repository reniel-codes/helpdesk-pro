import type { Role } from '../../features/auth/AuthContext'

export type NavItem = {
  to: string
  label: string
  /** Shown instead of `label` for employees, who only see their own records. */
  employeeLabel?: string
  roles: readonly Role[]
}

const ALL_ROLES: readonly Role[] = ['admin', 'it_staff', 'employee']

// Keep the roles here in sync with the allowedRoles guards in App.tsx.
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', roles: ALL_ROLES },
  { to: '/tickets', label: 'Tickets', employeeLabel: 'My Tickets', roles: ALL_ROLES },
  { to: '/assets', label: 'Assets', employeeLabel: 'My Assets', roles: ALL_ROLES },
  { to: '/users', label: 'Users', roles: ['admin'] },
]

export function getNavItems(role: Role): { to: string; label: string }[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => ({
    to: item.to,
    label: role === 'employee' && item.employeeLabel ? item.employeeLabel : item.label,
  }))
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  it_staff: 'IT Staff',
  employee: 'Employee',
}
