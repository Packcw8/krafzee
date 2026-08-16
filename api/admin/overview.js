import { requireAdminUser, sendJson } from '../_utils.js'

function centsToDollars(cents = 0) {
  return Number(cents || 0) / 100
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  const { supabaseAdmin } = await requireAdminUser(req, res)

  if (!supabaseAdmin) {
    return
  }

  const [
    boothsResponse,
    listingsResponse,
    ordersResponse,
    recentBoothsResponse,
    recentListingsResponse,
    topListingsResponse,
  ] = await Promise.all([
    supabaseAdmin.from('booths').select('id, is_verified, is_hidden', { count: 'exact' }),
    supabaseAdmin.from('listings').select('id, is_verified, is_hidden', { count: 'exact' }),
    supabaseAdmin.from('orders').select('id, status, subtotal_amount, shipping_amount', { count: 'exact' }),
    supabaseAdmin
      .from('booths')
      .select('id, name, owner_id, owner_name, market_type, location, is_verified, is_hidden, view_count, created_at')
      .order('created_at', { ascending: false })
      .limit(12),
    supabaseAdmin
      .from('listings')
      .select('id, booth_id, title, category, price, quantity, is_verified, is_hidden, view_count, created_at')
      .order('created_at', { ascending: false })
      .limit(16),
    supabaseAdmin
      .from('listings')
      .select('id, booth_id, title, category, price, view_count, last_viewed_at')
      .order('view_count', { ascending: false })
      .limit(10),
  ])

  const boothOwnerIds = [...new Set((recentBoothsResponse.data ?? []).map((booth) => booth.owner_id).filter(Boolean))]
  const userEmailById = new Map()

  if (boothOwnerIds.length > 0) {
    const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })

    for (const user of usersPage?.users ?? []) {
      if (boothOwnerIds.includes(user.id)) {
        userEmailById.set(user.id, user.email)
      }
    }
  }

  const orders = ordersResponse.data ?? []
  const grossSales = orders
    .filter((order) => order.status === 'paid')
    .reduce((total, order) => total + Number(order.subtotal_amount || 0) + Number(order.shipping_amount || 0), 0)

  sendJson(res, 200, {
    stats: {
      booths: boothsResponse.count ?? 0,
      hiddenBooths: (boothsResponse.data ?? []).filter((booth) => booth.is_hidden).length,
      listings: listingsResponse.count ?? 0,
      hiddenListings: (listingsResponse.data ?? []).filter((listing) => listing.is_hidden).length,
      orders: ordersResponse.count ?? 0,
      paidOrders: orders.filter((order) => order.status === 'paid').length,
      grossSales: centsToDollars(grossSales),
      verifiedBooths: (boothsResponse.data ?? []).filter((booth) => booth.is_verified).length,
    },
    booths: (recentBoothsResponse.data ?? []).map((booth) => ({
      ...booth,
      owner_email: userEmailById.get(booth.owner_id) ?? '',
    })),
    listings: recentListingsResponse.data ?? [],
    topListings: topListingsResponse.data ?? [],
  })
}
