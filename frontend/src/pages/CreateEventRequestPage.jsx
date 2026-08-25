import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createEventRequest } from '../services/eventRequestService.js'
import '../styles/communityRequests.css'

const categories = ['Sports', 'Music', 'Food', 'Workshops', 'Meetups', 'Student Events', 'Garage Sale', 'Community']

function toTimestamp(date, time) {
  return new Date(`${date}T${time}`).getTime()
}

export default function CreateEventRequestPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', category: '', date: '', startTime: '', endTime: '', location: '', city: '', neighborhood: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })) }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    const startTime = toTimestamp(form.date, form.startTime)
    const endTime = toTimestamp(form.date, form.endTime)
    if (!form.title.trim() || !form.description.trim() || !form.category || !form.city.trim()) return setError('Title, description, category, and city are required.')
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return setError('End time must be after start time.')
    if (endTime <= Date.now()) return setError('Requested time must be in the future.')

    setStatus('saving')
    try {
      const request = await createEventRequest({
        title: form.title.trim(), description: form.description.trim(), category: form.category,
        city: form.city.trim(), neighborhood: form.neighborhood.trim(), location: form.location.trim(),
        startTime, endTime,
      })
      navigate(`/community-requests/${encodeURIComponent(request.requestId)}`)
    } catch (requestError) {
      setStatus('idle')
      setError(requestError.message)
    }
  }

  return (
    <section className="request-form">
      <Link className="back-link" to="/community-requests">← Community Requests</Link>
      <header className="request-form__intro">
        <p className="eyebrow">Request Event</p>
        <h1>Tell the community what should happen</h1>
        <p>This creates a demand request, not a published event. If enough people express interest, the organizer can review and confirm it.</p>
      </header>

      <form className="event-form" onSubmit={handleSubmit}>
        <div className="form-field"><label htmlFor="request-title">Proposed title</label><input id="request-title" value={form.title} onChange={(e) => update('title', e.target.value)} /></div>
        <div className="form-field"><label htmlFor="request-description">Description</label><textarea id="request-description" value={form.description} onChange={(e) => update('description', e.target.value)} /></div>
        <div className="form-field"><label htmlFor="request-category">Category</label><select id="request-category" value={form.category} onChange={(e) => update('category', e.target.value)}><option value="">Select category</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
        <div className="form-grid form-grid--date-time">
          <div className="form-field"><label htmlFor="request-date">Suggested date</label><input id="request-date" type="date" value={form.date} onChange={(e) => update('date', e.target.value)} /></div>
          <div className="form-field"><label htmlFor="request-start">Start time</label><input id="request-start" type="time" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} /></div>
          <div className="form-field"><label htmlFor="request-end">End time</label><input id="request-end" type="time" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} /></div>
        </div>
        <div className="form-field"><label htmlFor="request-location">Suggested venue</label><input id="request-location" value={form.location} onChange={(e) => update('location', e.target.value)} /></div>
        <div className="form-grid form-grid--location">
          <div className="form-field"><label htmlFor="request-city">City</label><input id="request-city" value={form.city} onChange={(e) => update('city', e.target.value)} /></div>
          <div className="form-field"><label htmlFor="request-neighborhood">Neighborhood</label><input id="request-neighborhood" value={form.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} /></div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Submitting…' : 'Submit Request'}</button>
      </form>
    </section>
  )
}
