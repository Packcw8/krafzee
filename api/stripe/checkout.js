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

  const {
    items: rawItems,
    selectedShippingRates: rawSelectedShippingRates = {},
    shippingQuoteId = null,
    shipTo = {},
  } = await readJson(req)
  const cartItems = normalizeCartItems(rawItems)

  if (cartItems.length === 0) {
    sendJson(res, 400, { error: 'Add at least one priced item before checkout.' })
    return
  }

  const listingIds = [...new Set(cartItems.map((item) => item.id))]
  const { data: listings, error: listingError } = await supabaseAdmin
    .from('listings')
    .select(`
      id,
      booth_id,
      title,
      description,
      price,
      image_url,
      requires_shipping,
      free_shipping
    `)
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
  const shippingLineItems = []
  const buyer = await getOptionalBuyer(req, supabaseAdmin)
  let subtotalAmount = 0
  let platformFeeAmount = 0
  let shippingAmount = 0
  let shippingPostageAmount = 0
  let shippingServiceFeeAmount = 0
  let sellerShippingResponsibilityAmount = 0

  const shippableBoothIds = [
    ...new Set(
      cartItems
        .map((item) => listingById.get(item.id))
        .filter((listing) => listing?.requires_shipping !== false)
        .map((listing) => listing.booth_id),
    ),
  ]
  const selectedRateIds = Object.values(rawSelectedShippingRates)
    .map((rateId) => String(rateId || ''))
    .filter(Boolean)
  const selectedRateByBoothId = new Map()

  if (shippableBoothIds.length > 0) {
    if (!shippingQuoteId || selectedRateIds.length !== shippableBoothIds.length) {
      sendJson(res, 400, { error: 'Choose shipping for each seller before checkout.' })
      return
    }

    if (!buyer) {
      sendJson(res, 401, { error: 'Sign in before checking out with shipped items.' })
      return
    }

    const { data: shippingQuote, error: quoteError } = await supabaseAdmin
      .from('shipping_quotes')
      .select('id, buyer_id, expires_at, destination_address, status')
      .eq('id', shippingQuoteId)
      .maybeSingle()

    if (
      quoteError ||
      !shippingQuote ||
      shippingQuote.buyer_id !== buyer.id ||
      shippingQuote.status !== 'active' ||
      new Date(shippingQuote.expires_at).getTime() <= Date.now()
    ) {
      sendJson(res, 400, { error: 'Shipping rates expired. Calculate shipping again.' })
      return
    }

    const { data: selectedRates, error: selectedRateError } = await supabaseAdmin
      .from('shipping_rates')
      .select('*')
      .eq('shipping_quote_id', shippingQuoteId)
      .in('id', selectedRateIds)

    if (selectedRateError || selectedRates?.length !== shippableBoothIds.length) {
      sendJson(res, 400, { error: 'We could not confirm the selected shipping rates.' })
      return
    }

    for (const boothId of shippableBoothIds) {
      const selectedRateId = rawSelectedShippingRates[boothId]
      const selectedRate = selectedRates.find((rate) => rate.id === selectedRateId && rate.booth_id === boothId)

      if (!selectedRate || new Date(selectedRate.expires_at).getTime() <= Date.now()) {
        sendJson(res, 400, { error: 'Shipping rates expired. Calculate shipping again.' })
        return
      }

      selectedRateByBoothId.set(boothId, selectedRate)
      shippingAmount += selectedRate.customer_shipping_charge
      shippingPostageAmount += selectedRate.carrier_postage_cost
      shippingServiceFeeAmount += selectedRate.krafzee_shipping_fee
      sellerShippingResponsibilityAmount += selectedRate.seller_shipping_responsibility

      if (selectedRate.customer_shipping_charge > 0) {
        const booth = boothById.get(boothId)
        shippingLineItems.push({
          quantity: 1,
          price_data: {
            currency: selectedRate.currency || 'usd',
            unit_amount: selectedRate.customer_shipping_charge,
            product_data: {
              name: `Shipping - ${booth?.name || 'seller'}`,
              description: `${selectedRate.carrier} ${selectedRate.service}`,
              metadata: {
                shipping_rate_id: selectedRate.id,
                booth_id: boothId,
              },
            },
          },
        })
      }
    }
  }

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
      requires_shipping: listing.requires_shipping !== false,
      free_shipping: Boolean(listing.free_shipping),
      shipping_responsibility_amount: 0,
    })
  }

  const sellerShippingByBoothId = Array.from(selectedRateByBoothId.values()).reduce((groups, rate) => {
    groups.set(rate.booth_id, rate.seller_shipping_responsibility || 0)
    return groups
  }, new Map())

  for (const [boothId, responsibilityAmount] of sellerShippingByBoothId.entries()) {
    if (responsibilityAmount <= 0) {
      continue
    }

    const sellerItems = orderItems.filter((item) => item.booth_id === boothId)
    let remainingResponsibility = responsibilityAmount
    const sellerMerchandiseTotal = sellerItems.reduce((total, item) => total + item.seller_amount, 0)

    if (sellerMerchandiseTotal < responsibilityAmount) {
      sendJson(res, 400, {
        error: 'A free-shipping item does not leave enough seller proceeds to cover postage.',
      })
      return
    }

    sellerItems.forEach((item, index) => {
      const itemResponsibility =
        index === sellerItems.length - 1
          ? remainingResponsibility
          : Math.min(item.seller_amount, Math.round(responsibilityAmount * (item.seller_amount / sellerMerchandiseTotal)))

      item.seller_amount -= itemResponsibility
      item.shipping_responsibility_amount = itemResponsibility
      remainingResponsibility -= itemResponsibility
    })
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      buyer_id: buyer?.id ?? null,
      status: 'pending',
      subtotal_amount: subtotalAmount,
      platform_fee_amount: platformFeeAmount,
      shipping_amount: shippingAmount,
      shipping_postage_amount: shippingPostageAmount,
      shipping_service_fee_amount: shippingServiceFeeAmount,
      seller_shipping_responsibility_amount: sellerShippingResponsibilityAmount,
      shipping_quote_id: shippingQuoteId,
      shipping_address: shipTo,
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

  const { data: insertedOrderItems, error: itemError } = await supabaseAdmin
    .from('order_items')
    .insert(orderRows)
    .select('id, booth_id, quantity')

  if (itemError || !insertedOrderItems) {
    sendJson(res, 500, { error: 'We could not prepare this order.' })
    return
  }

  for (const [boothId, selectedRate] of selectedRateByBoothId.entries()) {
    const { data: fulfillment, error: fulfillmentError } = await supabaseAdmin
      .from('order_fulfillments')
      .insert({
        order_id: order.id,
        booth_id: boothId,
        status: 'pending',
        selected_shipping_rate_id: selectedRate.id,
        buyer_shipping_charge: selectedRate.customer_shipping_charge,
        carrier_postage_cost: selectedRate.carrier_postage_cost,
        shipping_api_cost: selectedRate.shipping_api_cost,
        krafzee_shipping_fee: selectedRate.krafzee_shipping_fee,
        seller_shipping_responsibility: selectedRate.seller_shipping_responsibility,
        total_shipping_cost: selectedRate.total_shipping_cost,
      })
      .select('id')
      .single()

    if (fulfillmentError || !fulfillment) {
      sendJson(res, 500, { error: 'We could not prepare seller shipping.' })
      return
    }

    const { data: shipment, error: shipmentError } = await supabaseAdmin
      .from('shipments')
      .insert({
        order_fulfillment_id: fulfillment.id,
        provider: selectedRate.provider,
        status: 'pending',
        ship_to_address: shipTo,
        selected_shipping_rate_id: selectedRate.id,
      })
      .select('id')
      .single()

    if (shipmentError || !shipment) {
      sendJson(res, 500, { error: 'We could not prepare seller shipping.' })
      return
    }

    const shipmentItems = insertedOrderItems
      .filter((item) => item.booth_id === boothId)
      .map((item) => ({
        shipment_id: shipment.id,
        order_item_id: item.id,
        quantity: item.quantity,
      }))

    if (shipmentItems.length > 0) {
      const { error: shipmentItemsError } = await supabaseAdmin
        .from('shipment_items')
        .insert(shipmentItems)

      if (shipmentItemsError) {
        sendJson(res, 500, { error: 'We could not prepare seller shipping.' })
        return
      }
    }
  }

  const siteUrl = getSiteUrl(req)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [...checkoutLineItems, ...shippingLineItems],
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
