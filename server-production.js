const { createServer } = require('http')
const { Server } = require('socket.io')
const express = require('express')

const port = parseInt(process.env.PORT || '3000', 10)
const app = express()

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    connections: serverStats.connections,
    rooms: Object.keys(rooms).length,
    uptime: Date.now() - serverStats.startTime
  })
})

const httpServer = createServer(app)

// Initialize Socket.IO with CORS for production
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for now - restrict later
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true
})

console.log('🚀 Socket.IO server starting in PRODUCTION mode...')

// Room storage with cleanup tracking
const rooms = {}

// Authoritative per-room change24h map (symbol -> number)
const roomMarketChange24h = {}
const roomCleanupTimers = new Map()
// Live activity intervals per room
const activityIntervals = {}

// Track per-player cleanup timers for disconnected players
const playerCleanupTimers = new Map()

// 🚨 CRITICAL: Global crypto prices - SINGLE SOURCE OF TRUTH
const globalCryptoPrices = {
  DSHEEP: 42.30,
  NUGGET: 1250.75, 
  LNTR: 89.20,
  OMLT: 156.40,
  REX: 0.85,
  ORLO: 2340.80
}

// 🚨 CRITICAL: Centralized scan data per room - SERVER SOURCE OF TRUTH
const roomScanData = {
  // roomCode: {
  //   autoScanActions: [],
  //   playerScanActions: []
  // }
}

// Performance monitoring
const serverStats = {
  connections: 0,
  messagesProcessed: 0,
  roomsCreated: 0,
  startTime: Date.now()
}

// Cleanup inactive rooms after 1 hour
const ROOM_CLEANUP_TIMEOUT = 60 * 60 * 1000 // 1 hour

// Cleanup disconnected players after 15 minutes if they don't return
const PLAYER_CLEANUP_TIMEOUT = 15 * 60 * 1000 // 15 minutes

function scheduleRoomCleanup(roomCode) {
  if (roomCleanupTimers.has(roomCode)) {
    clearTimeout(roomCleanupTimers.get(roomCode))
  }
  
  const timer = setTimeout(() => {
    if (rooms[roomCode] && Object.keys(rooms[roomCode].players).length === 0) {
      console.log(`🧹 Cleaning up inactive room: ${roomCode}`)
      stopActivityInterval(roomCode)
      delete rooms[roomCode]
      roomCleanupTimers.delete(roomCode)
    }
  }, ROOM_CLEANUP_TIMEOUT)
  
  roomCleanupTimers.set(roomCode, timer)
}

function cancelRoomCleanup(roomCode) {
  if (roomCleanupTimers.has(roomCode)) {
    clearTimeout(roomCleanupTimers.get(roomCode))
    roomCleanupTimers.delete(roomCode)
  }
}

// Helper: start periodic live activity for a room
function startActivityInterval(roomCode, socketIo) {
  if (activityIntervals[roomCode]) {
    console.log(`⚠️ Activity interval for room ${roomCode} already exists, skipping`)
    return
  }
  
  if (!roomScanData[roomCode]) {
    roomScanData[roomCode] = {
      autoScanActions: [],
      playerScanActions: []
    }
  }
  
  console.log(`🚀 Creating activity interval for room ${roomCode}`)
  const cryptoSymbols = ['DSHEEP', 'NUGGET', 'LNTR', 'OMLT', 'REX', 'ORLO']
  
  const generateActivity = () => {
    const randomCrypto = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)]
    const percentage = parseFloat(((Math.random() * 20) - 10).toFixed(1))
    const sign = percentage >= 0 ? '+' : ''
    const actions = ['Market Move', 'Price Alert', 'Trading Signal', 'Volume Spike']
    const randomActionType = actions[Math.floor(Math.random() * actions.length)]

    const activity = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      player: 'Bot',
      action: randomActionType,
      effect: `${randomCrypto} ${sign}${percentage}%`,
      cryptoSymbol: randomCrypto,
      percentageValue: percentage
    }

    if (rooms[roomCode]) {
      if (globalCryptoPrices[randomCrypto]) {
        const oldPrice = globalCryptoPrices[randomCrypto]
        const newPrice = oldPrice * (1 + percentage / 100)
        globalCryptoPrices[randomCrypto] = Math.max(0.01, Math.round(newPrice * 100) / 100)
        
        console.log(`📈 PRICE UPDATE: ${randomCrypto} ${oldPrice.toFixed(2)} → ${globalCryptoPrices[randomCrypto].toFixed(2)}`)
      }
      
      roomScanData[roomCode].autoScanActions.unshift(activity)
      if (roomScanData[roomCode].autoScanActions.length > 10) {
        roomScanData[roomCode].autoScanActions = roomScanData[roomCode].autoScanActions.slice(0, 10)
      }
      
      if (!roomMarketChange24h[roomCode]) roomMarketChange24h[roomCode] = {}
      const prevChange = roomMarketChange24h[roomCode][randomCrypto] || 0
      roomMarketChange24h[roomCode][randomCrypto] = Math.round((prevChange + percentage) * 10) / 10
      
      socketIo.to(roomCode).emit('crypto:priceUpdate', globalCryptoPrices)
      socketIo.to(roomCode).emit('scanData:update', {
        autoScanActions: roomScanData[roomCode].autoScanActions,
        playerScanActions: roomScanData[roomCode].playerScanActions
      })
      socketIo.to(roomCode).emit('market:change24hUpdate', roomMarketChange24h[roomCode])
    }
  }

  generateActivity()
  const interval = setInterval(generateActivity, 8000)
  activityIntervals[roomCode] = interval
  
  console.log(`✅ Activity interval created for room ${roomCode}`)
}

