// Seekable progress bar. Click or drag anywhere on the track to scrub;
// the seek(ms) call fires on pointer release. While scrubbing, the local
// drag position overrides the polled progress so the handle doesn't fight
// the 2s poll. Also keyboard-accessible (role="slider", arrows = ±5s).
import { useCallback, useRef, useState } from 'react'

const KEY_STEP_MS = 5000

export function formatTime(ms) {
  const totalSec = Math.max(0, Math.floor((ms || 0) / 1000))
  const m = Math.floor(totalSec / 60)
  const s = String(totalSec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function ProgressBar({ progressMs = 0, durationMs = 0, onSeek }) {
  const trackRef = useRef(null)
  const [dragMs, setDragMs] = useState(null) // non-null while scrubbing

  const shownMs = dragMs ?? Math.min(progressMs, durationMs)
  const fraction = durationMs > 0 ? shownMs / durationMs : 0

  const msFromPointer = useCallback(
    (clientX) => {
      const rect = trackRef.current.getBoundingClientRect()
      const t = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
      return Math.round(t * durationMs)
    },
    [durationMs],
  )

  const handlePointerDown = (e) => {
    if (durationMs <= 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragMs(msFromPointer(e.clientX))
  }

  const handlePointerMove = (e) => {
    if (dragMs === null) return
    setDragMs(msFromPointer(e.clientX))
  }

  const handlePointerUp = (e) => {
    if (dragMs === null) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    onSeek?.(msFromPointer(e.clientX))
    setDragMs(null)
  }

  const handleKeyDown = (e) => {
    if (durationMs <= 0) return
    let target = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      target = Math.min(progressMs + KEY_STEP_MS, durationMs)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      target = Math.max(progressMs - KEY_STEP_MS, 0)
    } else if (e.key === 'Home') {
      target = 0
    } else if (e.key === 'End') {
      target = durationMs
    }
    if (target !== null) {
      e.preventDefault()
      onSeek?.(target)
    }
  }

  return (
    <div className="progress">
      <span className="progress-time">{formatTime(shownMs)}</span>
      <div
        ref={trackRef}
        className={`progress-track${dragMs !== null ? ' scrubbing' : ''}`}
        role="slider"
        tabIndex={0}
        aria-label="Seek position"
        aria-valuemin={0}
        aria-valuemax={Math.round(durationMs / 1000)}
        aria-valuenow={Math.round(shownMs / 1000)}
        aria-valuetext={`${formatTime(shownMs)} of ${formatTime(durationMs)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDragMs(null)}
        onKeyDown={handleKeyDown}
      >
        <div className="progress-fill" style={{ width: `${fraction * 100}%` }} />
        <div className="progress-handle" style={{ left: `${fraction * 100}%` }} />
      </div>
      <span className="progress-time">{formatTime(durationMs)}</span>
    </div>
  )
}
