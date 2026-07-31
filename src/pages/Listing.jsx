import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return ''
  }

  return `$${Number(price).toFixed(2)}`
}

function Listing() {
  const { listingId } = useParams()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [listing, setListing] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadListing() {
      setIsLoading(true)
      setError('')

      const { data, error: listingError } = await supabase
        .from('listings')
        .select('id, booth_id, title, description, price, image_url, market_type, category')
        .eq('id', listingId)
        .maybeSingle()

      if (!isMounted) {
        return
      }

      if (listingError) {
        setError(listingError.message)
        setListing(null)
      } else {
        setListing(data)
      }

      setIsLoading(false)
    }

    loadListing()

    return () => {
      isMounted = false
    }
  }, [listingId])

  if (isLoading) {
    return (
      <article className="state-card">
        <h1>Loading listing</h1>
        <p>Checking the market table.</p>
      </article>
    )
  }

  if (error) {
    return (
      <article className="state-card state-card-error">
        <h1>Could not load this listing</h1>
        <p>{error}</p>
      </article>
    )
  }

  if (!listing) {
    return (
      <article className="state-card">
        <h1>Listing not found</h1>
        <p>This listing may not be on the market yet.</p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/browse">
            Browse booths
          </Link>
        </div>
      </article>
    )
  }

  return (
    <div className="listing-detail">
      <section className="listing-photo" aria-label={`${listing.title} preview`}>
        {listing.image_url ? (
          <img src={listing.image_url} alt="" className="card-image" />
        ) : (
          <span>{listing.category || 'Handmade listing'}</span>
        )}
      </section>

      <section className="listing-info">
        <p className="eyebrow">Handmade listing</p>
        <h1>{listing.title}</h1>
        {listing.price && <strong className="price">{formatPrice(listing.price)}</strong>}
        <p>{listing.description}</p>

        <dl className="detail-list">
          <div>
            <dt>Category</dt>
            <dd>{listing.category || 'Original goods'}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>Inquiry only. Payments are not enabled yet.</dd>
          </div>
        </dl>

        <div className="hero-actions">
          <Link className="button button-primary" to={`/booth/${listing.booth_id}`}>
            Visit booth
          </Link>
          <Link className="button button-secondary" to="/browse">
            Keep browsing
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Listing
