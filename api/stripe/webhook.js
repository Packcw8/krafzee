import {
  getStripe,
  getSupabaseAdmin,
  readRawBody,
  requireServerConfig,
  sendJson,
} from '../_utils.js'

async function createSellerTransfers(stripe, supabaseAdmin, orderId, paymentIntentId, sourceChargeId) {
  const { data: items, error } = await supabaseAdmin
    .from('order_items')
    .select('id, stripe_account_id, seller_amount')
    .eq('order_id', orderId)

  if (error || !items?.length) {
    throw new Error('No order items found for transfer.')
  }

  const transferGroups = items.reduce((groups, item) => {
    const current = groups.get(item.stripe_account_id) ?? {
      amount: 0,
      itemIds: [],
    }

    current.amount += item.seller_amount
    current.itemIds.push(item.id)
    groups.set(item.stripe_account_id, current)

    return groups
  }, new Map())

  for (const [stripeAccountId, transferGroup] of transferGroups.entries()) {
    if (transferGroup.amount <= 0) {
      continue
    }

    const transfer = await stripe.transfers.create({
      amount: transferGroup.amount,
      currency: 'usd',
      destination: stripeAccountId,
      source_transaction: sourceChargeId,
      transfer_group: orderId,
      metadata: {
        order_id: orderId,
        payment_intent_id: paymentIntentId,
      },
    })

    await supabaseAdmin
      .from('order_items')
      .update({ stripe_transfer_id: transfer.id })
      .in('id', transferGroup.itemIds)
  }
}

async function handleCheckoutCompleted(stripe, supabaseAdmin, session) {
  const orderId = session.metadata?.order_id

  if (!orderId) {
    return
  }

  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .maybeSingle()

  if (!existingOrder || existingOrder.status === 'paid') {
    return
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent)
  const sourceChargeId =
    typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : null

  await createSellerTransfers(stripe, supabaseAdmin, orderId, session.payment_intent, sourceChargeId)

  await supabaseAdmin
    .from('orders')
    .update({
      status: 'paid',
      stripe_payment_intent_id: session.payment_intent,
      customer_email: session.customer_details?.email ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  if (!requireServerConfig(res, ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'SUPABASE_SERVICE_ROLE_KEY'])) {
    return
  }

  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()

  const signature = req.headers['stripe-signature']
  const rawBody = await readRawBody(req)
  let event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    sendJson(res, 400, { error: `Webhook signature check failed: ${error.message}` })
    return
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(stripe, supabaseAdmin, event.data.object)
    }

    sendJson(res, 200, { received: true })
  } catch (error) {
    sendJson(res, 500, { error: error.message })
  }
}
