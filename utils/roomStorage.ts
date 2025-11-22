// Simple cross-device room storage using localStorage + URL params
export class RoomStorage {
  private static STORAGE_KEY = 'cryptoclash-rooms'
  
  // Get all active rooms
  static getRooms(): string[] {
    try {
      const rooms = localStorage.getItem(this.STORAGE_KEY)
      return rooms ? JSON.parse(rooms) : []
    } catch {
      return []
    }
  }
  
  // Add a room
  static addRoom(roomId: string): void {
    try {
      const rooms = this.getRooms()
      if (!rooms.includes(roomId)) {
        rooms.push(roomId)
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rooms))
      }
    } catch (error) {
      console.error('Failed to add room:', error)
    }
  }
  
  // Check if room exists
  static roomExists(roomId: string): boolean {
    const rooms = this.getRooms()
    return rooms.includes(roomId) || roomId === '123' // Always allow test room
  }
  
  // Sync rooms via URL (for cross-device sharing)
  static syncFromUrl(): void {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const sharedRooms = urlParams.get('rooms')
      if (sharedRooms) {
        const rooms = sharedRooms.split(',').filter(r => r.length >= 3)
        const currentRooms = this.getRooms()
        const newRooms = Array.from(new Set([...currentRooms, ...rooms]))
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newRooms))
      }
    } catch (error) {
      console.error('Failed to sync from URL:', error)
    }
  }
  
  // Generate shareable URL with rooms
  static getShareableUrl(): string {
    const rooms = this.getRooms()
    const baseUrl = window.location.origin + window.location.pathname
    if (rooms.length > 0) {
      return `${baseUrl}?rooms=${rooms.join(',')}`
    }
    return baseUrl
  }
}
