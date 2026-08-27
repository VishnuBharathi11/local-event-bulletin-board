import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getDistrictFromCoords } from '../services/locationService.js'

const LocationContext = createContext()

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState(null)

  const isInvalidName = (name) => {
    if (!name || typeof name !== 'string') return true;
    const normalized = name.toLowerCase().trim();
    return normalized.length === 0 ||
           normalized.includes('[no name]') ||
           normalized.includes('unnamed') ||
           normalized.includes('unknown') ||
           normalized === 'null' ||
           normalized === 'undefined';
  };

  const [district, setDistrict] = useState(() => {
    const saved = localStorage.getItem('detected_district')
    if (isInvalidName(saved)) {
      if (saved) localStorage.removeItem('detected_district');
      return null;
    }
    return saved
  })
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
        console.log("USER COORDINATES", { latitude, longitude })
        setCoords({ latitude, longitude })

        try {
          const data = await getDistrictFromCoords(latitude, longitude)
          console.log("GEOCODING RESPONSE", data)
          const rawDistrict = data?.district

          if (!isInvalidName(rawDistrict)) {
            const resolvedDistrict = rawDistrict.trim()
            console.log("RESOLVED LOCATION", resolvedDistrict)
            setDistrict(resolvedDistrict)
            localStorage.setItem('detected_district', resolvedDistrict)
            setStatus('resolved')
          } else {
            console.warn('Resolved district was empty or invalid:', rawDistrict)
            localStorage.removeItem('detected_district')
            setDistrict(null)
            setStatus('error')
          }
        } catch (err) {
          console.error('Failed to resolve district:', err)
          localStorage.removeItem('detected_district')
          setDistrict(null)
          setStatus('error')
        }
      },
      (error) => {
        console.warn('Geolocation denied or error:', error)
        // Only clear if the user explicitly denied it
        if (error.code === error.PERMISSION_DENIED) {
           localStorage.removeItem('detected_district')
           setDistrict(null)
        }
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
