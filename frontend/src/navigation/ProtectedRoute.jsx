import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { loading, authenticated } = useAuth()
  const location = useLocation()

  if (loading) return <div className="page-placeholder"><p>Checking authentication…</p></div>
  if (!authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
