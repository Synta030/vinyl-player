// Spotify OAuth 2.0 — Authorization Code with PKCE
// Docs: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

export const SPOTIFY_CONFIG = {
  clientId: '6f4f6d30a955417daebab82320efe2c2',
  // Must exactly match a Redirect URI registered in the Spotify app dashboard
  redirectUri: window.location.origin + window.location.pathname,
  scopes: [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
  ].join(' '),
}

const AUTH_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const TOKEN_STORAGE_KEY = 'vinyl.spotify.tokens'
const VERIFIER_STORAGE_KEY = 'vinyl.spotify.pkce_verifier'
const EXPIRY_MARGIN_MS = 60_000

/* ---------- PKCE primitives ---------- */

export function generateCodeVerifier(length = 64) {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const randomBytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(randomBytes, (b) => charset[b % charset.length]).join('')
}

export async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  // base64url encode
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/* ---------- Token storage ---------- */

function readTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY))
  } catch {
    return null
  }
}

function saveTokens(tokenResponse) {
  const stored = {
    accessToken: tokenResponse.access_token,
    // Spotify may omit refresh_token on refresh responses — keep the old one
    refreshToken: tokenResponse.refresh_token ?? readTokens()?.refreshToken,
    expiresAt: Date.now() + tokenResponse.expires_in * 1000,
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(stored))
  return stored
}

export function isAuthenticated() {
  return Boolean(readTokens()?.refreshToken)
}

export function logout() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(VERIFIER_STORAGE_KEY)
}

/* ---------- Auth flow ---------- */

export async function redirectToSpotifyAuth() {
  const verifier = generateCodeVerifier()
  localStorage.setItem(VERIFIER_STORAGE_KEY, verifier)
  const challenge = await generateCodeChallenge(verifier)

  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
    scope: SPOTIFY_CONFIG.scopes,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  window.location.href = `${AUTH_URL}?${params.toString()}`
}

async function requestTokens(body) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Spotify token request failed (${res.status}): ${detail}`)
  }
  return saveTokens(await res.json())
}

/**
 * Call on app load. If the URL contains an OAuth callback (?code=...),
 * exchanges it for tokens, cleans the URL, and returns the stored tokens.
 * Returns null when the URL is not a callback.
 */
export async function handleAuthCallback() {
  const params = new URLSearchParams(window.location.search)
  const error = params.get('error')
  const code = params.get('code')

  if (!error && !code) return null

  // Clean the URL either way so a reload doesn't retry a used code
  window.history.replaceState({}, document.title, SPOTIFY_CONFIG.redirectUri)

  if (error) throw new Error(`Spotify authorization denied: ${error}`)

  const verifier = localStorage.getItem(VERIFIER_STORAGE_KEY)
  if (!verifier) throw new Error('Missing PKCE verifier — please log in again.')

  const tokens = await requestTokens({
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
    client_id: SPOTIFY_CONFIG.clientId,
    code_verifier: verifier,
  })
  localStorage.removeItem(VERIFIER_STORAGE_KEY)
  return tokens
}

export async function refreshAccessToken() {
  const stored = readTokens()
  if (!stored?.refreshToken) throw new Error('No refresh token available.')
  return requestTokens({
    grant_type: 'refresh_token',
    refresh_token: stored.refreshToken,
    client_id: SPOTIFY_CONFIG.clientId,
  })
}

/**
 * Returns a non-expired access token, refreshing if necessary.
 * Returns null if the user is not authenticated (or refresh failed).
 */
export async function getValidToken() {
  const stored = readTokens()
  if (!stored) return null
  if (Date.now() < stored.expiresAt - EXPIRY_MARGIN_MS) {
    return stored.accessToken
  }
  try {
    return (await refreshAccessToken()).accessToken
  } catch {
    logout()
    return null
  }
}
