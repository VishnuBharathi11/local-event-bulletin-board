import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Send } from 'lucide-react'
import CreateEventLeftPanel from '../components/events/CreateEventLeftPanel.jsx'
import CreateEventStepper from '../components/events/CreateEventStepper.jsx'
import Step01BasicInfo from '../components/events/Step01BasicInfo.jsx'
import Step02DateTime from '../components/events/Step02DateTime.jsx'
import Step03Location from '../components/events/Step03Location.jsx'
import Step04Details from '../components/events/Step04Details.jsx'
import Step05Review from '../components/events/Step05Review.jsx'
import ConflictReview from '../components/ConflictReview.jsx'
import { createEvent, continueEventCreation, getEventById, saveEvent, checkEventConflicts } from '../services/eventService.js'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/createEventMultiStep.css'

function initialForm() {
  return {
    title: '',
    description: '',
    category: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    city: '',
    neighborhood: '',
    imageUrl: null,
    latitude: null,
    longitude: null,
  }
}

export default function CreateEventPage() {
  const { eventId } = useParams()
  const isEdit = Boolean(eventId)
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [conflicts, setConflicts] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [pendingEvent, setPendingEvent] = useState(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availabilityMessage, setAvailabilityMessage] = useState(null)

  // Load existing event data if editing
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

        setForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
          location: data.location || '',
          city: data.city || '',
          neighborhood: data.neighborhood || '',
          imageUrl: data.imageUrl || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
        })
      } catch (err) {
        setServerError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isEdit, eventId, currentUser?.userId])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: null }))
    setServerError(null)
  }

  function validateStep(step) {
    const stepErrors = {}

    if (step === 1) {
      if (!form.title || !form.title.trim()) {
        stepErrors.title = 'Event title is required.'
      }
      if (!form.description || !form.description.trim()) {
        stepErrors.description = 'Event description is required.'
      }
    } else if (step === 2) {
      if (!form.date) {
        stepErrors.date = 'Event date is required.'
      }
      if (!form.startTime || !/^\d{2}:\d{2}$/.test(form.startTime)) {
        stepErrors.startTime = 'Start time is required.'
      }
      if (!form.endTime || !/^\d{2}:\d{2}$/.test(form.endTime)) {
        stepErrors.endTime = 'End time is required.'
      }

      if (form.date && form.startTime && form.endTime) {
        const [year, month, day] = form.date.split('-').map(Number)
        const [startHour, startMin] = form.startTime.split(':').map(Number)
        const [endHour, endMin] = form.endTime.split(':').map(Number)

        const startTimestamp = new Date(year, month - 1, day, startHour, startMin, 0, 0).getTime()
        const endTimestamp = new Date(year, month - 1, day, endHour, endMin, 0, 0).getTime()
        const now = Date.now()

        if (startTimestamp <= now) {
          stepErrors.startTime = 'Start time must be in the future.'
        }
        if (endTimestamp <= startTimestamp) {
          stepErrors.endTime = 'End time must be after start time.'
        }
      }
    } else if (step === 3) {
      if (!form.location || !form.location.trim()) {
        stepErrors.location = 'Venue or exact location is required.'
      }
      if (!form.city || !form.city.trim()) {
        stepErrors.city = 'City is required.'
      }
    } else if (step === 4) {
      if (!form.category) {
        stepErrors.category = 'Please select a category.'
      }
    }

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  function handleNext() {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(5, prev + 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handlePrev() {
    setCurrentStep((prev) => Math.max(1, prev - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleStepClick(targetStep) {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep)
    } else if (targetStep === currentStep + 1 && validateStep(currentStep)) {
      setCurrentStep(targetStep)
    }
  }

  async function handlePublish() {
    // Validate all required steps
    for (let step = 1; step <= 4; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step)
        return
      }
    }

    setSubmitting(true)
    setServerError(null)

    try {
      const [year, month, day] = form.date.split('-').map(Number)
      const [startHour, startMin] = form.startTime.split(':').map(Number)
      const [endHour, endMin] = form.endTime.split(':').map(Number)

      const startTime = new Date(year, month - 1, day, startHour, startMin, 0, 0).getTime()
      const endTime = new Date(year, month - 1, day, endHour, endMin, 0, 0).getTime()

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        city: form.city.trim(),
        neighborhood: form.neighborhood ? form.neighborhood.trim() : '',
        latitude: form.latitude,
        longitude: form.longitude,
        startTime,
        endTime,
        status: 'PUBLISHED',
        createdAt: Date.now(),
        expireAt: endTime,
        imageUrl: form.imageUrl,
      }

      if (isEdit) {
        await saveEvent({ ...payload, eventId })
      } else {
        await createEvent(payload)
      }
      navigate('/profile', { replace: true })
    } catch (error) {
      if (error.status === 409 && error.conflicts?.length) {
        const [year, month, day] = form.date.split('-').map(Number)
        const [startHour, startMin] = form.startTime.split(':').map(Number)
        const [endHour, endMin] = form.endTime.split(':').map(Number)
        const startTime = new Date(year, month - 1, day, startHour, startMin, 0, 0).getTime()
        const endTime = new Date(year, month - 1, day, endHour, endMin, 0, 0).getTime()

        setPendingEvent({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          location: form.location.trim(),
          city: form.city.trim(),
          neighborhood: form.neighborhood ? form.neighborhood.trim() : '',
          latitude: form.latitude,
          longitude: form.longitude,
          startTime,
          endTime,
          imageUrl: form.imageUrl,
        })
        setConflicts(error.conflicts)
        setSuggestions(error.suggestions || [])
        setAvailabilityMessage(null)
      } else {
        setServerError(error.message || 'Failed to publish event. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleContinue() {
    if (!pendingEvent) return
    setSubmitting(true)
    setServerError(null)
    try {
      await continueEventCreation(pendingEvent)
      setConflicts([])
      setPendingEvent(null)
      navigate('/profile', { replace: true })
    } catch (error) {
      setServerError(error.message)
    } finally {
      setSubmitting(false)
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
      const updatedEvent = {
        ...pendingEvent,
        startTime: alternative.startTime,
        endTime: alternative.endTime,
        location: alternative.location,
        neighborhood: alternative.neighborhood,
        city: alternative.city,
        latitude: alternative.latitude,
        longitude: alternative.longitude,
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
    const updatedEvent = {
      ...pendingEvent,
      startTime: alternative.startTime,
      endTime: alternative.endTime,
      location: alternative.location,
      neighborhood: alternative.neighborhood,
      city: alternative.city,
      latitude: alternative.latitude,
      longitude: alternative.longitude,
    }

    setConflicts([])
    setSuggestions([])
    setPendingEvent(null)
    setAvailabilityMessage(null)

    setSubmitting(true)
    try {
      if (isEdit) {
        await saveEvent({ ...updatedEvent, eventId })
      } else {
        await createEvent(updatedEvent)
      }
      navigate('/profile', { replace: true })
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancelConflict() {
    setConflicts([])
    setSuggestions([])
    setPendingEvent(null)
    setAvailabilityMessage(null)
  }

  if (loading) {
    return (
      <div className="state-card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <strong>Loading event data...</strong>
      </div>
    )
  }

  return (
    <section className="create-event-multi-page">
      <div className="create-event-grid-layout">
        {/* Left Side Information Panel */}
        <CreateEventLeftPanel currentStep={currentStep} isEdit={isEdit} />

        {/* Right Side Form Panel */}
        <main className={`create-event-panel-right ${currentStep === 3 ? 'create-event-panel-right--step3' : ''} ${currentStep === 5 ? 'create-event-panel-right--step5' : ''}`}>
          {/* 5-Step Stepper */}
          <CreateEventStepper currentStep={currentStep} onStepClick={handleStepClick} />

          {/* Current Step Form Content */}
          <div className="create-event-step-wrapper">
            {currentStep === 1 && (
              <Step01BasicInfo
                form={form}
                update={update}
                currentUser={currentUser}
                errors={errors}
              />
            )}

            {currentStep === 2 && (
              <Step02DateTime
                form={form}
                update={update}
                errors={errors}
              />
            )}

            {currentStep === 3 && (
              <Step03Location
                form={form}
                update={update}
                errors={errors}
              />
            )}

            {currentStep === 4 && (
              <Step04Details
                form={form}
                update={update}
                errors={errors}
              />
            )}

            {currentStep === 5 && (
              <Step05Review
                form={form}
                currentUser={currentUser}
                onGoToStep={(step) => setCurrentStep(step)}
              />
            )}
          </div>

          {serverError && (
            <p className="form-field-error" style={{ margin: '14px 0 0', fontSize: '13px' }} role="alert">
              {serverError}
            </p>
          )}

          {/* Footer Action Buttons matching Reference Screenshots */}
          <footer className="create-event-footer-actions">
            {currentStep === 1 ? (
              <Link to="/" className="create-event-btn-secondary create-event-btn-cancel">
                Cancel
              </Link>
            ) : (
              <button
                type="button"
                className="create-event-btn-secondary"
                onClick={handlePrev}
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                className="create-event-btn-primary"
                onClick={handleNext}
              >
                <span>Save &amp; Continue</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="create-event-btn-primary"
                onClick={handlePublish}
                disabled={submitting}
              >
                <span>{submitting ? 'Publishing…' : isEdit ? 'Update Event' : 'Publish Event'}</span>
                <Send size={15} />
              </button>
            )}
          </footer>
        </main>
      </div>

      {/* Conflict Review Modal for Scheduling Collisions */}
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
