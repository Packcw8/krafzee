import { Link } from 'react-router-dom'
import OnboardingShell from '../components/OnboardingShell.jsx'

function FeeTransparency() {
  return (
    <OnboardingShell
      actions={
        <Link className="button button-primary" to="/terms-acceptance">
          Continue to terms
        </Link>
      }
      currentStep="Fee Transparency"
      intro="No surprise booth rent tucked under the table."
      title="Review fee transparency."
    >
      <div className="fees-table onboarding-fees" aria-label="Seller fee preview">
        <div className="fee-row">
          <span>Opening a booth</span>
          <strong>No charge in preview</strong>
        </div>
        <div className="fee-row">
          <span>Listing goods</span>
          <strong>No listing fee in preview</strong>
        </div>
        <div className="fee-row">
          <span>Payment handling</span>
          <strong>Not built yet</strong>
        </div>
      </div>
      <p className="helper-note">
        Krafzee will show fee changes plainly before they affect sellers.
      </p>
    </OnboardingShell>
  )
}

export default FeeTransparency
