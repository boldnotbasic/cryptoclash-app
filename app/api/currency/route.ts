import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CURRENCY_CONFIG_PATH = path.join(process.cwd(), 'config', 'currency.json')

export async function GET() {
  try {
    const data = fs.readFileSync(CURRENCY_CONFIG_PATH, 'utf-8')
    const config = JSON.parse(data)
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error reading currency config:', error)
    return NextResponse.json(
      { error: 'Failed to read currency configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { currency } = body

    if (!currency || !currency.symbol || !currency.name || !currency.code) {
      return NextResponse.json(
        { error: 'Invalid currency data' },
        { status: 400 }
      )
    }

    // Read current config
    const data = fs.readFileSync(CURRENCY_CONFIG_PATH, 'utf-8')
    const config = JSON.parse(data)

    // Update currency
    config.currency = currency

    // Write back to file
    fs.writeFileSync(CURRENCY_CONFIG_PATH, JSON.stringify(config, null, 2))

    return NextResponse.json({ success: true, currency: config.currency })
  } catch (error) {
    console.error('Error updating currency config:', error)
    return NextResponse.json(
      { error: 'Failed to update currency configuration' },
      { status: 500 }
    )
  }
}
