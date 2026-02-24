/**
 * Vision — Optional persistence of session recording blobs (IndexedDB).
 * Gated by feature flag; when disabled, no IndexedDB access.
 * Does not touch VISION_SESSIONS or session payload schema.
 */

const DB_NAME = 'VISION_RECORDINGS_DB'
const STORE_NAME = 'recordings'
const DB_VERSION = 1
const FLAG_ENV = 'VITE_STORE_RECORDINGS'
const FLAG_LOCAL = 'VISION_STORE_RECORDINGS'

function isEnabled() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[FLAG_ENV] === 'true') return true
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(FLAG_LOCAL) === 'true') return true
  } catch (_) {}
  return false
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' })
      }
    }
  })
}

/**
 * Whether recording storage is enabled (env or localStorage flag).
 * When false, save/get/has/remove do not access IndexedDB.
 */
export function enabled() {
  return isEnabled()
}

/**
 * Save a recording blob for a session. No-op when not enabled.
 * @param {string} sessionId
 * @param {Blob} blob
 * @returns {Promise<void>}
 */
export async function save(sessionId, blob) {
  if (!isEnabled() || !sessionId || !blob) return
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put({ sessionId, blob, savedAt: Date.now() })
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
    tx.oncomplete = () => db.close()
  })
}

/**
 * Get a recording blob for a session. Returns null when not enabled or not found.
 * @param {string} sessionId
 * @returns {Promise<Blob | null>}
 */
export async function get(sessionId) {
  if (!isEnabled() || !sessionId) return null
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(sessionId)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const row = req.result
      db.close()
      resolve(row?.blob ?? null)
    }
  })
}

/**
 * Check if a recording exists for a session. False when not enabled.
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
export async function has(sessionId) {
  if (!isEnabled() || !sessionId) return false
  const blob = await get(sessionId)
  return blob != null
}

/**
 * Remove a recording for a session. No-op when not enabled.
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
export async function remove(sessionId) {
  if (!isEnabled() || !sessionId) return
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(sessionId)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
    tx.oncomplete = () => db.close()
  })
}
