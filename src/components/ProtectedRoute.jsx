/**
 * Phase 4 — Redirect to /login if user is not authenticated.
 * Public routes: /, /login. All other routes require auth.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { getAuth } from '../lib/auth.js'

const PUBLIC_PATHS = ['/', '/login', '/demo']

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const auth = getAuth()
  const isPublic = PUBLIC_PATHS.some((p) => location.pathname === p)
  if (isPublic) return children
  if (!auth?.userId) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}
