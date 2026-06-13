import { useEffect, useState } from 'react'
import Background from './components/Background'
import VinylRecord from './components/VinylRecord'
import ToneArm from './components/ToneArm'
import PlayerPanel from './components/PlayerPanel'
import SettingsPanel from './components/SettingsPanel'
import {
  handleAuthCallback,
  isAuthenticated,
  redirectToSpotifyAuth,
  logout,
} from './spotify/auth'
import { useSpotifyPlayer } from './spotify/useSpotifyPlayer'

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [authError, setAuthError] = useState(null)
  const [checkingCallback, setCheckingCallback] = useState(true)

  useEffect(() => {
    handleAuthCallback()
      .then((tokens) => {
        if (tokens) setAuthed(true)
      })
      .catch((e) => setAuthError(e.message))
      .finally(() => setCheckingCallback(false))
  }, [])

  if (checkingCallback) return <Background />

  return (
    <>
      <Background />
      <SettingsPanel />
      {authed ? (
        <Player
          onAuthExpired={() => {
            logout()
            setAuthed(false)
          }}
        />
      ) : (
        <LoginCard error={authError} />
      )}
    </>
  )
}

function LoginCard({ error }) {
  return (
    <div className="login-wrap">
      <div className="glass glass-highlight login-card">
        <h1>Vinyl Player</h1>
        <p>
          Connect your Spotify account to spin your music on a virtual
          turntable. Playback is controlled on your active Spotify device.
        </p>
        <button className="login-btn" onClick={redirectToSpotifyAuth}>
          Connect Spotify
        </button>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  )
}

function Player({ onAuthExpired }) {
  const { playerState, error, play, pause, next, previous, setVolume, seek } =
    useSpotifyPlayer()

  useEffect(() => {
    if (error === 'auth') onAuthExpired()
  }, [error, onAuthExpired])

  const track = playerState?.track ?? null
  const isPlaying = playerState?.isPlaying ?? false

  return (
    <main className="app">
      <div className="turntable">
        <VinylRecord albumArt={track?.albumArt} isPlaying={isPlaying} />
        <ToneArm
          progressMs={playerState?.progressMs ?? 0}
          durationMs={playerState?.durationMs ?? 0}
        />
      </div>

      <PlayerPanel
        playerState={playerState}
        play={play}
        pause={pause}
        next={next}
        previous={previous}
        setVolume={setVolume}
        seek={seek}
      />
    </main>
  )
}
