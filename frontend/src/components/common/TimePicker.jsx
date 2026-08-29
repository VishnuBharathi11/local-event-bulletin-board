import { useEffect, useRef, useState } from 'react'
import '../../styles/communityRequests.css'

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDisplayTime(time) {
  if (!time) {
    return ''
  }

  const [hourString, minuteString] = time.split(':')
  const hour24 = Number(hourString)

  if (!Number.isFinite(hour24) || !Number.isFinite(Number(minuteString))) {
    return ''
  }

  let hour12 = hour24 % 12
  if (hour12 === 0) {
    hour12 = 12
  }

  const period = hour24 >= 12 ? 'PM' : 'AM'
  return `${pad(hour12)}:${pad(Number(minuteString))} ${period}`
}

function convert12To24(hour12, minute, period) {
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

function getTotalMinutes(hour, minute, period) {
  const converted = convert12To24(hour, minute, period)
  return converted.hour * 60 + converted.minute
}

const ITEM_HEIGHT = 34
const CONTAINER_HEIGHT = 126
const SPACER_HEIGHT = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2 // 46px

function WheelColumn({ items, selectedValue, onSelect }) {
  const containerRef = useRef(null)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef(null)

  // Scroll to selected value on mount, open, or when selection changes externally
  useEffect(() => {
    if (isUserScrollingRef.current) return
    const index = items.findIndex((item) => String(item.value) === String(selectedValue))
    if (index !== -1 && containerRef.current) {
      const targetScroll = index * ITEM_HEIGHT
      const applyScroll = () => {
        if (containerRef.current) {
          containerRef.current.scrollTop = targetScroll
        }
      }
      applyScroll()
      const frameId = requestAnimationFrame(applyScroll)
      const timerId = setTimeout(applyScroll, 30)
      return () => {
        cancelAnimationFrame(frameId)
        clearTimeout(timerId)
      }
    }
  }, [selectedValue, items])

  const handleScroll = (e) => {
    isUserScrollingRef.current = true
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    const scrollTop = e.currentTarget.scrollTop
    const targetIndex = Math.round(scrollTop / ITEM_HEIGHT)
    const clampedIndex = Math.max(0, Math.min(items.length - 1, targetIndex))
    const targetItem = items[clampedIndex]

    if (targetItem) {
      if (String(targetItem.value) !== String(selectedValue)) {
        onSelect(targetItem.value)
      }
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
    }, 80)
  }

  const handleClick = (item, index) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth',
      })
    }
    onSelect(item.value)
  }

  const selectedIndex = items.findIndex((item) => String(item.value) === String(selectedValue))

  return (
    <div
      className="time-picker-wheel__column"
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: `${CONTAINER_HEIGHT}px` }}
    >
      <div style={{ height: `${SPACER_HEIGHT}px`, flexShrink: 0 }} aria-hidden="true" />
      {items.map((item, index) => {
        const isSelected = String(item.value) === String(selectedValue)
        const distance = selectedIndex !== -1 ? Math.abs(index - selectedIndex) : 99

        let distanceClass = 'time-picker-wheel__item--far'
        if (distance === 0) {
          distanceClass = 'time-picker-wheel__item--selected'
        } else if (distance === 1) {
          distanceClass = 'time-picker-wheel__item--neighbor'
        }

        return (
          <button
            key={item.value}
            type="button"
            className={`time-picker-wheel__item ${distanceClass}`}
            style={{ height: `${ITEM_HEIGHT}px` }}
            onClick={() => handleClick(item, index)}
          >
            {item.label}
          </button>
        )
      })}
      <div style={{ height: `${SPACER_HEIGHT}px`, flexShrink: 0 }} aria-hidden="true" />
    </div>
  )
}

