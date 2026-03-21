import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Subscription {
  id: string
  user_id: string
  email: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  lobby_code: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  created_at: string
}
