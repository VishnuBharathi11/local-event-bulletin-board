import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
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

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function EventMap({ events = [], center = [20.5937, 78.9629], zoom = 5, height = '400px' }) {
  // Filter events with valid coordinates
  const mapEvents = events.filter(event =>
    event.latitude !== null &&
    event.longitude !== null &&
    !isNaN(event.latitude) &&
    !isNaN(event.longitude)
  );

  return (
    <div className="map-container" style={{ height }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapEvents.map((event) => (
          <Marker key={event.eventId} position={[event.latitude, event.longitude]}>
            <Popup>
              <div className="event-map-popup">
                <h3>{event.title}</h3>
                <p>{event.category} · {event.city}</p>
                <Link className="primary-button" style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }} to={`/events/${encodeURIComponent(event.eventId)}`}>
                  View Event
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
