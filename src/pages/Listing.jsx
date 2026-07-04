import { Link, useParams } from 'react-router-dom'
import { booths, listings } from '../data/marketplace.js'

function Listing() {
  const { listingId } = useParams()
  const listing = listings.find((item) => item.id === listingId) ?? listings[0]
  const booth = booths.find((item) => item.id === listing.boothId)

  return (
    <div className="listing-detail">
      <section className="listing-photo" aria-label={`${listing.title} preview`}>
        <span>{listing.category}</span>
      </section>

      <section className="listing-info">
        <p className="eyebrow">{listing.condition}</p>
        <h1>{listing.title}</h1>
        <strong className="price">{listing.price}</strong>
        <p>{listing.description}</p>

        <dl className="detail-list">
          <div>
            <dt>Location</dt>
            <dd>{listing.location}</dd>
          </div>
          <div>
            <dt>Booth</dt>
            <dd>{booth?.name}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>Inquiry only. Payments are not enabled yet.</dd>
          </div>
        </dl>

        <div className="hero-actions">
          <Link className="button button-primary" to={`/booth/${listing.boothId}`}>
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
