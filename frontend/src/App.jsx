import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { LocationProvider } from './context/LocationContext.jsx'
import AppRouter from './navigation/AppRouter.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <AppRouter />
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
