/**
 * Basic Auth — password-protect the site when BASIC_AUTH_PASSWORD is set.
 * Set BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD in Netlify env vars.
 * If either is unset, auth is bypassed (useful for prod without protection).
 */
import type { Context } from '@netlify/edge-functions'

export default async (request: Request, context: Context): Promise<Response | undefined> => {
  const username = Netlify.env.get('BASIC_AUTH_USERNAME')
  const password = Netlify.env.get('BASIC_AUTH_PASSWORD')
  if (!password) return context.next()

  const correctAuth = `Basic ${btoa(`${username || ''}:${password}`)}`

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || authHeader !== correctAuth) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Vision"' },
    })
  }
  return context.next()
}
