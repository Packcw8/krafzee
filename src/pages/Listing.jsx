import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../contexts/useCart.js'
import { formatListingAttributes, listingSelectFields } from '../data/marketplace.js'
import { supabase } from '../lib/supabase.js'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return ''
  }

  return `$${Number(price).toFixed(2)}`
}

function Listing() {
  const { listingId } = useParams()
  const { addToCart } = useCart()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [listing, setListing] = useState(null)
  const [listingBooth, setListingBooth] = useState(null)
  const [selectedOption, setSelectedOption] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadListing() {
      setIsLoading(true)
      setError('')

      const { data, error: listingError } = await supabase
        .from('listings')
        .select(listingSelectFields)
        .eq('id', listingId)
        .maybeSingle()

      if (!isMounted) {
        return
      }

      if (listingError) {
        setError('We could not load this listing right now. Please try again soon.')
        setListing(null)
        setListingBooth(null)
      } else {
        setListing(data)
        setSelectedOption(data?.variants?.[0]?.name ?? '')

        if (data?.booth_id) {
          const { data: boothData } = await supabase
            .from('booths')
            .select('id, name, owner_name, location')
            .eq('id', data.booth_id)
            .maybeSingle()

          if (isMounted) {
            setListingBooth(boothData)
          }
        }
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
            <dt>Booth</dt>
            <dd>
              {listing.booth_id ? (
                <Link to={`/booth/${listing.booth_id}`}>{listingBooth?.name || 'Maker booth'}</Link>
              ) : (
                listingBooth?.name || 'Maker booth'
              )}
            </dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{listing.category || 'Original goods'}</dd>
          </div>
          <div>
            <dt>Quantity</dt>
            <dd>{listing.quantity ?? 1}</dd>
          </div>
          <div>
            <dt>Processing</dt>
            <dd>{listing.processing_time || 'Not posted yet'}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>Inquiry only. Payments are not enabled yet.</dd>
          </div>
        </dl>

        {(formatListingAttributes(listing.attributes).length > 0 ||
          listing.materials?.length > 0 ||
          listing.variants?.length > 0) && (
          <section className="listing-details-panel">
            <h2>Item details</h2>
            {formatListingAttributes(listing.attributes).length > 0 && (
              <div className="attribute-chip-list">
                {formatListingAttributes(listing.attributes).map((attribute) => (
                  <span className="attribute-chip" key={attribute.key}>
                    {attribute.label}: {attribute.value}
                  </span>
                ))}
              </div>
            )}
            {listing.materials?.length > 0 && (
              <p>
                <strong>Materials:</strong> {listing.materials.join(', ')}
              </p>
            )}
            {listing.variants?.length > 0 && (
              <p>
                <strong>Options:</strong> {listing.variants.map((variant) => variant.name).join(', ')}
              </p>
            )}
          </section>
        )}

        <section className="cart-composer">
          {listing.variants?.length > 0 && (
            <label>
              Choose an option
              <select
                onChange={(event) => setSelectedOption(event.target.value)}
                value={selectedOption}
              >
                {listing.variants.map((variant) => (
                  <option key={variant.name} value={variant.name}>
                    {variant.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            className="button button-primary"
            onClick={() =>
              addToCart({
                id: listing.id,
                booth_id: listing.booth_id,
                boothName: listingBooth?.name || 'Maker booth',
                category: listing.category,
                free_shipping: listing.free_shipping,
                image_url: listing.image_url,
                price: listing.price,
                requires_shipping: listing.requires_shipping,
                selectedOption,
                title: listing.title,
              })
            }
            type="button"
          >
            Add to cart
          </button>
          <small>Checkout opens through Stripe once every booth in your cart has seller payouts ready.</small>
        </section>

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
