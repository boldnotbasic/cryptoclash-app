import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy')

export async function POST(request: Request) {
  try {
    const { email, userId, priceId } = await request.json()

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Email and userId are required' },
        { status: 400 }
      )
    }

    // Create or get customer
    let customer: Stripe.Customer
    const existingCustomers = await stripe.customers.list({ email, limit: 1 })
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId }
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card', 'ideal', 'bancontact'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?subscription=cancelled`,
      metadata: {
        supabase_user_id: userId
      }
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
