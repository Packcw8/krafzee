import { getSupabaseAdmin, getUserFromRequest, readJson, sendJson } from '../_utils.js'
import {
  buildParcelForGroup,
  createShippingProvider,
  getRateExpirationDate,
  getShippingServiceFeeCents,
  normalizeAddress,
  validateShippingAddress,
} from '../_shipping.js'

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

function shippingAddressFromSetting(setting, booth) {
  return normalizeAddress({
    name: setting?.ship_from_name || booth.owner_name || booth.name,
    street1: setting?.ship_from_street1,
    street2: setting?.ship_from_street2,
    city: setting?.ship_from_city,
    state: setting?.ship_from_state,
    zip: setting?.ship_from_zip,
    country: setting?.ship_from_country || 'US',
    phone: setting?.ship_from_phone,
    email: setting?.ship_from_email,
  })
}

function publicRate(rate) {
  return {
    id: rate.id,
    carrier: rate.carrier,
    service: rate.service,
    amount: rate.customer_shipping_charge,
    currency: rate.currency,
    estimatedDays: rate.estimated_days,
    freeShipping: rate.customer_shipping_charge === 0,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { user } = await getUserFromRequest(req)
  const { items: rawItems, shipTo: rawShipTo } = await readJson(req)
  const cartItems = normalizeCartItems(rawItems)
  const shipTo = normalizeAddress(rawShipTo)
  const addressError = validateShippingAddress(shipTo, 'Delivery address')

  if (!user) {
    sendJson(res, 401, { error: 'Sign in to calculate shipping.' })
    return
  }

  if (cartItems.length === 0) {
    sendJson(res, 400, { error: 'Add at least one item before calculating shipping.' })
    return
  }

  if (addressError) {
    sendJson(res, 400, { error: addressError })
    return
  }

  const listingIds = [...new Set(cartItems.map((item) => item.id))]
  const { data: listings, error: listingError } = await supabaseAdmin
    .from('listings')
    .select(`
      id,
      booth_id,
      title,
      price,
      requires_shipping,
      free_shipping,
      weight,
      weight_unit,
      package_length,
      package_width,
      package_height,
      dimension_unit,
      is_hidden
    `)
    .in('id', listingIds)

  if (listingError || !listings?.length) {
    sendJson(res, 400, { error: 'We could not confirm the items in this cart.' })
    return
  }

  if (listings.some((listing) => listing.is_hidden)) {
    sendJson(res, 400, { error: 'One or more items in this cart are not available.' })
    return
  }

  const listingById = new Map(listings.map((listing) => [listing.id, listing]))
  const boothIds = [...new Set(listings.map((listing) => listing.booth_id).filter(Boolean))]
  const { data: booths, error: boothError } = await supabaseAdmin
    .from('booths')
    .select('id, owner_id, name, owner_name, is_hidden')
    .in('id', boothIds)

  if (boothError || !booths?.length) {
    sendJson(res, 400, { error: 'We could not confirm seller shipping setup for this cart.' })
    return
  }

  if (booths.some((booth) => booth.is_hidden)) {
    sendJson(res, 400, { error: 'One or more booths in this cart are not available.' })
    return
  }

  const { data: settings } = await supabaseAdmin
    .from('seller_shipping_settings')
    .select('*')
    .in('booth_id', boothIds)

  const { data: packages } = await supabaseAdmin
    .from('seller_packages')
    .select('*')
    .in('booth_id', boothIds)
    .order('is_default', { ascending: false })

  const boothById = new Map(booths.map((booth) => [booth.id, booth]))
  const settingsByBoothId = new Map((settings ?? []).map((setting) => [setting.booth_id, setting]))
  const packagesByBoothId = (packages ?? []).reduce((groups, sellerPackage) => {
    const current = groups.get(sellerPackage.booth_id) ?? []
    current.push(sellerPackage)
    groups.set(sellerPackage.booth_id, current)
    return groups
  }, new Map())

  const groupedItems = cartItems.reduce((groups, item) => {
    const listing = listingById.get(item.id)

    if (!listing || listing.requires_shipping === false) {
      return groups
    }

    const current = groups.get(listing.booth_id) ?? []
    current.push({ listing, quantity: item.quantity })
    groups.set(listing.booth_id, current)
    return groups
  }, new Map())

  if (groupedItems.size === 0) {
    sendJson(res, 200, {
      quoteId: null,
      groups: [],
      shippingAmount: 0,
      message: 'No shipping needed for this cart.',
    })
    return
  }

  const shippingFeeCents = await getShippingServiceFeeCents(supabaseAdmin)
  const provider = createShippingProvider()
  const expiresAt = getRateExpirationDate()
  const { data: quote, error: quoteError } = await supabaseAdmin
    .from('shipping_quotes')
    .insert({
      buyer_id: user.id,
      currency: 'usd',
      destination_address: shipTo,
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single()

  if (quoteError || !quote) {
    sendJson(res, 500, { error: 'We could not prepare shipping rates.' })
    return
  }

  const responseGroups = []

  for (const [boothId, items] of groupedItems.entries()) {
    const booth = boothById.get(boothId)
    const setting = settingsByBoothId.get(boothId)
    const sellerPackages = packagesByBoothId.get(boothId) ?? []
    const defaultPackage =
      sellerPackages.find((sellerPackage) => sellerPackage.id === setting?.default_package_id) ||
      sellerPackages.find((sellerPackage) => sellerPackage.is_default) ||
      sellerPackages[0]
    const addressFrom = shippingAddressFromSetting(setting, booth)
    const fromAddressError = validateShippingAddress(addressFrom, `${booth?.name || 'Seller'} ship-from address`)
    const missingWeightItem = items.find((item) => !Number(item.listing.weight))

    if (fromAddressError) {
      sendJson(res, 400, { error: fromAddressError })
      return
    }

    if (missingWeightItem) {
      sendJson(res, 400, {
        error: `${missingWeightItem.listing.title} needs a shipping weight before checkout.`,
      })
      return
    }

    const parcel = buildParcelForGroup(items, defaultPackage)
    const sellerPaid = items.every((item) => item.listing.free_shipping)
    const { data: quoteGroup, error: quoteGroupError } = await supabaseAdmin
      .from('shipping_quote_groups')
      .insert({
        shipping_quote_id: quote.id,
        booth_id: boothId,
        seller_paid: sellerPaid,
        total_weight: parcel.weight,
        weight_unit: parcel.mass_unit,
        package_length: parcel.length,
        package_width: parcel.width,
        package_height: parcel.height,
        dimension_unit: parcel.distance_unit,
      })
      .select('id')
      .single()

    if (quoteGroupError || !quoteGroup) {
      sendJson(res, 500, { error: 'We could not prepare shipping rates.' })
      return
    }

    const rates = await provider.getRates({
      addressFrom,
      addressTo: shipTo,
      parcel,
      metadata: `${quote.id}:${boothId}`.slice(0, 100),
    })

    if (!rates.length) {
      sendJson(res, 400, { error: `${booth?.name || 'A seller'} has no shipping rates available.` })
      return
    }

    const rateRows = rates.slice(0, 4).map((rate) => {
      const customerShippingCharge = sellerPaid ? 0 : rate.amount + shippingFeeCents
      const sellerShippingResponsibility = sellerPaid ? rate.amount + shippingFeeCents : 0

      return {
        shipping_quote_id: quote.id,
        shipping_quote_group_id: quoteGroup.id,
        provider: provider.name,
        provider_rate_id: rate.providerRateId,
        carrier: rate.carrier,
        service: rate.service,
        amount: rate.amount,
        currency: rate.currency,
        estimated_days: rate.estimatedDays,
        seller_id: booth.owner_id,
        booth_id: boothId,
        carrier_postage_cost: rate.amount,
        shipping_api_cost: 0,
        krafzee_shipping_fee: shippingFeeCents,
        customer_shipping_charge: customerShippingCharge,
        seller_shipping_responsibility: sellerShippingResponsibility,
        total_shipping_cost: rate.amount + shippingFeeCents,
        expires_at: expiresAt.toISOString(),
      }
    })

    const { data: insertedRates, error: ratesError } = await supabaseAdmin
      .from('shipping_rates')
      .insert(rateRows)
      .select('id, carrier, service, customer_shipping_charge, currency, estimated_days')

    if (ratesError || !insertedRates?.length) {
      sendJson(res, 500, { error: 'We could not save shipping rates.' })
      return
    }

    responseGroups.push({
      boothId,
      boothName: booth.name,
      sellerPaid,
      rates: insertedRates.map(publicRate),
    })
  }

  sendJson(res, 200, {
    quoteId: quote.id,
    expiresAt: expiresAt.toISOString(),
    groups: responseGroups,
  })
}
