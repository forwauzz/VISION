/**
 * Vision MVP — Auth lib (Phase 4). Simulated login only; read/write auth state to localStorage.
 * First-time login gets bot (seed) establishments; re-login preserves user-added list.
 */
import { AUTH_STORAGE_KEY } from './authStorageSchema.js'

/** Demo establishments for first-time users so selector/dashboard are usable without manual add. */
const BOT_ESTABLISHMENTS = [
  {
    id: 'est-bot-cllc',
    name: 'Canadian Limb Lengthening Center',
    type: 'Orthopedic Clinic',
    location: 'Mont-Royal, QC',
    logo: 'https://cllcenter.com/wp-content/uploads/2022/05/cllc.png',
    url: 'https://cllcenter.com/',
    primary: true,
  },
  {
    id: 'est-bot-creoq',
    name: 'CREOQ',
    type: 'Ambulatory Surgery Centre',
    location: 'Mont-Royal, QC',
    logo: 'https://creoq.com/wp-content/uploads/2024/01/creoq.png',
    url: 'https://creoq.com/',
  },
]

function read() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !data.userId) return null
    const establishments = Array.isArray(data.establishments) ? data.establishments : []
    return {
      userId: data.userId,
      email: data.email || '',
      displayName: data.displayName || '',
      establishments,
      activeEstablishmentId: data.activeEstablishmentId ?? null,
    }
  } catch {
    return null
  }
}

function write(state) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

/**
 * @returns {import('./authStorageSchema.js').AuthState | null}
 */
export function getAuth() {
  return read()
}

/**
 * Simulated login: accept any non-empty email/password; store user. Establishments list starts empty (user adds via UI).
 * On re-login with the same email, preserves existing establishments so they appear at establishment-selector.
 * @returns {{ ok: true, redirect: 'dashboard' | 'establishment-selector' } | { ok: false, error: string }}
 */
export function mockLogin(email, password) {
  const e = (email || '').trim()
  const p = (password || '').trim()
  if (!e || !p) return { ok: false, error: 'Email and password required' }

  const existing = read()
  const sameUser = existing && existing.email && existing.email.toLowerCase() === e.toLowerCase()
  const preservedEstablishments = sameUser && Array.isArray(existing.establishments) ? existing.establishments : []
  const establishments = preservedEstablishments.length > 0 ? preservedEstablishments : BOT_ESTABLISHMENTS
  const primaryId = establishments.find((e) => e.primary)?.id ?? establishments[0]?.id ?? null
  const preservedActiveId = sameUser && preservedEstablishments.length > 0
    ? (existing.activeEstablishmentId ?? primaryId)
    : primaryId

  const displayName = e.includes('@') ? e.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'User'
  const state = {
    userId: existing?.userId ?? `user-${Date.now()}`,
    email: e,
    displayName,
    establishments,
    activeEstablishmentId: preservedActiveId,
  }
  if (!write(state)) return { ok: false, error: 'Failed to save session' }
  const redirect = 'dashboard'
  return { ok: true, redirect }
}

/**
 * Add an establishment to the current user's list (functional; no mock). Sets activeEstablishmentId if none.
 * @param {{ name: string, type?: string, location?: string }} input
 * @returns {import('./authStorageSchema.js').Establishment | null}
 */
export function addEstablishment(input) {
  const auth = read()
  if (!auth) return null
  const name = (input.name || '').trim()
  if (!name) return null
  const id = `est-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const establishment = {
    id,
    name,
    type: (input.type || '').trim() || undefined,
    location: (input.location || '').trim() || undefined,
  }
  auth.establishments = auth.establishments || []
  auth.establishments.push(establishment)
  if (!auth.activeEstablishmentId) auth.activeEstablishmentId = id
  if (!write(auth)) return null
  return establishment
}

export function setActiveEstablishment(establishmentId) {
  const auth = read()
  if (!auth) return false
  const valid = auth.establishments.some((e) => e.id === establishmentId)
  if (!valid) return false
  auth.activeEstablishmentId = establishmentId
  return write(auth)
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
