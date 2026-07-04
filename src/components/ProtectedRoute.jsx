import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'

function ProtectedRoute({ allowedRoles, children }) {
  const { isLoading, role, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <article className="state-card">
        <h1>Checking your market pass</h1>
        <p>Give us a moment while we open the right gate.</p>
      </article>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!allowedRoles.includes(role)) {
    return (
      <article className="state-card state-card-error">
        <h1>This row is not open to your account</h1>
        <p>Your current market pass does not include this area yet.</p>
      </article>
    )
  }

  return children
}

export default ProtectedRoute
