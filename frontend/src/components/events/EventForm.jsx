import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import TimePicker from '../common/TimePicker.jsx'
import EventMapPicker from '../map/EventMapPicker.jsx'
import '../../styles/createEvent.css'

const CATEGORIES = [
  'Sports',
  'Music',
  'Food',
  'Workshops',
  'Meetups',
  'Student Events',
  'Garage Sale',
  'Community',
]

function initialForm() {
  return {
    title: '',
    description: '',
    category: '',
    date: '',
    startTime: '17:00',
    endTime: '19:00',
    location: '',
    city: '',
    neighborhood: '',
    imageUrl: null,
    latitude: null,
    longitude: null,
  }
}

export default function EventForm({ onSubmit, submitting = false, serverError = null, initialData = null }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState(initialData || initialForm)
  const [error, setError] = useState(null)
  const [nowTick, setNowTick] = useState(Date.now())

  useEffect(() => {
    if (initialData) {
      setForm(initialData)
    }
  }, [initialData])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(Date.now())
    }, 30000)
    return () => window.clearInterval(timer)
  }, [])

  const today = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [nowTick])

  const getCurrentMinutes = () => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  }

  const startMinimumMinutes = useMemo(() => {
    if (!form.date) return 0
    if (form.date === today) return getCurrentMinutes()
    return 0
  }, [form.date, today, nowTick])

  const endMinimumMinutes = useMemo(() => {
    let minimum = 0
    if (form.date === today) minimum = getCurrentMinutes()
    if (form.startTime) {
      const [hour, minute] = form.startTime.split(':').map(Number)
      if (Number.isFinite(hour) && Number.isFinite(minute)) {
        minimum = Math.max(minimum, hour * 60 + minute + 1)
      }
    }
    return minimum
  }, [form.date, form.startTime, today, nowTick])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  function handleImageChange(event) {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large. Max size is 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      update('imageUrl', reader.result)
    }
    reader.readAsDataURL(file)
  }

  function clearImage() {
    update('imageUrl', null)
  }

  function validate() {
    const required = ['title', 'description', 'category', 'location', 'city', 'neighborhood']
    if (required.some((field) => !form[field].trim())) return 'All fields are required.'
    if (!form.date) return 'Please select a valid event date.'
    if (!/^\d{2}:\d{2}$/.test(form.startTime)) return 'Please select a valid start time.'
    if (!/^\d{2}:\d{2}$/.test(form.endTime)) return 'Please select a valid end time.'

    const [year, month, day] = form.date.split('-').map(Number)
    const [startHour, startMin] = form.startTime.split(':').map(Number)
    const [endHour, endMin] = form.endTime.split(':').map(Number)

    const startTime = new Date(year, month - 1, day, startHour, startMin, 0, 0).getTime()
    const endTime = new Date(year, month - 1, day, endHour, endMin, 0, 0).getTime()
    const now = Date.now()

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return 'Please select a valid event date and time.'
    if (startTime <= now) return 'Start time must be in the future.'
    if (endTime <= startTime) return 'End time must be after start time.'
    if (endTime <= now) return 'End time must be in the future.'

    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    // Convert local date/time strings to UTC timestamps for the API
    const [year, month, day] = form.date.split('-').map(Number)
    const [startHour, startMin] = form.startTime.split(':').map(Number)
    const [endHour, endMin] = form.endTime.split(':').map(Number)

    const startTime = new Date(year, month - 1, day, startHour, startMin, 0, 0).getTime()
    const endTime = new Date(year, month - 1, day, endHour, endMin, 0, 0).getTime()

    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      location: form.location.trim(),
      city: form.city.trim(),
      neighborhood: form.neighborhood.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      startTime,
      endTime,
      status: 'PUBLISHED',
      createdAt: Date.now(),
      expireAt: endTime,
      imageUrl: form.imageUrl,
    })
  }

  return (
    <form className="event-form create-event-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="create-event-form__section">
        <div className="create-event-form__section-header">
          <h2 className="create-event-form__section-title">Basic Information</h2>
          <p className="create-event-form__section-description">Add the essential details people need to understand your event.</p>
        </div>
        <div className="create-event-form__fields">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="user-name">Name</label>
              <input id="user-name" value={currentUser?.name || ''} readOnly className="input--readonly" />
            </div>

            <div className="form-field">
              <label htmlFor="user-email">Email</label>
              <input id="user-email" value={currentUser?.email || ''} readOnly className="input--readonly" />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="event-title">Event Title <span className="required-star">*</span></label>
            <input id="event-title" value={form.title} onChange={(event) => update('title', event.target.value)} />
          </div>

          <div className="form-field">
            <label htmlFor="event-description">Description <span className="required-star">*</span></label>
            <textarea id="event-description" rows="6" value={form.description} onChange={(event) => update('description', event.target.value)} />
          </div>

          <div className="form-field">
            <label htmlFor="event-category">Category <span className="required-star">*</span></label>
            <select id="event-category" value={form.category} onChange={(event) => update('category', event.target.value)}>
              <option value="">Select category</option>
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="event-image">Event Image <span className="required-star">*</span></label>
            <div className="image-upload">
              {!form.imageUrl ? (
                <label htmlFor="event-image" className="image-upload__label">
                  <input
                    id="event-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-upload__input"
                  />
                  <div className="image-upload__icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <div className="image-upload__text">
                    <strong>Click to upload event image</strong>
                    <span>PNG, JPG or JPEG (max. 5MB)</span>
                  </div>
                </label>
              ) : (
                <div className="image-upload__preview-wrap">
                  <img src={form.imageUrl} alt="Preview" className="image-upload__preview" />
                  <button
                    type="button"
                    className="image-upload__clear"
                    onClick={clearImage}
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="create-event-form__section">
        <div className="create-event-form__section-header">
          <h2 className="create-event-form__section-title">Date &amp; Time</h2>
          <p className="create-event-form__section-description">Choose when the event starts and ends. The existing local-time behavior is preserved.</p>
        </div>
        <div className="create-event-form__fields create-event-form__fields--date-time">
          <div className="form-field">
            <label htmlFor="event-date">Event Date <span className="required-star">*</span></label>
            <input id="event-date" type="date" min={today} value={form.date} onChange={(event) => update('date', event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="event-start">Start Time <span className="required-star">*</span></label>
            <TimePicker
              id="event-start"
              label="start time"
              value={form.startTime}
              onChange={(value) => update('startTime', value)}
              minimumMinutes={startMinimumMinutes}
              disabled={!form.date}
            />
          </div>
          <div className="form-field">
            <label htmlFor="event-end">End Time <span className="required-star">*</span></label>
            <TimePicker
              id="event-end"
              label="end time"
              value={form.endTime}
              onChange={(value) => update('endTime', value)}
              minimumMinutes={endMinimumMinutes}
              disabled={!form.date || !form.startTime}
              align="right"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="create-event-form__section">
        <div className="create-event-form__section-header">
          <h2 className="create-event-form__section-title">Location</h2>
          <p className="create-event-form__section-description">Tell attendees where the event will take place.</p>
        </div>
        <div className="create-event-form__fields">
          <div className="form-field">
            <label htmlFor="event-location">Venue / Exact Location <span className="required-star">*</span></label>
            <input id="event-location" value={form.location} onChange={(event) => update('location', event.target.value)} />
          </div>
        </div>
        <div className="create-event-form__fields create-event-form__fields--location">
          <div className="form-field">
            <label htmlFor="event-city">City <span className="required-star">*</span></label>
            <input id="event-city" value={form.city} onChange={(event) => update('city', event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="event-neighborhood">Neighborhood <span className="required-star">*</span></label>
            <input id="event-neighborhood" value={form.neighborhood} onChange={(event) => update('neighborhood', event.target.value)} />
          </div>
        </div>

        <div className="form-field" style={{ marginTop: '16px' }}>
          <label>Event Location on Map</label>
          <EventMapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onLocationChange={(lat, lng) => {
              update('latitude', lat);
              update('longitude', lng);
            }}
            initialCenter={form.latitude && form.longitude ? [form.latitude, form.longitude] : undefined}
            initialZoom={form.latitude && form.longitude ? 15 : undefined}
          />
          {!form.latitude && (
            <p style={{ fontSize: '13px', color: 'var(--warning)', marginTop: '8px' }}>
              Select the event location on the map for better discovery.
            </p>
          )}
        </div>
      </fieldset>

      {(error || serverError) && <p className="create-event-form__error form-error" role="alert">{error || serverError}</p>}

      <div className="create-event-form__actions">
        <button className="primary-button" type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? (initialData ? 'Updating Event…' : 'Creating Event…') : (initialData ? 'Update Event' : 'Create Event')}
        </button>
      </div>
    </form>
  )
}
