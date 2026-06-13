// Three animated blob layers over a dark navy base.
// Colors and speed come from CSS custom properties (see globals.css),
// so SettingsPanel can retheme everything live.
export default function Background() {
  return (
    <div className="background" aria-hidden="true">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
    </div>
  )
}
