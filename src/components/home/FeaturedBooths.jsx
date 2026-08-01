import { Link } from 'react-router-dom'
import { featuredBooths } from '../../data/homepage.js'

function FeaturedBooths() {
  return (
    <section className="section" id="booths">
      <div className="section-heading">
        <p className="eyebrow">Meet the makers</p>
        <h2>Featured maker booths</h2>
        <p>Step into booths shaped around a craft, a place, and a maker story.</p>
      </div>

      <div className="featured-booth-grid">
        {featuredBooths.map((booth) => (
          <article className="featured-booth-card" key={booth.name}>
            <div className={`booth-cover product-visual-${booth.visual}`} />
            <div className="booth-card-body">
              <span className="maker-avatar">{booth.name.charAt(0)}</span>
              <p className="eyebrow">{booth.craft}</p>
              <h3>{booth.name}</h3>
              <p>{booth.description}</p>
              <dl className="listing-meta">
                <div>
                  <dt>Location</dt>
                  <dd>{booth.location}</dd>
                </div>
              </dl>
              <Link to="/browse">Visit booths</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default FeaturedBooths
