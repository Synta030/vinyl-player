// Liquid glass now-playing panel: track info, playback controls,
// seekable progress bar, and a volume slider. Receives the player state
// and actions from useSpotifyPlayer via props (the hook lives in App so
// only one poll loop runs).
import { useEffect, useRef, useState } from 'react'
import Controls from './Controls'
import ProgressBar from './ProgressBar'

const VOLUME_DEBOUNCE_MS = 200

export default function PlayerPanel({
  playerState,
  play,
  pause,
  next,
  previous,
  setVolume,
  seek,
}) {
  const track = playerState?.track ?? null
  const isPlaying = playerState?.isPlaying ?? false

  // Local volume mirrors the slider instantly; API calls are debounced so
  // dragging doesn't fire a request per pixel.
  const [localVolume, setLocalVolume] = useState(null)
  const volumeTimerRef = useRef(null)
  const shownVolume = localVolume ?? playerState?.volume ?? 50

  useEffect(() => () => clearTimeout(volumeTimerRef.current), [])

  const handleVolumeChange = (e) => {
    const v = Number(e.target.value)
    setLocalVolume(v)
    clearTimeout(volumeTimerRef.current)
    volumeTimerRef.current = setTimeout(() => {
      setVolume(v)
      setLocalVolume(null)
    }, VOLUME_DEBOUNCE_MS)
  }

  return (
    <section className="glass glass-highlight player-panel" aria-label="Now playing">
      {track ? (
        <>
          <div className="track-info">
            <h1 className="track-name">{track.name}</h1>
            <p className="track-artists">{track.artists}</p>
            <p className="track-album">
              {track.album}
              {playerState?.deviceName ? ` — on ${playerState.deviceName}` : ''}
            </p>
          </div>

          <ProgressBar
            progressMs={playerState?.progressMs ?? 0}
            durationMs={playerState?.durationMs ?? 0}
            onSeek={seek}
          />

          <Controls
            isPlaying={isPlaying}
            onPlay={play}
            onPause={pause}
            onNext={next}
            onPrevious={previous}
          />

          <div className="volume">
            <svg className="volume-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a3.5 3.5 0 0 0-2-3.15v6.3a3.5 3.5 0 0 0 2-3.15zm-2-7v2.06A5.5 5.5 0 0 1 18.5 12a5.5 5.5 0 0 1-4 5.94V20a7.5 7.5 0 0 0 0-15z"
                fill="currentColor"
              />
            </svg>
            <input
              className="volume-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={shownVolume}
              onChange={handleVolumeChange}
              aria-label="Volume"
              style={{ '--volume-fill': `${shownVolume}%` }}
            />
            <span className="volume-value">{shownVolume}</span>
          </div>
        </>
      ) : (
        <p className="idle-hint">
          Nothing playing. Start playback in Spotify on any device and it will
          appear here.
        </p>
      )}
    </section>
  )
}
