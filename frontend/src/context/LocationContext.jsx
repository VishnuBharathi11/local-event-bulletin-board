import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getDistrictFromCoords, getLocalities } from '../services/locationService.js'

const LocationContext = createContext()

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState(null)
  const [localities, setLocalities] = useState([])

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
      console.error("PHASE 1: Geolocation not supported");
      setStatus('error')
      return
    }

    setStatus('detecting')
    console.log("PHASE 1: Starting fresh location detection...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        console.log("PHASE 1: BROWSER COORDS =", { latitude, longitude })
        setCoords({ latitude, longitude })

        try {
          const response = await getDistrictFromCoords(latitude, longitude)
          console.log("PHASE 1: BACKEND API FULL RESPONSE =", response)

          if (response.error) {
            console.error("PHASE 1: BACKEND ERROR =", response.error)
            setStatus('error')
            return
          }

          if (response.debug) {
            console.log("--- PHASE 1: COMPONENT DEBUG ---")
            console.log("Admin L2 List:", response.debug.admin2List)
            console.log("Admin L3 List:", response.debug.admin3List)
            console.log("Locality List:", response.debug.localityList)
            console.log("All Unique Components:", response.debug.allComponents)
            console.log("-------------------------------")
          }

          const rawDistrict = response?.district
          const rawLocality = response?.locality

          console.log("PHASE 1: FINAL DISTRICT RESOLVED =", rawDistrict)
          console.log("PHASE 1: FINAL LOCALITY RESOLVED =", rawLocality)

          if (!isInvalidName(rawDistrict)) {
            const resolvedDistrict = rawDistrict.trim()
            setDistrict(resolvedDistrict)
            localStorage.setItem('detected_district', resolvedDistrict)

            if (!isInvalidName(rawLocality)) {
              setLocality(rawLocality.trim())
              localStorage.setItem('detected_locality', rawLocality.trim())
            }

            setStatus('resolved')
          } else {
            console.warn('PHASE 1: Resolved district was empty or invalid. Not setting incorrect name.')
            setDistrict(null)
            setLocality(null)
            localStorage.removeItem('detected_district')
            localStorage.removeItem('detected_locality')
            setStatus('error')
          }
        } catch (err) {
          console.error('PHASE 1: Exception in resolution flow:', err)
          setStatus('error')
        }
      },
      (error) => {
        console.warn('PHASE 1: Geolocation access denied or hardware error:', error)
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

  useEffect(() => {
    if (status === 'resolved' && district) {
      getLocalities(district)
        .then(data => {
          if (data.areas) setLocalities(data.areas)
        })
        .catch(err => console.error("Failed to fetch localities:", err))
    }
  }, [status, district])

  return (
    <LocationContext.Provider value={{ coords, district, locality, localities, status, detectLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) throw new Error('useLocation must be used within LocationProvider')
  return context
}
