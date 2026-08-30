import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Info, MapPin } from 'lucide-react'
import EventMapPicker from '../map/EventMapPicker.jsx'
import { searchLocations } from '../../services/locationService.js'
import '../../styles/locationAutocomplete.css'

const LOCATION_DEBOUNCE_MS = 400
const MIN_LOCATION_QUERY_LENGTH = 2

function formatSelectedLocation(suggestion) {
  const venue = String(suggestion?.venue || '').trim()
  const address = String(suggestion?.address || '').trim()

  if (venue && address && venue.toLowerCase() !== address.toLowerCase()) {
    return `${venue}, ${address}`
  }

  return venue || address
}

export default function Step03Location({ form, update, errors = {} }) {
  const [suggestions, setSuggestions] = useState([])
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)

  const fieldRef = useRef(null)
  const requestIdRef = useRef(0)
  const suppressNextSearchRef = useRef(false)
  const hasInteractedRef = useRef(false)

  const locationQuery = form.location || ''

  useEffect(() => {
    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false
      return undefined
    }

    if (!hasInteractedRef.current) return undefined

    const normalizedQuery = locationQuery.trim()
    const requestId = ++requestIdRef.current

    if (normalizedQuery.length < MIN_LOCATION_QUERY_LENGTH) {
      setSuggestions([])
      setSuggestionsOpen(false)
      setLocationLoading(false)
      setLocationError('')
      return undefined
    }

    const timer = setTimeout(async () => {
      setLocationLoading(true)
      setLocationError('')

      try {
        const result = await searchLocations(normalizedQuery)
        if (requestId !== requestIdRef.current) return

        const nextSuggestions = Array.isArray(result?.suggestions) ? result.suggestions : []
        setSuggestions(nextSuggestions)
        setSuggestionsOpen(nextSuggestions.length > 0)
        setActiveSuggestionIndex(-1)
      } catch (error) {
        if (requestId !== requestIdRef.current) return

        setSuggestions([])
        setSuggestionsOpen(false)
        setLocationError(error?.message || 'Unable to search locations right now. You can enter the venue manually.')
      } finally {
        if (requestId === requestIdRef.current) {
          setLocationLoading(false)
        }
      }
    }, LOCATION_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [locationQuery])

  useEffect(() => {
    if (!suggestionsOpen) return undefined

    function handleOutsidePointer(event) {
      if (!fieldRef.current?.contains(event.target)) {
        setSuggestionsOpen(false)
        setActiveSuggestionIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleOutsidePointer)
    return () => document.removeEventListener('mousedown', handleOutsidePointer)
  }, [suggestionsOpen])

  function handleLocationChange(event) {
    hasInteractedRef.current = true
    update('location', event.target.value)
    setLocationError('')
    setSuggestionsOpen(true)
  }

  function handleSuggestionSelect(suggestion) {
    const selectedLocation = formatSelectedLocation(suggestion)

    requestIdRef.current += 1
    suppressNextSearchRef.current = true
    setSuggestionsOpen(false)
    setSuggestions([])
    setActiveSuggestionIndex(-1)
    setLocationError('')

    update('location', selectedLocation)
    update('city', suggestion?.city || '')
    update('neighborhood', suggestion?.neighborhood || '')
    update('latitude', Number.isFinite(Number(suggestion?.latitude)) ? Number(suggestion.latitude) : null)
    update('longitude', Number.isFinite(Number(suggestion?.longitude)) ? Number(suggestion.longitude) : null)
  }

  function handleLocationKeyDown(event) {
    if (!suggestionsOpen || suggestions.length === 0) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveSuggestionIndex((index) => (index + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestionIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
      return
    }

    if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
      event.preventDefault()
      handleSuggestionSelect(suggestions[activeSuggestionIndex])
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setSuggestionsOpen(false)
      setActiveSuggestionIndex(-1)
    }
  }

  return (
    <div className="create-step-content" role="region" aria-labelledby="step3-title">
      <div className="create-step-header">
        <div className="create-step-header__title-row">
          <MapPin size={22} className="create-step-header__icon" />
          <h2 id="step3-title" className="create-step-title">Location</h2>
        </div>
        <p className="create-step-desc">Tell attendees where the event will take place.</p>
      </div>

      <div className="create-step-form">
        <div className="form-group">
          <label htmlFor="event-location">
            Venue / Exact Location <span className="required-star">*</span>
          </label>
          <div className="location-autocomplete" ref={fieldRef}>
            <div className="location-autocomplete__input-wrap">
              <input
                id="event-location"
                type="text"
                placeholder="Enter venue name or exact address"
                value={form.location || ''}
                onChange={handleLocationChange}
                onFocus={() => {
                  if (suggestions.length > 0) setSuggestionsOpen(true)
                }}
                onKeyDown={handleLocationKeyDown}
                className={`form-input ${errors.location ? 'form-input--error' : ''}`}
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={suggestionsOpen}
                aria-controls="event-location-suggestions"
                aria-activedescendant={
                  activeSuggestionIndex >= 0
                    ? `event-location-suggestion-${activeSuggestionIndex}`
                    : undefined
                }
              />
              {locationLoading && <span className="location-autocomplete__loading" aria-hidden="true" />}
              {!locationLoading && suggestions.length > 0 && (
                <ChevronDown size={16} className="location-autocomplete__chevron" aria-hidden="true" />
              )}
            </div>

            {suggestionsOpen && suggestions.length > 0 && (
              <div
                id="event-location-suggestions"
                className="location-autocomplete__menu"
                role="listbox"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.venue}-${suggestion.address}-${index}`}
                    id={`event-location-suggestion-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeSuggestionIndex}
                    className={`location-autocomplete__option ${index === activeSuggestionIndex ? 'location-autocomplete__option--active' : ''}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <span className="location-autocomplete__option-icon" aria-hidden="true">
                      <MapPin size={15} />
                    </span>
                    <span className="location-autocomplete__option-copy">
                      <strong>{suggestion.venue || suggestion.address}</strong>
                      <span>{suggestion.address || [suggestion.neighborhood, suggestion.city].filter(Boolean).join(', ')}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {errors.location && <span className="form-field-error">{errors.location}</span>}
          {locationError && (
            <span className="location-autocomplete__error" role="status">
              {locationError}
            </span>
          )}
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="event-city">
              City <span className="required-star">*</span>
            </label>
            <input
              id="event-city"
              type="text"
              placeholder="Enter city"
              value={form.city || ''}
              onChange={(e) => update('city', e.target.value)}
              className={`form-input ${errors.city ? 'form-input--error' : ''}`}
            />
            {errors.city && <span className="form-field-error">{errors.city}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="event-neighborhood">
              Neighborhood (Optional)
            </label>
            <input
              id="event-neighborhood"
              type="text"
              placeholder="Enter neighborhood"
              value={form.neighborhood || ''}
              onChange={(e) => update('neighborhood', e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '12px' }}>
          <label>
            Select on Map <span className="required-star">*</span>
          </label>
          <EventMapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onLocationChange={(lat, lng) => {
              update('latitude', lat)
              update('longitude', lng)
            }}
            initialCenter={form.latitude && form.longitude ? [form.latitude, form.longitude] : undefined}
            initialZoom={form.latitude && form.longitude ? 15 : undefined}
          />

          <div className="create-step-info-hint">
            <Info size={16} />
            <span>Drag or zoom the map and click on the exact location to pin it.</span>
          </div>

          {errors.map && <span className="form-field-error" style={{ display: 'block', marginTop: '6px' }}>{errors.map}</span>}
        </div>
      </div>
    </div>
  )
}
