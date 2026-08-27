import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import '../../styles/eventMap.css';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const DEFAULT_CENTER = {
  lat: 20.5937,
  lng: 78.9629
};

export default function EventMapPicker({
  latitude,
  longitude,
  onLocationChange,
  initialCenter = [20.5937, 78.9629],
  initialZoom = 5
}) {
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState({
    lat: initialCenter[0],
    lng: initialCenter[1]
  });
  const [zoom, setZoom] = useState(initialZoom);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  const onLoad = useCallback(function callback(map) {
    setMap(map);
    map.setOptions({
      gestureHandling: 'greedy'
    });
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const onMapClick = useCallback((e) => {
    onLocationChange(e.latLng.lat(), e.latLng.lng());
  }, [onLocationChange]);

  const useMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCenter(loc);
          setZoom(13);
        },
        (error) => {
          console.error("Error getting location: ", error);
          alert("Unable to retrieve your location. Please check permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const clearLocation = () => {
    onLocationChange(null, null);
  };

  const onMarkerDragEnd = (e) => {
    onLocationChange(e.latLng.lat(), e.latLng.lng());
  };

  if (!isLoaded) return <div className="state-card">Loading map picker...</div>;

  return (
    <div className="map-picker-container">
      <div className="map-container" style={{ height: '350px' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          onClick={onMapClick}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            gestureHandling: 'greedy',
          }}
        >
          {latitude !== null && longitude !== null && (
            <Marker
              position={{ lat: latitude, lng: longitude }}
              draggable={true}
              onDragEnd={onMarkerDragEnd}
            />
          )}
        </GoogleMap>
      </div>

      <div className="map-picker-actions">
        <button type="button" className="secondary-button" style={{ minHeight: '36px', fontSize: '13px' }} onClick={useMyLocation}>
          Use My Location
        </button>
        <button type="button" className="secondary-button" style={{ minHeight: '36px', fontSize: '13px' }} onClick={clearLocation}>
          Clear Location
        </button>
      </div>

      {(latitude !== null && longitude !== null) ? (
        <div className="map-picker-coords">
          <span><strong>Latitude:</strong> {latitude.toFixed(6)}</span>
          <span><strong>Longitude:</strong> {longitude.toFixed(6)}</span>
        </div>
      ) : (
        <p className="map-picker-help">Click on the map to select the exact event location.</p>
      )}
    </div>
  );
}
