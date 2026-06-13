// Spinning vinyl disc at 33.33 RPM (1.8s/rev, see --vinyl-rev in globals.css).
// The CSS animation pauses when playback pauses.
export default function VinylRecord({ albumArt, isPlaying }) {
  return (
    <div
      className="vinyl"
      style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
    >
      <div className="vinyl-grooves" />
      <div className="vinyl-label">
        {albumArt ? (
          <img src={albumArt} alt="Album art" draggable="false" />
        ) : (
          <div className="vinyl-label-empty" />
        )}
      </div>
      <div className="vinyl-hole" />
    </div>
  )
}
