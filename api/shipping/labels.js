import { getSupabaseAdmin, getUserFromRequest, readJson, sendJson } from '../_utils.js'
import { createShippingProvider, getShippingServiceFeeCents, isShippingTestMode } from '../_shipping.js'

function normalizeStatus(status = '') {
  const normalized = String(status).toLowerCase()

  if (normalized.includes('delivered')) return 'delivered'
  if (normalized.includes('out_for_delivery')) return 'out_for_delivery'
  if (normalized.includes('transit')) return 'in_transit'
  if (normalized.includes('pre_transit')) return 'pre_transit'
  if (normalized.includes('return')) return 'returned'
  if (normalized.includes('fail') || normalized.includes('error')) return 'failure'
  return 'unknown'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { user, error: userError } = await getUserFromRequest(req)

  if (!user) {
    sendJson(res, 401, { error: userError })
    return
  }

  const { fulfillmentId, idempotencyKey } = await readJson(req)

  if (!fulfillmentId || !idempotencyKey) {
    sendJson(res, 400, { error: 'Missing fulfillment or idempotency key.' })
    return
  }

  const { data: fulfillment, error: fulfillmentError } = await supabaseAdmin
    .from('order_fulfillments')
    .select(`
      id,
      order_id,
      booth_id,
      selected_shipping_rate_id,
      total_shipping_cost,
      carrier_postage_cost,
      krafzee_shipping_fee,
      orders!inner(status),
      booths!inner(owner_id)
    `)
    .eq('id', fulfillmentId)
    .maybeSingle()

  if (fulfillmentError || !fulfillment) {
    sendJson(res, 404, { error: 'Shipment not found.' })
    return
  }

  if (fulfillment.booths.owner_id !== user.id) {
    sendJson(res, 403, { error: 'You can only buy labels for your own booth.' })
    return
  }

  if (fulfillment.orders.status !== 'paid') {
    sendJson(res, 400, { error: 'Labels can only be purchased after payment is complete.' })
    return
  }

  const { data: existingLabel } = await supabaseAdmin
    .from('shipping_labels')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  if (existingLabel) {
    sendJson(res, 200, { label: existingLabel })
    return
  }

  const { data: shipment, error: shipmentError } = await supabaseAdmin
    .from('shipments')
    .select('id, selected_shipping_rate_id')
    .eq('order_fulfillment_id', fulfillment.id)
    .maybeSingle()

  if (shipmentError || !shipment) {
    sendJson(res, 404, { error: 'Shipment not found.' })
    return
  }

  const { data: rate, error: rateError } = await supabaseAdmin
    .from('shipping_rates')
    .select('*')
    .eq('id', fulfillment.selected_shipping_rate_id || shipment.selected_shipping_rate_id)
    .maybeSingle()

  if (rateError || !rate) {
    sendJson(res, 400, { error: 'Shipping rate not found.' })
    return
  }

  const provider = createShippingProvider()
  const shippingFeeCents = await getShippingServiceFeeCents(supabaseAdmin)
  const transaction = await provider.purchaseLabel({
    rateId: rate.provider_rate_id,
    metadata: `${fulfillment.order_id}:${fulfillment.booth_id}`.slice(0, 100),
  })
  const status = normalizeStatus(transaction.status || 'label_created')

  const { data: label, error: labelError } = await supabaseAdmin
    .from('shipping_labels')
    .insert({
      shipment_id: shipment.id,
      provider: rate.provider,
      provider_transaction_id: transaction.providerTransactionId,
      provider_rate_id: rate.provider_rate_id,
      carrier: rate.carrier,
      service: rate.service,
      label_url: transaction.labelUrl,
      tracking_number: transaction.trackingNumber,
      tracking_url: transaction.trackingUrl,
      status,
      postage_amount: rate.carrier_postage_cost,
      krafzee_shipping_fee: shippingFeeCents,
      is_test: isShippingTestMode(),
      idempotency_key: idempotencyKey,
      purchased_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (labelError || !label) {
    sendJson(res, 500, { error: 'We could not save the purchased label.' })
    return
  }

  await supabaseAdmin
    .from('shipments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', shipment.id)

  await supabaseAdmin
    .from('order_fulfillments')
    .update({ status: 'label_created', updated_at: new Date().toISOString() })
    .eq('id', fulfillment.id)

  await supabaseAdmin
    .from('shipping_events')
    .insert({
      shipment_id: shipment.id,
      shipping_label_id: label.id,
      provider: rate.provider,
      provider_event_id: transaction.providerTransactionId,
      normalized_status: status,
      provider_status: transaction.status || 'label_created',
      payload: transaction,
    })

  sendJson(res, 200, { label })
}
