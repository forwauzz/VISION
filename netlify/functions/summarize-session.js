import { handleSummarizeSession, corsHeaders } from './api.js'

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(event.headers?.origin), body: '' }
  }
  return handleSummarizeSession(event)
}
