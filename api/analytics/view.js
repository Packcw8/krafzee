import { getSupabaseAdmin, getUserFromRequest, readJson, sendJson } from '../_utils.js'

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for']
  return Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  const body = await readJson(req)
  const listingId = body.listingId || null
  const boothId = body.boothId || null

  if (!listingId && !boothId) {
    sendJson(res, 400, { error: 'A listing or booth is required.' })
    return
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { user } = await getUserFromRequest(req)
  let resolvedBoothId = boothId

  if (listingId) {
    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('id, booth_id, is_hidden')
      .eq('id', listingId)
      .maybeSingle()

    if (!listing || listing.is_hidden) {
      sendJson(res, 404, { error: 'Listing not found.' })
      return
    }

    resolvedBoothId = listing.booth_id
  }

  if (resolvedBoothId) {
    const { data: booth } = await supabaseAdmin
      .from('booths')
      .select('id, is_hidden')
      .eq('id', resolvedBoothId)
      .maybeSingle()

    if (!booth || booth.is_hidden) {
      sendJson(res, 404, { error: 'Booth not found.' })
      return
    }
  }

  await supabaseAdmin
    .from('listing_views')
    .insert({
      booth_id: resolvedBoothId,
      listing_id: listingId,
      session_key: body.sessionKey || getClientIp(req) || null,
      source: body.source || null,
      user_agent: req.headers['user-agent'] || null,
      viewer_id: user?.id || null,
    })

  if (listingId) {
    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('view_count')
      .eq('id', listingId)
      .single()

    await supabaseAdmin
      .from('listings')
      .update({
        last_viewed_at: new Date().toISOString(),
        view_count: (listing?.view_count ?? 0) + 1,
      })
      .eq('id', listingId)
  }

  if (resolvedBoothId) {
    const { data: booth } = await supabaseAdmin
      .from('booths')
      .select('view_count')
      .eq('id', resolvedBoothId)
      .single()

    await supabaseAdmin
      .from('booths')
      .update({
        last_viewed_at: new Date().toISOString(),
        view_count: (booth?.view_count ?? 0) + 1,
      })
      .eq('id', resolvedBoothId)
  }

  sendJson(res, 200, { ok: true })
}
