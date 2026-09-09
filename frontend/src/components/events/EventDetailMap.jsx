import { useState, useCallback, useRef } from 'react'
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api'
import {
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Navigation,
  Activity,
  Music,
  Utensils,
  GraduationCap,
  Users,
  BookOpen,
  ShoppingBag,
  HeartHandshake,
  Tag,
} from 'lucide-react'
import '../../styles/eventMap.css'

const LIBRARIES = ['places']

const CATEGORY_META = {
  Sports: {
    icon: Activity,
    color: '#16A34A',
    bgColor: '#DCFCE7',
  },
  Music: {
    icon: Music,
    color: '#7C3AED',
    bgColor: '#F3E8FF',
  },
  Food: {
    icon: Utensils,
    color: '#EA580C',
    bgColor: '#FFEDD5',
  },
  Workshops: {
    icon: GraduationCap,
    color: '#2563EB',
    bgColor: '#DBEAFE',
  },
  Meetups: {
    icon: Users,
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
  },
  'Student Events': {
    icon: BookOpen,
    color: '#0D9488',
    bgColor: '#CCFBF1',
  },
  'Garage Sale': {
    icon: ShoppingBag,
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  Community: {
    icon: HeartHandshake,
    color: '#059669',
    bgColor: '#D1FAE5',
  },
}

function getCategoryConfig(categoryKey) {
  if (CATEGORY_META[categoryKey]) {
    return CATEGORY_META[categoryKey]
  }
  return {
    icon: Tag,
    color: '#5E2EA8',
    bgColor: '#F3ECFA',
  }
}

export default function EventDetailMap({ event }) {
  const mapRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(15)
  const [imgError, setImgError] = useState(false)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  })

  const hasCoords = Boolean(event?.latitude && event?.longitude)
  const center = hasCoords
    ? { lat: Number(event.latitude), lng: Number(event.longitude) }
    : { lat: 11.0168, lng: 76.9558 }

  const categoryConfig = getCategoryConfig(event?.category || 'Community')
  const IconComp = categoryConfig.icon

  const onLoad = useCallback((map) => {
    mapRef.current = map
  }, [])

  const onUnmount = useCallback(() => {
    mapRef.current = null
  }, [])

  const handleZoomIn = () => {
    if (mapRef.current) {
      const nextZoom = (mapRef.current.getZoom() || zoom) + 1
      mapRef.current.setZoom(nextZoom)
      setZoom(nextZoom)
    }
  }

  const handleZoomOut = () => {
    if (mapRef.current) {
      const nextZoom = (mapRef.current.getZoom() || zoom) - 1
      mapRef.current.setZoom(nextZoom)
      setZoom(nextZoom)
    }
  }

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev)
  }

  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        event?.location || 'Event Location'
      )}`

  return (
    <div>
      {/* Map Canvas with Controls */}
      <div
        className={`event-details__map-wrapper ${
          isFullscreen ? 'event-details__map-wrapper--fullscreen' : ''
        }`}
      >
        {isLoaded && hasCoords ? (
          <GoogleMap
            mapContainerClassName="event-details__map-canvas"
            center={center}
            zoom={zoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              disableDefaultUI: true,
              gestureHandling: 'greedy',
              zoomControl: false,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'on' }],
                },
              ],
            }}
          >
            {/* Custom Event Image Map Marker with Category Accent & Tip */}
            <OverlayView
              position={center}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={(width, height) => ({
                x: -(width / 2),
                y: -height,
              })}
            >
              <div
                className="map-image-marker"
                title={event.title || event.location}
                style={{
                  '--marker-accent': categoryConfig.color,
                }}
              >
                <div className="map-image-marker__pin">
                  <div className="map-image-marker__img-container">
                    {event.imageUrl && !imgError ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title || ''}
                        className="map-image-marker__img"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div
                        className="map-image-marker__fallback"
                        style={{
                          backgroundColor: categoryConfig.bgColor,
                          color: categoryConfig.color,
                        }}
                      >
                        <IconComp size={22} strokeWidth={2.4} />
                      </div>
                    )}
                  </div>
                  <div className="map-image-marker__tip" />
                </div>
              </div>
            </OverlayView>
          </GoogleMap>
        ) : (
          <div className="event-details__map-fallback">
            <span>{hasCoords ? 'Loading map…' : 'Map not available for this location'}</span>
          </div>
        )}

        {/* Fullscreen Button Top Right */}
        <button
          type="button"
          className="event-details__map-ctrl-fullscreen"
          title="Toggle Fullscreen"
          aria-label="Toggle Fullscreen"
          onClick={handleToggleFullscreen}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* Zoom Controls Right Side */}
        <div className="event-details__map-zoom-group">
          <button
            type="button"
            className="event-details__map-zoom-btn"
            title="Zoom in"
            aria-label="Zoom in"
            onClick={handleZoomIn}
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            className="event-details__map-zoom-btn"
            title="Zoom out"
            aria-label="Zoom out"
            onClick={handleZoomOut}
          >
            <Minus size={16} />
          </button>
        </div>
      </div>

      {/* Get Directions Button Full Width Directly Below Map */}
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="event-details__directions-action-btn"
      >
        <Navigation size={16} strokeWidth={2.4} style={{ transform: 'rotate(45deg)' }} />
        <span>Get Directions</span>
      </a>
    </div>
  )
}
