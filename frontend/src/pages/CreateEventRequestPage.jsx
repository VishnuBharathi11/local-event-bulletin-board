import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Send } from 'lucide-react'
import CreateEventRequestLeftPanel from '../components/events/CreateEventRequestLeftPanel.jsx'
import CreateEventStepper from '../components/events/CreateEventStepper.jsx'
import RequestStep01BasicInfo from '../components/events/RequestStep01BasicInfo.jsx'
import RequestStep02DateTime from '../components/events/RequestStep02DateTime.jsx'
import RequestStep03Location from '../components/events/RequestStep03Location.jsx'
import RequestStep04Details from '../components/events/RequestStep04Details.jsx'
import RequestStep05Review from '../components/events/RequestStep05Review.jsx'
import {
  createEventRequest,
  getEventRequestById,
  updateEventRequest
} from '../services/eventRequestService.js'
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
    demandThreshold: '',
    imageUrl: null,
    latitude: null,
    longitude: null,
  }
}

function pad(value) {
  return String(value).padStart(2, '0')
}

export default function CreateEventRequestPage() {
  const { requestId } = useParams()
  const isEdit = Boolean(requestId)
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)

  // Load existing request data if editing
  useEffect(() => {
    if (!isEdit) return

    async function load() {
      try {
        const data = await getEventRequestById(requestId)

        // Authorization check
        if (data.organizerId !== currentUser?.userId) {
          setServerError('You are not authorized to edit this request.')
          setLoading(false)
          return
        }

        const start = new Date(data.startTime)
        const end = new Date(data.endTime)

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
          demandThreshold: String(data.demandThreshold || ''),
          imageUrl: data.imageUrl || null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        })
      } catch (err) {
        setServerError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isEdit, requestId, currentUser?.userId])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: null }))
    setServerError(null)
  }

  function validateStep(step) {
    const stepErrors = {}

    if (step === 1) {
      if (!form.title || !form.title.trim()) {
        stepErrors.title = 'Proposed title is required.'
      }
      if (!form.description || !form.description.trim()) {
        stepErrors.description = 'Description is required.'
      }
    } else if (step === 2) {
      const now = new Date()
      const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

      if (!form.date) {
        stepErrors.date = 'Suggested date is required.'
      } else if (form.date < today) {
        stepErrors.date = 'Past dates cannot be selected.'
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
        const nowTs = Date.now()

        if (startTimestamp <= nowTs) {
          stepErrors.startTime = 'Start time must be in the future.'
        }
        if (endTimestamp <= startTimestamp) {
          stepErrors.endTime = 'End time must be after start time.'
        }
      }
    } else if (step === 3) {
      if (!form.location || !form.location.trim()) {
        stepErrors.location = 'Venue or location is required.'
      }
      if (!form.city || !form.city.trim()) {
        stepErrors.city = 'City is required.'
      }
    } else if (step === 4) {
      if (!form.category) {
        stepErrors.category = 'Please select a category.'
      }
      const threshold = parseInt(form.demandThreshold, 10)
      if (!Number.isInteger(threshold) || threshold <= 0) {
        stepErrors.demandThreshold = 'Please enter a valid positive number for support target.'
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

  async function handleSubmit() {
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
        city: form.city.trim(),
        neighborhood: form.neighborhood ? form.neighborhood.trim() : '',
        location: form.location.trim(),
        startTime,
        endTime,
        demandThreshold: parseInt(form.demandThreshold, 10) || 0,
        imageUrl: form.imageUrl,
        latitude: form.latitude,
        longitude: form.longitude,
      }

      let result
      if (isEdit) {
        result = await updateEventRequest(requestId, payload)
      } else {
        result = await createEventRequest(payload)
      }

      navigate(`/community-requests/${encodeURIComponent(result.requestId)}`, { replace: true })
    } catch (error) {
      setServerError(error.message || 'Failed to submit event request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="state-card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <strong>Loading request data...</strong>
      </div>
    )
  }

  return (
    <section className="create-event-multi-page">
      <div className="create-event-grid-layout">
        {/* Left Side Information Panel */}
        <CreateEventRequestLeftPanel currentStep={currentStep} isEdit={isEdit} />

        {/* Right Side 5-Step Form Panel */}
        <main className={`create-event-panel-right ${currentStep === 3 ? 'create-event-panel-right--step3' : ''} ${currentStep === 4 ? 'create-event-panel-right--step4' : ''} ${currentStep === 5 ? 'create-event-panel-right--step5' : ''}`}>
          {/* 5-Step Stepper */}
          <CreateEventStepper currentStep={currentStep} onStepClick={handleStepClick} />

          {/* Current Step Form Content */}
          <div className="create-event-step-wrapper">
            {currentStep === 1 && (
              <RequestStep01BasicInfo
                form={form}
                update={update}
                currentUser={currentUser}
                errors={errors}
              />
            )}

            {currentStep === 2 && (
              <RequestStep02DateTime
                form={form}
                update={update}
                errors={errors}
              />
            )}

            {currentStep === 3 && (
              <RequestStep03Location
                form={form}
                update={update}
                errors={errors}
              />
            )}

            {currentStep === 4 && (
              <RequestStep04Details
                form={form}
                update={update}
                errors={errors}
              />
            )}

            {currentStep === 5 && (
              <RequestStep05Review
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

          {/* Footer Action Buttons */}
          <footer className="create-event-footer-actions">
            {currentStep === 1 ? (
              <Link
                to={isEdit ? '/profile' : '/community-requests'}
                className="create-event-btn-secondary create-event-btn-cancel"
              >
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
                onClick={handleSubmit}
                disabled={submitting}
              >
                <span>{submitting ? 'Submitting…' : isEdit ? 'Update Request' : 'Submit Request'}</span>
                <Send size={15} />
              </button>
            )}
          </footer>
        </main>
      </div>
    </section>
  )
}