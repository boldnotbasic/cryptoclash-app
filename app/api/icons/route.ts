import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const FILE_PATH = path.join(process.cwd(), 'locales', 'icons.json')

export async function GET() {
  try {
    const content = fs.readFileSync(FILE_PATH, 'utf-8')
    return NextResponse.json(JSON.parse(content), {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch {
    return NextResponse.json({}, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    fs.writeFileSync(FILE_PATH, JSON.stringify(body, null, 2), 'utf-8')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to save icons:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
