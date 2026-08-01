import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { featuredProducts } from '../../data/homepage.js'

function FeaturedProducts() {
  return (
    <section className="section" id="shop">
      <div className="section-heading">
        <p className="eyebrow">Featured handmade goods</p>
        <h2>Fresh finds from maker booths</h2>
        <p>Preview the kind of original work shoppers can discover across KrafZee.</p>
      </div>

      <div className="featured-product-grid">
        {featuredProducts.map((product) => (
          <article className="featured-product-card" key={product.title}>
            <div className={`product-visual product-visual-${product.visual}`}>
              <span>{product.category}</span>
              <button aria-label={`Save ${product.title}`} className="favorite-button" type="button">
                <Heart aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="product-card-copy">
              <p className="eyebrow">{product.category}</p>
              <h3>{product.title}</h3>
              <p>{product.booth}</p>
              <dl className="listing-meta">
                <div>
                  <dt>Price</dt>
                  <dd>{product.price}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{product.location}</dd>
                </div>
              </dl>
              <Link to="/browse">Browse similar goods</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default FeaturedProducts
