import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { lobbyCode } = await request.json()

    if (!lobbyCode) {
      return NextResponse.json(
        { valid: false, error: 'Lobby code is required' },
        { status: 400 }
      )
    }

    // Check if lobby code exists in subscriptions table
    const { data, error } = await supabase
      .from('subscriptions')
      .select('lobby_code, status')
      .eq('lobby_code', lobbyCode.toUpperCase())
      .single()

    if (error || !data) {
      return NextResponse.json(
        { valid: false, error: 'Lobby code not found' },
        { status: 404 }
      )
    }

    if (data.status !== 'active') {
      return NextResponse.json(
        { valid: false, error: 'Lobby is not active' },
        { status: 403 }
      )
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Error validating lobby:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
