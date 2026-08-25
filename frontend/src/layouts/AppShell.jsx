import { NavLink, Outlet } from 'react-router-dom'
import { useBackendHealth } from '../hooks/useBackendHealth.js'

const navigation = [
  { to: '/', label: 'Event Board', end: true },
  { to: '/calendar', label: 'Calendar' },
  { to: '/community-requests', label: 'Community Requests' },
]

export default function AppShell() {
  const { status } = useBackendHealth()

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
          <span className={`health-indicator health-indicator--${status}`}>
            <span aria-hidden="true" />
            Backend {status}
          </span>
        </div>
      </header>
      <main className="app-main container">
        <Outlet />
      </main>
    </div>
  )
}
