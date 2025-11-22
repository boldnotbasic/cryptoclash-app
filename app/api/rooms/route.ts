import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const roomsFilePath = path.join(process.cwd(), 'public', 'rooms.json')

// Ensure rooms file exists
function ensureRoomsFile() {
  if (!fs.existsSync(roomsFilePath)) {
    fs.writeFileSync(roomsFilePath, JSON.stringify({ activeRooms: [] }, null, 2))
  }
}

// GET - Get all active rooms
export async function GET() {
  try {
    ensureRoomsFile()
    const data = fs.readFileSync(roomsFilePath, 'utf8')
    const rooms = JSON.parse(data)
    return NextResponse.json(rooms)
  } catch (error) {
    return NextResponse.json({ activeRooms: [] })
  }
}

// POST - Create a new room
export async function POST(request: NextRequest) {
  try {
    const { roomId } = await request.json()
    
    if (!roomId || roomId.length < 3) {
      return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 })
    }

    ensureRoomsFile()
    const data = fs.readFileSync(roomsFilePath, 'utf8')
    const rooms = JSON.parse(data)
    
    // Add room if it doesn't exist
    if (!rooms.activeRooms.includes(roomId)) {
      rooms.activeRooms.push(roomId)
      fs.writeFileSync(roomsFilePath, JSON.stringify(rooms, null, 2))
    }
    
    return NextResponse.json({ success: true, roomId })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}

// DELETE - Remove a room
export async function DELETE(request: NextRequest) {
  try {
    const { roomId } = await request.json()
    
    ensureRoomsFile()
    const data = fs.readFileSync(roomsFilePath, 'utf8')
    const rooms = JSON.parse(data)
    
    rooms.activeRooms = rooms.activeRooms.filter((id: string) => id !== roomId)
    fs.writeFileSync(roomsFilePath, JSON.stringify(rooms, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}
