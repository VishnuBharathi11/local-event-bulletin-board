import { useEffect, useRef, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { generateEventDescription } from '../../services/eventService.js'
import '../../styles/createEvent.css'

const DESCRIPTION_MAX_LENGTH = 500
const DESCRIPTION_DEBOUNCE_MS = 850

export default function RequestStep01BasicInfo({ form, update, currentUser, errors = {} }) {
  const currentCount = (form.description || '').length
  const [aiDescription, setAiDescription] = useState('')
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [descriptionAiError, setDescriptionAiError] = useState('')

  const requestIdRef = useRef(0)
  const latestTitleRef = useRef('')
  const formRef = useRef(form)

  formRef.current = form

  useEffect(() => {
    const title = (form.title || '').trim()
    latestTitleRef.current = title

    if (!title) {
      requestIdRef.current += 1
      setGeneratingDescription(false)
      setAiDescription('')
      return undefined
    }

    const requestId = ++requestIdRef.current
    const timer = setTimeout(async () => {
      setGeneratingDescription(true)
      setDescriptionAiError('')

      try {
        const currentForm = formRef.current
        const result = await generateEventDescription({
          title,
          description: currentForm.description || '',
          category: currentForm.category || '',
          city: currentForm.city || '',
          neighborhood: currentForm.neighborhood || '',
          location: currentForm.location || '',
        })

        if (requestId !== requestIdRef.current) return
        if (latestTitleRef.current !== title) return

        const generated = String(result?.description || '').trim()
        if (!generated || generated.length > DESCRIPTION_MAX_LENGTH) {
          throw new Error('The AI returned an invalid description. Please try again or enter one manually.')
        }

        setAiDescription(generated)

        const latestForm = formRef.current
        if (latestForm.title.trim() === title && !latestForm.description.trim()) {
          update('description', generated)
        }
      } catch (error) {
        if (requestId !== requestIdRef.current) return
        setDescriptionAiError(error?.message || 'Unable to generate a description right now. Please enter one manually.')
      } finally {
        if (requestId === requestIdRef.current) {
          setGeneratingDescription(false)
        }
      }
    }, DESCRIPTION_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [form.title])

  function handleTitleChange(event) {
    const nextTitle = event.target.value
    requestIdRef.current += 1
    latestTitleRef.current = nextTitle.trim()
    update('title', nextTitle)
    setAiDescription('')
    setDescriptionAiError('')
    setGeneratingDescription(false)
  }

  function handleDescriptionChange(event) {
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
    const currentForm = formRef.current
    const title = (currentForm.title || '').trim()

    if (!title || generatingDescription) return

    const requestId = ++requestIdRef.current
    latestTitleRef.current = title
    setGeneratingDescription(true)
    setDescriptionAiError('')

    try {
      const result = await generateEventDescription({
        title,
        description: currentForm.description || '',
        category: currentForm.category || '',
        city: currentForm.city || '',
        neighborhood: currentForm.neighborhood || '',
        location: currentForm.location || '',
      })

      if (requestId !== requestIdRef.current) return
      if (latestTitleRef.current !== title) return

      const generated = String(result?.description || '').trim()
      if (!generated || generated.length > DESCRIPTION_MAX_LENGTH) {
        throw new Error('The AI returned an invalid description. Please try again or enter one manually.')
      }

      setAiDescription(generated)
      update('description', generated)
    } catch (error) {
      if (requestId !== requestIdRef.current) return
      setDescriptionAiError(error?.message || 'Unable to regenerate the description right now. Please enter one manually.')
    } finally {
      if (requestId === requestIdRef.current) {
        setGeneratingDescription(false)
      }
    }
  }

  return (
    <div className="create-step-content" role="region" aria-labelledby="request-step1-title">
      <div className="create-step-header">
        <h2 id="request-step1-title" className="create-step-title">Basic Information</h2>
        <p className="create-step-desc">Describe the event idea you are proposing to the community.</p>
      </div>

      <div className="create-step-form">
        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="user-name">Name</label>
            <input
              id="user-name"
              type="text"
              value={currentUser?.name || 'Community Member'}
              readOnly
              className="form-input form-input--readonly"
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-email">Email</label>
            <input
              id="user-email"
              type="email"
              value={currentUser?.email || ''}
              readOnly
              className="form-input form-input--readonly"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="request-title">
            Proposed Title <span className="required-star">*</span>
          </label>
          <input
            id="request-title"
            type="text"
            placeholder="e.g., Neighborhood Weekend Cleanup"
            value={form.title || ''}
            onChange={handleTitleChange}
            className={`form-input ${errors.title ? 'form-input--error' : ''}`}
            autoFocus
          />
          {errors.title && <span className="form-field-error">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="request-description">
            Description <span className="required-star">*</span>
          </label>
          <textarea
            id="request-description"
            rows={5}
            maxLength={DESCRIPTION_MAX_LENGTH}
            placeholder="What is this event about? Explain why the community would love it..."
            value={form.description || ''}
            onChange={handleDescriptionChange}
            className={`form-textarea ${errors.description ? 'form-textarea--error' : ''} ${generatingDescription ? 'event-description-textarea--generating' : ''}`}
            aria-busy={generatingDescription}
          />

          <div className="event-description-ai">
            <div className="event-description-ai__controls">
              <button
                type="button"
                className="secondary-button event-description-ai__button"
                onClick={handleInsertDescription}
                disabled={!aiDescription || generatingDescription}
                aria-label="Insert AI-generated description"
              >
                <Check size={15} aria-hidden="true" />
                Insert
              </button>
              <button
                type="button"
                className="secondary-button event-description-ai__button"
                onClick={handleRegenerateDescription}
                disabled={!form.title?.trim() || generatingDescription}
                aria-busy={generatingDescription}
                aria-label="Regenerate AI event request description"
              >
                <Sparkles size={15} aria-hidden="true" />
                {generatingDescription ? 'Generating...' : 'Regenerate'}
              </button>
            </div>

            {descriptionAiError && (
              <p className="event-description-ai__error" role="alert">
                {descriptionAiError}
              </p>
            )}
          </div>

          <div className="form-field-footer">
            {errors.description ? (
              <span className="form-field-error">{errors.description}</span>
            ) : <span />}
            <span className="form-char-count">{currentCount} / {DESCRIPTION_MAX_LENGTH}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
