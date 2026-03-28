import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const getFilePath = (lang: string) =>
  path.join(process.cwd(), 'locales', `${lang}.json`)

export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get('lang') || 'nl'
  if (lang !== 'nl' && lang !== 'en' && lang !== 'fr') {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
  }

  try {
    const filePath = getFilePath(lang)
    const content = fs.readFileSync(filePath, 'utf-8')
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
    const { lang, translations } = body

    if (lang !== 'nl' && lang !== 'en' && lang !== 'fr') {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
    }

    const filePath = getFilePath(lang)
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf-8')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to save translations:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
