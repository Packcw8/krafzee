import { getSupabaseAdmin, readRawBody, sendJson } from '../_utils.js'

function normalizeTrackingStatus(status = '') {
  const normalized = String(status).toLowerCase()

  if (normalized.includes('delivered')) return 'delivered'
  if (normalized.includes('out_for_delivery')) return 'out_for_delivery'
  if (normalized.includes('transit')) return 'in_transit'
  if (normalized.includes('pre_transit')) return 'pre_transit'
  if (normalized.includes('return')) return 'returned'
  if (normalized.includes('fail') || normalized.includes('error')) return 'failure'
  return 'unknown'
}

function getEventId(payload) {
  return (
    payload.object_id ||
    payload.event_id ||
    payload.data?.object_id ||
    payload.data?.tracking_number ||
    `${payload.event || 'shippo'}:${Date.now()}`
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const rawBody = await readRawBody(req)
  const signature = req.headers['shippo-signature'] || req.headers['x-shippo-signature']

  if (process.env.SHIPPO_WEBHOOK_SECRET && signature !== process.env.SHIPPO_WEBHOOK_SECRET) {
    sendJson(res, 401, { error: 'Invalid webhook signature.' })
    return
  }

  const payload = rawBody.length ? JSON.parse(rawBody.toString('utf8')) : {}
  const trackingNumber =
    payload.tracking_number ||
    payload.data?.tracking_number ||
    payload.object?.tracking_number
  const providerStatus =
    payload.tracking_status?.status ||
    payload.data?.tracking_status?.status ||
    payload.object?.tracking_status?.status ||
    payload.status
  const normalizedStatus = normalizeTrackingStatus(providerStatus)
  const supabaseAdmin = getSupabaseAdmin()

  const { data: label } = trackingNumber
    ? await supabaseAdmin
        .from('shipping_labels')
        .select('id, shipment_id')
        .eq('tracking_number', trackingNumber)
        .maybeSingle()
    : { data: null }

  const eventId = getEventId(payload)
  const { error: eventError } = await supabaseAdmin
    .from('shipping_events')
    .insert({
      shipment_id: label?.shipment_id ?? null,
      shipping_label_id: label?.id ?? null,
      provider: 'shippo',
      provider_event_id: eventId,
      normalized_status: normalizedStatus,
      provider_status: providerStatus || null,
      message: payload.message || null,
      payload,
    })

  if (eventError && eventError.code !== '23505') {
    sendJson(res, 500, { error: 'Could not save shipping event.' })
    return
  }

  if (label?.shipment_id) {
    await supabaseAdmin
      .from('shipments')
      .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
      .eq('id', label.shipment_id)

    await supabaseAdmin
      .from('shipping_labels')
      .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
      .eq('id', label.id)
  }

  sendJson(res, 200, { received: true })
}
