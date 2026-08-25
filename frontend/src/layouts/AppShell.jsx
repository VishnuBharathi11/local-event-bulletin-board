import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useBackendHealth } from '../hooks/useBackendHealth.js'
import { useAuth } from '../context/AuthContext.jsx'

const navigation = [
  { to: '/', label: 'Event Board', end: true },
  { to: '/calendar', label: 'Calendar' },
  { to: '/community-requests', label: 'Community Requests' },
]

export default function AppShell() {
  const { status: backendStatus } = useBackendHealth()
  const { loading, authenticated, currentUser, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
      navigate('/', { replace: true })
    } catch {
      // Keep the existing authenticated state when logout cannot reach the backend.
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner container">
          <NavLink className="brand" to="/" aria-label="Local Event Bulletin Board home">
            <span className="brand__mark" aria-hidden="true">EB</span>
            <span>
              <strong>Local Event Bulletin Board</strong>
              <small>Community events</small>
            </span>
          </NavLink>
          <nav className="main-nav" aria-label="Primary navigation">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="auth-nav">
            {loading ? (
              <span className="auth-nav__state">Checking account…</span>
            ) : authenticated ? (
              <>
                <span className="auth-nav__user" title={currentUser?.email}>{currentUser?.name}</span>
                <button className="secondary-button auth-nav__logout" type="button" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <NavLink className="nav-link" to="/login">Login</NavLink>
                <NavLink className="primary-button auth-nav__register" to="/register">Register</NavLink>
              </>
            )}
            <span className={`health-indicator health-indicator--${backendStatus}`}>
              <span aria-hidden="true" />
              Backend {backendStatus}
            </span>
          </div>
        </div>
      </header>
      <main className="app-main container">
        <Outlet />
      </main>
    </div>
  )
}