function stopActivityInterval(roomCode) {
  if (activityIntervals[roomCode]) {
    clearInterval(activityIntervals[roomCode])
    delete activityIntervals[roomCode]
    console.log(`🛑 Activity interval stopped for room ${roomCode}`)
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  serverStats.connections++
  console.log(`🔌 Client connected: ${socket.id} (Total: ${serverStats.connections})`)

  socket.on('host:createRoom', ({ roomCode, hostName, hostAvatar, settings }) => {
    console.log(`🏠 Host creating room: ${roomCode}`)
    
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        hostId: socket.id,
        hostName,
        hostAvatar,
        players: {},
        started: false,
        settings: {
          volatility: settings?.volatility || 'Medium',
          gameDuration: settings?.gameDuration || 1,
          startingCash: settings?.startingCash || 1000
        }
      }
      
      rooms[roomCode].players[socket.id] = {
        name: hostName,
        avatar: hostAvatar,
        joinedAt: Date.now(),
        isHost: true,
        cashBalance: settings?.startingCash || 1000,
        portfolio: {
          DSHEEP: 1.0,
          NUGGET: 0.5,
          LNTR: 2.0,
          OMLT: 1.5,
          REX: 100.0,
          ORLO: 0.25
        }
      }
      
      serverStats.roomsCreated++
      cancelRoomCleanup(roomCode)
    }
    
    socket.join(roomCode)
    socket.emit('host:createSuccess', { roomCode, room: rooms[roomCode] })
    startActivityInterval(roomCode, io)
    
    socket.emit('crypto:priceUpdate', globalCryptoPrices)
    if (roomScanData[roomCode]) {
      socket.emit('scanData:update', {
        autoScanActions: roomScanData[roomCode].autoScanActions,
        playerScanActions: roomScanData[roomCode].playerScanActions
      })
    }
  })

  socket.on('player:join', ({ roomCode, playerName, playerAvatar }) => {
    console.log(`👤 Player joining room: ${roomCode}`)
    
    const room = rooms[roomCode]
    if (!room) {
      socket.emit('player:joinError', 'Kamer niet gevonden')
      return
    }
    
    room.players[socket.id] = {
      name: playerName,
      avatar: playerAvatar,
      joinedAt: Date.now(),
      isHost: false,
      cashBalance: room.settings.startingCash || 1000,
      portfolio: {
        DSHEEP: 1.0,
        NUGGET: 0.5,
        LNTR: 2.0,
        OMLT: 1.5,
        REX: 100.0,
        ORLO: 0.25
      }
    }
    
    socket.join(roomCode)
    socket.emit('player:joinSuccess', { roomCode, room })
    io.to(roomCode).emit('lobby:update', room)
    
    socket.emit('crypto:priceUpdate', globalCryptoPrices)
    if (roomScanData[roomCode]) {
      socket.emit('scanData:update', {
        autoScanActions: roomScanData[roomCode].autoScanActions,
        playerScanActions: roomScanData[roomCode].playerScanActions
      })
    }
  })

  socket.on('host:startGame', ({ roomCode }) => {
    const room = rooms[roomCode]
    if (room) {
      room.started = true
      io.to(roomCode).emit('game:started', { room })
    }
  })

  socket.on('player:scanAction', ({ roomCode, scanAction }) => {
    if (!roomScanData[roomCode]) {
      roomScanData[roomCode] = {
        autoScanActions: [],
        playerScanActions: []
      }
    }
    
    roomScanData[roomCode].playerScanActions.unshift(scanAction)
    if (roomScanData[roomCode].playerScanActions.length > 10) {
      roomScanData[roomCode].playerScanActions = roomScanData[roomCode].playerScanActions.slice(0, 10)
    }
    
    io.to(roomCode).emit('scanData:update', {
      autoScanActions: roomScanData[roomCode].autoScanActions,
      playerScanActions: roomScanData[roomCode].playerScanActions
    })
  })

  socket.on('test:message', ({ roomCode, message, sender }) => {
    io.to(roomCode).emit('test:messageReceived', {
      message,
      sender,
      timestamp: Date.now(),
      roomCode
    })
  })

  socket.on('disconnect', () => {
    serverStats.connections--
    console.log(`🔌 Client disconnected: ${socket.id}`)
    
    // Clean up player from all rooms
    Object.keys(rooms).forEach(roomCode => {
      const room = rooms[roomCode]
      if (room.players[socket.id]) {
        delete room.players[socket.id]
        
        if (Object.keys(room.players).length === 0) {
          scheduleRoomCleanup(roomCode)
        } else {
          io.to(roomCode).emit('lobby:update', room)
        }
      }
    })
  })
})

// Start server
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`✅ Production Socket.IO server running on port ${port}`)
  console.log(`📡 Health check: http://0.0.0.0:${port}/health`)
})
