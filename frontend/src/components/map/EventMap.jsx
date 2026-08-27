import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, OverlayView, MarkerClusterer } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { isPincode } from '../../utils/eventDiscovery.js';
import '../../styles/eventMap.css';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const DEFAULT_CENTER = {
  lat: 20.5937,
  lng: 78.9629
};

const CATEGORY_COLORS = {
  'Sports': '#3B82F6',
  'Music': '#8B5CF6',
  'Food': '#F59E0B',
  'Workshops': '#10B981',
  'Meetups': '#EF4444',
  'Student Events': '#14B8A6',
  'Garage Sale': '#EAB308',
  'Community': '#EC4899',
};

const getCategoryColor = (category) => CATEGORY_COLORS[category] || '#6366F1';

const CustomEventMarker = ({ event, onClick }) => {
  const color = getCategoryColor(event.category);
  const position = { lat: event.latitude, lng: event.longitude };

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(width, height) => ({
        x: -(width / 2),
        y: -height,
      })}
    >
      <div
        className="custom-marker"
        onClick={() => onClick(event)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <div className="marker-image-container" style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          border: `3px solid ${color}`,
          padding: '2px',
          backgroundColor: 'white',
          boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'transform 0.2s ease-in-out'
        }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', backgroundColor: '#f0f4f8', color: '#667085', fontSize: '10px', fontWeight: 'bold' }}>EH</div>
            )}
          </div>
        </div>
        <div className="marker-pin" style={{
          width: '0',
          height: '0',
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: `12px solid ${color}`,
          marginTop: '-2px',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))'
        }} />
      </div>
    </OverlayView>
  );
};

export default function EventMap({
  events = [],
  center: propCenter,
  zoom: propZoom,
  height = '400px',
  showUserLocation = true
}) {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const [center, setCenter] = useState(() => {
    if (propCenter) return Array.isArray(propCenter) ? { lat: propCenter[0], lng: propCenter[1] } : propCenter;
    return DEFAULT_CENTER;
  });

  const [zoom, setZoom] = useState(propZoom || 5);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  useEffect(() => {
    if (propCenter) {
      setCenter(Array.isArray(propCenter) ? { lat: propCenter[0], lng: propCenter[1] } : propCenter);
    }
    if (propZoom) {
      setZoom(propZoom);
    }
  }, [propCenter, propZoom]);

  const onLoad = useCallback(function callback(map) {
    mapRef.current = map;
    map.setOptions({
      gestureHandling: 'greedy'
    });
  }, []);

  const onUnmount = useCallback(function callback(map) {
    mapRef.current = null;
  }, []);

  const mapEvents = useMemo(() => events.filter(event =>
    event.latitude !== null &&
    event.longitude !== null &&
    !isNaN(event.latitude) &&
    !isNaN(event.longitude)
  ), [events]);

  const requestUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          setCenter(loc);
          setZoom(13);
        },
        () => {
          console.warn("Geolocation permission denied or error.");
        }
      );
    }
  }, []);

  useEffect(() => {
    if (showUserLocation && !propCenter) {
      requestUserLocation();
    }
  }, [showUserLocation, propCenter, requestUserLocation]);

  const handleMarkerClick = (event) => {
    setSelectedEvent(event);
  };

  if (!isLoaded) return <div className="state-card">Loading map...</div>;

  return (
    <div className="map-container-wrapper" style={{ position: 'relative', height }}>
      <div className="map-container" style={{ height: '100%' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
          }}
        >
          {userLocation && window.google && (
            <Marker
              position={userLocation}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              }}
              label={{
                text: "YOU",
                color: "#4285F4",
                fontSize: "10px",
                fontWeight: "bold",
                className: "user-location-label"
              }}
              title="Your Location"
            />
          )}

          <MarkerClusterer
            options={{
              imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
            }}
          >
            {(clusterer) =>
              mapEvents.map((event) => (
                <CustomEventMarker
                  key={event.eventId}
                  event={event}
                  onClick={handleMarkerClick}
                  clusterer={clusterer}
                />
              ))
            }
          </MarkerClusterer>

          {selectedEvent && (
            <InfoWindow
              position={{ lat: selectedEvent.latitude, lng: selectedEvent.longitude }}
              onCloseClick={() => setSelectedEvent(null)}
            >
              <div className="event-map-popup">
                {selectedEvent.imageUrl && (
                  <div style={{ width: '100%', height: '100px', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={selectedEvent.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{selectedEvent.title}</h3>
                <div style={{ display: 'flex', gap: '6px', margin: '6px 0' }}>
                  <span className="event-badge" style={{ backgroundColor: getCategoryColor(selectedEvent.category) + '20', color: getCategoryColor(selectedEvent.category), fontSize: '11px', padding: '2px 8px' }}>
                    {selectedEvent.category}
                  </span>
                </div>
                <p style={{ margin: '4px 0', fontSize: '13px' }}>📅 {new Date(selectedEvent.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <p style={{ margin: '4px 0', fontSize: '13px' }}>
                  📍 {selectedEvent.location}
                  {selectedEvent.city && !isPincode(selectedEvent.city) && `, ${selectedEvent.city}`}
                  {selectedEvent.neighborhood && !isPincode(selectedEvent.neighborhood) && (selectedEvent.city === selectedEvent.neighborhood ? '' : `, ${selectedEvent.neighborhood}`)}
                </p>
                {selectedEvent.rsvpCount > 0 && (
                  <p style={{ margin: '4px 0', fontSize: '12px', color: 'var(--text-muted)' }}>👥 {selectedEvent.rsvpCount} going</p>
                )}
                <button
                  className="primary-button"
                  style={{ width: '100%', minHeight: '32px', padding: '6px 12px', fontSize: '13px', marginTop: '10px', borderRadius: '8px' }}
                  onClick={() => navigate(`/events/${encodeURIComponent(selectedEvent.eventId)}`)}
                >
                  View Event
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      <button
        className="map-action-button my-location-button"
        onClick={requestUserLocation}
        title="Show My Location"
        aria-label="Show My Location"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3"/>
          <line x1="12" y1="1" x2="12" y2="4"/>
          <line x1="12" y1="20" x2="12" y2="23"/>
          <line x1="1" y1="12" x2="4" y2="12"/>
          <line x1="20" y1="12" x2="23" y2="12"/>
        </svg>
      </button>
    </div>
  );
}
