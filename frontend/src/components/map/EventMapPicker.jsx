import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import '../../styles/eventMap.css';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const LIBRARIES = ['places'];

export default function EventMapPicker({
  latitude,
  longitude,
  onLocationChange,
  initialCenter = [20.5937, 78.9629],
  initialZoom = 5
}) {
  const [, setMap] = useState(null);
  const [center, setCenter] = useState({
    lat: initialCenter[0],
    lng: initialCenter[1]
  });
  const [zoom, setZoom] = useState(initialZoom);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES
  });

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
    mapInstance.setOptions({
      gestureHandling: 'greedy'
    });
  }, []);

  const onUnmount = useCallback(function callback() {
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
          onLocationChange(position.coords.latitude, position.coords.longitude);
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
      {/* Map Embedded Frame */}
      <div className="map-picker-embedded-wrap">
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

      {/* Clearly Separated Button Action Row Below Map Container */}
      <div className="map-picker-actions">
        <button
          type="button"
          className="map-picker-btn"
          onClick={useMyLocation}
        >
          Use My Location
        </button>
        <button
          type="button"
          className="map-picker-btn"
          onClick={clearLocation}
        >
          Clear Location
        </button>
      </div>
    </div>
  );
}
