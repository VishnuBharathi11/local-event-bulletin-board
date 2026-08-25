import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '../layouts/AppShell.jsx'
import PlaceholderPage from '../pages/PlaceholderPage.jsx'

const routes = [
  ['/', 'Event Board', 'The main event discovery area is ready for later feature conversion.'],
  ['/events/new', 'Create Event', 'Event creation will be implemented in a later migration phase.'],
  ['/events/:eventId', 'Event Details', 'Event details are reserved for the later feature conversion phase.'],
  ['/calendar', 'Calendar', 'Calendar functionality will be implemented in a later migration phase.'],
  ['/community-requests', 'Community Requests', 'Community request functionality will be implemented later.'],
  ['/community-requests/new', 'Request Event', 'Event request creation will be implemented later.'],
  ['/community-requests/:requestId', 'Request Details', 'Request details will be implemented later.'],
]

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {routes.map(([path, title, description]) => (
          <Route
            key={path}
            path={path}
            element={<PlaceholderPage title={title} description={description} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
