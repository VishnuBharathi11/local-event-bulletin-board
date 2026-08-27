import { useState } from 'react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleLogout() {
    try {
      await logout()
      setMobileMenuOpen(false)
      navigate('/', { replace: true })
    } catch {
      // Keep the existing authenticated state when logout cannot reach the backend.
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner container">
          <NavLink className="brand" to="/" aria-label="EventHive home" onClick={() => setMobileMenuOpen(false)}>
            <img src={logo} alt="" className="brand__logo" />
            <span>
              <strong>EventHive</strong>
              <small>Local Event Bulletin Board</small>
            </span>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="main-nav desktop-only-nav" aria-label="Primary navigation">
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

          {/* Desktop Auth Links */}
          <div className="auth-nav desktop-only-nav">
            {loading ? (
              <span className="auth-nav__state">Checking account…</span>
            ) : authenticated ? (
              <>
                <NavLink
                  className={({ isActive }) => isActive ? 'auth-nav__user nav-link--active' : 'auth-nav__user'}
                  to="/profile"
                  title={currentUser?.email}
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 6 }}>
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

          {/* Mobile-only User Bar (Avatar + Logout on Top Row) */}
          <div className="mobile-only-user-bar">
            {loading ? (
              <span className="auth-nav__state">Checking account…</span>
            ) : authenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <NavLink to="/profile" className="mobile-user-avatar" title={currentUser?.name}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand)' }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </NavLink>
                <button
                  className="auth-nav__logout"
                  type="button"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            ) : (
              <NavLink className="nav-link" to="/login" style={{ fontWeight: 800, color: 'var(--brand)' }}>Login</NavLink>
            )}
          </div>

          {/* Mobile Hamburger toggle button */}
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Drawer / Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
              <nav className="mobile-nav-links" aria-label="Mobile navigation">
                {navigation.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => (isActive ? 'mobile-nav-link mobile-nav-link--active' : 'mobile-nav-link')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mobile-auth-links">
                {loading ? (
                  <span className="auth-nav__state">Checking account…</span>
                ) : authenticated ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                    <NavLink
                      className="mobile-user-profile"
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ textDecoration: 'none' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <div>
                        <strong>{currentUser?.name}</strong>
                        <span>{currentUser?.email}</span>
                      </div>
                    </NavLink>
                    <button className="secondary-button" type="button" onClick={handleLogout} style={{ width: '100%' }}>Logout</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    <NavLink className="secondary-button" to="/login" onClick={() => setMobileMenuOpen(false)}>Login</NavLink>
                    <NavLink className="primary-button" to="/register" onClick={() => setMobileMenuOpen(false)}>Register</NavLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="app-main container">
        <Outlet />
      </main>
    </div>
  )
}
