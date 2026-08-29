import { MapPin, Info } from 'lucide-react'
import EventMapPicker from '../map/EventMapPicker.jsx'

export default function RequestStep03Location({ form, update, errors = {} }) {
  return (
    <div className="create-step-content" role="region" aria-labelledby="request-step3-title">
      <div className="create-step-header">
        <div className="create-step-header__title-row">
          <MapPin size={22} className="create-step-header__icon" />
          <h2 id="request-step3-title" className="create-step-title">Location</h2>
        </div>
        <p className="create-step-desc">Suggest a venue, neighborhood, or exact map location for the event.</p>
      </div>

      <div className="create-step-form">
        <div className="form-group">
          <label htmlFor="request-location">
            Venue / Exact Location <span className="required-star">*</span>
          </label>
          <input
            id="request-location"
            type="text"
            placeholder="e.g., Central Park Pavilion or Downtown Community Center"
            value={form.location || ''}
            onChange={(e) => update('location', e.target.value)}
            className={`form-input ${errors.location ? 'form-input--error' : ''}`}
          />
          {errors.location && <span className="form-field-error">{errors.location}</span>}
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="request-city">
              City <span className="required-star">*</span>
            </label>
            <input
              id="request-city"
              type="text"
              placeholder="Enter city"
              value={form.city || ''}
              onChange={(e) => update('city', e.target.value)}
              className={`form-input ${errors.city ? 'form-input--error' : ''}`}
            />
            {errors.city && <span className="form-field-error">{errors.city}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="request-neighborhood">
              Neighborhood (Optional)
            </label>
            <input
              id="request-neighborhood"
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
            Select on Map
          </label>
          
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

          {/* Info Hint below Map and Actions */}
          <div className="create-step-info-hint" style={{ marginTop: '6px' }}>
            <Info size={16} />
            <span>Drag or zoom the map and click on the exact location to pin it.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
