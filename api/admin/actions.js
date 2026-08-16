import { readJson, requireAdminUser, sendJson } from '../_utils.js'

const allowedBoothActions = new Set(['verify', 'unverify', 'hide', 'show', 'delete'])
const allowedListingActions = new Set(['verify', 'unverify', 'hide', 'show', 'delete'])

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  const { supabaseAdmin, user } = await requireAdminUser(req, res)

  if (!supabaseAdmin) {
    return
  }

  const { action, id, target } = await readJson(req)

  if (!id || !target || !action) {
    sendJson(res, 400, { error: 'Target, action, and id are required.' })
    return
  }

  if (target === 'booth') {
    if (!allowedBoothActions.has(action)) {
      sendJson(res, 400, { error: 'Unsupported booth action.' })
      return
    }

    if (action === 'delete') {
      const { error } = await supabaseAdmin.from('booths').delete().eq('id', id)

      if (error) {
        sendJson(res, 500, { error: 'Could not delete this booth.' })
        return
      }

      sendJson(res, 200, { ok: true })
      return
    }

    const updates = {
      hide: { is_hidden: true },
      show: { is_hidden: false },
      unverify: { is_verified: false, verified_at: null, verified_by: null },
      verify: { is_verified: true, verified_at: new Date().toISOString(), verified_by: user.id },
    }[action]

    const { data, error } = await supabaseAdmin
      .from('booths')
      .update(updates)
      .eq('id', id)
      .select('id, name, is_verified, is_hidden, view_count')
      .single()

    if (error) {
      sendJson(res, 500, { error: 'Could not update this booth.' })
      return
    }

    sendJson(res, 200, { booth: data })
    return
  }

  if (target === 'listing') {
    if (!allowedListingActions.has(action)) {
      sendJson(res, 400, { error: 'Unsupported listing action.' })
      return
    }

    if (action === 'delete') {
      const { error } = await supabaseAdmin.from('listings').delete().eq('id', id)

      if (error) {
        sendJson(res, 500, { error: 'Could not delete this listing.' })
        return
      }

      sendJson(res, 200, { ok: true })
      return
    }

    const updates = {
      hide: { is_hidden: true },
      show: { is_hidden: false },
      unverify: { is_verified: false, verified_at: null, verified_by: null },
      verify: { is_verified: true, verified_at: new Date().toISOString(), verified_by: user.id },
    }[action]

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select('id, title, is_verified, is_hidden, view_count')
      .single()

    if (error) {
      sendJson(res, 500, { error: 'Could not update this listing.' })
      return
    }

    sendJson(res, 200, { listing: data })
    return
  }

  sendJson(res, 400, { error: 'Unsupported target.' })
}
