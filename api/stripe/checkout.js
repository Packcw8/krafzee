import {
  getSiteUrl,
  getStripe,
  getSupabaseAdmin,
  platformFeeFor,
  readJson,
  requireServerConfig,
  sendJson,
  toCents,
} from '../_utils.js'

function getBearerToken(req) {
  const authHeader = req.headers.authorization || ''
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
}

async function getOptionalBuyer(req, supabaseAdmin) {
  const token = getBearerToken(req)

  if (!token) {
    return null
  }

  const { data } = await supabaseAdmin.auth.getUser(token)
  return data.user ?? null
}

function normalizeCartItems(rawItems) {
  if (!Array.isArray(rawItems)) {
    return []
  }

  return rawItems
    .map((item) => ({
      id: String(item.id || ''),
      quantity: Math.max(1, Math.min(Number(item.quantity) || 1, 25)),
      selectedOption: item.selectedOption ? String(item.selectedOption) : '',
    }))
    .filter((item) => item.id)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  if (!requireServerConfig(res, ['STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'])) {
    return
  }

  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()

  const { items: rawItems } = await readJson(req)
  const cartItems = normalizeCartItems(rawItems)

  if (cartItems.length === 0) {
    sendJson(res, 400, { error: 'Add at least one priced item before checkout.' })
    return
  }

  const listingIds = [...new Set(cartItems.map((item) => item.id))]
  const { data: listings, error: listingError } = await supabaseAdmin
    .from('listings')
    .select('id, booth_id, title, description, price, image_url')
    .in('id', listingIds)

  if (listingError || !listings?.length) {
    sendJson(res, 400, { error: 'We could not confirm the items in this cart.' })
    return
  }

  const listingById = new Map(listings.map((listing) => [listing.id, listing]))
  const boothIds = [...new Set(listings.map((listing) => listing.booth_id).filter(Boolean))]

  const { data: booths, error: boothError } = await supabaseAdmin
    .from('booths')
    .select('id, name, stripe_account_id, stripe_charges_enabled, stripe_onboarding_complete')
    .in('id', boothIds)

  if (boothError || !booths?.length) {
    sendJson(res, 400, { error: 'We could not confirm seller payout setup for this cart.' })
    return
  }

  const boothById = new Map(booths.map((booth) => [booth.id, booth]))
  const checkoutLineItems = []
  const orderItems = []
  let subtotalAmount = 0
  let platformFeeAmount = 0

  for (const cartItem of cartItems) {
    const listing = listingById.get(cartItem.id)
    const booth = listing ? boothById.get(listing.booth_id) : null
    const unitAmount = listing ? toCents(listing.price) : 0

    if (!listing || unitAmount <= 0) {
      sendJson(res, 400, { error: 'Remove unpriced items before checkout.' })
      return
    }

    if (!booth?.stripe_account_id || !booth.stripe_charges_enabled) {
      sendJson(res, 400, {
        error: `${booth?.name || 'A seller'} still needs to finish Stripe payout setup before checkout can accept this cart.`,
      })
      return
    }

    const totalAmount = unitAmount * cartItem.quantity
    const itemPlatformFee = platformFeeFor(totalAmount)
    const sellerAmount = totalAmount - itemPlatformFee

    subtotalAmount += totalAmount
    platformFeeAmount += itemPlatformFee

    checkoutLineItems.push({
      quantity: cartItem.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: unitAmount,
        product_data: {
          name: cartItem.selectedOption
            ? `${listing.title} - ${cartItem.selectedOption}`
            : listing.title,
          description: listing.description?.slice(0, 250) || undefined,
          images: listing.image_url ? [listing.image_url] : undefined,
          metadata: {
            listing_id: listing.id,
            booth_id: booth.id,
          },
        },
      },
    })

    orderItems.push({
      listing_id: listing.id,
      booth_id: booth.id,
      stripe_account_id: booth.stripe_account_id,
      title: listing.title,
      selected_option: cartItem.selectedOption || null,
      quantity: cartItem.quantity,
      unit_amount: unitAmount,
      total_amount: totalAmount,
      platform_fee_amount: itemPlatformFee,
      seller_amount: sellerAmount,
    })
  }

  const buyer = await getOptionalBuyer(req, supabaseAdmin)
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      buyer_id: buyer?.id ?? null,
      status: 'pending',
      subtotal_amount: subtotalAmount,
      platform_fee_amount: platformFeeAmount,
      currency: 'usd',
    })
    .select('id')
    .single()

  if (orderError || !order) {
    sendJson(res, 500, { error: 'We could not prepare this order.' })
    return
  }

  const orderRows = orderItems.map((item) => ({
    ...item,
    order_id: order.id,
  }))

  const { error: itemError } = await supabaseAdmin
    .from('order_items')
    .insert(orderRows)

  if (itemError) {
    sendJson(res, 500, { error: 'We could not prepare this order.' })
    return
  }

  const siteUrl = getSiteUrl(req)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: checkoutLineItems,
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
    automatic_tax: {
      enabled: process.env.STRIPE_TAX_ENABLED === 'true',
    },
    payment_intent_data: {
      transfer_group: order.id,
      metadata: {
        order_id: order.id,
      },
    },
    metadata: {
      order_id: order.id,
      platform_fee_amount: String(platformFeeAmount),
    },
  })

  await supabaseAdmin
    .from('orders')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', order.id)

  sendJson(res, 200, { url: session.url })
}
