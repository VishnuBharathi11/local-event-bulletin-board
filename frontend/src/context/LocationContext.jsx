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

  const [locality, setLocality] = useState(() => {
    const saved = localStorage.getItem('detected_locality')
    if (isInvalidName(saved)) {
      if (saved) localStorage.removeItem('detected_locality');
      return null;
    }
    return saved
  })

  const [status, setStatus] = useState('idle') // idle, detecting, resolved, denied, error

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      console.error("PHASE 1 FRONTEND ERROR: Geolocation not supported");
      setStatus('error')
      return
    }

    setStatus('detecting')
    console.log("PHASE 1 FRONTEND: Requesting coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        console.log("PHASE 1 FRONTEND: COORDS RECEIVED", { latitude, longitude })
        setCoords({ latitude, longitude })

        try {
          const response = await getDistrictFromCoords(latitude, longitude)
          console.log("PHASE 1 FRONTEND: BACKEND RESPONSE", response)

          if (response.error) {
            console.error("PHASE 1 FRONTEND ERROR FROM BACKEND:", response.error)
            setStatus('error')
            return
          }

          const rawDistrict = response?.district
          const rawLocality = response?.locality

          if (!isInvalidName(rawDistrict)) {
            const resolvedDistrict = rawDistrict.trim()
            console.log("PHASE 1 FRONTEND: SUCCESS - DISTRICT IS", resolvedDistrict)
            setDistrict(resolvedDistrict)
            localStorage.setItem('detected_district', resolvedDistrict)

            if (!isInvalidName(rawLocality)) {
              setLocality(rawLocality.trim())
              localStorage.setItem('detected_locality', rawLocality.trim())
            }

            setStatus('resolved')
          } else {
            console.warn('PHASE 1 FRONTEND: District resolution returned empty/invalid name:', rawDistrict)
            // Debug the raw data components if possible
            if (response.raw && response.raw.results) {
               console.log("PHASE 1 FRONTEND: Inspecting raw address components for first result:")
               console.log(response.raw.results[0]?.address_components)
            }
            localStorage.removeItem('detected_district')
            localStorage.removeItem('detected_locality')
            setDistrict(null)
            setLocality(null)
            setStatus('error')
          }
        } catch (err) {
          console.error('PHASE 1 FRONTEND: Failed to fetch from backend:', err)
          setStatus('error')
        }
      },
      (error) => {
        console.warn('PHASE 1 FRONTEND: Geolocation denied/error:', error)
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  useEffect(() => {
    if (status === 'idle') {
      detectLocation()
    }
  }, [status, detectLocation])

  return (
    <LocationContext.Provider value={{ coords, district, locality, status, detectLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) throw new Error('useLocation must be used within LocationProvider')
  return context
}
