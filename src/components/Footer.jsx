import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img src="/KrafZeeLogo.png" alt="KrafZee.com USA" />
        <p>
          A modern marketplace for handcrafted goods, jumble finds, and local
          booth-style shopping.
        </p>
      </div>

      <div className="footer-link-grid">
        <div>
          <h2>Shop</h2>
          <Link to="/browse?market=handmade">Shop handcrafted</Link>
          <Link to="/browse?market=jumble">Jumble market</Link>
        </div>
        <div>
          <h2>Sellers</h2>
          <Link to="/signup">Create an account</Link>
          <Link to="/fees">Seller fees</Link>
          <Link to="/seller-terms">Seller terms</Link>
        </div>
        <div>
          <h2>Policies</h2>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/prohibited-items">Prohibited items</Link>
          <Link to="/refund-dispute-policy">Refunds & disputes</Link>
        </div>
      </div>

      <p className="footer-fine-print">
        &copy; {new Date().getFullYear()} KrafZee. Marketplace pages are in preview.
      </p>
    </footer>
  )
}

export default Footer
