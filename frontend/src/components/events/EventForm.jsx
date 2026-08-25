import { useMemo, useState } from 'react'

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
  }
}

function localTimestamp(date, time) {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  const value = new Date(year, month - 1, day, hours, minutes, 0, 0).getTime()
  return Number.isFinite(value) ? value : NaN
}

export default function EventForm({ onSubmit, submitting = false, serverError = null }) {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState(null)

  const minDate = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  function validate() {
    const required = ['title', 'description', 'category', 'location', 'city', 'neighborhood']
    if (required.some((field) => !form[field].trim())) return 'All fields are required.'
    if (!form.date) return 'Please select a valid event date.'
    if (!/^\d{2}:\d{2}$/.test(form.startTime)) return 'Please select a valid start time.'
    if (!/^\d{2}:\d{2}$/.test(form.endTime)) return 'Please select a valid end time.'

    const startTime = localTimestamp(form.date, form.startTime)
    const endTime = localTimestamp(form.date, form.endTime)
    const now = Date.now()

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return 'Please select a valid event date and time.'
    if (endTime <= startTime) return 'End time must be after start time.'
    if (endTime <= now) return 'Event must end in the future.'

    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const startTime = localTimestamp(form.date, form.startTime)
    const endTime = localTimestamp(form.date, form.endTime)
    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      location: form.location.trim(),
      city: form.city.trim(),
      neighborhood: form.neighborhood.trim(),
      startTime,
      endTime,
      status: 'PUBLISHED',
      createdAt: Date.now(),
      expireAt: endTime,
    })
  }

  return (
    <form className="event-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="event-title">Event Title</label>
        <input id="event-title" value={form.title} onChange={(event) => update('title', event.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="event-description">Description</label>
        <textarea id="event-description" rows="4" value={form.description} onChange={(event) => update('description', event.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="event-category">Category</label>
        <select id="event-category" value={form.category} onChange={(event) => update('category', event.target.value)}>
          <option value="">Select category</option>
          {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>

      <div className="form-grid form-grid--date-time">
        <div className="form-field">
          <label htmlFor="event-date">Event Date</label>
          <input id="event-date" type="date" min={minDate} value={form.date} onChange={(event) => update('date', event.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="event-start">Start Time</label>
          <input id="event-start" type="time" value={form.startTime} onChange={(event) => update('startTime', event.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="event-end">End Time</label>
          <input id="event-end" type="time" value={form.endTime} onChange={(event) => update('endTime', event.target.value)} />
        </div>
      </div>

      <div className="form-section-title">Location Details</div>

      <div className="form-field">
        <label htmlFor="event-location">Venue / Exact Location</label>
        <input id="event-location" value={form.location} onChange={(event) => update('location', event.target.value)} />
      </div>

      <div className="form-grid form-grid--location">
        <div className="form-field">
          <label htmlFor="event-city">City</label>
          <input id="event-city" value={form.city} onChange={(event) => update('city', event.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="event-neighborhood">Neighborhood</label>
          <input id="event-neighborhood" value={form.neighborhood} onChange={(event) => update('neighborhood', event.target.value)} />
        </div>
      </div>

      {(error || serverError) && <p className="form-error" role="alert">{error || serverError}</p>}

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? 'Creating Event…' : 'Create Event'}
      </button>
    </form>
  )
}
