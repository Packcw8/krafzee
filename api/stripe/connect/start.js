import {
  getSiteUrl,
  getSupabaseAdmin,
  getUserFromRequest,
  getStripe,
  requireServerConfig,
  sendJson,
} from '../../_utils.js'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
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
      .select('id, owner_id, name, description, stripe_account_id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (boothError || !booth) {
      sendJson(res, 404, { error: 'Open a booth before setting up payouts.' })
      return
    }

    let stripeAccountId = booth.stripe_account_id

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        business_profile: {
          name: booth.name,
          product_description: booth.description || 'Krafzee marketplace seller',
          url: getSiteUrl(req),
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          booth_id: booth.id,
          owner_id: user.id,
        },
      })

      stripeAccountId = account.id

      await supabaseAdmin
        .from('booths')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', booth.id)
    }

    const siteUrl = getSiteUrl(req)
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${siteUrl}/seller-dashboard?stripe=refresh`,
      return_url: `${siteUrl}/seller-dashboard?stripe=success`,
      type: 'account_onboarding',
    })

    sendJson(res, 200, { url: accountLink.url })
  } catch (error) {
    const message =
      error?.raw?.message ||
      error?.message ||
      'Stripe onboarding is not ready yet. Please check the platform setup in Stripe.'

    sendJson(res, error?.statusCode || 500, { error: message })
  }
}
