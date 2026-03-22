import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy'
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

// Price ID for the yearly subscription - you need to create this in Stripe Dashboard
// Go to Stripe > Products > Create Product > Add Price (€18/year recurring)
export const YEARLY_SUBSCRIPTION_PRICE_ID = 'price_1TDYhXCJQ9hlHdcJL2mVEim4'
