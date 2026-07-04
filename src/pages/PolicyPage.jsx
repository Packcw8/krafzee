import { Link, Navigate, useParams } from 'react-router-dom'
import { policies } from '../data/policies.js'

function PolicyPage() {
  const { policySlug } = useParams()
  const policy = policies[policySlug]

  if (!policy) {
    return <Navigate to="/terms" replace />
  }

  return (
    <article className="policy-page">
      <p className="eyebrow">{policy.eyebrow}</p>
      <h1>{policy.title}</h1>
      <div className="policy-copy">
        {policy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="policy-link-grid">
        <Link to="/terms">Terms of Service</Link>
        <Link to="/seller-terms">Seller Terms</Link>
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/prohibited-items">Prohibited Items Policy</Link>
        <Link to="/fee-policy">Fee Policy</Link>
        <Link to="/refund-dispute-policy">Refund & Dispute Policy</Link>
      </div>
    </article>
  )
}

export default PolicyPage
