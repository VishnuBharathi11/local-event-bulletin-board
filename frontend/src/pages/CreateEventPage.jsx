import createEventHero from '../assets/create-event-hero.jpeg'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EventForm from '../components/events/EventForm.jsx'
import ConflictReview from '../components/ConflictReview.jsx'
import { createEvent, continueEventCreation, getEventById, saveEvent } from '../services/eventService.js'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/createEvent.css'

export default function CreateEventPage() {
  const { eventId } = useParams()
  const isEdit = Boolean(eventId)
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [loading, setLoading] = useState(isEdit)
  const [initialData, setInitialData] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [conflicts, setConflicts] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [pendingEvent, setPendingEvent] = useState(null)
  const [continuing, setContinuing] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availabilityMessage, setAvailabilityMessage] = useState(null)

  useEffect(() => {
    if (!isEdit) return

    async function load() {
      try {
        const data = await getEventById(eventId)

        // Authorization check
        if (data.organizerId !== currentUser?.userId) {
          setServerError('You are not authorized to edit this event.')
          setLoading(false)
          return
        }

        // Check 2-hour rule
        const twoHoursInMs = 2 * 60 * 60 * 1000
        if (data.startTime - Date.now() < twoHoursInMs) {
          setServerError('Events cannot be edited less than 2 hours before the start time.')
          setLoading(false)
          return
        }

        const start = new Date(data.startTime)
        const end = new Date(data.endTime)

        const pad = (v) => String(v).padStart(2, '0')
        const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
        const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`
        const endStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`

        setInitialData({
          ...data,
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
        })
      } catch (err) {
        setServerError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isEdit, eventId, currentUser?.userId])

  async function handleCreate(event) {
    setSubmitting(true)
    setServerError(null)
    try {
      if (isEdit) {
        await saveEvent({ ...event, eventId })
      } else {
        await createEvent(event)
      }
      navigate('/profile', { replace: true })
    } catch (error) {
      if (error.status === 409 && error.conflicts?.length) {
        setPendingEvent(event)
        setConflicts(error.conflicts)
        setSuggestions(error.suggestions || [])
        setAvailabilityMessage(null)
      } else {
        setServerError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleContinue() {
    if (!pendingEvent) return
    setContinuing(true)
    setServerError(null)
    try {
      await continueEventCreation(pendingEvent)
      setConflicts([])
      setPendingEvent(null)
      navigate('/profile', { replace: true })
    } catch (error) {
      setServerError(error.message)
    } finally {
      setContinuing(false)
    }
  }

  async function handleCheckAvailability(alternative, clearOnly = false) {
    if (clearOnly) {
      setAvailabilityMessage(null)
      return
    }
    setCheckingAvailability(true)
    setAvailabilityMessage(null)
    try {
      // Create a copy of the pending event with the new alternative details
      const updatedEvent = {
        ...pendingEvent,
        startTime: alternative.startTime,
        endTime: alternative.endTime,
        location: alternative.location,
        neighborhood: alternative.neighborhood,
        city: alternative.city,
        latitude: alternative.latitude,
        longitude: alternative.longitude
      }

      const response = await checkEventConflicts(updatedEvent)
      if (response.conflicts?.length === 0) {
        setAvailabilityMessage('✓ No scheduling conflict found')
      } else {
        setConflicts(response.conflicts)
        setSuggestions(response.suggestions || [])
        setAvailabilityMessage(null)
      }
    } catch (error) {
      setServerError(error.message)
    } finally {
      setCheckingAvailability(false)
    }
  }

  async function handleConfirmAlternative(alternative) {
    // Update the form data conceptually by creating the event with these details
    const updatedEvent = {
      ...pendingEvent,
      startTime: alternative.startTime,
      endTime: alternative.endTime,
      location: alternative.location,
      neighborhood: alternative.neighborhood,
      city: alternative.city,
      latitude: alternative.latitude,
      longitude: alternative.longitude
    }

    // Clear conflict state before proceeding
    setConflicts([])
    setSuggestions([])
    setPendingEvent(null)
    setAvailabilityMessage(null)

    // Call handleCreate with the updated event details
    await handleCreate(updatedEvent)
  }

  function handleCancelConflict() {
    setConflicts([])
    setSuggestions([])
    setPendingEvent(null)
    setAvailabilityMessage(null)
  }

  if (loading) {
    return (
      <div className="state-card">
        <strong>Loading event data...</strong>
      </div>
    )
  }

  return (
    <section className="event-page create-event-page">
      <div className="create-event-layout">
        {/* LEFT COLUMN: VISUAL INTRO */}
        <div className="create-event-layout__visual">
          <div className="create-event-visual__top">
            <Link className="back-link" to="/">← Back to Event Board</Link>
            <div className="create-event-visual__content" style={{ marginTop: '24px' }}>
              <p className="eyebrow">{isEdit ? 'Edit event' : 'New event'}</p>
              <h1 style={{ marginTop: '8px' }}>{isEdit ? 'Edit Event' : 'Create New Event'}</h1>
              <p className="create-event-description">
                {isEdit
                  ? 'Update the details of your event. Changes will be reflected immediately.'
                  : 'Publish a local event with the date, time, location, category, and description attendees need.'
                }
              </p>
            </div>
          </div>
          <div className="create-event-visual__image">
            <img src={createEventHero} alt="" />
          </div>
        </div>

        {/* RIGHT COLUMN: FORM CARD */}
        <div className="create-event-layout__form">
          <EventForm
            onSubmit={handleCreate}
            submitting={submitting}
            serverError={serverError}
            initialData={initialData}
          />
        </div>
      </div>
      {conflicts.length > 0 && (
        <ConflictReview
          conflicts={conflicts}
          suggestions={suggestions}
          onCancel={handleCancelConflict}
          onCheckAvailability={handleCheckAvailability}
          onConfirm={handleConfirmAlternative}
          checking={checkingAvailability}
          continuing={submitting}
          availabilityMessage={availabilityMessage}
        />
      )}
    </section>
  )
}
