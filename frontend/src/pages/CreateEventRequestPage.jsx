import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { createEventRequest, getEventRequestById, updateEventRequest } from '../services/eventRequestService.js'
import TimePicker from '../components/common/TimePicker.jsx'
import EventMapPicker from '../components/map/EventMapPicker.jsx'
import '../styles/communityRequests.css'

const categories = [
  'Sports',
  'Music',
  'Food',
  'Workshops',
  'Meetups',
  'Student Events',
  'Garage Sale',
  'Community',
]

function pad(value) {
  return String(value).padStart(2, '0')
}

function getTodayString() {
  const now = new Date()

  return `${now.getFullYear()}-${pad(
    now.getMonth() + 1
  )}-${pad(now.getDate())}`
}

function getCurrentMinutes() {
  const now = new Date()

  return (
    now.getHours() * 60 +
    now.getMinutes()
  )
}

function toTimestamp(date, time) {
  if (!date || !time) {
    return NaN
  }

  return new Date(
    `${date}T${time}`
  ).getTime()
}

function formatDisplayTime(time) {
  if (!time) {
    return ''
  }

  const [hourString, minuteString] =
    time.split(':')

  const hour24 = Number(hourString)

  if (
    !Number.isFinite(hour24) ||
    !Number.isFinite(Number(minuteString))
  ) {
    return ''
  }

  let hour12 = hour24 % 12

  if (hour12 === 0) {
    hour12 = 12
  }

  const period =
    hour24 >= 12 ? 'PM' : 'AM'

  return `${hour12}:${pad(
    Number(minuteString)
  )} ${period}`
}

function convert12To24(
  hour12,
  minute,
  period
) {
  let hour24 = Number(hour12)

  if (period === 'AM') {
    if (hour24 === 12) {
      hour24 = 0
    }
  } else {
    if (hour24 !== 12) {
      hour24 += 12
    }
  }

  return {
    hour: hour24,
    minute: Number(minute),
  }
}

function getTotalMinutes(
  hour,
  minute,
  period
) {
  const converted =
    convert12To24(
      hour,
      minute,
      period
    )

  return (
    converted.hour * 60 +
    converted.minute
  )
}

