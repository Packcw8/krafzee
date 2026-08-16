import {
  getSupabaseAdmin,
  getUserFromRequest,
  getStripe,
  requireServerConfig,
  sendJson,
} from '../../_utils.js'

function stripeStatusPayload(account) {
  return {
    stripe_onboarding_complete: Boolean(account.details_submitted),
    stripe_charges_enabled: Boolean(account.charges_enabled),
    stripe_payouts_enabled: Boolean(account.payouts_enabled),
    stripe_requirements: {
      currently_due: account.requirements?.currently_due ?? [],
      eventually_due: account.requirements?.eventually_due ?? [],
      past_due: account.requirements?.past_due ?? [],
      disabled_reason: account.requirements?.disabled_reason ?? null,
    },
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  if (!requireServerConfig(res, ['STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'])) {
    return
  }

  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()

  const { user, error: userError } = await getUserFromRequest(req)

  if (userError) {
    sendJson(res, 401, { error: userError })
    return
  }

  const { data: booth, error: boothError } = await supabaseAdmin
    .from('booths')
    .select('id, stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled, stripe_requirements')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (boothError || !booth) {
    sendJson(res, 404, { error: 'Open a booth before checking payout status.' })
    return
  }

  if (!booth.stripe_account_id) {
    sendJson(res, 200, { connected: false, booth })
    return
  }

  const account = await stripe.accounts.retrieve(booth.stripe_account_id)
  const statusPayload = stripeStatusPayload(account)

  const { data: updatedBooth } = await supabaseAdmin
    .from('booths')
    .update(statusPayload)
    .eq('id', booth.id)
    .select('id, stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled, stripe_requirements')
    .single()

  sendJson(res, 200, {
    connected: true,
    booth: updatedBooth ?? { ...booth, ...statusPayload },
  })
}
