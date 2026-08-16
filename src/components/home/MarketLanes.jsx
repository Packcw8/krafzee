import { ArrowRight, PackageSearch, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

function MarketLanes() {
  return (
    <section className="section" id="lanes">
      <div className="section-heading">
        <p className="eyebrow">Choose your lane</p>
        <h2>Two ways to shop KrafZee</h2>
      </div>

      <div className="market-lane-card-grid">
        <Link className="market-lane-card market-lane-card-handmade" to="/browse?market=handmade">
          <Sparkles aria-hidden="true" size={28} />
          <span>
            <strong>Shop Handcrafted</strong>
            <small>Maker-made clothing, soaps, candles, art, woodwork, jewelry, and original goods.</small>
          </span>
          <ArrowRight aria-hidden="true" size={20} />
        </Link>

        <Link className="market-lane-card market-lane-card-jumble" to="/browse?market=jumble">
          <PackageSearch aria-hidden="true" size={28} />
          <span>
            <strong>Jumble Market</strong>
            <small>Vintage finds, supplies, collectibles, tools, books, home goods, and resale tables.</small>
          </span>
          <ArrowRight aria-hidden="true" size={20} />
        </Link>
      </div>
    </section>
  )
}

export default MarketLanes
