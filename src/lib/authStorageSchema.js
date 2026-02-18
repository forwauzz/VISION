/**
 * Vision MVP — Auth/session storage schema (Phase 4)
 * Single source of truth for localStorage keys and value shapes.
 * Simulated auth only; no backend. Establishments are user-added (no mock list).
 *
 * Key: VISION_AUTH
 * Value (JSON):
 * {
 *   userId: string,           // opaque id after "login"
 *   email: string,            // from login form (for display)
 *   displayName: string,      // e.g. "Dr. Alexander Vance"
 *   establishments: [         // list available to this user
 *     { id: string, name: string, type?: string, location?: string, lastActive?: string, primary?: boolean, image?: string, url?: string, logo?: string }
 *   ],
 *   activeEstablishmentId: string | null   // selected establishment; set on selector card click or after login if single establishment
 * }
 *
 * Missing or invalid JSON → treat as logged out (redirect to /login).
 */

export const AUTH_STORAGE_KEY = 'VISION_AUTH'

/** @typedef {{ id: string, name: string, type?: string, location?: string, lastActive?: string, primary?: boolean, image?: string, url?: string, logo?: string }} Establishment */

/** @typedef {{ userId: string, email: string, displayName: string, establishments: Establishment[], activeEstablishmentId: string | null }} AuthState */
