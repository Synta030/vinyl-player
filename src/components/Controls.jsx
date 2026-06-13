// Playback buttons, wired to the useSpotifyPlayer hook actions via props.
export default function Controls({ isPlaying, onPlay, onPause, onNext, onPrevious }) {
  return (
    <div className="controls">
      <button className="control-btn" onClick={onPrevious} aria-label="Previous track">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 5h2v14H6zM20 5v14L9.5 12z" fill="currentColor" />
        </svg>
      </button>
      <button
        className="control-btn play-pause"
        onClick={isPlaying ? onPause : onPlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4l13 8-13 8z" fill="currentColor" />
          </svg>
        )}
      </button>
      <button className="control-btn" onClick={onNext} aria-label="Next track">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 5h2v14h-2zM4 5v14l10.5-7z" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
}
