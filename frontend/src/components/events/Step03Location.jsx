import { MapPin, Info } from 'lucide-react'
import EventMapPicker from '../map/EventMapPicker.jsx'

export default function Step03Location({ form, update, errors = {} }) {
  return (
    <div className="create-step-content" role="region" aria-labelledby="step3-title">
      <div className="create-step-header">
        <div className="create-step-header__title-row">
          <MapPin size={22} className="create-step-header__icon" />
          <h2 id="step3-title" className="create-step-title">Location</h2>
        </div>
        <p className="create-step-desc">Tell attendees where the event will take place.</p>
      </div>

      <div className="create-step-form">
        <div className="form-group">
          <label htmlFor="event-location">
            Venue / Exact Location <span className="required-star">*</span>
          </label>
          <input
            id="event-location"
            type="text"
            placeholder="Enter venue name or exact address"
            value={form.location || ''}
            onChange={(e) => update('location', e.target.value)}
            className={`form-input ${errors.location ? 'form-input--error' : ''}`}
          />
          {errors.location && <span className="form-field-error">{errors.location}</span>}
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="event-city">
              City <span className="required-star">*</span>
            </label>
            <input
              id="event-city"
              type="text"
              placeholder="Enter city"
              value={form.city || ''}
              onChange={(e) => update('city', e.target.value)}
              className={`form-input ${errors.city ? 'form-input--error' : ''}`}
            />
            {errors.city && <span className="form-field-error">{errors.city}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="event-neighborhood">
              Neighborhood (Optional)
            </label>
            <input
              id="event-neighborhood"
              type="text"
              placeholder="Enter neighborhood"
              value={form.neighborhood || ''}
              onChange={(e) => update('neighborhood', e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Map Selection Section */}
        <div className="form-group" style={{ marginTop: '12px' }}>
          <label>
            Select on Map <span className="required-star">*</span>
          </label>
          <div className="map-picker-embedded-wrap">
            <EventMapPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onLocationChange={(lat, lng) => {
                update('latitude', lat)
                update('longitude', lng)
              }}
              initialCenter={form.latitude && form.longitude ? [form.latitude, form.longitude] : undefined}
              initialZoom={form.latitude && form.longitude ? 15 : undefined}
            />
          </div>

          {/* Info Hint below Map */}
          <div className="create-step-info-hint">
            <Info size={16} />
            <span>Drag or zoom the map and click on the exact location to pin it.</span>
          </div>

          {errors.map && <span className="form-field-error" style={{ display: 'block', marginTop: '6px' }}>{errors.map}</span>}
        </div>
      </div>
    </div>
  )
}
