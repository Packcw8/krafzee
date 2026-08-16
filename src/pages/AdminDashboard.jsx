import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function statusText(item) {
  if (item.is_hidden) {
    return 'Hidden'
  }

  return item.is_verified ? 'Verified' : 'Needs review'
}

function AdminDashboard() {
  const { profile, session } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [message, setMessage] = useState('')

  async function loadDashboard(accessToken) {
    if (!accessToken) {
      return
    }

    const response = await fetch('/api/admin/overview', {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    })
    const payload = await response.json()

    if (!response.ok) {
      setError(payload.error || 'Could not load admin dashboard.')
      setDashboard(null)
    } else {
      setDashboard(payload)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    let isMounted = true

    async function loadInitialDashboard() {
      if (!session?.access_token) {
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      const response = await fetch('/api/admin/overview', {
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      })
      const payload = await response.json()

      if (!isMounted) {
        return
      }

      if (!response.ok) {
        setError(payload.error || 'Could not load admin dashboard.')
        setDashboard(null)
      } else {
        setDashboard(payload)
      }

      setIsLoading(false)
    }

    loadInitialDashboard()

    return () => {
      isMounted = false
    }
  }, [session?.access_token])

  async function runAction(target, id, action) {
    const confirmDanger =
      action === 'delete'
        ? window.confirm(`Delete this ${target}? This cannot be undone.`)
        : true

    if (!confirmDanger) {
      return
    }

    setIsMutating(true)
    setError('')
    setMessage('')

    const response = await fetch('/api/admin/actions', {
      body: JSON.stringify({ action, id, target }),
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    const payload = await response.json()

    if (!response.ok) {
      setError(payload.error || 'Admin action failed.')
    } else {
      setMessage('Admin action saved.')
      await loadDashboard(session.access_token)
    }

    setIsMutating(false)
  }

  const stats = dashboard?.stats

  return (
    <div className="page-stack admin-dashboard">
      <section className="page-intro">
        <p className="eyebrow">Admin dashboard</p>
        <h1>Review the market.</h1>
        <p>
          Welcome {profile?.display_name ?? 'admin'}. Verify booths, moderate listings,
          and watch market activity from one protected area.
        </p>
      </section>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      {isLoading && (
        <article className="state-card">
          <h2>Loading admin tools</h2>
        </article>
      )}

      {!isLoading && dashboard && (
        <>
          <section className="admin-stat-grid" aria-label="Market statistics">
            <article>
              <span>Booths</span>
              <strong>{stats.booths}</strong>
              <small>{stats.verifiedBooths} verified, {stats.hiddenBooths} hidden</small>
            </article>
            <article>
              <span>Listings</span>
              <strong>{stats.listings}</strong>
              <small>{stats.hiddenListings} hidden</small>
            </article>
            <article>
              <span>Orders</span>
              <strong>{stats.orders}</strong>
              <small>{stats.paidOrders} paid</small>
            </article>
            <article>
              <span>Gross sales</span>
              <strong>{formatMoney(stats.grossSales)}</strong>
              <small>Paid order value</small>
            </article>
          </section>

          <section className="section">
            <div className="section-heading">
              <p className="eyebrow">Booth review</p>
              <h2>Recent booths</h2>
            </div>
            <div className="admin-table">
              {dashboard.booths.map((booth) => (
                <article className="admin-row" key={booth.id}>
                  <div>
                    <strong>{booth.name}</strong>
                    <span>{booth.owner_name} {booth.owner_email ? `- ${booth.owner_email}` : ''}</span>
                    <small>{booth.market_type || 'handmade'} - {booth.location || 'No location'} - {booth.view_count ?? 0} views</small>
                  </div>
                  <span className={booth.is_hidden ? 'admin-badge admin-badge-danger' : 'admin-badge'}>
                    {statusText(booth)}
                  </span>
                  <div className="admin-actions">
                    <button disabled={isMutating} onClick={() => runAction('booth', booth.id, booth.is_verified ? 'unverify' : 'verify')} type="button">
                      {booth.is_verified ? 'Unverify' : 'Verify'}
                    </button>
                    <button disabled={isMutating} onClick={() => runAction('booth', booth.id, booth.is_hidden ? 'show' : 'hide')} type="button">
                      {booth.is_hidden ? 'Show' : 'Hide'}
                    </button>
                    <button disabled={isMutating} onClick={() => runAction('booth', booth.id, 'delete')} type="button">
                      Delete
                    </button>
                    <Link to={`/booth/${booth.id}`}>View</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <p className="eyebrow">Listing review</p>
              <h2>Recent listings</h2>
            </div>
            <div className="admin-table">
              {dashboard.listings.map((listing) => (
                <article className="admin-row" key={listing.id}>
                  <div>
                    <strong>{listing.title}</strong>
                    <span>{listing.category || 'No category'} - {listing.price ? `$${Number(listing.price).toFixed(2)}` : 'No price'}</span>
                    <small>{listing.quantity ?? 0} available - {listing.view_count ?? 0} views</small>
                  </div>
                  <span className={listing.is_hidden ? 'admin-badge admin-badge-danger' : 'admin-badge'}>
                    {statusText(listing)}
                  </span>
                  <div className="admin-actions">
                    <button disabled={isMutating} onClick={() => runAction('listing', listing.id, listing.is_verified ? 'unverify' : 'verify')} type="button">
                      {listing.is_verified ? 'Unverify' : 'Verify'}
                    </button>
                    <button disabled={isMutating} onClick={() => runAction('listing', listing.id, listing.is_hidden ? 'show' : 'hide')} type="button">
                      {listing.is_hidden ? 'Show' : 'Hide'}
                    </button>
                    <button disabled={isMutating} onClick={() => runAction('listing', listing.id, 'delete')} type="button">
                      Delete
                    </button>
                    <Link to={`/listing/${listing.id}`}>View</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <p className="eyebrow">Activity</p>
              <h2>Most viewed items</h2>
            </div>
            <div className="dashboard-grid">
              {dashboard.topListings.map((listing) => (
                <article className="dashboard-card" key={listing.id}>
                  <h3>{listing.title}</h3>
                  <p>{listing.category || 'Market item'}</p>
                  <strong>{listing.view_count ?? 0} views</strong>
                  <Link to={`/listing/${listing.id}`}>View item</Link>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
