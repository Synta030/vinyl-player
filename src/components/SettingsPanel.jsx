// Theme settings: fixed gear button opening a glass drawer with color
// pickers (--blob-1/2/3, --accent) and sliders (--blob-speed, --glass-blur).
// Values are applied live via document.documentElement.style.setProperty,
// persisted to localStorage ("vinyl.settings"), and restored on mount.
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'vinyl.settings'

// key -> { cssVar, unit, default }
const FIELDS = {
  blob1: { cssVar: '--blob-1', unit: '', def: '#2541b2' },
  blob2: { cssVar: '--blob-2', unit: '', def: '#7b2fbe' },
  blob3: { cssVar: '--blob-3', unit: '', def: '#0f7173' },
  accent: { cssVar: '--accent', unit: '', def: '#1ed760' },
  blobSpeed: { cssVar: '--blob-speed', unit: 's', def: 24 },
  glassBlur: { cssVar: '--glass-blur', unit: 'px', def: 22 },
}

const DEFAULTS = Object.fromEntries(
  Object.entries(FIELDS).map(([k, f]) => [k, f.def]),
)

function applySettings(settings) {
  const root = document.documentElement.style
  for (const [key, field] of Object.entries(FIELDS)) {
    root.setProperty(field.cssVar, `${settings[key]}${field.unit}`)
  }
}

function clearSettings() {
  const root = document.documentElement.style
  for (const field of Object.values(FIELDS)) {
    root.removeProperty(field.cssVar) // fall back to stylesheet :root values
  }
}

function loadStoredSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return stored ? { ...DEFAULTS, ...stored } : null
  } catch {
    return null
  }
}

export default function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState(() => loadStoredSettings() ?? DEFAULTS)

  // Restore persisted theme on mount
  useEffect(() => {
    const stored = loadStoredSettings()
    if (stored) applySettings(stored)
  }, [])

  // Close on Escape while open
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const update = (key, value) => {
    const nextSettings = { ...settings, [key]: value }
    setSettings(nextSettings)
    applySettings(nextSettings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings))
  }

  const reset = () => {
    setSettings(DEFAULTS)
    clearSettings()
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <>
      <button
        className="glass settings-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close theme settings' : 'Open theme settings'}
        aria-expanded={open}
        aria-controls="settings-drawer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M19.14 12.94a7.07 7.07 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.43h-3.84a.5.5 0 0 0-.5.43l-.36 2.54c-.59.24-1.13.56-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L2.63 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.61.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.04.25.25.43.5.43h3.84c.25 0 .46-.18.5-.43l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96c.21.1.48.01.61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
            fill="currentColor"
          />
        </svg>
      </button>

      <aside
        id="settings-drawer"
        className={`glass glass-highlight settings-drawer${open ? ' open' : ''}`}
        aria-label="Theme settings"
        aria-hidden={!open}
      >
        <h2>Theme</h2>

        <div className="settings-row">
          <label htmlFor="set-blob1">Blob 1</label>
          <input
            id="set-blob1"
            type="color"
            value={settings.blob1}
            onChange={(e) => update('blob1', e.target.value)}
          />
        </div>
        <div className="settings-row">
          <label htmlFor="set-blob2">Blob 2</label>
          <input
            id="set-blob2"
            type="color"
            value={settings.blob2}
            onChange={(e) => update('blob2', e.target.value)}
          />
        </div>
        <div className="settings-row">
          <label htmlFor="set-blob3">Blob 3</label>
          <input
            id="set-blob3"
            type="color"
            value={settings.blob3}
            onChange={(e) => update('blob3', e.target.value)}
          />
        </div>
        <div className="settings-row">
          <label htmlFor="set-accent">Accent</label>
          <input
            id="set-accent"
            type="color"
            value={settings.accent}
            onChange={(e) => update('accent', e.target.value)}
          />
        </div>

        <div className="settings-row slider-row">
          <label htmlFor="set-speed">Blob speed</label>
          <input
            id="set-speed"
            type="range"
            min="6"
            max="60"
            step="1"
            value={settings.blobSpeed}
            onChange={(e) => update('blobSpeed', Number(e.target.value))}
          />
          <span className="settings-value">{settings.blobSpeed}s</span>
        </div>
        <div className="settings-row slider-row">
          <label htmlFor="set-blur">Glass blur</label>
          <input
            id="set-blur"
            type="range"
            min="0"
            max="40"
            step="1"
            value={settings.glassBlur}
            onChange={(e) => update('glassBlur', Number(e.target.value))}
          />
          <span className="settings-value">{settings.glassBlur}px</span>
        </div>

        <button className="settings-reset" onClick={reset}>
          Reset to defaults
        </button>
      </aside>
    </>
  )
}
