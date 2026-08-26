import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '../assets/logo.jpeg'

const navigation = [
  { to: '/', label: 'Event Board', end: true },
  { to: '/calendar', label: 'Calendar' },
  { to: '/community-requests', label: 'Community Requests' },
]

export default function AppShell() {
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
          <NavLink className="brand" to="/" aria-label="EventHive home">
            <img src={logo} alt="" className="brand__logo" />
            <span>
              <strong>EventHive</strong>
              <small>Local Event Bulletin Board</small>
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
                <NavLink
                  className={({ isActive }) => isActive ? 'auth-nav__user nav-link--active' : 'auth-nav__user'}
                  to="/profile"
                  title={currentUser?.email}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  {currentUser?.name}
                </NavLink>
                <button
                  className="auth-nav__logout"
                  type="button"
                  onClick={handleLogout}
                  aria-label="Logout"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </>
            ) : (
              <>
                <NavLink className="nav-link" to="/login">Login</NavLink>
                <NavLink className="primary-button auth-nav__register" to="/register">Register</NavLink>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="app-main container">
        <Outlet />
      </main>
    </div>
  )
}
