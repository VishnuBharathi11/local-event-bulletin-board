import { useEffect, useState } from 'react'

function pad(value) {
  return String(value).padStart(2, '0')
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

export default function TimePicker({
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
