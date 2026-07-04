import { Link } from 'react-router-dom'

const steps = [
  'Open Your Booth',
  'Choose Booth Type',
  'Seller Profile Setup',
  'Seller Promise',
  'Fee Transparency',
  'Terms Acceptance',
]

function OnboardingShell({
  actions,
  children,
  currentStep,
  eyebrow = 'Open your booth',
  intro,
  title,
}) {
  return (
    <div className="onboarding-layout">
      <aside className="onboarding-rail" aria-label="Seller onboarding steps">
        <p className="eyebrow">Booth setup</p>
        <ol>
          {steps.map((step) => (
            <li
              className={step === currentStep ? 'onboarding-step-active' : ''}
              key={step}
            >
              {step}
            </li>
          ))}
        </ol>
      </aside>

      <section className="onboarding-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
        <div className="onboarding-content">{children}</div>
        <div className="hero-actions">
          {actions}
          <Link className="button button-secondary" to="/browse">
            Walk the market first
          </Link>
        </div>
      </section>
    </div>
  )
}

export default OnboardingShell
