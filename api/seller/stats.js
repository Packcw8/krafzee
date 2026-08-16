import { getSupabaseAdmin, getUserFromRequest, sendJson } from '../_utils.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  const { user, error } = await getUserFromRequest(req)

  if (error) {
    sendJson(res, 401, { error })
    return
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: booth, error: boothError } = await supabaseAdmin
    .from('booths')
    .select('id, name, view_count, last_viewed_at, is_verified')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (boothError) {
    sendJson(res, 500, { error: 'Could not load seller stats.' })
    return
  }

  if (!booth) {
    sendJson(res, 200, {
      booth: null,
      listings: [],
      totals: { boothViews: 0, listingViews: 0, listings: 0 },
    })
    return
  }

  const { data: listings, error: listingError } = await supabaseAdmin
    .from('listings')
    .select('id, title, category, price, quantity, view_count, last_viewed_at, is_verified, is_hidden')
    .eq('booth_id', booth.id)
    .order('view_count', { ascending: false })

  if (listingError) {
    sendJson(res, 500, { error: 'Could not load listing stats.' })
    return
  }

  const visibleListings = listings ?? []
  const listingViews = visibleListings.reduce((total, listing) => total + Number(listing.view_count || 0), 0)

  sendJson(res, 200, {
    booth,
    listings: visibleListings,
    totals: {
      boothViews: Number(booth.view_count || 0),
      listingViews,
      listings: visibleListings.length,
    },
  })
}
