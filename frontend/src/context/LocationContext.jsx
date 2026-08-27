import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getDistrictFromCoords } from '../services/locationService.js'

const LocationContext = createContext()

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState(null)
  const [district, setDistrict] = useState(() => localStorage.getItem('detected_district'))
  const [status, setStatus] = useState('idle') // idle, detecting, resolved, denied, error

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus('error')
      return
    }

    setStatus('detecting')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCoords({ latitude, longitude })

        try {
          const data = await getDistrictFromCoords(latitude, longitude)
          if (data.district && data.district.trim()) {
            const resolvedDistrict = data.district.trim()
            setDistrict(resolvedDistrict)
            localStorage.setItem('detected_district', resolvedDistrict)
            setStatus('resolved')
          } else {
            console.warn('Resolved district was empty or invalid:', data.district)
            setStatus('error')
          }
        } catch (err) {
          console.error('Failed to resolve district:', err)
          setStatus('error')
        }
      },
      (error) => {
        console.warn('Geolocation denied or error:', error)
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 3600000 }
    )
  }, [])

  useEffect(() => {
    if (!district && status === 'idle') {
      detectLocation()
    } else if (district && status === 'idle') {
      setStatus('resolved')
    }
  }, [district, status, detectLocation])

  return (
    <LocationContext.Provider value={{ coords, district, status, detectLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) throw new Error('useLocation must be used within LocationProvider')
  return context
}
