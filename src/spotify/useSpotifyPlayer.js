// React hook: polls Spotify's player state and exposes playback controls.
import { useCallback, useEffect, useRef, useState } from 'react'
import { getValidToken, logout } from './auth'

const PLAYER_API = 'https://api.spotify.com/v1/me/player'
const POLL_INTERVAL_MS = 2000

function parsePlayerState(data) {
  const item = data.item
  return {
    isPlaying: data.is_playing ?? false,
    progressMs: data.progress_ms ?? 0,
    durationMs: item?.duration_ms ?? 0,
    volume: data.device?.volume_percent ?? 50,
    deviceName: data.device?.name ?? '',
    track: item
      ? {
          id: item.id,
          name: item.name,
          artists: (item.artists ?? []).map((a) => a.name).join(', '),
          album: item.album?.name ?? '',
          albumArt: item.album?.images?.[0]?.url ?? null,
        }
      : null,
  }
}

/**
 * @returns {{
 *   playerState: object|null,  // null = no active Spotify device
 *   error: 'auth'|string|null,
 *   play, pause, next, previous,
 *   setVolume: (percent: number) => Promise<void>,
 *   seek: (positionMs: number) => Promise<void>,
 * }}
 */
export function useSpotifyPlayer(enabled = true) {
  const [playerState, setPlayerState] = useState(null)
  const [error, setError] = useState(null)
  const backoffUntilRef = useRef(0) // 429 rate-limit backoff
  const pollTimerRef = useRef(null)

  const request = useCallback(async (path = '', options = {}) => {
    const token = await getValidToken()
    if (!token) {
      setError('auth')
      return null
    }
    const res = await fetch(`${PLAYER_API}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options.headers },
    })

    if (res.status === 401) {
      // Token rejected despite proactive refresh — force re-login.
      logout()
      setError('auth')
      return null
    }
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After') ?? 5)
      backoffUntilRef.current = Date.now() + retryAfter * 1000
      return null
    }
    return res
  }, [])

  const poll = useCallback(async () => {
    if (Date.now() < backoffUntilRef.current) return
    try {
      const res = await request()
      if (!res) return
      if (res.status === 204) {
        // No active device / nothing playing
        setPlayerState(null)
        setError(null)
        return
      }
      if (!res.ok) return
      setPlayerState(parsePlayerState(await res.json()))
      setError(null)
    } catch {
      // Network hiccup — keep last known state, retry on next tick.
    }
  }, [request])

  useEffect(() => {
    if (!enabled) return undefined
    poll()
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(pollTimerRef.current)
  }, [enabled, poll])

  /* ---------- Controls (optimistic where cheap, then re-poll) ---------- */

  const command = useCallback(
    async (method, path, optimistic) => {
      if (optimistic) setPlayerState((s) => (s ? { ...s, ...optimistic } : s))
      await request(path, { method })
      // Spotify's state lags slightly behind commands
      setTimeout(poll, 350)
    },
    [request, poll],
  )

  const play = useCallback(() => command('PUT', '/play', { isPlaying: true }), [command])
  const pause = useCallback(() => command('PUT', '/pause', { isPlaying: false }), [command])
  const next = useCallback(() => command('POST', '/next'), [command])
  const previous = useCallback(() => command('POST', '/previous'), [command])

  const setVolume = useCallback(
    (percent) => {
      const v = Math.round(Math.min(100, Math.max(0, percent)))
      return command('PUT', `/volume?volume_percent=${v}`, { volume: v })
    },
    [command],
  )

  const seek = useCallback(
    (positionMs) => {
      const ms = Math.max(0, Math.round(positionMs))
      return command('PUT', `/seek?position_ms=${ms}`, { progressMs: ms })
    },
    [command],
  )

  return { playerState, error, play, pause, next, previous, setVolume, seek }
}
