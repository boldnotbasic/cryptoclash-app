'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, Subscription } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  subscription: Subscription | null
  isLoading: boolean
  isSubscribed: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    subscription: null,
    isLoading: true,
    isSubscribed: false
  })

  // Check subscription status
  const checkSubscription = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking subscription:', error)
        return null
      }

      return data as Subscription | null
    } catch (error) {
      console.error('Error checking subscription:', error)
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const subscription = await checkSubscription(session.user.id)
          setAuthState({
            user: session.user,
            session,
            subscription,
            isLoading: false,
            isSubscribed: subscription?.status === 'active'
          })
        } else {
          setAuthState({
            user: null,
            session: null,
            subscription: null,
            isLoading: false,
            isSubscribed: false
          })
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setAuthState(prev => ({ ...prev, isLoading: false }))
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        if (session?.user) {
          const subscription = await checkSubscription(session.user.id)
          setAuthState({
            user: session.user,
            session,
            subscription,
            isLoading: false,
            isSubscribed: subscription?.status === 'active'
          })
        } else {
          setAuthState({
            user: null,
            session: null,
            subscription: null,
            isLoading: false,
            isSubscribed: false
          })
        }
      }
    )

    return () => {
      authSubscription.unsubscribe()
    }
  }, [checkSubscription])

  // Sign in with email + password
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Sign up with email + password
  const signUp = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      })
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Send Magic Link (kept for backwards compatibility)
  const sendMagicLink = async (email: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    setAuthState({
      user: null,
      session: null,
      subscription: null,
      isLoading: false,
      isSubscribed: false
    })
  }

  // Refresh subscription status
  const refreshSubscription = async () => {
    if (authState.user) {
      const subscription = await checkSubscription(authState.user.id)
      setAuthState(prev => ({
        ...prev,
        subscription,
        isSubscribed: subscription?.status === 'active'
      }))
    }
  }

  return {
    ...authState,
    lobbyCode: authState.subscription?.lobby_code || null,
    signIn,
    signUp,
    sendMagicLink,
    signOut,
    refreshSubscription
  }
}
