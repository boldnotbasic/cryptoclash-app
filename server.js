const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

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
  // Clear existing timer if any
  if (roomCleanupTimers.has(roomCode)) {
    clearTimeout(roomCleanupTimers.get(roomCode))
  }
  
  // Schedule new cleanup
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
  
  // Initialize room scan data if not exists
  if (!roomScanData[roomCode]) {
    roomScanData[roomCode] = {
      autoScanActions: [],
      playerScanActions: []
    }
  }
  
  console.log(`🚀 Creating activity interval for room ${roomCode}`)
  const cryptoSymbols = ['DSHEEP', 'NUGGET', 'LNTR', 'OMLT', 'REX', 'ORLO']
  
  // Generate first activity immediately
  const generateActivity = () => {
    const randomCrypto = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)]
    const percentage = parseFloat(((Math.random() * 20) - 10).toFixed(1)) // -10.0 to +10.0
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
      // 🚨 CRITICAL: Update server crypto prices for live beurs activities
      if (globalCryptoPrices[randomCrypto]) {
        const oldPrice = globalCryptoPrices[randomCrypto]
        const newPrice = oldPrice * (1 + percentage / 100)
        globalCryptoPrices[randomCrypto] = Math.max(0.01, Math.round(newPrice * 100) / 100)
        
        console.log(`📈 LIVE BEURS PRICE UPDATE: ${randomCrypto} ${oldPrice.toFixed(2)} → ${globalCryptoPrices[randomCrypto].toFixed(2)} (${percentage > 0 ? '+' : ''}${percentage}%)`)
      }
      
      // Store activity in server scan data
      roomScanData[roomCode].autoScanActions.unshift(activity)
      // Keep only last 10 activities
      if (roomScanData[roomCode].autoScanActions.length > 10) {
        roomScanData[roomCode].autoScanActions = roomScanData[roomCode].autoScanActions.slice(0, 10)
      }
      // Update authoritative change24h map
      if (!roomMarketChange24h[roomCode]) roomMarketChange24h[roomCode] = {}
      const prevChange = roomMarketChange24h[roomCode][randomCrypto] || 0
      roomMarketChange24h[roomCode][randomCrypto] = Math.round((prevChange + percentage) * 10) / 10
      
      // Broadcast updated crypto prices first
      socketIo.to(roomCode).emit('crypto:priceUpdate', globalCryptoPrices)
      
      // Then broadcast the activity with updated scan data
      socketIo.to(roomCode).emit('scanData:update', {
        autoScanActions: roomScanData[roomCode].autoScanActions,
        playerScanActions: roomScanData[roomCode].playerScanActions
      })
      // Broadcast current market change map
      socketIo.to(roomCode).emit('market:stateUpdate', {
        change24h: roomMarketChange24h[roomCode] || {}
      })
      
      // Force recalculation for all players
      socketIo.to(roomCode).emit('crypto:forceRecalculation', {
        prices: globalCryptoPrices,
        timestamp: Date.now(),
        triggeredBy: `LIVE_BEURS_${activity.player}`
      })
      
      console.log(`📈 [${roomCode}] ${activity.effect} - Broadcasted to all devices`)
    }
  }
  
  const interval = setInterval(generateActivity, 30000) // every 30 seconds

  activityIntervals[roomCode] = interval
  console.log(`⏱️ Started activity interval for room ${roomCode}`)
}

