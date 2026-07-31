import { useAuth } from '../contexts/useAuth.js'

function AdminDashboard() {
  const { profile } = useAuth()

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">Admin dashboard</p>
        <h1>Keep the market orderly.</h1>
        <p>
          Welcome {profile?.display_name ?? 'admin'}. Admins can review booths,
          sellers, roles, and market activity from this protected area.
        </p>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <h2>Booth review</h2>
          <p>Watch for incomplete booth profiles and listings that need attention.</p>
        </article>
        <article className="dashboard-card">
          <h2>Roles</h2>
          <p>Buyer, seller, and admin roles are managed through profile records.</p>
        </article>
        <article className="dashboard-card">
          <h2>Market health</h2>
          <p>Track the Handmade Market and project board sections.</p>
        </article>
      </section>
    </div>
  )
}

export default AdminDashboard