export default function TimePicker({
  id,
  value,
  onChange,
  disabled = false,
  minimumMinutes = 0,
  date,
  label,
  align = 'left',
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  const getInitialValues = (val) => {
    if (!val) {
      return {
        hour: '',
        minute: '',
        period: '',
      }
    }

    const [hourString, minuteString] = val.split(':')
    const hour24 = Number(hourString)
    let hour12 = hour24 % 12
    if (hour12 === 0) {
      hour12 = 12
    }

    return {
      hour: pad(hour12),
      minute: pad(Number(minuteString)),
      period: hour24 >= 12 ? 'PM' : 'AM',
    }
  }

  const initialValues = getInitialValues(value)
  const [selectedHour, setSelectedHour] = useState(initialValues.hour)
  const [selectedMinute, setSelectedMinute] = useState(initialValues.minute)
  const [selectedPeriod, setSelectedPeriod] = useState(initialValues.period)

  useEffect(() => {
    const next = getInitialValues(value)
    setSelectedHour(next.hour)
    setSelectedMinute(next.minute)
    setSelectedPeriod(next.period)
  }, [value])

  // Close when clicking outside without blocking wheel or scroll events
  useEffect(() => {
    if (!open) return undefined
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [open])

  function isPastTime(hour, minute, period) {
    if (!hour || minute === '' || !period) {
      return true
    }

    const converted = convert12To24(hour, minute, period)
    const selectedTotalMinutes = converted.hour * 60 + converted.minute

    // Current local time
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
    const currentDay = String(now.getDate()).padStart(2, '0')
    const todayStr = `${currentYear}-${currentMonth}-${currentDay}`
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    if (date) {
      if (date < todayStr) {
        return true // yesterday or older
      }
      if (date === todayStr) {
        // Selected time exactly equal or in past relative to current local time -> invalid
        if (selectedTotalMinutes <= currentMinutes) {
          return true
        }
      }
    } else if (minimumMinutes > 0) {
      if (selectedTotalMinutes <= minimumMinutes) {
        return true
      }
    }

    // Check minimumMinutes constraint (e.g. End Time > Start Time)
    if (minimumMinutes && selectedTotalMinutes < minimumMinutes) {
      return true
    }

    return false
  }

  function emitTimeChange(hour, minute, period) {
    if (!hour || minute === '' || !period) return
    if (isPastTime(hour, minute, period)) return
    const converted = convert12To24(hour, minute, period)
    const time24 = `${pad(converted.hour)}:${pad(converted.minute)}`
    onChange(time24)
  }

  function findFirstValidTime() {
    for (const hour of ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']) {
      for (const period of ['AM', 'PM']) {
        for (let minute = 0; minute < 60; minute += 1) {
          if (!isPastTime(hour, pad(minute), period)) {
            return {
              hour,
              minute: pad(minute),
              period,
            }
          }
        }
      }
    }
    return { hour: '12', minute: '00', period: 'PM' }
  }

  function openPicker() {
    if (disabled) {
      return
    }

    if (!value) {
      const firstValid = findFirstValidTime()
      setSelectedHour(firstValid.hour)
      setSelectedMinute(firstValid.minute)
      setSelectedPeriod(firstValid.period)
    }

    setOpen(true)
  }

  function handleHourSelect(hour) {
    setSelectedHour(hour)
    const currentMinute = selectedMinute !== '' ? selectedMinute : '00'
    const currentPeriod = selectedPeriod || 'AM'
    emitTimeChange(hour, currentMinute, currentPeriod)
  }

  function handleMinuteSelect(minute) {
    setSelectedMinute(minute)
    const currentHour = selectedHour || '12'
    const currentPeriod = selectedPeriod || 'PM'
    emitTimeChange(currentHour, minute, currentPeriod)
  }

  function handlePeriodSelect(period) {
    setSelectedPeriod(period)
    const currentHour = selectedHour || '12'
    const currentMinute = selectedMinute !== '' ? selectedMinute : '00'
    emitTimeChange(currentHour, currentMinute, period)
  }

  function applyTime() {
    const hour = selectedHour || '12'
    const minute = selectedMinute !== '' ? selectedMinute : '00'
    const period = selectedPeriod || 'PM'

    if (isPastTime(hour, minute, period)) {
      return
    }

    const converted = convert12To24(hour, minute, period)
    const time24 = `${pad(converted.hour)}:${pad(converted.minute)}`
    onChange(time24)
    setOpen(false)
  }

  const isDoneDisabled = isPastTime(selectedHour, selectedMinute, selectedPeriod)
  const displayValue = formatDisplayTime(value)

  const hourItems = [
    '12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'
  ].map((h) => ({ value: h, label: h }))

  const minuteItems = Array.from({ length: 60 }, (_, index) => {
    const m = pad(index)
    return { value: m, label: m }
  })

  const periodItems = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' },
  ]

  return (
    <div className="time-picker-wrapper" ref={wrapperRef}>
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
        <div className={`time-picker-dropdown time-picker-dropdown--${align}`}>
          <div className="time-picker-dropdown__header">
            <div>
              <span className="time-picker-dropdown__title">Select time</span>
              <span className="time-picker-dropdown__subtitle">12-hour format</span>
            </div>

            <button
              type="button"
              className="time-picker-close"
              onClick={() => setOpen(false)}
              aria-label="Close time picker"
            >
              ×
            </button>
          </div>

          <div className="time-picker-wheel__headers">
            <span className="time-picker-wheel__header">Hour</span>
            <span aria-hidden="true" />
            <span className="time-picker-wheel__header">Minute</span>
            <span className="time-picker-wheel__header">Period</span>
          </div>

          <div className="time-picker-wheel__container">
            {/* ONE continuous horizontal fixed selection band */}
            <div className="time-picker-wheel__highlight" aria-hidden="true" />

            {/* Hour Wheel */}
            <WheelColumn
              items={hourItems}
              selectedValue={selectedHour}
              onSelect={handleHourSelect}
            />

            {/* Fixed Centered Colon */}
            <span className="time-picker-wheel__colon">:</span>

            {/* Minute Wheel */}
            <WheelColumn
              items={minuteItems}
              selectedValue={selectedMinute}
              onSelect={handleMinuteSelect}
            />

            {/* Period Wheel */}
            <WheelColumn
              items={periodItems}
              selectedValue={selectedPeriod}
              onSelect={handlePeriodSelect}
            />
          </div>

          <p className="time-picker-help">Past times cannot be selected.</p>

          <button
            type="button"
            className="time-picker-apply"
            disabled={isDoneDisabled}
            onClick={applyTime}
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
