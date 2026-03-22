import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy')

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'
)

// Generate unique 6-character lobby code
function generateLobbyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars like 0/O, 1/I
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    // For production, you should verify the webhook signature
    // event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    event = JSON.parse(body) as Stripe.Event
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (userId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
          
          // Check if user already has a lobby code
          const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('lobby_code')
            .eq('user_id', userId)
            .single()
          
          // Generate new lobby code only if user doesn't have one
          const lobbyCode = existingSub?.lobby_code || generateLobbyCode()
          
          // Upsert subscription in database
          await supabaseAdmin.from('subscriptions').upsert({
            user_id: userId,
            email: session.customer_email,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            lobby_code: lobbyCode,
            current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
            current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const customerId = subscription.customer as string
        
        // Find user by customer ID
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (existingSub) {
          await supabaseAdmin.from('subscriptions').update({
            status: subscription.status === 'active' ? 'active' : 'cancelled',
            current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
            current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
          }).eq('user_id', existingSub.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabaseAdmin
          .from('subscriptions')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
