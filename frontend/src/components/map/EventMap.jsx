import { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, OverlayView } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
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
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: `3px solid ${color}`,
          overflow: 'hidden',
          backgroundColor: 'white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}>
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
        <div className="marker-pin" style={{
          width: '0',
          height: '0',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `10px solid ${color}`,
          marginTop: '-1px',
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
  const [map, setMap] = useState(null);
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
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const mapEvents = useMemo(() => events.filter(event =>
    event.latitude !== null &&
    event.longitude !== null &&
    !isNaN(event.latitude) &&
    !isNaN(event.longitude)
  ), [events]);

  useEffect(() => {
    if (showUserLocation && !propCenter && navigator.geolocation) {
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
  }, [showUserLocation, propCenter]);

  const handleMarkerClick = (event) => {
    setSelectedEvent(event);
  };

  if (!isLoaded) return <div className="state-card">Loading map...</div>;

  return (
    <div className="map-container" style={{ height }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
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

        {mapEvents.map((event) => (
          <CustomEventMarker
            key={event.eventId}
            event={event}
            onClick={handleMarkerClick}
          />
        ))}

        {selectedEvent && (
          <InfoWindow
            position={{ lat: selectedEvent.latitude, lng: selectedEvent.longitude }}
            onCloseClick={() => setSelectedEvent(null)}
          >
            <div className="event-map-popup">
              {selectedEvent.imageUrl && (
                <div style={{ width: '100%', height: '80px', marginBottom: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <img src={selectedEvent.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <h3>{selectedEvent.title}</h3>
              <p style={{ margin: '2px 0' }}><strong>{selectedEvent.category}</strong></p>
              <p>{selectedEvent.city} · {new Date(selectedEvent.startTime).toLocaleDateString()}</p>
              <button
                className="primary-button"
                style={{ width: '100%', minHeight: '32px', padding: '4px 12px', fontSize: '12px', marginTop: '8px' }}
                onClick={() => navigate(`/events/${encodeURIComponent(selectedEvent.eventId)}`)}
              >
                View Event →
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
