import { useState } from 'react'
import { CalendarCheck, Share2 } from 'lucide-react'
import { shareEvent } from '../../utils/eventShare.js'
import '../../styles/eventActions.css'

export default function EventActions({ event, going, isBusy, onGoing, onNotGoing }) {
  const [shareState, setShareState] = useState({ status: 'idle', message: '' })

  async function handleShare() {
    setShareState({ status: 'sharing', message: '' })
    try {
      const result = await shareEvent(event)
      setShareState({ status: 'success', message: result.message })
    } catch (error) {
      if (error?.name === 'AbortError') {
        setShareState({ status: 'idle', message: '' })
        return
      }
      setShareState({ status: 'error', message: error.message })
    }
  }

  return (
    <div className="event-details__actions">
      <div className="event-details__action-row">
        {going ? (
          <button className="secondary-button" type="button" disabled={isBusy} onClick={onNotGoing} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <CalendarCheck size={16} />
            {isBusy ? 'Updating…' : 'Going'}
          </button>
        ) : (
          <button className="primary-button" type="button" disabled={isBusy} onClick={onGoing} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <CalendarCheck size={16} />
            {isBusy ? 'Updating…' : "I'm Going"}
          </button>
        )}
        <button className="secondary-button" type="button" disabled={shareState.status === 'sharing'} onClick={handleShare} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Share2 size={16} />
          {shareState.status === 'sharing' ? 'Sharing…' : 'Share Event'}
        </button>
      </div>
      {shareState.message && (
        <p className={shareState.status === 'error' ? 'action-message action-message--error' : 'action-message'} role={shareState.status === 'error' ? 'alert' : 'status'}>
          {shareState.message}
        </p>
      )}
    </div>
  )
}
