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
      console.error("PHASE 1: Geolocation not supported by browser");
      setStatus('error')
      return
    }

    setStatus('detecting')
    console.log("PHASE 1: Requesting browser coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        console.log("PHASE 1 DEBUG: BROWSER COORDINATES RECEIVED", { latitude, longitude })
        setCoords({ latitude, longitude })

        try {
          // Calls backend /api/location/district
          const response = await getDistrictFromCoords(latitude, longitude)

          console.log("PHASE 1 DEBUG: FULL BACKEND API RESPONSE", response)

          if (response.raw) {
            console.log("PHASE 1 DEBUG: GOOGLE GEOCODING RAW RESULTS", response.raw.results)
            response.raw.results.forEach((res, idx) => {
               console.log(`PHASE 1 DEBUG: Result [${idx}] Address Components:`, res.address_components)
            })
          }

          const rawDistrict = response?.district
          const rawLocality = response?.locality

          console.log("PHASE 1 DEBUG: EXTRACTED DISTRICT (Level 2):", rawDistrict)
          console.log("PHASE 1 DEBUG: EXTRACTED LOCALITY (City/Village):", rawLocality)

          if (!isInvalidName(rawDistrict)) {
            const resolvedDistrict = rawDistrict.trim()
            console.log("PHASE 1 SUCCESS: SETTING DISTRICT TO", resolvedDistrict)
            setDistrict(resolvedDistrict)
            localStorage.setItem('detected_district', resolvedDistrict)

            if (!isInvalidName(rawLocality)) {
              const resolvedLocality = rawLocality.trim()
              setLocality(resolvedLocality)
              localStorage.setItem('detected_locality', resolvedLocality)
            }

            setStatus('resolved')
          } else {
            console.warn('PHASE 1 ERROR: Resolved district was empty or invalid:', rawDistrict)
            localStorage.removeItem('detected_district')
            localStorage.removeItem('detected_locality')
            setDistrict(null)
            setLocality(null)
            setStatus('error')
          }
        } catch (err) {
          console.error('PHASE 1 ERROR: Failed to resolve location from API:', err)
          localStorage.removeItem('detected_district')
          localStorage.removeItem('detected_locality')
          setDistrict(null)
          setLocality(null)
          setStatus('error')
        }
      },
      (error) => {
        console.warn('PHASE 1 ERROR: Geolocation permission denied or error:', error)
        if (error.code === error.PERMISSION_DENIED) {
           localStorage.removeItem('detected_district')
           localStorage.removeItem('detected_locality')
           setDistrict(null)
           setLocality(null)
        }
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 } // force fresh position
    )
  }, [])

  useEffect(() => {
    // ALWAYS trigger detection on mount for Phase 1 Debugging to ensure we aren't seeing stale cache
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
