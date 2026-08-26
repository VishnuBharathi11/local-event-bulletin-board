import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createEventRequest } from '../services/eventRequestService.js'
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

function TimePicker({
  id,
  value,
  onChange,
  disabled = false,
  minimumMinutes = 0,
  label,
}) {
  const [open, setOpen] = useState(false)

  const getInitialValues = () => {
    if (!value) {
      return {
        hour: '',
        minute: '',
        period: '',
      }
    }

    const [
      hourString,
      minuteString,
    ] = value.split(':')

    const hour24 =
      Number(hourString)

    let hour12 =
      hour24 % 12

    if (hour12 === 0) {
      hour12 = 12
    }

    return {
      hour: String(hour12),
      minute: pad(
        Number(minuteString)
      ),
      period:
        hour24 >= 12
          ? 'PM'
          : 'AM',
    }
  }

  const initialValues =
    getInitialValues()

  const [selectedHour, setSelectedHour] =
    useState(initialValues.hour)

  const [
    selectedMinute,
    setSelectedMinute,
  ] = useState(
    initialValues.minute
  )

  const [
    selectedPeriod,
    setSelectedPeriod,
  ] = useState(
    initialValues.period
  )

  useEffect(() => {
    const next =
      getInitialValues()

    setSelectedHour(
      next.hour
    )

    setSelectedMinute(
      next.minute
    )

    setSelectedPeriod(
      next.period
    )
  }, [value])

  function isPastTime(
    hour,
    minute,
    period
  ) {
    if (
      !hour ||
      minute === '' ||
      !period
    ) {
      return true
    }

    const totalMinutes =
      getTotalMinutes(
        hour,
        minute,
        period
      )

    return (
      totalMinutes <
      minimumMinutes
    )
  }

  function findFirstValidTime() {
    for (
      let hour = 1;
      hour <= 12;
      hour += 1
    ) {
      for (
        const period of ['AM', 'PM']
      ) {
        for (
          let minute = 0;
          minute < 60;
          minute += 1
        ) {
          if (
            !isPastTime(
              hour,
              minute,
              period
            )
          ) {
            return {
              hour,
              minute,
              period,
            }
          }
        }
      }
    }

    return null
  }

  function openPicker() {
    if (disabled) {
      return
    }

    if (!value) {
      const firstValid =
        findFirstValidTime()

      if (firstValid) {
        setSelectedHour(
          String(
            firstValid.hour
          )
        )

        setSelectedMinute(
          pad(
            firstValid.minute
          )
        )

        setSelectedPeriod(
          firstValid.period
        )
      }
    }

    setOpen(
      (current) => !current
    )
  }

  function handleHourChange(
    event
  ) {
    const hour =
      event.target.value

    setSelectedHour(hour)

    if (!hour) {
      return
    }

    if (
      selectedMinute !== '' &&
      selectedPeriod &&
      !isPastTime(
        Number(hour),
        Number(selectedMinute),
        selectedPeriod
      )
    ) {
      return
    }

    const periods = [
      'AM',
      'PM',
    ]

    for (
      const period of periods
    ) {
      const firstValidMinute =
        Array.from(
          { length: 60 },
          (_, minute) =>
            minute
        ).find(
          (minute) =>
            !isPastTime(
              Number(hour),
              minute,
              period
            )
        )

      if (
        firstValidMinute !==
        undefined
      ) {
        setSelectedPeriod(
          period
        )

        setSelectedMinute(
          pad(firstValidMinute)
        )

        return
      }
    }
  }

  function handleMinuteChange(
    event
  ) {
    const minute =
      Number(event.target.value)

    if (
      !selectedHour ||
      !selectedPeriod
    ) {
      return
    }

    if (
      isPastTime(
        Number(selectedHour),
        minute,
        selectedPeriod
      )
    ) {
      return
    }

    setSelectedMinute(
      pad(minute)
    )
  }

  function handlePeriodChange(
    event
  ) {
    const period =
      event.target.value

    if (
      !selectedHour ||
      selectedMinute === ''
    ) {
      setSelectedPeriod(
        period
      )

      return
    }

    if (
      isPastTime(
        Number(selectedHour),
        Number(selectedMinute),
        period
      )
    ) {
      return
    }

    setSelectedPeriod(
      period
    )
  }

  function applyTime() {
    if (
      !selectedHour ||
      selectedMinute === '' ||
      !selectedPeriod
    ) {
      return
    }

    if (
      isPastTime(
        Number(selectedHour),
        Number(selectedMinute),
        selectedPeriod
      )
    ) {
      return
    }

    const converted =
      convert12To24(
        selectedHour,
        selectedMinute,
        selectedPeriod
      )

    const time24 =
      `${pad(converted.hour)}:${pad(
        converted.minute
      )}`

    onChange(time24)

    setOpen(false)
  }

  const displayValue =
    formatDisplayTime(value)

  const hours = Array.from(
    { length: 12 },
    (_, index) =>
      index + 1
  )

  const minutes = Array.from(
    { length: 60 },
    (_, index) =>
      index
  )

  return (
    <div className="time-picker-wrapper">
      <div className="time-picker-field">
        <input
          id={id}
          type="text"
          value={displayValue}
          placeholder="--:--"
          readOnly
          disabled={disabled}
          onClick={openPicker}
          aria-label={label}
        />
      </div>

      {open && !disabled && (
        <>
          <button
            type="button"
            className="time-picker-backdrop"
            aria-label="Close time picker"
            onClick={() =>
              setOpen(false)
            }
          />

          <div className="time-picker-dropdown">
            <div className="time-picker-dropdown__header">
              <div>
                <span className="time-picker-dropdown__title">
                  Select time
                </span>

                <span className="time-picker-dropdown__subtitle">
                  12-hour format
                </span>
              </div>

              <button
                type="button"
                className="time-picker-close"
                onClick={() =>
                  setOpen(false)
                }
                aria-label="Close time picker"
              >
                ×
              </button>
            </div>

            <div className="time-picker-dropdown__content">

              {/* HOUR */}

              <div className="time-picker-column">
                <label
                  htmlFor={`${id}-hour`}
                >
                  Hour
                </label>

                <select
                  id={`${id}-hour`}
                  value={selectedHour}
                  onChange={
                    handleHourChange
                  }
                >
                  <option value="">
                    HH
                  </option>

                  {hours.map(
                    (hour) => (
                      <option
                        key={hour}
                        value={hour}
                      >
                        {pad(hour)}
                      </option>
                    )
                  )}
                </select>
              </div>

              <span className="time-picker-colon">
                :
              </span>

              {/* MINUTE */}

              <div className="time-picker-column">
                <label
                  htmlFor={`${id}-minute`}
                >
                  Minute
                </label>

                <select
                  id={`${id}-minute`}
                  value={selectedMinute}
                  disabled={
                    !selectedHour
                  }
                  onChange={
                    handleMinuteChange
                  }
                >
                  <option value="">
                    MM
                  </option>

                  {minutes.map(
                    (minute) => (
                      <option
                        key={minute}
                        value={pad(minute)}
                        disabled={
                          selectedHour &&
                          selectedPeriod
                            ? isPastTime(
                                Number(
                                  selectedHour
                                ),
                                minute,
                                selectedPeriod
                              )
                            : false
                        }
                      >
                        {pad(minute)}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* AM / PM */}

              <div className="time-picker-column">
                <label
                  htmlFor={`${id}-period`}
                >
                  Period
                </label>

                <select
                  id={`${id}-period`}
                  value={selectedPeriod}
                  disabled={
                    !selectedHour ||
                    selectedMinute === ''
                  }
                  onChange={
                    handlePeriodChange
                  }
                >
                  <option value="">
                    AM/PM
                  </option>

                  <option
                    value="AM"
                    disabled={
                      selectedHour &&
                      selectedMinute !== ''
                        ? isPastTime(
                            Number(
                              selectedHour
                            ),
                            Number(
                              selectedMinute
                            ),
                            'AM'
                          )
                        : false
                    }
                  >
                    AM
                  </option>

                  <option
                    value="PM"
                    disabled={
                      selectedHour &&
                      selectedMinute !== ''
                        ? isPastTime(
                            Number(
                              selectedHour
                            ),
                            Number(
                              selectedMinute
                            ),
                            'PM'
                          )
                        : false
                    }
                  >
                    PM
                  </option>
                </select>
              </div>
            </div>

            <p className="time-picker-help">
              Past times cannot be selected.
            </p>

            <button
              type="button"
              className="time-picker-apply"
              disabled={
                !selectedHour ||
                selectedMinute === '' ||
                !selectedPeriod
              }
              onClick={applyTime}
            >
              Done
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function CreateEventRequestPage() {
  const navigate =
    useNavigate()

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
    })

  const [status, setStatus] =
    useState('idle')

  const [error, setError] =
    useState(null)

  const [nowTick, setNowTick] =
    useState(Date.now())

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
      const request =
        await createEventRequest({
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
        })

      navigate(
        `/community-requests/${encodeURIComponent(
          request.requestId
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

  return (
    <section className="request-form">
      <Link
        className="back-link"
        to="/community-requests"
      >
        ← Community Requests
      </Link>

      <header className="request-form__intro">
        <p className="eyebrow">
          Request Event
        </p>

        <h1>
          Tell the community what should happen
        </h1>

        <p>
          This creates a demand request,
          not a published event. If enough
          people express interest, the
          organizer can review and confirm it.
        </p>
      </header>

      <form
        className="event-form"
        onSubmit={handleSubmit}
      >
        <div className="form-field">
          <label htmlFor="request-title">
            Proposed title
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
            Description
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
            Category
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

        <div className="form-grid form-grid--date-time">
          <div className="form-field">
            <label htmlFor="request-date">
              Suggested date
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
              Start time
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
              End time
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
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="request-location">
            Suggested venue
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
              City
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
              Neighborhood
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
            ? 'Submitting…'
            : 'Submit Request'}
        </button>
      </form>
    </section>
  )
}