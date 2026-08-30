import { useEffect, useRef, useState } from 'react'
import { generateEventDescription } from '../../services/eventService.js'

const DESCRIPTION_DEBOUNCE_MS = 850

export default function Step01BasicInfo({ form, update, currentUser, errors = {} }) {
  const maxChars = 500
  const currentCount = (form.description || '').length

  const [aiDescription, setAiDescription] = useState('')
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [descriptionAiError, setDescriptionAiError] = useState('')

  const requestIdRef = useRef(0)
  const latestTitleRef = useRef('')

  const title = (form.title || '').trim()

  useEffect(() => {
    if (!title) {
      return undefined
    }

    const requestId = ++requestIdRef.current
    latestTitleRef.current = title

    const timer = setTimeout(async () => {
      setGeneratingDescription(true)
      setDescriptionAiError('')

      try {
        const result = await generateEventDescription({
          title,
          description: form.description || '',
        })

        if (requestId !== requestIdRef.current) return
        if (latestTitleRef.current !== title) return

        const generated = String(result?.description || '').trim()

        if (!generated) {
          throw new Error('AI returned an empty description.')
        }

        setAiDescription(generated)
        update('description', generated)
      } catch (error) {
        if (requestId !== requestIdRef.current) return

        setDescriptionAiError(
          error?.message || 'Unable to generate a description right now.'
        )
      } finally {
        if (requestId === requestIdRef.current) {
          setGeneratingDescription(false)
        }
      }
    }, DESCRIPTION_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [title])

  function handleTitleChange(event) {
    const nextTitle = event.target.value

    update('title', nextTitle)

    // These are event-handler updates, not synchronous effect updates.
    setAiDescription('')
    setDescriptionAiError('')
    setGeneratingDescription(false)

    requestIdRef.current += 1
    latestTitleRef.current = nextTitle.trim()
  }

  function handleDescriptionChange(event) {
    // Invalidate any in-flight AI response before accepting the user's edit.
    // This prevents a stale response from replacing newer manual content.
    requestIdRef.current += 1
    update('description', event.target.value)
    setDescriptionAiError('')
  }

  function handleInsertDescription() {
    if (!aiDescription || generatingDescription) return

    update('description', aiDescription)
    setDescriptionAiError('')
  }

  async function handleRegenerateDescription() {
    const currentTitle = (form.title || '').trim()

    if (!currentTitle || generatingDescription) return

    const requestId = ++requestIdRef.current
    latestTitleRef.current = currentTitle

    setGeneratingDescription(true)
    setDescriptionAiError('')

    try {
      const result = await generateEventDescription({
        title: currentTitle,
        description: form.description || '',
      })

      if (requestId !== requestIdRef.current) return
      if (latestTitleRef.current !== currentTitle) return

      const generated = String(result?.description || '').trim()

      if (!generated) {
        throw new Error('AI returned an empty description.')
      }

      setAiDescription(generated)
      update('description', generated)
    } catch (error) {
      if (requestId !== requestIdRef.current) return

      setDescriptionAiError(
        error?.message || 'Unable to regenerate the description right now.'
      )
    } finally {
      if (requestId === requestIdRef.current) {
        setGeneratingDescription(false)
      }
    }
  }

  return (
    <div className="create-step-content" role="region" aria-labelledby="step1-title">
      <div className="create-step-header">
        <h2 id="step1-title" className="create-step-title">Basic Information</h2>
        <p className="create-step-desc">
          Add the essential details people need to understand your event.
        </p>
      </div>

      <div className="create-step-form">
        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="user-name">Name</label>
            <input
              id="user-name"
              type="text"
              value={currentUser?.name || 'Anbu'}
              readOnly
              className="form-input form-input--readonly"
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-email">Email</label>
            <input
              id="user-email"
              type="email"
              value={currentUser?.email || 'anbu@gmail.com'}
              readOnly
              className="form-input form-input--readonly"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="event-title">
            Event Title <span className="required-star">*</span>
          </label>

          <input
            id="event-title"
            type="text"
            placeholder="Enter a catchy title for your event"
            value={form.title || ''}
            onChange={handleTitleChange}
            className={`form-input ${errors.title ? 'form-input--error' : ''}`}
            autoFocus
          />

          {errors.title && (
            <span className="form-field-error">{errors.title}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="event-basic-description">
            Description <span className="required-star">*</span>
          </label>

          <textarea
            id="event-basic-description"
            rows={5}
            maxLength={maxChars}
            placeholder="Describe your event, what makes it special, and what attendees can expect..."
            value={form.description || ''}
            onChange={handleDescriptionChange}
            className={`form-textarea ${errors.description ? 'form-textarea--error' : ''} ${generatingDescription ? 'event-description-textarea--generating' : ''}`}
          />

          <div className="form-field-footer">
            {errors.description ? (
              <span className="form-field-error">{errors.description}</span>
            ) : (
              <span />
            )}

            <span className="form-char-count">
              {currentCount} / {maxChars}
            </span>
          </div>

          <div className="event-description-ai">
            <div className="event-description-ai__controls">
              <button
                type="button"
                className="secondary-button event-description-ai__button"
                onClick={handleInsertDescription}
                disabled={!aiDescription || generatingDescription}
              >
                Insert
              </button>

              <button
                type="button"
                className="secondary-button event-description-ai__button"
                onClick={handleRegenerateDescription}
                disabled={!form.title?.trim() || generatingDescription}
              >
                {generatingDescription ? 'Generating...' : 'Regenerate'}
              </button>
            </div>

            {descriptionAiError && (
              <p className="event-description-ai__error" role="alert">
                {descriptionAiError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
