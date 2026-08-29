import { useMemo } from 'react'
import { Calendar } from 'lucide-react'
import TimePicker from '../common/TimePicker.jsx'

export default function Step02DateTime({ form, update, errors = {} }) {
  const today = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [])

  const getCurrentMinutes = () => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  }

  const startMinimumMinutes = useMemo(() => {
    if (!form.date) return 0
    if (form.date === today) return getCurrentMinutes()
    return 0
  }, [form.date, today])

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
  }, [form.date, form.startTime, today])

  return (
    <div className="create-step-content" role="region" aria-labelledby="step2-title">
      <div className="create-step-header">
        <div className="create-step-header__title-row">
          <Calendar size={22} className="create-step-header__icon" />
          <h2 id="step2-title" className="create-step-title">Date &amp; Time</h2>
        </div>
        <p className="create-step-desc">Choose when the event starts and ends. The existing local-time behavior is preserved.</p>
      </div>

      <div className="create-step-form">
        <div className="form-row-3">
          <div className="form-group">
            <label htmlFor="event-date">
              Event Date <span className="required-star">*</span>
            </label>
            <input
              id="event-date"
              type="date"
              min={today}
              value={form.date || ''}
              onChange={(e) => update('date', e.target.value)}
              className={`form-input ${errors.date ? 'form-input--error' : ''}`}
            />
            {errors.date && <span className="form-field-error">{errors.date}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="event-start">
              Start Time <span className="required-star">*</span>
            </label>
            <TimePicker
              id="event-start"
              label="start time"
              value={form.startTime || ''}
              onChange={(val) => update('startTime', val)}
              minimumMinutes={startMinimumMinutes}
              disabled={!form.date}
              date={form.date}
            />
            {errors.startTime && <span className="form-field-error">{errors.startTime}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="event-end">
              End Time <span className="required-star">*</span>
            </label>
            <TimePicker
              id="event-end"
              label="end time"
              value={form.endTime || ''}
              onChange={(val) => update('endTime', val)}
              minimumMinutes={endMinimumMinutes}
              disabled={!form.date || !form.startTime}
              align="right"
              date={form.date}
            />
            {errors.endTime && <span className="form-field-error">{errors.endTime}</span>}
          </div>
        </div>

        {/* Informative Note Box */}
        <div className="create-step-note-box">
          <div className="create-step-note-icon">
            <Calendar size={18} />
          </div>
          <div className="create-step-note-text">
            <strong>Note:</strong> Event times will be displayed in the viewer's local time.
          </div>
        </div>
      </div>
    </div>
  )
}
