const SHIPPO_API_BASE_URL = 'https://api.goshippo.com'
const DEFAULT_SHIPPING_FEE_CENTS = 35
const RATE_EXPIRATION_MINUTES = 30

export function centsToDollars(cents) {
  return (Number(cents || 0) / 100).toFixed(2)
}

export function dollarsToCents(amount) {
  return Math.round(Number(amount || 0) * 100)
}

export function isShippingTestMode() {
  return process.env.SHIPPO_TEST_MODE === 'true' || process.env.NODE_ENV !== 'production'
}

export async function getShippingServiceFeeCents(supabaseAdmin) {
  const { data } = await supabaseAdmin
    .from('platform_settings')
    .select('value')
    .eq('key', 'krafzee_shipping_service_fee_cents')
    .maybeSingle()

  const configuredFee = Number(data?.value)
  return Number.isFinite(configuredFee) ? configuredFee : DEFAULT_SHIPPING_FEE_CENTS
}

export function getRateExpirationDate() {
  return new Date(Date.now() + RATE_EXPIRATION_MINUTES * 60 * 1000)
}

export function normalizeAddress(address = {}) {
  return {
    name: String(address.name || '').trim(),
    street1: String(address.street1 || '').trim(),
    street2: String(address.street2 || '').trim(),
    city: String(address.city || '').trim(),
    state: String(address.state || '').trim().toUpperCase(),
    zip: String(address.zip || '').trim(),
    country: String(address.country || 'US').trim().toUpperCase(),
    phone: String(address.phone || '').trim(),
    email: String(address.email || '').trim(),
  }
}

export function validateShippingAddress(address, label = 'shipping address') {
  const missing = ['name', 'street1', 'city', 'state', 'zip', 'country'].filter((key) => !address[key])

  if (missing.length > 0) {
    return `${label} is missing ${missing.join(', ')}.`
  }

  return ''
}

export function normalizeWeightToOunces(weight, unit = 'oz') {
  const numericWeight = Number(weight || 0)

  if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
    return 0
  }

  if (unit === 'lb') {
    return numericWeight * 16
  }

  if (unit === 'g') {
    return numericWeight * 0.035274
  }

  if (unit === 'kg') {
    return numericWeight * 35.274
  }

  return numericWeight
}

export function buildParcelForGroup(items, savedPackage) {
  const totalItemWeightOz = items.reduce(
    (total, item) =>
      total + normalizeWeightToOunces(item.listing.weight, item.listing.weight_unit) * item.quantity,
    0,
  )
  const packageWeightOz = normalizeWeightToOunces(savedPackage?.empty_weight, savedPackage?.weight_unit)
  const firstListing = items[0]?.listing ?? {}
  const length = Number(savedPackage?.length || firstListing.package_length || 8)
  const width = Number(savedPackage?.width || firstListing.package_width || 6)
  const height = Number(savedPackage?.height || firstListing.package_height || 2)

  return {
    length,
    width,
    height,
    distance_unit: savedPackage?.dimension_unit || firstListing.dimension_unit || 'in',
    weight: Number((totalItemWeightOz + packageWeightOz).toFixed(2)),
    mass_unit: 'oz',
  }
}

function shippoAddress(address) {
  return {
    name: address.name,
    street1: address.street1,
    street2: address.street2 || undefined,
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country || 'US',
    phone: address.phone || undefined,
    email: address.email || undefined,
  }
}

function formatCarrier(value = '') {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function mockRates(parcel) {
  const weight = Math.max(1, Number(parcel.weight || 1))
  const ground = Math.round(395 + weight * 18)
  const priority = Math.round(695 + weight * 24)

  return [
    {
      providerRateId: `mock_ground_${weight}`,
      carrier: 'USPS',
      service: 'Ground Advantage',
      amount: ground,
      currency: 'usd',
      estimatedDays: 5,
    },
    {
      providerRateId: `mock_priority_${weight}`,
      carrier: 'USPS',
      service: 'Priority Mail',
      amount: priority,
      currency: 'usd',
      estimatedDays: 3,
    },
  ]
}

export function createShippingProvider() {
  const provider = process.env.SHIPPING_PROVIDER || 'shippo'
  const apiKey = process.env.SHIPPO_API_KEY
  const testMode = isShippingTestMode()

  async function shippoRequest(path, payload) {
    if (!apiKey) {
      throw new Error('Missing server configuration: SHIPPO_API_KEY')
    }

    const response = await fetch(`${SHIPPO_API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        authorization: `ShippoToken ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.detail || data?.message || 'Shippo request failed.')
    }

    return data
  }

  return {
    name: provider,
    testMode,
    async getRates({ addressFrom, addressTo, parcel, metadata }) {
      if (testMode && !apiKey) {
        return mockRates(parcel)
      }

      if (provider !== 'shippo') {
        throw new Error(`Unsupported shipping provider: ${provider}`)
      }

      const addressFromResult = await shippoRequest('/addresses/', shippoAddress(addressFrom))
      const addressToResult = await shippoRequest('/addresses/', shippoAddress(addressTo))
      const parcelResult = await shippoRequest('/parcels/', parcel)
      const shipment = await shippoRequest('/shipments/', {
        address_from: addressFromResult.object_id,
        address_to: addressToResult.object_id,
        parcels: [parcelResult.object_id],
        async: false,
        metadata,
      })

      return (shipment.rates || [])
        .filter((rate) => rate.object_id && rate.amount)
        .map((rate) => ({
          providerRateId: rate.object_id,
          carrier: formatCarrier(rate.provider || rate.carrier || 'Carrier'),
          service: rate.servicelevel?.name || rate.servicelevel?.token || rate.service || 'Shipping',
          amount: dollarsToCents(rate.amount),
          currency: (rate.currency || 'usd').toLowerCase(),
          estimatedDays: rate.estimated_days ?? null,
        }))
    },
    async purchaseLabel({ rateId, metadata }) {
      if (testMode && !apiKey) {
        return {
          providerTransactionId: `mock_txn_${rateId}`,
          labelUrl: '',
          trackingNumber: `TEST${Date.now()}`,
          trackingUrl: '',
          status: 'label_created',
          metadata,
        }
      }

      if (provider !== 'shippo') {
        throw new Error(`Unsupported shipping provider: ${provider}`)
      }

      const transaction = await shippoRequest('/transactions/', {
        rate: rateId,
        async: false,
        label_file_type: 'PDF',
        metadata,
      })

      if (transaction.status && transaction.status !== 'SUCCESS') {
        throw new Error(transaction.messages?.[0]?.text || 'Shippo could not purchase this label.')
      }

      return {
        providerTransactionId: transaction.object_id,
        labelUrl: transaction.label_url,
        trackingNumber: transaction.tracking_number,
        trackingUrl: transaction.tracking_url_provider,
        status: 'label_created',
        metadata,
      }
    },
  }
}