// Helper: stop interval for a room
function stopActivityInterval(roomCode) {
  if (activityIntervals[roomCode]) {
    clearInterval(activityIntervals[roomCode])
    delete activityIntervals[roomCode]
    console.log(`🛑 Stopped activity interval for room ${roomCode}`)
  }
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Common security/permission headers for camera usage on iOS/Safari
      try {
        res.setHeader('Permissions-Policy', 'camera=(self)')
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
      } catch {}

      // Health check endpoint for Render
      if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'OK',
          timestamp: new Date().toISOString(),
          connections: serverStats.connections,
          rooms: Object.keys(rooms).length,
          uptime: Math.floor((Date.now() - serverStats.startTime) / 1000)
        }))
        return
      }

      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io with Render-compatible settings
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['polling', 'websocket'], // Start with polling for Render
    perMessageDeflate: false,
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    cookie: false, // Disable cookies for better compatibility
    path: '/socket.io',
    serveClient: false,
    // Trust Render's proxy
    allowRequest: (req, callback) => {
      console.log(`📡 Socket.IO request from: ${req.headers.origin || req.headers.host}`)
      callback(null, true) // Allow all requests
    }
  })

  console.log('✅ Socket.IO initialized with Render-compatible settings')

  // Update crypto prices and broadcast to ALL clients
  function updateCryptoPrices() {
    const cryptoSymbols = Object.keys(globalCryptoPrices)
    
    cryptoSymbols.forEach(symbol => {
      const currentPrice = globalCryptoPrices[symbol]
      const changePercent = (Math.random() - 0.5) * 10 // -5% to +5%
      const newPrice = Math.round(currentPrice * (1 + changePercent / 100) * 100) / 100
      globalCryptoPrices[symbol] = Math.max(0.01, newPrice) // Minimum 1 cent
    })
    
    console.log('💰 Updated global crypto prices:', globalCryptoPrices)
    
    // Broadcast to ALL rooms
    Object.keys(rooms).forEach(roomCode => {
      io.to(roomCode).emit('crypto:priceUpdate', globalCryptoPrices)
    })
  }

  // 🚨 CRITICAL: Periodic consistency validation
  function validateRoomConsistency() {
    console.log('\n🔍 === PERIODIC CONSISTENCY CHECK ===')
    
    Object.entries(rooms).forEach(([roomCode, room]) => {
      if (!room.started || Object.keys(room.players).length === 0) return
      
      console.log(`🏠 Checking room ${roomCode} with ${Object.keys(room.players).length} players`)
      
      // Force all players to recalculate with server prices
      io.to(roomCode).emit('crypto:forceRecalculation', {
        prices: globalCryptoPrices,
        timestamp: Date.now(),
        triggeredBy: 'CONSISTENCY_CHECK'
      })
      
      console.log(`🔄 Forced consistency check for room ${roomCode}`)
    })
    
    console.log('✅ Consistency validation complete\n')
  }

  // Removed generic periodic price updates.
  // Prices now change ONLY via live market activities (startActivityInterval)
  // and manual player scans to ensure predictable, event-driven updates.

  // Run consistency check every 2 minutes
  setInterval(validateRoomConsistency, 120000)

  io.on('connection', (socket) => {
    serverStats.connections++
    console.log(`\n🎉 === NEW CONNECTION ===`)
    console.log(`🔌 Socket ID: ${socket.id}`)
    console.log(`🌐 Transport: ${socket.conn.transport.name}`)
    console.log(`📍 Remote address: ${socket.handshake.address}`)
    console.log(`🔗 Origin: ${socket.handshake.headers.origin || 'N/A'}`)
    console.log(`📊 Total connections: ${serverStats.connections}`)
    console.log(`===================\n`)
    
    // === INITIALIZATION: Send current market state to new client ===
    // 1. Send current crypto prices (authoritative source)
    socket.emit('crypto:priceUpdate', globalCryptoPrices)
    console.log('💰 Sent initial crypto prices to new client:', globalCryptoPrices)

    // Host checks if room already has a host
    socket.on('host:checkRoom', ({ roomCode }) => {
      console.log(`\n🔍 === HOST CHECK REQUEST ===`)
      console.log(`🏠 Room Code: ${roomCode}`)
      console.log(`🔌 Requesting Socket: ${socket.id}`)
      
      const room = rooms[roomCode]
      if (!room) {
        console.log(`✅ Room ${roomCode} doesn't exist - no host`)
        socket.emit('host:roomCheckResponse', { hasHost: false })
        return
      }
      
      // Check if there are any hosts in the room
      const existingHosts = Object.values(room.players).filter(player => player.isHost)
      console.log(`🔍 Existing hosts found: ${existingHosts.length}`)
      
      if (existingHosts.length > 0) {
        const existingHost = existingHosts[0]
        console.log(`🔍 Found existing host: ${existingHost.name}`)
        
        // If existing host is "Test Host" or "Host", allow takeover
        if (existingHost.name === 'Test Host' || existingHost.name === 'Host') {
          console.log(`✅ Test/Auto host found - allowing takeover`)
          socket.emit('host:roomCheckResponse', { hasHost: false, allowTakeover: true })
        } else {
          console.log(`❌ Room ${roomCode} already has real host: ${existingHost.name}`)
          console.log(`🚫 Blocking new host attempt from ${socket.id}`)
          
          socket.emit('host:roomCheckResponse', { 
            hasHost: true, 
            hostName: existingHost.name 
          })
          // Send error message
          socket.emit('host:createError', `Er is al een host in deze kamer: ${existingHost.name}`)
          console.log(`📤 Error sent to ${socket.id}: Host conflict`)
        }
      } else {
        console.log(`✅ Room ${roomCode} exists but no host found - allowing host creation`)
        socket.emit('host:roomCheckResponse', { hasHost: false })
      }
      console.log(`🔍 === HOST CHECK COMPLETE ===\n`)
    })

    // Host creates room - NUCLEAR OPTION: ALWAYS BECOME HOST
    socket.on('host:createRoom', ({ roomCode, hostName, hostAvatar, settings }) => {
      console.log(`\n💥 === NUCLEAR HOST TAKEOVER ===`)
      console.log(`👤 ${hostName} (${socket.id}) WILL BE HOST`)
      
      // Create room if doesn't exist
      if (!rooms[roomCode]) {
        rooms[roomCode] = { players: {}, started: false }
        serverStats.roomsCreated++
        console.log(`🏠 New room created: ${roomCode} (Total rooms: ${Object.keys(rooms).length})`)
        // Initialize authoritative market change map for this room
        roomMarketChange24h[roomCode] = roomMarketChange24h[roomCode] || {}
      }
      
      // Cancel any pending cleanup for this room
      cancelRoomCleanup(roomCode)
      
      // NUKE ALL EXISTING HOSTS - NO MERCY
      Object.keys(rooms[roomCode].players).forEach(id => {
        if (rooms[roomCode].players[id].isHost) {
          console.log(`💀 NUKING HOST: ${rooms[roomCode].players[id].name}`)
          delete rooms[roomCode].players[id]
        }
      })
      
      // SET NEW HOST - NO QUESTIONS ASKED
      rooms[roomCode].hostId = socket.id
      rooms[roomCode].hostName = hostName
      rooms[roomCode].hostAvatar = hostAvatar
      rooms[roomCode].settings = settings
      
      rooms[roomCode].players[socket.id] = {
        name: hostName,
        avatar: hostAvatar,
        joinedAt: Date.now(),
        isHost: true,
        // Initialize host with starting portfolio and cash (even though host uses Market Screen)
        portfolio: { 
          DSHEEP: 1.0,
          NUGGET: 0,
          LNTR: 0,
          OMLT: 0,
          REX: 0,
          ORLO: 0
        },
        cashBalance: settings.startingCash || 1000.00
      }
      
      socket.join(roomCode)
      socket.emit('host:createSuccess', { roomCode, room: rooms[roomCode] })
      io.to(roomCode).emit('lobby:update', rooms[roomCode])
      
      console.log(`✅ ${hostName} IS NOW THE ONLY HOST`)
      console.log(`💥 === NUCLEAR TAKEOVER COMPLETE ===\n`)

      // Note: Live activities will start when game begins (not during host setup)
    })

    // Player joins room
    socket.on('player:join', ({ roomCode, playerName, playerAvatar }) => {
      console.log(`\n🔍 === PLAYER JOIN EVENT RECEIVED ===`)
      console.log(`👤 Player: ${playerName}`)
      console.log(`🏠 Room Code: ${roomCode}`)
      console.log(`🎭 Avatar: ${playerAvatar}`)
      console.log(`🔌 Socket ID: ${socket.id}`)
      console.log(`🔍 Current rooms: ${Object.keys(rooms).join(', ') || 'none'}`)
      
      let room = rooms[roomCode]
      console.log(`🔍 Room exists: ${!!room}`)
      console.log(`🔍 Room code check: "${roomCode}" === "123": ${roomCode === '123'}`)
      
      // Don't auto-create room - let host create it first
      // This prevents conflicts with host takeover logic
      
      if (!room) {
        socket.emit('player:joinError', 'Lobby bestaat niet')
        console.log(`❌ Room ${roomCode} does not exist`)
        return
      }
      
      console.log(`🔍 Room status - started: ${room.started}`)
      console.log(`🔍 Room players: ${Object.keys(room.players).length}`)
      console.log(`🔍 Room host: ${room.hostName}`)
      
      // Check if player is rejoining an active game
      const existingPlayerInActiveGame = Object.entries(room.players).find(([id, p]) => p.name === playerName && p.avatar === playerAvatar)
      const isRejoinActiveGame = room.started && existingPlayerInActiveGame
      
      if (room.started && !isRejoinActiveGame) {
        socket.emit('player:joinError', 'Spel is al gestart')
        console.log(`❌ Room ${roomCode} already started, no existing player found`)
        return
      }

      // Check if player is rejoining (same name exists but different socket)
      const existingPlayer = Object.entries(room.players).find(([id, p]) => p.name === playerName && p.avatar === playerAvatar)
      const isRejoining = existingPlayer && existingPlayer[0] !== socket.id
      
      if (isRejoining) {
        console.log(`🔄 Player ${playerName} is rejoining room ${roomCode}`)
        console.log(`🔌 Old Socket: ${existingPlayer[0]} -> New Socket: ${socket.id}`)
        
        // Preserve existing player data but update socket ID
        const oldPlayerData = existingPlayer[1]
        delete room.players[existingPlayer[0]] // Remove old socket entry
        // Cancel any pending cleanup for the old socket
        const cleanupKey = `${roomCode}:${existingPlayer[0]}`
        if (playerCleanupTimers.has(cleanupKey)) {
          clearTimeout(playerCleanupTimers.get(cleanupKey))
          playerCleanupTimers.delete(cleanupKey)
          console.log(`🧹 Cancelled pending cleanup for ${playerName} (rejoined)`)
        }
        
        room.players[socket.id] = {
          ...oldPlayerData,
          joinedAt: Date.now(), // Update join time
          isRejoining: true,
          disconnected: false,
          disconnectedAt: undefined
        }
        
        console.log(`✅ ${playerName} successfully rejoined with preserved data`)
      } else {
        // Check if it's a completely new player with existing name
        const nameExists = Object.values(room.players).some(p => p.name === playerName && p.avatar === playerAvatar)
        if (nameExists) {
          socket.emit('player:joinError', 'Naam + emoji is al in gebruik')
          console.log(`❌ Name ${playerName} already exists in room ${roomCode}`)
          return
        }
        
        // New player joining
        room.players[socket.id] = {
          name: playerName,
          avatar: playerAvatar,
          joinedAt: Date.now(),
          isHost: false,
          isRejoining: false,
          // Initialize with starting portfolio and cash
          portfolio: { 
            DSHEEP: 1.0,
            NUGGET: 0,
            LNTR: 0,
            OMLT: 0,
            REX: 0,
            ORLO: 0
          },
          cashBalance: room.settings?.startingCash || 1000.00
        }
      }
      
      socket.join(roomCode)
      
      console.log(`📤 Sending joinSuccess to ${socket.id}`)
      console.log(`📤 Join success data:`, { roomCode, playersCount: Object.keys(room.players).length })
      socket.emit('player:joinSuccess', { roomCode, room })
      
      // === INITIALIZATION: Send authoritative market state to joining player ===
      // This ensures the player sees the same percentages as dashboard
      const initialChange = roomMarketChange24h[roomCode] || {}
      socket.emit('market:stateUpdate', { change24h: initialChange })
      console.log(`📊 Sent initial market state to ${playerName}:`, initialChange)
      
      console.log(`📡 Broadcasting lobby update to room ${roomCode}`)
      io.to(roomCode).emit('lobby:update', room)
      
      // Send special notification for dashboard popup
      const joinMessage = isRejoining ? 
        `${playerName} is teruggekeerd naar de lobby` : 
        `${playerName} heeft zich aangesloten bij de lobby`
      
      io.to(roomCode).emit('player:joinNotification', {
        playerName,
        playerAvatar,
        message: joinMessage,
        isRejoining,
        timestamp: Date.now()
      })
      
      console.log(`✅ Player ${playerName} ${isRejoining ? 'rejoined' : 'joined'} room ${roomCode}. Total players: ${Object.keys(room.players).length}`)
      console.log(`🔍 === PLAYER JOIN COMPLETE ===\n`)
    })

    // Start game - NO LOGIC, JUST START
    socket.on('host:startGame', ({ roomCode }) => {
      console.log(`\n🚀 === GAME START - NO QUESTIONS ASKED ===`)
      
      const room = rooms[roomCode]
      if (room) {
        room.started = true
        io.to(roomCode).emit('game:started', { room })
        console.log(`✅ GAME STARTED IN ROOM ${roomCode}`)
        
        // Start live market activities interval now (first event in 30 seconds)
        console.log(`⏰ Live market activities will start in 30 seconds...`)
        startActivityInterval(roomCode, io)
      } else {
        console.log(`❌ Room ${roomCode} not found`)
      }
      
      console.log(`🚀 === GAME START COMPLETE ===\n`)
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      serverStats.connections = Math.max(0, serverStats.connections - 1)
      console.log(`🔌 Client disconnected: ${socket.id} (Remaining: ${serverStats.connections})`)
      
      // Mark player as disconnected and schedule cleanup instead of immediate removal
      for (const [roomCode, room] of Object.entries(rooms)) {
        if (room.players[socket.id]) {
          const playerName = room.players[socket.id].name
          // If host disconnected, keep existing behavior (delete room)
          // Otherwise, mark player as disconnected and keep their state for a grace period
          
          // If host disconnected, clean up room immediately
          if (room.hostId === socket.id) {
            delete rooms[roomCode]
            console.log(`🏠 Room ${roomCode} deleted (host disconnected)`)
            stopActivityInterval(roomCode)
            cancelRoomCleanup(roomCode)
          } else {
            // Mark as disconnected
            room.players[socket.id].disconnected = true
            room.players[socket.id].disconnectedAt = Date.now()
            io.to(roomCode).emit('lobby:update', room)
            console.log(`👤 Player ${playerName} temporarily disconnected from room ${roomCode}`)
            
            // Schedule player cleanup after grace period if they don't return
            const cleanupKey = `${roomCode}:${socket.id}`
            const timer = setTimeout(() => {
              const r = rooms[roomCode]
              if (r && r.players[socket.id] && r.players[socket.id].disconnected) {
                console.log(`🧹 Removing disconnected player ${playerName} from room ${roomCode} after grace period`)
                delete r.players[socket.id]
                io.to(roomCode).emit('lobby:update', r)
                // If room becomes empty, schedule room cleanup
                if (Object.keys(r.players).length === 0) {
                  scheduleRoomCleanup(roomCode)
                }
              }
              playerCleanupTimers.delete(cleanupKey)
            }, PLAYER_CLEANUP_TIMEOUT)
            playerCleanupTimers.set(cleanupKey, timer)
          }
        }
      }
    })

    // Debug: List all rooms
    socket.on('debug:listRooms', () => {
      console.log('\n📋 === ROOM DEBUG INFO ===')
      console.log('📋 Current rooms:', Object.keys(rooms))
      
      Object.entries(rooms).forEach(([roomCode, room]) => {
        console.log(`\n🏠 Room ${roomCode}:`)
        console.log(`   Host ID: ${room.hostId}`)
        console.log(`   Host Name: ${room.hostName}`)
        console.log(`   Players: ${Object.keys(room.players).length}`)
        Object.entries(room.players).forEach(([socketId, player]) => {
          console.log(`     - ${player.name} (${player.avatar}) [${socketId.substring(0, 8)}...] ${player.isHost ? '👑' : ''}`)
        })
        console.log(`   Started: ${room.started}`)
      })
      
      console.log('📋 === END ROOM DEBUG ===\n')
      socket.emit('debug:rooms', rooms)
    })

    // Debug: Force game start test
    socket.on('test:forceGameStart', ({ roomCode }) => {
      console.log('\n🧪 === FORCE GAME START TEST ===')
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`🔌 Socket: ${socket.id}`)
      
      const room = rooms[roomCode]
      if (room) {
        console.log('📡 Force broadcasting game:started event...')
        io.to(roomCode).emit('game:started', { room })
        console.log('✅ Test game:started event sent')
      } else {
        console.log('❌ Room not found for test')
      }
      console.log('🧪 === FORCE GAME START TEST COMPLETE ===\n')
    })

    // Debug: Force host takeover
    socket.on('debug:forceHostTakeover', ({ roomCode, newHostName, newHostAvatar }) => {
      console.log('\n👑 === FORCE HOST TAKEOVER ===')
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`🔌 New Host Socket: ${socket.id}`)
      console.log(`👤 New Host Name: ${newHostName}`)
      
      const room = rooms[roomCode]
      if (!room) {
        console.log('❌ Room not found')
        return
      }
      
      // Remove all existing hosts
      Object.keys(room.players).forEach(socketId => {
        if (room.players[socketId].isHost) {
          console.log(`🗑️ Removing old host: ${room.players[socketId].name}`)
          delete room.players[socketId]
        }
      })
      
      // Add new host
      room.players[socket.id] = {
        name: newHostName,
        avatar: newHostAvatar,
        joinedAt: Date.now(),
        isHost: true
      }
      
      // Update room host info
      room.hostId = socket.id
      room.hostName = newHostName
      room.hostAvatar = newHostAvatar
      
      console.log(`✅ Host takeover complete: ${newHostName} is now host`)
      
      // Broadcast update
      io.to(roomCode).emit('lobby:update', room)
      socket.emit('host:createSuccess', { roomCode, room })
      
      console.log('👑 === FORCE HOST TAKEOVER COMPLETE ===\n')
    })

    // Debug: Clear test connections
    socket.on('debug:clearTestConnections', () => {
      console.log('\n🧹 === CLEARING TEST CONNECTIONS ===')
      
      Object.entries(rooms).forEach(([roomCode, room]) => {
        const testPlayers = Object.entries(room.players).filter(([socketId, player]) => 
          player.name === 'Test Host' || player.name === 'Test Player' || socketId === 'auto-host'
        )
        
        testPlayers.forEach(([socketId, player]) => {
          console.log(`🗑️ Removing test player: ${player.name} (${socketId.substring(0, 8)}...)`)
          delete room.players[socketId]
        })
        
        // If we removed the host, reset room host info
        if (testPlayers.some(([_, player]) => player.isHost)) {
          const remainingHosts = Object.entries(room.players).filter(([_, player]) => player.isHost)
          if (remainingHosts.length > 0) {
            const [newHostId, newHost] = remainingHosts[0]
            room.hostId = newHostId
            room.hostName = newHost.name
            room.hostAvatar = newHost.avatar
            console.log(`👑 New host assigned: ${newHost.name}`)
          }
        }
        
        if (testPlayers.length > 0) {
          io.to(roomCode).emit('lobby:update', room)
          console.log(`📡 Updated room ${roomCode} after removing test players`)
        }
      })
      
      console.log('🧹 === TEST CONNECTIONS CLEARED ===\n')
      socket.emit('debug:testConnectionsCleared')
    })

    // Debug: Create test room 123
    socket.on('debug:createRoom123', () => {
      if (!rooms['123']) {
        rooms['123'] = {
          hostId: 'debug-host',
          hostName: 'Debug Host',
          hostAvatar: '🛠️',
          players: {},
          started: false,
          settings: { volatility: 'medium', gameDuration: 1 }
        }
        console.log('🛠️ Debug: Created room 123')
        socket.emit('debug:roomCreated', '123')
      } else {
        socket.emit('debug:roomExists', '123')
      }
    })

    // Debug: Server statistics
    socket.on('debug:serverStats', () => {
      const uptime = Date.now() - serverStats.startTime
      const stats = {
        ...serverStats,
        uptime: Math.floor(uptime / 1000), // seconds
        activeRooms: Object.keys(rooms).length,
        totalPlayers: Object.values(rooms).reduce((sum, room) => sum + Object.keys(room.players).length, 0),
        globalCryptoPrices
      }
      console.log('📊 Server Stats:', stats)
      socket.emit('debug:serverStats', stats)
    })

    // Debug: Force crypto price sync
    socket.on('debug:forcePriceSync', ({ roomCode }) => {
      console.log(`🔄 DEBUG: Forcing price sync for room ${roomCode}`)
      if (roomCode && rooms[roomCode]) {
        io.to(roomCode).emit('crypto:forceRecalculation', {
          prices: globalCryptoPrices,
          timestamp: Date.now(),
          triggeredBy: 'DEBUG'
        })
        console.log('✅ Forced price sync sent to room')
      } else {
        console.log('❌ Room not found for price sync')
      }
    })

    // Test message for room sync verification
    socket.on('test:message', ({ roomCode, message, sender }) => {
      console.log(`\n📡 === TEST MESSAGE RECEIVED ===`)
      console.log(`🏠 Room Code: ${roomCode}`)
      console.log(`👤 Sender: ${sender}`)
      console.log(`💬 Message: ${message}`)
      console.log(`🔌 Socket ID: ${socket.id}`)
      console.log(`🔍 Room exists: ${!!rooms[roomCode]}`)
      
      if (rooms[roomCode]) {
        const playersInRoom = Object.keys(rooms[roomCode].players)
        console.log(`👥 Players count: ${playersInRoom.length}`)
        console.log(`🔌 Socket IDs in room:`, playersInRoom)
        
        // Get all sockets in this room
        const socketsInRoom = io.sockets.adapter.rooms.get(roomCode)
        console.log(`🔌 Active socket connections in room:`, socketsInRoom ? Array.from(socketsInRoom) : 'NONE')
        console.log(`📤 Broadcasting to ${socketsInRoom?.size || 0} connections in room ${roomCode}...`)
      } else {
        console.log(`❌ Room ${roomCode} not found`)
        console.log(`🔍 Available rooms:`, Object.keys(rooms))
      }
      
      // Broadcast to all clients in the room (including sender for confirmation)
      io.to(roomCode).emit('test:messageReceived', {
        message,
        sender,
        timestamp: Date.now(),
        roomCode
      })
      
      console.log(`✅ Test message broadcast complete`)
      console.log(`📡 === TEST MESSAGE END ===\n`)
    })

    // Live market activity - broadcast to all players in room
    socket.on('market:liveActivity', ({ roomCode, activity }) => {
      console.log(`\n📈 === LIVE MARKET ACTIVITY ===`)
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`📊 Activity: ${activity.action} - ${activity.effect}`)
      console.log(`🔌 From Socket: ${socket.id}`)
      
      if (rooms[roomCode]) {
        console.log(`📡 Broadcasting live activity to room ${roomCode}`)
        // Broadcast to ALL players in the room
        io.to(roomCode).emit('market:activityReceived', activity)
        console.log(`✅ Live activity broadcasted`)
      } else {
        console.log(`❌ Room ${roomCode} not found`)
      }
      console.log(`📈 === LIVE ACTIVITY END ===\n`)
    })

    // Crypto price update - broadcast to all players in room
    socket.on('market:priceUpdate', ({ roomCode, cryptos }) => {
      console.log(`\n💰 === CRYPTO PRICE UPDATE ===`)
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`🔌 From Socket: ${socket.id}`)
      console.log(`📊 Updated ${cryptos.length} crypto prices`)
      
      if (rooms[roomCode]) {
        console.log(`📡 Broadcasting price update to room ${roomCode}`)
        // Broadcast to ALL players in the room (except sender to avoid loops)
        socket.to(roomCode).emit('market:pricesUpdated', { cryptos })
        console.log(`✅ Price update broadcasted`)
      } else {
        console.log(`❌ Room ${roomCode} not found`)
      }
      console.log(`💰 === PRICE UPDATE END ===\n`)
    })

    // Player scan action - broadcast to all players in room (including Market Screen)
    socket.on('player:scanAction', ({ roomCode, scanAction }) => {
      console.log(`\n📱 === PLAYER SCAN ACTION ===`)
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`👤 Player: ${scanAction.player}`)
      console.log(`📊 Action: ${scanAction.action} - ${scanAction.effect}`)
      console.log(`🆔 Scan ID: ${scanAction.id}`)
      console.log(`🔌 From Socket: ${socket.id}`)
      
      if (rooms[roomCode]) {
        // Initialize room scan data if not exists
        if (!roomScanData[roomCode]) {
          roomScanData[roomCode] = {
            autoScanActions: [],
            playerScanActions: []
          }
        }
        
        const playersInRoom = Object.keys(rooms[roomCode].players)
        const socketIdsInRoom = playersInRoom
        console.log(`📡 Broadcasting player scan action to room ${roomCode}`)
        console.log(`👥 Players count: ${playersInRoom.length}`)
        console.log(`🔌 Socket IDs in room:`, socketIdsInRoom)
        
        // Get all sockets in this room
        const socketsInRoom = io.sockets.adapter.rooms.get(roomCode)
        console.log(`🔌 Active socket connections in room:`, socketsInRoom ? Array.from(socketsInRoom) : 'NONE')
        
        // 🚨 CRITICAL: Update server crypto prices based on scan effect
        if (scanAction.cryptoSymbol && scanAction.percentageValue !== undefined) {
          const symbol = scanAction.cryptoSymbol
          const percentageChange = scanAction.percentageValue
          
          if (globalCryptoPrices[symbol]) {
            const oldPrice = globalCryptoPrices[symbol]
            const newPrice = oldPrice * (1 + percentageChange / 100)
            globalCryptoPrices[symbol] = Math.max(0.01, Math.round(newPrice * 100) / 100) // Minimum 1 cent, round to 2 decimals
            
            console.log(`💰 MANUELE SCAN PRICE UPDATE: ${symbol} ${oldPrice.toFixed(2)} → ${globalCryptoPrices[symbol].toFixed(2)} (${percentageChange > 0 ? '+' : ''}${percentageChange}%)`)
          } else {
            console.warn(`⚠️ Unknown crypto symbol in scan: ${symbol}`)
          }
        }
        
        // Store player scan action in server data
        roomScanData[roomCode].playerScanActions.unshift(scanAction)
        // Keep only last 10 player scans
        if (roomScanData[roomCode].playerScanActions.length > 10) {
          roomScanData[roomCode].playerScanActions = roomScanData[roomCode].playerScanActions.slice(0, 10)
        }
        // Update authoritative change24h map based on scan effect
        if (!roomMarketChange24h[roomCode]) roomMarketChange24h[roomCode] = {}
        if (scanAction.cryptoSymbol && typeof scanAction.percentageValue === 'number') {
          const sym = scanAction.cryptoSymbol
          const prev = roomMarketChange24h[roomCode][sym] || 0
          roomMarketChange24h[roomCode][sym] = Math.round((prev + scanAction.percentageValue) * 10) / 10
        }
        
        // Broadcast updated crypto prices to ALL clients in room
        console.log(`📡 Broadcasting updated crypto prices to room ${roomCode}`)
        io.to(roomCode).emit('crypto:priceUpdate', globalCryptoPrices)
        
        // Broadcast updated scan data to ALL devices
        io.to(roomCode).emit('scanData:update', {
          autoScanActions: roomScanData[roomCode].autoScanActions,
          playerScanActions: roomScanData[roomCode].playerScanActions
        })
        // Broadcast authoritative market change map
        io.to(roomCode).emit('market:stateUpdate', {
          change24h: roomMarketChange24h[roomCode] || {}
        })
        
        // Force recalculation for all players to update their portfolios
        console.log(`🔄 Forcing portfolio recalculation for all players`)
        io.to(roomCode).emit('crypto:forceRecalculation', {
          prices: globalCryptoPrices,
          timestamp: Date.now(),
          triggeredBy: `MANUELE_SCAN_${scanAction.player}`
        })
        
        console.log(`✅ Player scan action and data broadcasted to ${socketsInRoom?.size || 0} active connections`)
        console.log(`📤 Broadcasted scan: ${scanAction.player} - ${scanAction.effect}`)
      } else {
        console.log(`❌ Room ${roomCode} not found`)
        console.log(`🔍 Available rooms:`, Object.keys(rooms))
      }
      console.log(`📱 === PLAYER SCAN ACTION END ===\n`)
    })

    // Request scan data - send current server scan data to client
    socket.on('scanData:request', ({ roomCode }) => {
      console.log(`\n📊 === SCAN DATA REQUEST ===`)
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`🔌 From Socket: ${socket.id}`)
      
      if (rooms[roomCode] && roomScanData[roomCode]) {
        console.log(`📤 Sending scan data to client`)
        console.log(`🤖 Auto scans: ${roomScanData[roomCode].autoScanActions.length}`)
        console.log(`👤 Player scans: ${roomScanData[roomCode].playerScanActions.length}`)
        
        socket.emit('scanData:update', {
          autoScanActions: roomScanData[roomCode].autoScanActions,
          playerScanActions: roomScanData[roomCode].playerScanActions
        })
      } else {
        console.log(`❌ Room ${roomCode} not found or no scan data`)
        socket.emit('scanData:update', {
          autoScanActions: [],
          playerScanActions: []
        })
      }
      console.log(`📊 === SCAN DATA REQUEST END ===\n`)
    })

    // === DASHBOARD INITIALIZATION: Dashboard pushes its market snapshot ===
    // This establishes the initial baseline for all market percentages
    // After this, all changes come from events (beurs + scans)
    socket.on('dashboard:syncMarketState', ({ roomCode, changeMap }) => {
      try {
        if (!rooms[roomCode]) return
        
        console.log(`\n📊 === DASHBOARD MARKET STATE SYNC ===`)
        console.log(`🏠 Room: ${roomCode}`)
        console.log(`📈 Received state:`, changeMap)
        
        // Update server's authoritative map
        roomMarketChange24h[roomCode] = { ...(roomMarketChange24h[roomCode] || {}), ...(changeMap || {}) }
        console.log(`✅ Server state updated:`, roomMarketChange24h[roomCode])
        
        // Broadcast to ALL clients to ensure synchronization
        io.to(roomCode).emit('market:stateUpdate', {
          change24h: roomMarketChange24h[roomCode]
        })
        console.log(`📡 Broadcasted unified state to all clients`)
        console.log(`📊 === DASHBOARD SYNC COMPLETE ===\n`)
      } catch (e) {
        console.warn('Failed to sync market state from dashboard', e)
      }
    })

    // Room verification - debug helper to check room membership
    socket.on('room:verify', ({ roomCode, playerName }) => {
      console.log(`\n🔍 === ROOM VERIFICATION REQUEST ===`)
      console.log(`🏠 Room Code: ${roomCode}`)
      console.log(`👤 Player Name: ${playerName}`)
      console.log(`🔌 Socket ID: ${socket.id}`)
      
      // Get actual socket.io room members
      const socketsInRoom = io.sockets.adapter.rooms.get(roomCode)
      const actualSocketsInRoom = socketsInRoom ? Array.from(socketsInRoom) : []
      
      console.log(`🔌 Socket.IO room members:`, actualSocketsInRoom)
      console.log(`🎯 This socket in Socket.IO room: ${actualSocketsInRoom.includes(socket.id)}`)
      
      if (rooms[roomCode]) {
        const room = rooms[roomCode]
        const playersInRoom = Object.keys(room.players)
        const isPlayerInRoom = playersInRoom.includes(socket.id)
        const isSocketInRoom = actualSocketsInRoom.includes(socket.id)
        
        console.log(`✅ Room exists: ${roomCode}`)
        console.log(`👥 Players in data: ${playersInRoom.length}`)
        console.log(`🔌 Socket IDs in data:`, playersInRoom)
        console.log(`🎯 This socket in data: ${isPlayerInRoom}`)
        console.log(`🎯 This socket in Socket.IO room: ${isSocketInRoom}`)
        
        // WARNING if mismatch
        if (isPlayerInRoom !== isSocketInRoom) {
          console.log(`⚠️ WARNING: Mismatch between player data and Socket.IO room!`)
          console.log(`   Player in data: ${isPlayerInRoom}`)
          console.log(`   Socket in room: ${isSocketInRoom}`)
        }
        
        // Send verification response back to client
        socket.emit('room:verificationResult', {
          roomExists: true,
          playerInRoom: isPlayerInRoom,
          socketInRoom: isSocketInRoom,
          playersCount: playersInRoom.length,
          socketIds: playersInRoom,
          actualSocketsInRoom: actualSocketsInRoom,
          roomData: room
        })
        
        console.log(`📤 Verification result sent to client`)
      } else {
        console.log(`❌ Room ${roomCode} does not exist in data`)
        console.log(`🔍 Available rooms:`, Object.keys(rooms))
        console.log(`🔌 But Socket.IO room has ${actualSocketsInRoom.length} connections:`, actualSocketsInRoom)
        
        socket.emit('room:verificationResult', {
          roomExists: false,
          playerInRoom: false,
          socketInRoom: actualSocketsInRoom.includes(socket.id),
          playersCount: 0,
          socketIds: [],
          actualSocketsInRoom: actualSocketsInRoom,
          availableRooms: Object.keys(rooms)
        })
      }
      console.log(`🔍 === ROOM VERIFICATION COMPLETE ===\n`)
    })

    // Dashboard requests refresh - tell all players to send their data
    socket.on('dashboard:requestRefresh', ({ roomCode }) => {
      console.log(`\n🔄 === DASHBOARD REFRESH REQUEST ===`)
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`📡 Broadcasting refresh request to all players...`)
      
      io.to(roomCode).emit('dashboard:refreshRequested', { 
        timestamp: Date.now() 
      })
      
      console.log(`✅ Refresh request sent`)
      console.log(`🔄 === REFRESH REQUEST COMPLETE ===\n`)
    })

    // 🎯 UNIFIED PLAYER DATA UPDATE - Single Source of Truth
    socket.on('player:updateData', ({ roomCode, playerData }) => {
      console.log(`\n🎯 === UNIFIED PLAYER UPDATE ===`)
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`👤 Player: ${playerData.name}`)
      console.log(`🔌 Socket: ${socket.id}`)
      console.log(`💯 Total Value: €${playerData.totalValue}`)
      
      if (!rooms[roomCode] || !rooms[roomCode].players[socket.id]) {
        console.log(`❌ Room ${roomCode} or player not found`)
        return
      }

      // 🔍 DATA VALIDATION
      const isValidData = (
        typeof playerData.cashBalance === 'number' &&
        typeof playerData.portfolioValue === 'number' &&
        typeof playerData.totalValue === 'number' &&
        playerData.cashBalance >= 0 &&
        playerData.portfolioValue >= 0 &&
        playerData.totalValue >= 0
      )

      if (!isValidData) {
        console.log(`❌ Invalid player data:`, playerData)
        return
      }

      // 🚨 CRITICAL: Server-side portfolio calculation using GLOBAL prices
      let serverPortfolioValue = 0
      if (playerData.portfolio && typeof playerData.portfolio === 'object') {
        serverPortfolioValue = Object.entries(playerData.portfolio).reduce((total, [symbol, amount]) => {
          const price = globalCryptoPrices[symbol] || 0
          return total + (price * Number(amount))
        }, 0)
        serverPortfolioValue = Math.round(serverPortfolioValue * 100) / 100
      }

      // 🧮 CONSISTENCY CHECK using server calculations
      const serverTotalValue = Math.round((serverPortfolioValue + playerData.cashBalance) * 100) / 100
      const clientPortfolioValue = Math.round(playerData.portfolioValue * 100) / 100
      const clientTotalValue = Math.round(playerData.totalValue * 100) / 100

      console.log(`🔍 CONSISTENCY CHECK:`)
      console.log(`📊 Server Portfolio: €${serverPortfolioValue} | Client Portfolio: €${clientPortfolioValue}`)
      console.log(`💰 Cash: €${playerData.cashBalance}`)
      console.log(`💯 Server Total: €${serverTotalValue} | Client Total: €${clientTotalValue}`)

      // Use SERVER calculations as the authoritative source
      if (Math.abs(serverPortfolioValue - clientPortfolioValue) > 0.01 || 
          Math.abs(serverTotalValue - clientTotalValue) > 0.01) {
        console.log(`🚨 MISMATCH DETECTED - Using SERVER values as authoritative!`)
        playerData.portfolioValue = serverPortfolioValue
        playerData.totalValue = serverTotalValue
      }

      // 📊 UPDATE SERVER STATE (Single Source of Truth)
      const timestamp = Date.now()
      rooms[roomCode].players[socket.id] = {
        ...rooms[roomCode].players[socket.id],
        ...playerData,
        lastUpdate: timestamp,
        socketId: socket.id
      }
      
      console.log(`✅ Server state updated for ${playerData.name}`)
      console.log(`💰 Cash: €${playerData.cashBalance}`)
      console.log(`💎 Portfolio: €${playerData.portfolioValue}`)
      console.log(`💯 Total: €${playerData.totalValue}`)

      // 📡 BROADCAST TO ALL PLAYERS IN ROOM
      io.to(roomCode).emit('dashboard:livePlayerUpdate', {
        playerId: socket.id,
        playerName: playerData.name,
        totalValue: playerData.totalValue,
        portfolioValue: playerData.portfolioValue,
        cashBalance: playerData.cashBalance,
        timestamp: timestamp
      })

      // 🚨 CRITICAL: Force all clients to recalculate with server prices
      io.to(roomCode).emit('crypto:forceRecalculation', {
        prices: globalCryptoPrices,
        timestamp: timestamp,
        triggeredBy: playerData.name
      })
      
      console.log(`📡 Broadcasted live update to room ${roomCode}`)
      console.log(`🔄 Forced price recalculation for all clients`)
      console.log(`🎯 === UNIFIED UPDATE COMPLETE ===\n`)
    })
  })

  // Pre-create room 123 for testing BEFORE starting server
  rooms['123'] = {
    hostId: 'startup-host',
    hostName: 'Startup Host',
    hostAvatar: '🚀',
    players: {},
    started: false,
    settings: { volatility: 'medium', gameDuration: 1 }
  }
  
  // Reset room status every 60 seconds to allow new players
  setInterval(() => {
    if (rooms['123']) {
      rooms['123'].started = false
      rooms['123'].players = {}
      console.log(`🔄 Reset room 123 status for new players`)
    }
  }, 60000)
  console.log(`🏠 Pre-created test room: 123`)

  httpServer
    .once('error', (err) => {
      console.error('❌ Server startup error:', err)
      process.exit(1)
    })
    .listen(port, '0.0.0.0', () => {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`🚀 CryptoClash Server Successfully Started!`)
      console.log(`${'='.repeat(60)}`)
      console.log(`📍 Environment: ${dev ? 'DEVELOPMENT' : 'PRODUCTION'}`)
      console.log(`🌐 Server URL: http://0.0.0.0:${port}`)
      console.log(`🏥 Health Check: http://0.0.0.0:${port}/api/health`)
      console.log(`🔌 Socket.IO: Enabled (polling → websocket)`)
      console.log(`🎮 Ready to accept players!`)
      console.log(`${'='.repeat(60)}\n`)
    })
})
