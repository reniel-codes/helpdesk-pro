import { BrowserRouter, Link, Route, Routes } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { AssetFormPage } from './features/assets/AssetFormPage'
import { AssetsPage } from './features/assets/AssetsPage'
import { AuthProvider } from './features/auth/AuthProvider'
import { LoginPage } from './features/auth/LoginPage'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { UsersPage } from './features/admin/UsersPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { NewTicketPage } from './features/tickets/NewTicketPage'
import { TicketDetailPage } from './features/tickets/TicketDetailPage'
import { TicketsPage } from './features/tickets/TicketsPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Everything inside here requires a logged-in user. */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="tickets/new" element={<NewTicketPage />} />
              <Route path="tickets/:id" element={<TicketDetailPage />} />
              <Route path="assets" element={<AssetsPage />} />

              {/* Staff-only pages. */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'it_staff']} />}>
                <Route path="assets/new" element={<AssetFormPage />} />
                <Route path="assets/:id/edit" element={<AssetFormPage />} />
              </Route>

              {/* Admin-only pages. */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="users" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <Link to="/" className="text-blue-600 hover:underline">
        Go to dashboard
      </Link>
    </main>
  )
}

export default App
