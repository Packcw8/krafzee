import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing server configuration: STRIPE_SECRET_KEY')
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL

  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing server configuration: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
    },
  })
}

export function getSiteUrl(req) {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, '')
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host
  const protocol = req.headers['x-forwarded-proto'] || 'https'

  return `${protocol}://${host}`
}

export function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(payload))
}

export async function readJson(req) {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk))
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')

  return rawBody ? JSON.parse(rawBody) : {}
}

export async function readRawBody(req) {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

export async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return { user: null, error: 'Sign in to continue.' }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data.user) {
    return { user: null, error: 'Your session expired. Please sign in again.' }
  }

  return { user: data.user, error: null }
}

export function requireServerConfig(res, requiredEnvNames) {
  const missing = requiredEnvNames.filter((name) => !process.env[name])

  if (missing.length > 0) {
    sendJson(res, 500, {
      error: `Missing server configuration: ${missing.join(', ')}`,
    })
    return false
  }

  return true
}

export function toCents(price) {
  const amount = Math.round(Number(price) * 100)

  return Number.isFinite(amount) ? amount : 0
}

export function platformFeeFor(amount) {
  const feePercent = Number(process.env.PLATFORM_FEE_PERCENT || 10)
  const normalizedFeePercent = Number.isFinite(feePercent) ? feePercent : 10

  return Math.round(amount * (normalizedFeePercent / 100))
}
