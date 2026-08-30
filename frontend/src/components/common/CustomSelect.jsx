import { useEffect, useRef, useState } from 'react'
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  CalendarDays,
  CalendarRange,
  ArrowUpDown,
  Flame,
  ArrowDownAZ,
  Activity,
  Music,
  Utensils,
  GraduationCap,
  Users,
  School,
  Tag,
  Heart,
  Grid,
  ChevronDown,
  Check,
  Crosshair,
  Globe
} from 'lucide-react'
import '../../styles/customSelect.css'

/**
 * Returns a fitting Lucide icon based on the option label or value.
 */
export function getOptionIcon(value, label = '', type = 'auto') {
  const text = String(label || value || '').toLowerCase().trim()

  // 1. Explicit Category mappings
  if (text === 'sports') return <Activity size={17} strokeWidth={2.2} />
  if (text === 'music') return <Music size={17} strokeWidth={2.2} />
  if (text === 'food') return <Utensils size={17} strokeWidth={2.2} />
  if (text === 'workshops' || text.includes('workshop')) return <GraduationCap size={17} strokeWidth={2.2} />
  if (text === 'meetups' || text.includes('meetup') || text === 'socials') return <Users size={17} strokeWidth={2.2} />
  if (text === 'student events' || text.includes('student')) return <School size={17} strokeWidth={2.2} />
  if (text === 'garage sale' || text.includes('garage') || text.includes('flea')) return <Tag size={17} strokeWidth={2.2} />
  if (text === 'community' || text.includes('community')) return <Heart size={17} strokeWidth={2.2} />

  // 2. Date / View mappings
  if (text === 'all events' || text === 'all upcoming' || text.includes('upcoming')) return <Calendar size={17} strokeWidth={2.2} />
  if (text === 'today') return <Clock size={17} strokeWidth={2.2} />
  if (text === 'tomorrow') return <CalendarDays size={17} strokeWidth={2.2} />
  if (text === 'this weekend' || text.includes('weekend')) return <CalendarRange size={17} strokeWidth={2.2} />
  if (text.includes('this week') || text.includes('this month')) return <CalendarDays size={17} strokeWidth={2.2} />

  // 3. Radius / Distance mappings
  if (text.includes('km') || text.includes('miles') || text.includes('mi') || type === 'radius') {
    if (text === 'all') return <Globe size={17} strokeWidth={2.2} />
    return <Crosshair size={17} strokeWidth={2.2} />
  }

  // 4. Sort mappings
  if (text.includes('soonest') || text.includes('date')) return <ArrowUpDown size={17} strokeWidth={2.2} />
  if (text.includes('popular') || text.includes('trending') || text.includes('rsvp')) return <Flame size={17} strokeWidth={2.2} />
  if (text.includes('a-z') || text.includes('alphabetical') || text.includes('title')) return <ArrowDownAZ size={17} strokeWidth={2.2} />

  // 5. City / Location / Default mappings
  if (text === 'all' || text === '') {
    if (type === 'city') return <Building2 size={17} strokeWidth={2.2} />
    if (type === 'date' || type === 'view') return <Calendar size={17} strokeWidth={2.2} />
    if (type === 'category') return <Grid size={17} strokeWidth={2.2} />
    if (type === 'radius') return <Globe size={17} strokeWidth={2.2} />
    return <Building2 size={17} strokeWidth={2.2} />
  }

  // Fallback for location names
  if (type === 'city' || type === 'location' || !type || type === 'auto') {
    return <MapPin size={17} strokeWidth={2.2} />
  }

  return <Grid size={17} strokeWidth={2.2} />
}

export default function CustomSelect({
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  iconType = 'auto',
  className = '',
  disabled = false,
  error = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Normalize options to [{ value, label, icon }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: opt.label || opt.value,
        icon: opt.icon || getOptionIcon(opt.value, opt.label, iconType),
      }
    }
    return {
      value: opt,
      label: opt || placeholder,
      icon: getOptionIcon(opt, opt, iconType),
    }
  })

  const selectedOption = normalizedOptions.find((opt) => opt.value === value) || {
    value,
    label: value || placeholder,
    icon: getOptionIcon(value, value || placeholder, iconType),
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = (event) => {
    if (disabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen((prev) => !prev)
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    } else if (event.key === 'ArrowDown' && isOpen) {
      event.preventDefault()
      const currentIndex = normalizedOptions.findIndex((opt) => opt.value === value)
      if (currentIndex < normalizedOptions.length - 1) {
        onChange(normalizedOptions[currentIndex + 1].value)
      }
    } else if (event.key === 'ArrowUp' && isOpen) {
      event.preventDefault()
      const currentIndex = normalizedOptions.findIndex((opt) => opt.value === value)
      if (currentIndex > 0) {
        onChange(normalizedOptions[currentIndex - 1].value)
      }
    }
  }

  const handleSelect = (optValue) => {
    onChange(optValue)
    setIsOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${isOpen ? 'custom-select-container--open' : ''} ${
        disabled ? 'custom-select-container--disabled' : ''
      } ${error ? 'custom-select-container--error' : ''} ${className}`}
    >
      {/* Hidden native select for form submissions and screen readers */}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="custom-select-native"
        tabIndex={-1}
        aria-hidden="true"
      >
        {normalizedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Visible Styled Trigger Button */}
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={id ? `${id}-label` : undefined}
      >
        <div className="custom-select-trigger__left">
          <div className="custom-select-icon-badge" aria-hidden="true">
            {selectedOption.icon}
          </div>
          <span className="custom-select-trigger__label">{selectedOption.label}</span>
        </div>
        <ChevronDown
          size={18}
          strokeWidth={2.2}
          className={`custom-select-chevron ${isOpen ? 'custom-select-chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <ul className="custom-select-menu" role="listbox" tabIndex={-1}>
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`custom-select-option ${
                  isSelected ? 'custom-select-option--selected' : ''
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                <div className="custom-select-option__left">
                  <div className="custom-select-icon-badge" aria-hidden="true">
                    {opt.icon}
                  </div>
                  <span className="custom-select-option__label">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check
                    size={16}
                    strokeWidth={2.4}
                    className="custom-select-checkmark"
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
