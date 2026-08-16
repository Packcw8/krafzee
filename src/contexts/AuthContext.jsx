import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { AuthContext } from './auth-context.js'

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadProfile(user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .eq('id', user.id)
        .maybeSingle()

      if (error || data) {
        return data ?? null
      }

      const displayName =
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        'Krafzee shopper'

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          display_name: displayName,
          role: 'buyer',
        })
        .select('id, display_name, role')
        .single()

      if (createError) {
        return null
      }

      return createdProfile
    }

    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      const currentSession = data.session

      if (!isMounted) {
        return
      }

      setSession(currentSession)

      if (currentSession?.user) {
        const userProfile = await loadProfile(currentSession.user)

        if (isMounted) {
          setProfile(userProfile)
        }
      } else {
        setProfile(null)
      }

      if (isMounted) {
        setIsLoading(false)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)

      if (nextSession?.user) {
        setProfile(await loadProfile(nextSession.user))
      } else {
        setProfile(null)
      }

      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null)
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', session.user.id)
      .single()

    if (error) {
      setProfile(null)
      return null
    }

    setProfile(data)
    return data
  }, [session])

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const effectiveRole = session?.user?.email?.toLowerCase() === 'brian@krafzee.com'
    ? 'admin'
    : profile?.role ?? (session?.user ? 'buyer' : 'guest')

  const value = useMemo(
    () => ({
      isLoading,
      logout,
      profile,
      refreshProfile,
      role: effectiveRole,
      session,
      user: session?.user ?? null,
    }),
    [effectiveRole, isLoading, profile, refreshProfile, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
