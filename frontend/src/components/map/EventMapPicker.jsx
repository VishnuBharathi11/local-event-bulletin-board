import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/eventMap.css';

// Fix for default marker icon issues in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function MapEvents({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function EventMapPicker({
  latitude,
  longitude,
  onLocationChange,
  initialCenter = [20.5937, 78.9629],
  initialZoom = 5
}) {
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [mapZoom, setMapZoom] = useState(initialZoom);

  const handleLocationSelect = (lat, lng) => {
    onLocationChange(lat, lng);
  };

  const useMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setMapCenter([lat, lng]);
          setMapZoom(13);
          // Optional: automatically select the user's location as event location
          // handleLocationSelect(lat, lng);
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

  return (
    <div className="map-picker-container">
      <div className="map-container" style={{ height: '350px' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <ChangeView center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onLocationSelect={handleLocationSelect} />
          {latitude !== null && longitude !== null && (
            <Marker position={[latitude, longitude]} draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  handleLocationSelect(position.lat, position.lng);
                },
              }}
            />
          )}
        </MapContainer>
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
