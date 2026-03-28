import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const PUBLIC_DIR = path.join(process.cwd(), 'public')

// Get list of all images in /public/
export async function GET() {
  try {
    const files = fs.readdirSync(PUBLIC_DIR)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(ext)
    })

    const assets = imageFiles.map(file => {
      const filePath = path.join(PUBLIC_DIR, file)
      const stats = fs.statSync(filePath)
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
        path: `/${file}`
      }
    })

    return NextResponse.json({ assets })
  } catch (err) {
    console.error('Failed to list assets:', err)
    return NextResponse.json({ error: 'Failed to list assets' }, { status: 500 })
  }
}

// Upload or replace an image
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileName = file.name
    const filePath = path.join(PUBLIC_DIR, fileName)
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Write file
    fs.writeFileSync(filePath, buffer)
    
    return NextResponse.json({ success: true, fileName })
  } catch (err) {
    console.error('Failed to upload asset:', err)
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 })
  }
}

// Delete an image
export async function DELETE(request: NextRequest) {
  try {
    const { fileName } = await request.json()
    
    if (!fileName) {
      return NextResponse.json({ error: 'No fileName provided' }, { status: 400 })
    }

    const filePath = path.join(PUBLIC_DIR, fileName)
    
    // Security check - ensure file is in public dir
    if (!filePath.startsWith(PUBLIC_DIR)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (err) {
    console.error('Failed to delete asset:', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