export default function CreateEventRequestPage() {
  const { requestId } = useParams()
  const isEdit = Boolean(requestId)
  const navigate =
    useNavigate()
  const { currentUser } = useAuth()

  const [form, setForm] =
    useState({
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
    })

  const [status, setStatus] =
    useState(isEdit ? 'loading' : 'idle')

  const [error, setError] =
    useState(null)

  const [nowTick, setNowTick] =
    useState(Date.now())

  useEffect(() => {
    if (!isEdit) return

    async function load() {
      try {
        const data = await getEventRequestById(requestId)

        // Authorization check
        if (data.organizerId !== currentUser?.userId) {
          setError('You are not authorized to edit this request.')
          setStatus('idle')
          return
        }

        const start = new Date(data.startTime)
        const end = new Date(data.endTime)

        const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
        const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`
        const endStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`

        setForm({
          title: data.title,
          description: data.description,
          category: data.category,
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
          location: data.location,
          city: data.city,
          neighborhood: data.neighborhood,
          demandThreshold: String(data.demandThreshold),
          imageUrl: data.imageUrl,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        })
        setStatus('idle')
      } catch (err) {
        setError(err.message)
        setStatus('idle')
      }
    }
    load()
  }, [isEdit, requestId, currentUser?.userId])

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setNowTick(
            Date.now()
          )
        },
        30000
      )

    return () =>
      window.clearInterval(
        timer
      )
  }, [])

  function update(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    )
  }

  function handleImageChange(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      update('imageUrl', reader.result)
    }
    reader.readAsDataURL(file)
  }

  function clearImage() {
    update('imageUrl', null)
  }

  const today = useMemo(
    () =>
      getTodayString(),
    [nowTick]
  )

  const startMinimumMinutes =
    useMemo(() => {
      if (!form.date) {
        return 0
      }

      if (
        form.date === today
      ) {
        return getCurrentMinutes()
      }

      return 0
    }, [
      form.date,
      today,
      nowTick,
    ])

  const endMinimumMinutes =
    useMemo(() => {
      let minimum = 0

      if (
        form.date === today
      ) {
        minimum =
          getCurrentMinutes()
      }

      if (form.startTime) {
        const [
          hour,
          minute,
        ] =
          form.startTime
            .split(':')
            .map(Number)

        if (
          Number.isFinite(hour) &&
          Number.isFinite(minute)
        ) {
          minimum =
            Math.max(
              minimum,
              hour * 60 +
                minute +
                1
            )
        }
      }

      return minimum
    }, [
      form.date,
      form.startTime,
      today,
      nowTick,
    ])

  function handleDateChange(
    event
  ) {
    const selectedDate =
      event.target.value

    if (
      selectedDate < today
    ) {
      return
    }

    setForm(
      (current) => ({
        ...current,
        date: selectedDate,
        startTime: '',
        endTime: '',
      })
    )
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    setError(null)

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.category ||
      !form.city.trim()
    ) {
      setError(
        'Title, description, category, and city are required.'
      )

      return
    }

    const threshold = parseInt(form.demandThreshold, 10)
    if (!Number.isInteger(threshold) || threshold <= 0) {
      setError('Please enter a valid positive number for minimum required participants.')
      return
    }

    if (!form.date) {
      setError(
        'Please select a suggested date.'
      )

      return
    }

    if (
      form.date < today
    ) {
      setError(
        'Past dates cannot be selected.'
      )

      return
    }

    const startTimestamp =
      toTimestamp(
        form.date,
        form.startTime
      )

    const endTimestamp =
      toTimestamp(
        form.date,
        form.endTime
      )

    if (
      !Number.isFinite(
        startTimestamp
      ) ||
      !Number.isFinite(
        endTimestamp
      )
    ) {
      setError(
        'Please select both start and end times.'
      )

      return
    }

    if (
      startTimestamp <=
      Date.now()
    ) {
      setError(
        'Start time must be in the future.'
      )

      return
    }

    if (
      endTimestamp <=
      startTimestamp
    ) {
      setError(
        'End time must be after start time.'
      )

      return
    }

    if (
      endTimestamp <=
      Date.now()
    ) {
      setError(
        'End time must be in the future.'
      )

      return
    }

    setStatus('saving')

    try {
      const payload = {
        title:
          form.title.trim(),

        description:
          form.description.trim(),

        category:
          form.category,

        city:
          form.city.trim(),

        neighborhood:
          form.neighborhood.trim(),

        location:
          form.location.trim(),

        startTime:
          startTimestamp,

        endTime:
          endTimestamp,

        demandThreshold:
          parseInt(form.demandThreshold, 10) || 0,

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

      navigate(
        `/community-requests/${encodeURIComponent(
          result.requestId
        )}`
      )
    } catch (
      requestError
    ) {
      setStatus('idle')

      setError(
        requestError.message
      )
    }
  }

  if (status === 'loading') {
    return (
      <div className="state-card">
        <strong>Loading request data...</strong>
      </div>
    )
  }

  return (
    <section className="request-form">
      <Link
        className="back-link"
        to={isEdit ? '/profile' : '/community-requests'}
      >
        ← {isEdit ? 'Back to Profile' : 'Community Requests'}
      </Link>

      <header className="request-form__intro">
        <p className="eyebrow">
          {isEdit ? 'Edit Request' : 'Request Event'}
        </p>

        <h1>
          {isEdit ? 'Update your community request' : 'Tell the community what should happen'}
        </h1>

        <p>
          {isEdit
            ? 'Refine the details of your event request. Changes will be reflected immediately.'
            : 'This creates a demand request, not a published event. If enough people express interest, the organizer can review and confirm it.'
          }
        </p>
      </header>

      <form
        className="event-form"
        onSubmit={handleSubmit}
      >
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="user-name">
              Name
            </label>

            <input
              id="user-name"
              value={currentUser?.name || ''}
              readOnly
              className="input--readonly"
            />
          </div>

          <div className="form-field">
            <label htmlFor="user-email">
              Email
            </label>

            <input
              id="user-email"
              value={currentUser?.email || ''}
              readOnly
              className="input--readonly"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="request-title">
            Proposed title <span className="required-star">*</span>
          </label>

          <input
            id="request-title"
            value={form.title}
            onChange={(event) =>
              update(
                'title',
                event.target.value
              )
            }
          />
        </div>

        <div className="form-field">
          <label htmlFor="request-description">
            Description <span className="required-star">*</span>
          </label>

          <textarea
            id="request-description"
            value={
              form.description
            }
            onChange={(event) =>
              update(
                'description',
                event.target.value
              )
            }
          />
        </div>

        <div className="form-field">
          <label htmlFor="request-category">
            Category <span className="required-star">*</span>
          </label>

          <select
            id="request-category"
            value={form.category}
            onChange={(event) =>
              update(
                'category',
                event.target.value
              )
            }
          >
            <option value="">
              Select category
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              )
            )}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="request-min-participants">
            Minimum required participants <span className="required-star">*</span>
          </label>

          <input
            id="request-min-participants"
            type="number"
            min="1"
            value={form.demandThreshold}
            onChange={(event) =>
              update(
                'demandThreshold',
                event.target.value
              )
            }
            placeholder="Enter minimum number of people"
          />
        </div>

        <div className="form-grid form-grid--date-time">
          <div className="form-field">
            <label htmlFor="request-date">
              Suggested date <span className="required-star">*</span>
            </label>

            <input
              id="request-date"
              type="date"
              min={today}
              value={form.date}
              onChange={
                handleDateChange
              }
            />
          </div>

          <div className="form-field">
            <label htmlFor="request-start">
              Start time <span className="required-star">*</span>
            </label>

            <TimePicker
              id="request-start"
              label="start time"
              value={
                form.startTime
              }
              onChange={(value) =>
                update(
                  'startTime',
                  value
                )
              }
              minimumMinutes={
                startMinimumMinutes
              }
              disabled={
                !form.date
              }
            />
          </div>

          <div className="form-field">
            <label htmlFor="request-end">
              End time <span className="required-star">*</span>
            </label>

            <TimePicker
              id="request-end"
              label="end time"
              value={
                form.endTime
              }
              onChange={(value) =>
                update(
                  'endTime',
                  value
                )
              }
              minimumMinutes={
                endMinimumMinutes
              }
              disabled={
                !form.date ||
                !form.startTime
              }
              align="right"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="request-image">
            Event Image <span className="required-star">*</span>
          </label>

          <div className="image-upload">
            {!form.imageUrl ? (
              <label htmlFor="request-image" className="image-upload__label">
                <input
                  id="request-image"
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
                  <strong>Click to upload image</strong>
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

        <div className="form-field">
          <label htmlFor="request-location">
            Suggested venue <span className="required-star">*</span>
          </label>

          <input
            id="request-location"
            value={
              form.location
            }
            onChange={(event) =>
              update(
                'location',
                event.target.value
              )
            }
          />
        </div>

        <div className="form-grid form-grid--location">
          <div className="form-field">
            <label htmlFor="request-city">
              City <span className="required-star">*</span>
            </label>

            <input
              id="request-city"
              value={form.city}
              onChange={(event) =>
                update(
                  'city',
                  event.target.value
                )
              }
            />
          </div>

          <div className="form-field">
            <label htmlFor="request-neighborhood">
              Neighborhood <span className="required-star">*</span>
            </label>

            <input
              id="request-neighborhood"
              value={
                form.neighborhood
              }
              onChange={(event) =>
                update(
                  'neighborhood',
                  event.target.value
                )
              }
            />
          </div>
        </div>

        <div className="form-field" style={{ marginTop: '16px' }}>
          <label>Suggested Location on Map</label>
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
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Selecting a map location helps others find your request.
            </p>
          )}
        </div>

        {error && (
          <p
            className="form-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={
            status === 'saving'
          }
        >
          {status === 'saving'
            ? (isEdit ? 'Updating…' : 'Submitting…')
            : (isEdit ? 'Update Request' : 'Submit Request')}
        </button>
      </form>
    </section>
  )
}