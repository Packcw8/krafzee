import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

function isResetPath(pathname) {
  return pathname === '/reset-password' || pathname === '/resetpassword'
}

function hasRecoveryMarker() {
  return (
    window.location.hash.includes('type=recovery') ||
    window.location.search.includes('type=recovery')
  )
}

function AuthRecoveryRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let recoveryTimer = null

    if (hasRecoveryMarker() && !isResetPath(location.pathname)) {
      recoveryTimer = window.setTimeout(() => {
        navigate('/reset-password', { replace: true })
      }, 500)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && !isResetPath(window.location.pathname)) {
        navigate('/reset-password', { replace: true })
      }
    })

    return () => {
      if (recoveryTimer) {
        window.clearTimeout(recoveryTimer)
      }

      subscription.unsubscribe()
    }
  }, [location.pathname, navigate])

  return null
}

export default AuthRecoveryRedirect
