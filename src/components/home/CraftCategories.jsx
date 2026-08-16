import { Link } from 'react-router-dom'
import { handmadeCategories } from '../../data/marketplace.js'
import { categoryVisuals } from '../../data/homepage.js'

function CraftCategories() {
  return (
    <section className="section" id="crafts">
      <div className="section-heading">
        <p className="eyebrow">Shop by craft</p>
        <h2>Find the maker table that fits your style</h2>
      </div>
      <div className="category-grid visual-category-grid">
        {handmadeCategories.map((category) => (
          <Link
            className="category-tile visual-category-card"
            key={category}
            to={`/browse?market=handmade&category=${encodeURIComponent(category)}`}
          >
            <span className={`category-visual product-visual-${categoryVisuals[category] ?? 'original'}`} />
            <strong>{category}</strong>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default CraftCategories
