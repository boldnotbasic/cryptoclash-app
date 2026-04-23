const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

console.log('🚀 CryptoClash Server v1.1 - Timer: 120s, Market Forecast enabled')

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Room storage with cleanup tracking
const rooms = {}

// Authoritative per-room change24h map (symbol -> number)
const roomMarketChange24h = {}
const roomCleanupTimers = new Map()
// Live activity intervals per room
const activityIntervals = {}

// Track scan count per room for automatic forecast every 10 scans
const roomScanCount = {}
// Pre-generated next 10 events per room for accurate forecast
const roomUpcomingEvents = {}
// Track price history per room per crypto (last 10 changes)
const roomPriceHistory = {}

// 📈 MOMENTUM SYSTEM: Track recent trends per room per crypto for realistic market behavior
// Helps coins in uptrend continue rising, and downtrends continue falling (like real markets)
const roomMomentum = {} // { roomCode: { DSHP: [+5, -2, +8], ORX: [-3, -5, +2], ... } }

// 🌍 MARKET STATE SYSTEM: Track overall market mood per room for realistic event cascades
// States: 'normal' (50/50), 'bull_market' (70% positive), 'bear_market' (70% negative), 'recovery' (60% positive)
// 'war' (85% negative), 'peace' (75% positive)
// Example: Bear Market event → 6-10 negative events → auto recovery → normal
// Example: WAR → 8-12 negative events → PEACE → 6-8 positive events → normal
const roomMarketState = {
  // roomCode: {
  //   state: 'normal',           // Current market state
  //   eventsRemaining: 0,        // Events until state transition
  //   triggeredBy: 'Bear Market' // What caused this state
  // }
}

// ⚔️ MACRO EVENT SYSTEM: Track major world events that trigger cascades
// Tracks when last macro event occurred to prevent too frequent triggering
const roomMacroEventTracker = {
  // roomCode: {
  //   lastMacroEvent: 'WAR',
  //   eventsSinceLastMacro: 0,
  //   macroEventCooldown: 30  // Minimum events between macro events
  // }
}

// Track per-player cleanup timers for disconnected players
const playerCleanupTimers = new Map()

// Track turn timers per room (auto-end turn after 90 seconds)
const turnTimers = new Map()
const TURN_DURATION = 90 * 1000 // 90 seconds

// Track pause state per room
const roomPauseState = {}

// Global marketplace orders map - persists across socket reconnections
// orderId -> { order, roomCode }
const globalMarketplaceOrders = new Map()

// CRITICAL: Global crypto prices - SINGLE SOURCE OF TRUTH
const globalCryptoPrices = {
  DSHP: 42.30,
  ORX: 1250.75, 
  LNTR: 89.20,
  SIL: 156.40,
  REX: 0.85,
  GLX: 2340.80
}

// CRITICAL: Default market change24h values - ALL START AT 0%
// All coins begin at 0% for a clean, fair start
const defaultMarketChange24h = {
  DSHP: 0,
  ORX: 0,
  LNTR: 0,
  SIL: 0,
  REX: 0,
  GLX: 0
}

// CRITICAL: Centralized scan data per room - SERVER SOURCE OF TRUTH
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

// Turn timer functions
function startTurnTimer(roomCode, io) {
  const room = rooms[roomCode]
  
  // Check if timer is enabled for this room
  if (room && room.timerEnabled === false) {
    console.log(`⏰ Timer disabled for room ${roomCode} - skipping auto turn`)
    return
  }
  
  // Clear existing timer if any
  if (turnTimers.has(roomCode)) {
    clearTimeout(turnTimers.get(roomCode))
  }
  
  console.log(`⏰ Starting turn timer for room ${roomCode} (${TURN_DURATION / 1000}s)`)
  
  const timer = setTimeout(() => {
    console.log(`⏰ Turn timer expired for room ${roomCode} - auto-ending turn`)
    
    const room = rooms[roomCode]
    if (!room) {
      console.log('❌ Room not found, skipping auto turn end')
      return
    }
    
    // Auto-advance turn using same logic as manual turn:end
    const nonHostIds = Object.keys(room.players || {}).filter(id => !room.players[id].isHost)
    if (nonHostIds.length === 0) {
      console.log('⚠️ No non-host players, skipping turn logic')
      return
    }
    
    let order = Array.isArray(room.playerOrder) ? room.playerOrder : []
    order = order.filter(id => nonHostIds.includes(id))
    const missing = nonHostIds.filter(id => !order.includes(id))
    order = [...order, ...missing]
    if (order.length === 0) {
      console.log('⚠️ Empty order after sanitization, skipping')
      return
    }
    
    const currentId = room.currentTurnPlayerId && order.includes(room.currentTurnPlayerId)
      ? room.currentTurnPlayerId
      : order[0]
    const currentIndex = order.indexOf(currentId)
    const nextIndex = (currentIndex + 1) % order.length
    const nextId = order[nextIndex]
    
    room.playerOrder = order
    room.currentTurnPlayerId = nextId
    
    const nextPlayer = room.players[nextId]
    const nextPlayerName = nextPlayer ? nextPlayer.name : 'Onbekende speler'
    
    console.log('⏰ Auto turn advanced:', {
      previous: currentId,
      next: nextId,
      nextPlayerName,
      order
    })
    
    // Broadcast room update
    io.to(roomCode).emit('lobby:update', room)
    
    // Send turn notification
    io.to(roomCode).emit('turn:changed', {
      newTurnPlayerId: nextId,
      newTurnPlayerName: nextPlayerName,
      previousTurnPlayerId: currentId,
      autoAdvanced: true // Flag to indicate this was auto-advanced
    })
    
    // Start timer for next player
    startTurnTimer(roomCode, io)
  }, TURN_DURATION)
  
  turnTimers.set(roomCode, timer)
}

function cancelTurnTimer(roomCode) {
  if (turnTimers.has(roomCode)) {
    console.log(`⏰ Cancelling turn timer for room ${roomCode}`)
    clearTimeout(turnTimers.get(roomCode))
    turnTimers.delete(roomCode)
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
  const cryptoSymbols = ['DSHP', 'ORX', 'LNTR', 'SIL', 'REX', 'GLX']
  const sanitizeEffect = (effect) => {
    try {
      if (typeof effect !== 'string') return effect
      // Replace whole-word occurrences only
      return effect
        .replace(/\bRIZZ\b/g, 'ORX')
        .replace(/\bWHALE\b/g, 'REX')
    } catch {
      return effect
    }
  }
  
  // Helper to get volatility bound in percent
  const getVolatilityBound = () => {
    const vRaw = rooms[roomCode]?.settings?.volatility
    const v = typeof vRaw === 'string' ? vRaw.toLowerCase() : 'medium'
    if (v === 'low') return 1
    if (v === 'high') return 3
    return 2
  }

  // Generate first activity immediately
  const generateActivity = () => {
    // Don't generate activities when game is paused
    if (roomPauseState[roomCode]) {
      console.log(`⏸️ Game paused for room ${roomCode}, skipping activity generation`)
      return
    }
    
    const randomCrypto = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)]
    const bound = getVolatilityBound()
    
    // Generate percentage - NEVER 0!
    let percentage
    do {
      const raw = parseFloat(((Math.random() * (2 * bound)) - bound).toFixed(1))
      percentage = Math.max(-bound, Math.min(bound, raw)) // final clamp
    } while (percentage === 0)  // Re-roll if 0
    
    const sign = percentage >= 0 ? '+' : ''
    const actions = ['Market Move', 'Price Alert', 'Trading Signal', 'Volume Spike']
    const randomActionType = actions[Math.floor(Math.random() * actions.length)]

    // Create consistent message format matching player events
    const cryptoNames = {
      'DSHP': 'DigiSheep',
      'ORX': 'Orex',
      'LNTR': 'Lentra',
      'SIL': 'Silica',
      'REX': 'Rex',
      'GLX': 'Glooma'
    }
    const cryptoName = cryptoNames[randomCrypto] || randomCrypto
    
    // Simple format for automatic events (no news headlines): "Orex dip -0.6%"
    let effectMessage = ''
    if (percentage > 0) {
      const action = 'stijgt'
      effectMessage = `${cryptoName} ${action} ${sign}${percentage}%`
    } else {
      const action = 'dip'
      effectMessage = `${cryptoName} ${action} ${sign}${percentage}%`
    }

    const activity = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      player: 'Bot',
      action: randomActionType,
      effect: sanitizeEffect(effectMessage),
      cryptoSymbol: randomCrypto,
      percentageValue: percentage,
      headline: 'Beurs update' // Header for automatic Bot events
    }

    if (rooms[roomCode]) {
      // 🚨 CRITICAL: Update server crypto prices for live beurs activities
      if (globalCryptoPrices[randomCrypto]) {
        const oldPrice = globalCryptoPrices[randomCrypto]
        const newPrice = oldPrice * (1 + percentage / 100)
        globalCryptoPrices[randomCrypto] = Math.max(0.01, Math.round(newPrice * 100) / 100)
        
        // Track price history for candlestick chart
        if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][randomCrypto]) {
          roomPriceHistory[roomCode][randomCrypto].push({ percentage: percentage, timestamp: Date.now() })
          if (roomPriceHistory[roomCode][randomCrypto].length > 10) {
            roomPriceHistory[roomCode][randomCrypto].shift()
          }
          console.log(`📊 BOT EVENT: ${randomCrypto} price history updated (${percentage > 0 ? '+' : ''}${percentage}%) - now ${roomPriceHistory[roomCode][randomCrypto].length} events`)
        }
        
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
      const prevChange = roomMarketChange24h[roomCode][randomCrypto] ?? defaultMarketChange24h[randomCrypto] ?? 0
      roomMarketChange24h[roomCode][randomCrypto] = Math.round((prevChange + percentage) * 10) / 10
      
      // Broadcast updated crypto prices first
      socketIo.to(roomCode).emit('crypto:priceUpdate', globalCryptoPrices)
      socketIo.to(roomCode).emit('crypto:priceHistory', roomPriceHistory[roomCode] || {})
      
      // Then broadcast the activity with updated scan data
      // Sanitize any legacy entries before emitting
      const sanitizedAuto = roomScanData[roomCode].autoScanActions.map(a => ({
        ...a,
        effect: sanitizeEffect(a.effect)
      }))
      const sanitizedPlayer = roomScanData[roomCode].playerScanActions.map(a => ({
        ...a,
        effect: sanitizeEffect(a.effect)
      }))
      socketIo.to(roomCode).emit('scanData:update', {
        autoScanActions: sanitizedAuto,
        playerScanActions: sanitizedPlayer,
        upcomingEvents: roomUpcomingEvents[roomCode] || [],
        scanCount: roomScanCount[roomCode] || 0
      })

      // Broadcast current market change map and market state
      socketIo.to(roomCode).emit('market:stateUpdate', {
        change24h: roomMarketChange24h[roomCode] || {},
        marketState: roomMarketState[roomCode]?.state || 'normal',
        stateEventsRemaining: roomMarketState[roomCode]?.eventsRemaining || 0
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
  // Also cancel turn timer when stopping activities
  cancelTurnTimer(roomCode)
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

    // Player checks if room exists WITHOUT joining
    socket.on('room:exists', ({ roomCode }) => {
      console.log(`\n🔍 === ROOM EXISTS CHECK ===`)
      console.log(`🏠 Room Code: ${roomCode}`)
      const room = rooms[roomCode]
      if (room && !room.started) {
        console.log(`✅ Room ${roomCode} exists and is open`)
        const playerAvatars = room.players
          ? Object.values(room.players).map((p) => p.avatar)
          : []
        socket.emit('room:existsResult', { exists: true, roomCode, playerAvatars })
      } else if (room && room.started) {
        console.log(`❌ Room ${roomCode} already started`)
        socket.emit('room:existsResult', { exists: false, error: 'Dit spel is al gestart' })
      } else {
        console.log(`❌ Room ${roomCode} does not exist`)
        socket.emit('room:existsResult', { exists: false, error: 'Lobby bestaat nog niet. Vraag de host om eerst een lobby aan te maken.' })
      }
    })

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

    // Update player order from WaitingRoom drag-and-drop
    socket.on('room:updatePlayerOrder', ({ roomCode, playerOrder }) => {
      try {
        console.log('\n🎯 === room:updatePlayerOrder RECEIVED ===')
        console.log('🏠 Room Code:', roomCode)
        console.log('📋 Incoming order:', playerOrder)

        const room = rooms[roomCode]
        if (!room) {
          console.log('❌ Room not found for updatePlayerOrder')
          return
        }
        if (!Array.isArray(playerOrder)) {
          console.log('❌ Invalid playerOrder payload')
          return
        }

        const currentPlayerIds = Object.keys(room.players || {}).filter(id => !room.players[id].isHost)
        if (currentPlayerIds.length === 0) {
          console.log('⚠️ No non-host players for turn order')
          return
        }

        // Sanitize order: keep only current players, preserve order
        const sanitized = playerOrder.filter(id => currentPlayerIds.includes(id))
        const missing = currentPlayerIds.filter(id => !sanitized.includes(id))
        const finalOrder = [...sanitized, ...missing]

        room.playerOrder = finalOrder

        // Set currentTurnPlayerId based on game state
        if (finalOrder.length > 0) {
          if (!room.started) {
            // Before game starts, first player in order gets the turn
            room.currentTurnPlayerId = finalOrder[0]
            console.log('🎯 Pre-game: Set turn to first in order:', room.currentTurnPlayerId)
          } else if (!room.currentTurnPlayerId || !finalOrder.includes(room.currentTurnPlayerId)) {
            // During game, only update if current player is invalid
            room.currentTurnPlayerId = finalOrder[0]
            console.log('🎯 In-game: Reset turn to first (invalid current player):', room.currentTurnPlayerId)
          } else {
            console.log('🎯 In-game: Keeping current turn player:', room.currentTurnPlayerId)
          }
        }

        console.log('✅ New player order stored:', finalOrder)
        console.log('🎯 Current turn player:', room.currentTurnPlayerId)
        console.log('🎯 Game started:', room.started)
        
        // Debug: show all players and their socket IDs
        console.log('🎯 All players in room:')
        Object.entries(room.players).forEach(([socketId, player]) => {
          console.log(`  - ${player.name} (${player.avatar}): ${socketId} ${player.isHost ? '👑 HOST' : ''}`)
        })

        // Broadcast updated lobby state
        io.to(roomCode).emit('lobby:update', room)
      } catch (e) {
        console.warn('⚠️ Failed to handle room:updatePlayerOrder', e)
      }
    })

    // Host creates room - NUCLEAR OPTION: ALWAYS BECOME HOST
    socket.on('host:createRoom', ({ roomCode, hostName, hostAvatar, settings }) => {
      console.log(`\n💥 === NUCLEAR HOST TAKEOVER ===`)
      console.log(`👤 ${hostName} (${socket.id}) WILL BE HOST`)
      
      // Create room if doesn't exist
      if (!rooms[roomCode]) {
        rooms[roomCode] = { 
          code: roomCode.toUpperCase(), // Ensure uppercase for consistency
          players: {}, 
          started: false, 
          settings: settings || {}, 
          playerOrder: [], 
          currentTurnPlayerId: null, 
          timerEnabled: true,
          finishedPlayers: [], // Track players who finished in order: [{ socketId, name, avatar, finishTime, yearsPlayed, rank }]
          gameStartTime: null
        }
        
        // Initialize price history for this room
        roomPriceHistory[roomCode] = {
          DSHP: [],
          ORX: [],
          LNTR: [],
          SIL: [],
          REX: [],
          GLX: []
        }
        
        // 📈 Initialize momentum tracking for realistic market trends
        roomMomentum[roomCode] = {
          DSHP: [],
          ORX: [],
          LNTR: [],
          SIL: [],
          REX: [],
          GLX: []
        }
        console.log(`📈 Initialized momentum tracking for room ${roomCode}`)
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
      rooms[roomCode].code = roomCode.toUpperCase() // Ensure code is always set
      rooms[roomCode].hostId = socket.id
      rooms[roomCode].hostName = hostName
      rooms[roomCode].hostAvatar = hostAvatar
      rooms[roomCode].settings = settings
      
      rooms[roomCode].players[socket.id] = {
        name: hostName,
        avatar: hostAvatar,
        joinedAt: Date.now(),
        isHost: true,
        // Initialize host with empty portfolio and starting cash
        portfolio: { 
          DSHP: 0,
          ORX: 0,
          LNTR: 0,
          SIL: 0,
          REX: 0,
          GLX: 0
        },
        cashBalance: settings.startingCash || 1000.00
      }
      
      socket.join(roomCode)
      
      // Send success to host first
      socket.emit('host:createSuccess', { roomCode, room: rooms[roomCode] })
      
      // 🚨 CRITICAL FIX: Use setImmediate to ensure host processes createSuccess first
      setImmediate(() => {
        console.log(`📡 Broadcasting lobby update to room ${roomCode}`)
        io.to(roomCode).emit('lobby:update', rooms[roomCode])
        console.log(`✅ Lobby update sent to ${io.sockets.adapter.rooms.get(roomCode)?.size || 0} clients`)
      })
      
      console.log(`✅ ${hostName} IS NOW THE ONLY HOST`)
      console.log(`💥 === NUCLEAR TAKEOVER COMPLETE ===\n`)

      // 🎯 CRITICAL: Generate upcoming events IMMEDIATELY when room is created
      // so the "Komende 10 Pop-up Events" widget is populated from the start
      try {
        if (!roomUpcomingEvents[roomCode] || roomUpcomingEvents[roomCode].length === 0) {
          generateUpcomingEvents(roomCode)
          console.log(`📋 Generated initial upcoming events for room ${roomCode}`)
        }
        if (typeof roomScanCount[roomCode] !== 'number') {
          roomScanCount[roomCode] = 0
        }
        // Ensure scan data container exists so dashboard can render
        if (!roomScanData[roomCode]) {
          roomScanData[roomCode] = { autoScanActions: [], playerScanActions: [] }
        }
        // Broadcast initial scan data + upcoming events to all clients
        setImmediate(() => {
          io.to(roomCode).emit('scanData:update', {
            autoScanActions: roomScanData[roomCode].autoScanActions,
            playerScanActions: roomScanData[roomCode].playerScanActions,
            upcomingEvents: roomUpcomingEvents[roomCode] || [],
            scanCount: roomScanCount[roomCode] || 0
          })
          console.log(`📡 Broadcasted initial upcomingEvents (${(roomUpcomingEvents[roomCode] || []).length}) to room ${roomCode}`)
        })
      } catch (e) {
        console.warn('⚠️ Failed to generate/broadcast initial upcoming events:', e)
      }

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
        const message = 'Lobby bestaat nog niet. Vraag de host om eerst een lobby aan te maken.'
        socket.emit('player:joinError', message)
        console.log(`❌ Room ${roomCode} does not exist - sending error to player:`, message)
        return
      }
      
      // 🚨 CRITICAL FIX: Join Socket.IO room FIRST before any data updates
      // This ensures the player receives all subsequent broadcasts
      try {
        socket.join(roomCode)
        console.log(`✅ Socket ${socket.id} joined Socket.IO room ${roomCode}`)
      } catch (error) {
        console.error(`❌ Failed to join Socket.IO room:`, error)
        socket.emit('player:joinError', 'Kon niet joinen in de lobby')
        return
      }
      
      console.log(`🔍 Room status - started: ${room.started}`)
      console.log(`🔍 Room players: ${Object.keys(room.players).length}`)
      console.log(`🔍 Room host: ${room.hostName}`)
      
      // Ensure turn metadata exists
      room.playerOrder = room.playerOrder || []
      if (typeof room.currentTurnPlayerId === 'undefined') {
        room.currentTurnPlayerId = null
      }

      // Check if player already exists with CURRENT socket ID (already joined)
      if (room.players[socket.id]) {
        console.log(`✅ Player ${playerName} already in room with socket ${socket.id} - sending success`)
        room.code = roomCode // Ensure room.code is set for client validation
        socket.emit('player:joinSuccess', { roomCode, room })
        return
      }

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
          disconnectedAt: undefined,
          isHost: false // Ensure rejoining players are never marked as host
        }
        
        console.log(`✅ ${playerName} successfully rejoined with preserved data`)
      } else {
        // New player joining - no avatar/name validation needed
        // Players can use default avatars and the system will handle duplicates
        console.log(`👤 New player ${playerName} joining room ${roomCode}`)
        
        // New player joining
        room.players[socket.id] = {
          name: playerName,
          avatar: playerAvatar,
          joinedAt: Date.now(),
          isHost: false,
          isRejoining: false,
          disconnected: false,
          // Initialize with empty portfolio and starting cash
          portfolio: { 
            DSHP: 0,
            ORX: 0,
            LNTR: 0,
            SIL: 0,
            REX: 0,
            GLX: 0
          },
          cashBalance: room.settings?.startingCash || 1000.00
        }
      }
      
      // Socket.IO room join already happened at the start of this handler
      
      // Ensure room.code is set for client-side validation
      room.code = roomCode
      
      console.log(`📤 Sending joinSuccess to ${socket.id}`)
      console.log(`📤 Join success data:`, { roomCode, playersCount: Object.keys(room.players).length })
      console.log(`📤 Room.code in response:`, room.code)
      
      // Send room language to player if available
      if (room.settings && room.settings.language) {
        console.log(`🌐 Room language: ${room.settings.language}`)
        socket.emit('room:languageUpdate', { language: room.settings.language })
      }
      
      socket.emit('player:joinSuccess', { roomCode, room })
      
      // === INITIALIZATION: Ensure price history exists for this room ===
      if (!roomPriceHistory[roomCode]) {
        console.log(`📊 Initializing price history for room ${roomCode}`)
        roomPriceHistory[roomCode] = {
          DSHP: [],
          ORX: [],
          LNTR: [],
          SIL: [],
          REX: [],
          GLX: []
        }
      }
      
      // 📈 Ensure momentum tracking exists for this room
      if (!roomMomentum[roomCode]) {
        console.log(`📈 Initializing momentum tracking for room ${roomCode}`)
        roomMomentum[roomCode] = {
          DSHP: [],
          ORX: [],
          LNTR: [],
          SIL: [],
          REX: [],
          GLX: []
        }
      }
      
      // === INITIALIZATION: Send authoritative market state to joining player ===
      // This ensures the player sees the same percentages as dashboard
      const initialChange = roomMarketChange24h[roomCode] || {}
      socket.emit('market:stateUpdate', { 
        change24h: initialChange,
        marketState: roomMarketState[roomCode]?.state || 'normal',
        stateEventsRemaining: roomMarketState[roomCode]?.eventsRemaining || 0
      })
      console.log(`📊 Sent initial market state to ${playerName}:`, initialChange)
      
      // === INITIALIZATION: Send price history to joining player ===
      socket.emit('crypto:priceHistory', roomPriceHistory[roomCode] || {})
      console.log(`📊 Sent initial price history to ${playerName}:`, roomPriceHistory[roomCode])
      
      // 🚨 CRITICAL FIX: Use setImmediate to ensure joinSuccess is processed first
      // This gives the client time to update their local state before receiving lobby update
      setImmediate(() => {
        console.log(`📡 Broadcasting lobby update to room ${roomCode}`)
        io.to(roomCode).emit('lobby:update', room)
        console.log(`✅ Lobby update broadcasted to ${io.sockets.adapter.rooms.get(roomCode)?.size || 0} clients`)
      })
      
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
      console.log(`🔍 Socket.IO room members:`, Array.from(io.sockets.adapter.rooms.get(roomCode) || []))
      console.log(`🔍 === PLAYER JOIN COMPLETE ===\n`)
    })

    // 🚨 NEW: Room state recovery for reconnecting clients
    socket.on('room:requestState', ({ roomCode }) => {
      console.log(`\n🔄 === ROOM STATE RECOVERY REQUEST ===`)
      console.log(`🏠 Room Code: ${roomCode}`)
      console.log(`🔌 Socket ID: ${socket.id}`)
      
      const room = rooms[roomCode]
      if (!room) {
        console.log(`❌ Room ${roomCode} not found for state recovery`)
        socket.emit('room:stateRecoveryError', 'Lobby bestaat niet meer')
        return
      }
      
      // Check if this socket is actually in the room's player list
      const playerInRoom = room.players[socket.id]
      if (!playerInRoom) {
        console.log(`❌ Socket ${socket.id} not found in room ${roomCode} player list`)
        socket.emit('room:stateRecoveryError', 'Je bent niet meer in deze lobby')
        return
      }
      
      console.log(`✅ Recovering room state for ${playerInRoom.name}`)
      
      // Re-join Socket.IO room if not already in it
      const socketsInRoom = io.sockets.adapter.rooms.get(roomCode)
      if (!socketsInRoom || !socketsInRoom.has(socket.id)) {
        socket.join(roomCode)
        console.log(`🔄 Re-joined Socket.IO room ${roomCode}`)
      }
      
      // Send full room state
      socket.emit('room:stateRecovered', { roomCode, room })
      
      // Send market state
      const marketChange = roomMarketChange24h[roomCode] || {}
      socket.emit('market:stateUpdate', { 
        change24h: marketChange,
        marketState: roomMarketState[roomCode]?.state || 'normal',
        stateEventsRemaining: roomMarketState[roomCode]?.eventsRemaining || 0
      })
      
      // Send scan data
      if (roomScanData[roomCode]) {
        socket.emit('scanData:update', {
          autoScanActions: roomScanData[roomCode].autoScanActions,
          playerScanActions: roomScanData[roomCode].playerScanActions,
          upcomingEvents: roomUpcomingEvents[roomCode] || [],
          scanCount: roomScanCount[roomCode] || 0
        })
      }
      
      console.log(`✅ Room state recovered successfully`)
      console.log(`🔄 === ROOM STATE RECOVERY COMPLETE ===\n`)
    })

    // 🚨 NEW: Full session recovery for PWA reconnections
    socket.on('player:recoverSession', ({ roomCode, playerName, playerAvatar, previousRoomState }) => {
      console.log(`\n🔄 === FULL SESSION RECOVERY REQUEST ===`)
      console.log(`🏠 Room Code: ${roomCode}`)
      console.log(`👤 Player: ${playerName} ${playerAvatar}`)
      console.log(`🔌 New Socket ID: ${socket.id}`)
      
      const room = rooms[roomCode]
      if (!room) {
        console.log(`❌ Room ${roomCode} not found for session recovery`)
        socket.emit('player:sessionRecoveryFailed', { 
          message: 'Lobby bestaat niet meer. Start een nieuw spel.' 
        })
        return
      }
      
      // Find existing player by name and avatar
      const existingPlayer = Object.entries(room.players).find(
        ([id, p]) => p.name === playerName && p.avatar === playerAvatar
      )
      
      if (existingPlayer) {
        const [oldSocketId, oldPlayerData] = existingPlayer
        console.log(`✅ Found existing player data`)
        console.log(`🔌 Old Socket: ${oldSocketId} -> New Socket: ${socket.id}`)
        
        // Cancel any pending cleanup for the old socket
        const cleanupKey = `${roomCode}:${oldSocketId}`
        if (playerCleanupTimers.has(cleanupKey)) {
          clearTimeout(playerCleanupTimers.get(cleanupKey))
          playerCleanupTimers.delete(cleanupKey)
          console.log(`🧹 Cancelled pending cleanup for ${playerName}`)
        }
        
        // Remove old socket entry
        delete room.players[oldSocketId]
        
        // Add player with new socket ID, preserving ALL data
        room.players[socket.id] = {
          ...oldPlayerData,
          joinedAt: oldPlayerData.joinedAt || Date.now(), // Keep original join time
          isRejoining: true,
          disconnected: false,
          disconnectedAt: undefined
        }
        
        // Update player order if needed
        if (room.playerOrder && room.playerOrder.includes(oldSocketId)) {
          const orderIndex = room.playerOrder.indexOf(oldSocketId)
          room.playerOrder[orderIndex] = socket.id
          console.log(`✅ Updated player order: ${oldSocketId} -> ${socket.id}`)
        }
        
        // Update current turn player if needed
        if (room.currentTurnPlayerId === oldSocketId) {
          room.currentTurnPlayerId = socket.id
          console.log(`✅ Updated current turn player: ${oldSocketId} -> ${socket.id}`)
        }
        
        // Join Socket.IO room
        socket.join(roomCode)
        console.log(`✅ Socket ${socket.id} joined Socket.IO room ${roomCode}`)
        
        // Send success with full room state (ensure code is included)
        socket.emit('player:sessionRecovered', { 
          room: { ...room, code: roomCode }, 
          message: `Welkom terug, ${playerName}! Je sessie is hersteld.` 
        })
        
        // Broadcast to others that player reconnected
        socket.to(roomCode).emit('player:reconnected', {
          playerName,
          playerAvatar,
          message: `${playerName} is weer verbonden`
        })
        
        // Broadcast updated room state
        io.to(roomCode).emit('lobby:update', room)
        
        // Send market state
        const marketChange = roomMarketChange24h[roomCode] || {}
        socket.emit('market:stateUpdate', { 
        change24h: marketChange,
        marketState: roomMarketState[roomCode]?.state || 'normal',
        stateEventsRemaining: roomMarketState[roomCode]?.eventsRemaining || 0
      })
        
        // Send scan data
        if (roomScanData[roomCode]) {
          socket.emit('scanData:update', {
            autoScanActions: roomScanData[roomCode].autoScanActions,
            playerScanActions: roomScanData[roomCode].playerScanActions,
            upcomingEvents: roomUpcomingEvents[roomCode] || [],
            scanCount: roomScanCount[roomCode] || 0
          })
        }
        
        console.log(`✅ Session fully recovered for ${playerName}`)
        console.log(`🔄 === SESSION RECOVERY COMPLETE ===\n`)
      } else {
        // Player not found - try regular join
        console.log(`⚠️ Player ${playerName} not found in room - attempting regular join`)
        socket.emit('player:join', { roomCode, playerName, playerAvatar })
      }
    })

    // Player finishes their game years
    socket.on('player:finishGame', ({ roomCode, playerName, playerAvatar, yearsPlayed }) => {
      console.log(`\n🏁 === PLAYER FINISH GAME ===`)
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`👤 Player: ${playerName}`)
      console.log(`📅 Years played: ${yearsPlayed}`)
      
      const room = rooms[roomCode]
      if (!room) {
        console.log('❌ Room not found')
        return
      }
      
      // Check if player already finished
      const alreadyFinished = room.finishedPlayers.find(p => p.socketId === socket.id)
      if (alreadyFinished) {
        console.log('⚠️ Player already finished, ignoring duplicate')
        return
      }
      
      // Add to finished players with rank
      const rank = room.finishedPlayers.length + 1
      const finishEntry = {
        socketId: socket.id,
        name: playerName,
        avatar: playerAvatar,
        finishTime: Date.now(),
        yearsPlayed,
        rank
      }
      
      room.finishedPlayers.push(finishEntry)
      
      console.log(`✅ Player finished - Rank ${rank}/${Object.keys(room.players).filter(id => !room.players[id].isHost).length}`)
      console.log(`📊 Finished players: ${room.finishedPlayers.length}`)
      
      // Broadcast finish notification to all players
      io.to(roomCode).emit('player:finished', {
        playerName,
        playerAvatar,
        rank,
        totalPlayers: Object.keys(room.players).filter(id => !room.players[id].isHost).length,
        finishedPlayers: room.finishedPlayers
      })
      
      // Send personal finish notification to the player
      socket.emit('player:finishConfirmed', {
        rank,
        yearsPlayed,
        finishTime: finishEntry.finishTime
      })
      
      console.log(`🏁 === PLAYER FINISH COMPLETE ===\n`)
    })

    // Dice roll broadcast for DiceRoll screen
    socket.on('dice:roll', ({ roomId, roll }) => {
      socket.to(roomId).emit('dice:rolled', { socketId: socket.id, roll })
    })

    // Start game - NO LOGIC, JUST START
    socket.on('host:startGame', ({ roomCode }) => {
      console.log(`\n🚀 === GAME START - NO QUESTIONS ASKED ===`)
      
      const room = rooms[roomCode]
      if (room) {
        room.started = true
        room.gameStartTime = Date.now()
        room.finishedPlayers = []

        // Initialize or sanitize playerOrder and currentTurnPlayerId based on non-host players
        try {
          const nonHostIds = Object.keys(room.players || {}).filter(id => !room.players[id].isHost)
          if (nonHostIds.length > 0) {
            if (!Array.isArray(room.playerOrder) || room.playerOrder.length === 0) {
              room.playerOrder = nonHostIds
            } else {
              const validOrder = room.playerOrder.filter(id => nonHostIds.includes(id))
              const missing = nonHostIds.filter(id => !validOrder.includes(id))
              room.playerOrder = [...validOrder, ...missing]
            }

            // ALWAYS set currentTurnPlayerId to first player at game start
            room.currentTurnPlayerId = room.playerOrder[0]

            console.log('🎯 === GAME START TURN INITIALIZATION ===')
            console.log('🎯 Player order for room', roomCode, ':', room.playerOrder)
            console.log('🎯 First player (gets turn):', room.currentTurnPlayerId)
            
            // Debug: show all players and their socket IDs
            console.log('🎯 All players in room:')
            Object.entries(room.players).forEach(([socketId, player]) => {
              console.log(`  - ${player.name} (${player.avatar}): ${socketId} ${player.isHost ? '👑 HOST' : ''}`)
            })
            console.log('🎯 === END TURN INITIALIZATION ===')
          }
        } catch (e) {
          console.warn('⚠️ Failed to initialize turn order on game start', e)
        }

        io.to(roomCode).emit('game:started', { room })
        console.log(`✅ GAME STARTED IN ROOM ${roomCode}`)
        
        // Normalize initial crypto prices for a fair start:
        // - Minimum price: ⚘50
        // - Maximum spread (max - min): ⚘300
        try {
          const symbols = Object.keys(globalCryptoPrices)
          if (symbols.length > 0) {
            // Evenly spread prices between 50 and 350 to guarantee max spread 300
            const minPrice = 50
            const maxPrice = 350
            const step = symbols.length > 1 ? (maxPrice - minPrice) / (symbols.length - 1) : 0
            // Keep relative ordering by current price (lowest gets minPrice)
            const ordered = symbols.slice().sort((a, b) => (globalCryptoPrices[a] || 0) - (globalCryptoPrices[b] || 0))
            ordered.forEach((sym, idx) => {
              const p = minPrice + step * idx
              globalCryptoPrices[sym] = Math.round(p * 100) / 100
            })
            console.log(`💠 Normalized initial prices for room ${roomCode}:`, globalCryptoPrices)
            
            // Initialize market change based on marketStartMode setting
            const marketStartMode = room.settings?.marketStartMode || 'zero'
            roomMarketChange24h[roomCode] = {}
            
            if (marketStartMode === 'random') {
              // Random start: generate random percentages between -10% and +10%
              symbols.forEach(sym => {
                const randomPercentage = (Math.random() * 20) - 10 // -10 to +10
                const roundedPercentage = Math.round(randomPercentage * 10) / 10
                roomMarketChange24h[roomCode][sym] = roundedPercentage
                
                // Add to price history so charts show the initial random change
                if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][sym]) {
                  roomPriceHistory[roomCode][sym].push({ 
                    percentage: roundedPercentage, 
                    timestamp: Date.now() 
                  })
                }
              })
              console.log(`🎲 Random start mode - initial percentages:`, roomMarketChange24h[roomCode])
            } else {
              // Zero start: all coins at 0%
              symbols.forEach(sym => {
                roomMarketChange24h[roomCode][sym] = 0
              })
              console.log(`🎯 Zero start mode - all coins at 0%`)
            }
            
            // Broadcast normalized prices, initial market state, and price history
            io.to(roomCode).emit('crypto:priceUpdate', globalCryptoPrices)
            io.to(roomCode).emit('market:stateUpdate', { 
              change24h: roomMarketChange24h[roomCode],
              marketState: roomMarketState[roomCode]?.state || 'normal',
              stateEventsRemaining: roomMarketState[roomCode]?.eventsRemaining || 0
            })
            io.to(roomCode).emit('crypto:priceHistory', roomPriceHistory[roomCode] || {})
            
            // Extra broadcast after short delay to ensure clients receive the data
            setTimeout(() => {
              io.to(roomCode).emit('market:stateUpdate', { 
              change24h: roomMarketChange24h[roomCode],
              marketState: roomMarketState[roomCode]?.state || 'normal',
              stateEventsRemaining: roomMarketState[roomCode]?.eventsRemaining || 0
            })
              io.to(roomCode).emit('crypto:priceHistory', roomPriceHistory[roomCode] || {})
              console.log(`🔄 Re-broadcast market state for ${marketStartMode} mode`)
            }, 500)
          }
        } catch (e) {
          console.warn('⚠️ Failed to normalize initial prices:', e)
        }
        
        // Start live market activities interval now (first event in 30 seconds)
        console.log(`⏰ Live market activities will start in 30 seconds...`)
        startActivityInterval(roomCode, io)
        
        // 🎯 CRITICAL: Generate upcoming events IMMEDIATELY at game start
        // so the "Komende 10 Pop-up Events" widget is populated from the start
        try {
          if (!roomUpcomingEvents[roomCode] || roomUpcomingEvents[roomCode].length === 0) {
            generateUpcomingEvents(roomCode)
            console.log(`📋 Generated initial upcoming events for room ${roomCode}`)
          }
          if (typeof roomScanCount[roomCode] !== 'number') {
            roomScanCount[roomCode] = 0
          }
          // Ensure scan data container exists so dashboard can render
          if (!roomScanData[roomCode]) {
            roomScanData[roomCode] = { autoScanActions: [], playerScanActions: [] }
          }
          // Broadcast initial scan data + upcoming events to all clients
          io.to(roomCode).emit('scanData:update', {
            autoScanActions: roomScanData[roomCode].autoScanActions,
            playerScanActions: roomScanData[roomCode].playerScanActions,
            upcomingEvents: roomUpcomingEvents[roomCode] || [],
            scanCount: roomScanCount[roomCode] || 0
          })
          console.log(`📡 Broadcasted initial upcomingEvents (${(roomUpcomingEvents[roomCode] || []).length}) to room ${roomCode}`)
        } catch (e) {
          console.warn('⚠️ Failed to generate/broadcast initial upcoming events:', e)
        }
        
        // Don't start timer for first player - they get unlimited time
        // Timer will start from second player onwards (in turn:end handler)
        console.log(`⏰ First player gets unlimited time - timer starts from 2nd player`)
      } else {
        console.log(`❌ Room ${roomCode} not found`)
      }
      
      console.log(`🚀 === GAME START COMPLETE ===\n`)
    })

    // Turn system: advance to next player in order
    socket.on('turn:end', ({ roomCode }) => {
      try {
        console.log('\n⏭️ === TURN END REQUEST ===')
        console.log('🏠 Room Code:', roomCode)
        const room = rooms[roomCode]
        if (!room) {
          console.log('❌ Room not found for turn:end')
          return
        }

        // Block turn advance if bidding is in progress
        if (room._activeBiddingOrderId) {
          console.log(`⚠️ turn:end IGNORED - bidding in progress (orderId: ${room._activeBiddingOrderId})`)
          return
        }

        const nonHostIds = Object.keys(room.players || {}).filter(id => !room.players[id].isHost)
        if (nonHostIds.length === 0) {
          console.log('⚠️ No non-host players, skipping turn logic')
          return
        }

        let order = Array.isArray(room.playerOrder) ? room.playerOrder : []
        order = order.filter(id => nonHostIds.includes(id))
        const missing = nonHostIds.filter(id => !order.includes(id))
        order = [...order, ...missing]
        if (order.length === 0) {
          console.log('⚠️ Empty order after sanitization, skipping')
          return
        }

        const currentId = room.currentTurnPlayerId && order.includes(room.currentTurnPlayerId)
          ? room.currentTurnPlayerId
          : order[0]
        const currentIndex = order.indexOf(currentId)
        const nextIndex = (currentIndex + 1) % order.length
        const nextId = order[nextIndex]

        room.playerOrder = order
        room.currentTurnPlayerId = nextId

        // Get next player info for notification
        const nextPlayer = room.players[nextId]
        const nextPlayerName = nextPlayer ? nextPlayer.name : 'Onbekende speler'

        console.log('⏭️ Turn advanced:', {
          previous: currentId,
          next: nextId,
          nextPlayerName,
          order
        })

        // Broadcast room update
        io.to(roomCode).emit('lobby:update', room)
        
        // Send turn notification to all players
        io.to(roomCode).emit('turn:changed', {
          newTurnPlayerId: nextId,
          newTurnPlayerName: nextPlayerName,
          previousTurnPlayerId: currentId
        })
        
        // Restart turn timer for next player
        startTurnTimer(roomCode, io)
      } catch (e) {
        console.warn('⚠️ Failed to handle turn:end', e)
      }
    })

    // Toggle turn timer on/off
    socket.on('room:toggleTimer', ({ roomCode, enabled }) => {
      console.log(`\n⏱️ === TIMER TOGGLE REQUEST ===`)
      console.log(`🏠 Room Code: ${roomCode}`)
      console.log(`🔄 New state: ${enabled ? 'ENABLED' : 'DISABLED'}`)
      
      const room = rooms[roomCode]
      if (!room) {
        console.log(`❌ Room ${roomCode} not found`)
        return
      }
      
      // Update room timer state
      room.timerEnabled = enabled
      console.log(`✅ Timer ${enabled ? 'enabled' : 'disabled'} for room ${roomCode}`)
      
      if (enabled) {
        // Timer was turned ON - start the timer
        console.log(`▶️ Starting turn timer`)
        startTurnTimer(roomCode, io)
      } else {
        // Timer was turned OFF - cancel any running timer
        console.log(`⏸️ Cancelling turn timer`)
        cancelTurnTimer(roomCode)
      }
      
      // Broadcast timer state to all players
      io.to(roomCode).emit('room:timerStateChanged', { enabled })
      console.log(`📡 Timer state broadcasted to all players`)
      console.log(`⏱️ === TIMER TOGGLE COMPLETE ===\n`)
    })

    // Handle game pause
    socket.on('game:pause', ({ roomCode }) => {
      console.log(`\n⏸️ === GAME PAUSE REQUEST ===`)
      console.log(`🏠 Room Code: ${roomCode}`)
      console.log(`🔌 Socket ID: ${socket.id}`)
      
      // Check if roomCode is valid
      if (!roomCode) {
        console.log('❌ ERROR: roomCode is empty or undefined!')
        return
      }
      
      const room = rooms[roomCode]
      if (!room) {
        console.log('❌ Room not found for game:pause')
        console.log('📋 Available rooms:', Object.keys(rooms))
        return
      }
      
      // Check how many clients are in the room
      const socketsInRoom = io.sockets.adapter.rooms.get(roomCode)
      console.log(`👥 Clients in room ${roomCode}:`, socketsInRoom ? socketsInRoom.size : 0)
      if (socketsInRoom) {
        console.log(`🔌 Socket IDs in room:`, Array.from(socketsInRoom))
      }
      
      // Set pause state
      roomPauseState[roomCode] = true
      console.log(`⏸️ Game paused for room ${roomCode}`)
      console.log(`📊 roomPauseState:`, roomPauseState)
      
      // Broadcast pause state to all clients
      io.to(roomCode).emit('game:paused')
      console.log(`📡 Broadcasted game:paused to all clients in room ${roomCode}`)
      console.log(`✅ === GAME PAUSE COMPLETE ===\n`)
    })
    
    // Handle game resume
    socket.on('game:resume', ({ roomCode }) => {
      console.log(`\n▶️ === GAME RESUME REQUEST ===`)
      console.log(`🏠 Room Code: ${roomCode}`)
      console.log(`🔌 Socket ID: ${socket.id}`)
      
      if (!roomCode) {
        console.log('❌ ERROR: roomCode is empty or undefined!')
        return
      }
      
      const room = rooms[roomCode]
      if (!room) {
        console.log('❌ Room not found for game:resume')
        return
      }
      
      // Clear pause state
      roomPauseState[roomCode] = false
      console.log(`▶️ Game resumed for room ${roomCode}`)
      console.log(`📊 roomPauseState:`, roomPauseState)
      
      // Broadcast resume state to all clients
      io.to(roomCode).emit('game:resumed')
      console.log(`📡 Broadcasted game:resumed to all clients in room ${roomCode}`)
      console.log(`✅ === GAME RESUME COMPLETE ===\n`)
    })

    // Host ends the game completely for all players
    socket.on('game:end', ({ roomCode, requestedBy }) => {
      try {
        console.log('\n🛑 === GAME END REQUEST RECEIVED ===')
        console.log('🏠 Room Code:', roomCode)
        console.log('🙋 Requested by:', requestedBy, `(${socket.id})`)

        const room = rooms[roomCode]
        if (!room) {
          console.log('❌ Room not found for game:end')
          return
        }

        // Only allow privileged initiators to end het spel:
        // - de huidige host-socket
        // - een requester met 'Host' in de naam
        // - of de speciale Market Dashboard client
        const isHostSocket = room.hostId && room.hostId === socket.id
        const isHostNamedRequester = typeof requestedBy === 'string' && requestedBy.includes('Host')
        const isMarketDashboard = requestedBy === 'Market Dashboard'

        if (!isHostSocket && !isHostNamedRequester && !isMarketDashboard) {
          console.log('⛔ Non-host/non-dashboard attempted to end game, ignoring')
          return
        }

        const message = `Het spel in lobby ${roomCode} is beëindigd door de host. Alle gegevens zijn gewist.`
        console.log('📡 Broadcasting game:ended to room', roomCode)
        io.to(roomCode).emit('game:ended', { message, roomCode })

        // Stop any running intervals/cleanups and remove room state
        stopActivityInterval(roomCode)
        cancelRoomCleanup(roomCode)
        cancelTurnTimer(roomCode)
        delete rooms[roomCode]

        // Clear scan history and market change state so a new game starts completely clean
        if (roomScanData[roomCode]) {
          delete roomScanData[roomCode]
        }
        if (roomMarketChange24h[roomCode]) {
          delete roomMarketChange24h[roomCode]
        }

        console.log('🧹 Room state cleared for', roomCode)
        console.log('🛑 === GAME END REQUEST PROCESSED ===\n')
      } catch (e) {
        console.warn('⚠️ Failed to handle game:end', e)
      }
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
          code: '123',
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
    socket.on('test:message', ({ roomCode, message, sender, avatar }) => {
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
        avatar,
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

    // 📈 MOMENTUM HELPER: Calculate trend bias for a crypto in a room
    // Returns probability (0-1) that next event should be positive
    // Real markets show momentum: coins in uptrend tend to continue rising
    const getTrendBias = (roomCode, symbol) => {
      if (!roomMomentum[roomCode] || !roomMomentum[roomCode][symbol]) {
        return 0.5 // No history = neutral 50/50
      }
      
      const recentMoves = roomMomentum[roomCode][symbol].slice(-3) // Last 3 moves
      if (recentMoves.length === 0) return 0.5
      
      // Count positive moves in recent history
      const positiveMoves = recentMoves.filter(pct => pct > 0).length
      
      // Calculate bias: 0 positive moves = 45% chance up, 3 positive moves = 65% chance up
      // Conservative bias: not too strong to keep randomness
      if (positiveMoves === 3) return 0.65 // Strong uptrend
      if (positiveMoves === 2) return 0.55 // Mild uptrend
      if (positiveMoves === 1) return 0.45 // Mild downtrend
      return 0.35 // Strong downtrend
    }
    
    // Helper function to generate a single random event with momentum/trend awareness
    // roomCode: needed for momentum tracking (optional - falls back to pure random if not provided)
    // 🌍 NOW ALSO USES MARKET STATE SYSTEM for realistic event cascades
    function generateRandomEvent(roomCode = null) {
      // Get current market state for this room
      const marketState = roomCode && roomMarketState[roomCode] ? roomMarketState[roomCode].state : 'normal'
      const eventTypes = [
        // Crypto specific events (NEVER 0%) - meest voorkomend
        { type: 'boost', symbol: 'DSHP', min: -30, max: 30 },
        { type: 'boost', symbol: 'DSHP', min: -30, max: 30 },
        { type: 'boost', symbol: 'DSHP', min: -30, max: 30 },
        { type: 'boost', symbol: 'ORX', min: -30, max: 30 },
        { type: 'boost', symbol: 'ORX', min: -30, max: 30 },
        { type: 'boost', symbol: 'ORX', min: -30, max: 30 },
        { type: 'boost', symbol: 'LNTR', min: -30, max: 30 },
        { type: 'boost', symbol: 'LNTR', min: -30, max: 30 },
        { type: 'boost', symbol: 'LNTR', min: -30, max: 30 },
        { type: 'boost', symbol: 'SIL', min: -30, max: 30 },
        { type: 'boost', symbol: 'SIL', min: -30, max: 30 },
        { type: 'boost', symbol: 'SIL', min: -30, max: 30 },
        { type: 'boost', symbol: 'REX', min: -30, max: 30 },
        { type: 'boost', symbol: 'REX', min: -30, max: 30 },
        { type: 'boost', symbol: 'REX', min: -30, max: 30 },
        { type: 'boost', symbol: 'GLX', min: -30, max: 30 },
        { type: 'boost', symbol: 'GLX', min: -30, max: 30 },
        { type: 'boost', symbol: 'GLX', min: -30, max: 30 },
        // Market-wide events are now handled via WAR/PEACE only
        // Bull Run and Bear Market removed - they should not be market states
        // WAR/PEACE events zijn NIET in de pool - ze worden via speciale logica getriggerd
        // Whale Alert events - TIJDELIJK UITGESCHAKELD
        // { type: 'whale', symbol: null, min: 50, max: 50 }, // Random crypto +50%
      ]
      
      let randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      
      // ⚔️ SPECIAL WAR TRIGGER LOGIC - zeer zeldzaam, alleen in normale markt
      const currentState = roomCode && roomMarketState[roomCode] ? roomMarketState[roomCode].state : 'normal'
      
      // Track events since game start for war trigger
      if (!global.roomWarTracker) {
        global.roomWarTracker = {}
      }
      if (roomCode && !global.roomWarTracker[roomCode]) {
        global.roomWarTracker[roomCode] = {
          eventsSinceStart: 0,
          lastWarEvent: null,
          warHappened: false,
          eventsSinceWarStarted: 0
        }
      }
      
      if (roomCode) {
        global.roomWarTracker[roomCode].eventsSinceStart++
        
        // Debug logging voor war trigger check
        if (global.roomWarTracker[roomCode].eventsSinceStart % 5 === 0) {
          console.log(`🎲 War Check - Events: ${global.roomWarTracker[roomCode].eventsSinceStart}, State: ${currentState}, War happened: ${global.roomWarTracker[roomCode].warHappened}`)
        }
        
        // War can only trigger if:
        // 1. Market is normal (not already in war/peace/bull/bear)
        // 2. At least 8 events have passed since game start
        // 3. At least 20 events since last war (cooldown)
        // 4. 10% random chance (~1 op 10 events in normal state)
        const eventsSinceLastWar = global.roomWarTracker[roomCode].lastWarEvent 
          ? global.roomWarTracker[roomCode].eventsSinceStart - global.roomWarTracker[roomCode].lastWarEvent 
          : 999
        
        if (currentState !== 'war' && 
            global.roomWarTracker[roomCode].eventsSinceStart >= 8 && 
            eventsSinceLastWar >= 20 &&
            Math.random() < 0.10) {
          // TRIGGER WAR!
          randomEvent = { type: 'war', symbol: null, min: 0, max: 0 }
          global.roomWarTracker[roomCode].lastWarEvent = global.roomWarTracker[roomCode].eventsSinceStart
          global.roomWarTracker[roomCode].eventsSinceWarStarted = 0 // Reset counter for minimum events before peace
          console.log(`⚔️ WAR EVENT QUEUED! Will activate when applied - After ${global.roomWarTracker[roomCode].eventsSinceStart} events`)
        }
      }
      
      // 🕊️ PEACE TRIGGER LOGIC - can only happen during war
      // Requires at least 10 events in war state before peace can trigger
      if (roomCode && currentState === 'war') {
        global.roomWarTracker[roomCode].eventsSinceWarStarted = (global.roomWarTracker[roomCode].eventsSinceWarStarted || 0) + 1
      }
      if (currentState === 'war' && (global.roomWarTracker[roomCode]?.eventsSinceWarStarted || 0) >= 10 && Math.random() < 0.40) {
        randomEvent = { type: 'peace', symbol: null, min: 0, max: 0 }
        console.log(`🕊️ PEACE EVENT QUEUED! Will activate when applied`)
      }
      
      let percentage
      
      // 🌍 MARKET STATE SYSTEM: Apply state-based bias for realistic event cascades
      // Bear market = 70% negative, Bull market = 70% positive, Recovery = 60% positive
      // WAR = 85% negative, PEACE = 75% positive
      if (roomCode && randomEvent.type === 'boost' && randomEvent.symbol) {
        let shouldBePositive
        let positiveChance
        
        // Determine positive/negative bias based on market state
        if (marketState === 'war') {
          positiveChance = 0.15 // 15% positive, 85% negative during war
          shouldBePositive = Math.random() < positiveChance
        } else if (marketState === 'peace') {
          positiveChance = 0.75 // 75% positive, 25% negative during peace
          shouldBePositive = Math.random() < positiveChance
        } else if (marketState === 'bear_market' || marketState === 'bull_market' || marketState === 'recovery') {
          // Legacy states - treat as normal
          const trendBias = getTrendBias(roomCode, randomEvent.symbol)
          positiveChance = trendBias
          shouldBePositive = Math.random() < trendBias
        } else {
          // Normal state: use momentum system
          const trendBias = getTrendBias(roomCode, randomEvent.symbol)
          positiveChance = trendBias
          shouldBePositive = Math.random() < trendBias
        }
        
        // Generate percentage biased towards the market state
        if (shouldBePositive) {
          // Positive event
          if (marketState === 'war') {
            percentage = Math.floor(Math.random() * 11) + 1 // +1% to +10% (kleine winsten tijdens oorlog)
          } else if (marketState === 'peace') {
            percentage = Math.floor(Math.random() * 41) + 1 // +1% to +40% (grote winsten tijdens vrede)
          } else {
            percentage = Math.floor(Math.random() * 30) + 1 // +1% to +30% (normal)
          }
        } else {
          // Negative event
          if (marketState === 'war') {
            percentage = -(Math.floor(Math.random() * 41) + 1) // -1% to -40% (enorme verliezen tijdens oorlog)
          } else if (marketState === 'peace') {
            percentage = -(Math.floor(Math.random() * 11) + 1) // -1% to -10% (kleine verliezen tijdens vrede)
          } else {
            percentage = -(Math.floor(Math.random() * 30) + 1) // -1% to -30% (normal)
          }
        }
        
        const stateLabel = marketState === 'normal' ? 'MOMENTUM' : `STATE:${marketState.toUpperCase()}`
        console.log(`🌍 ${stateLabel}: ${randomEvent.symbol} (${(positiveChance * 100).toFixed(0)}% pos) → ${percentage > 0 ? '+' : ''}${percentage}%`)
      } else if (randomEvent.type === 'war') {
        // ⚔️ TRIGGER WAR STATE - percentage is always 0, skip the do-while loop
        percentage = 0
        // Do NOT set roomMarketState here; this event is queued and will set state when applied
        console.log('⚔️ WAR EVENT GENERATED (queued) - will activate when applied')
      } else if (randomEvent.type === 'peace') {
        // 🕊️ TRIGGER PEACE STATE - percentage is always 0
        percentage = 0
        console.log('🕊️ PEACE EVENT GENERATED (queued) - will activate when applied')
      }
    }
    
    // Helper function to generate news headline for an event
    function generateNewsHeadline(event) {
      const newsHeadlines = {
        'DSHP': {
          positive: [
            'DigiSheep breekt door weerstandsniveau, investeerders optimistisch',
            'DigiSheep nieuwe oogst succesvol, vraag stijgt',
            'Recordoogst DigiSheep, prijzen stijgen',
            'DigiSheep exportdeal gesloten, koers omhoog',
            'Weersomstandigheden ideaal voor DigiSheep productie',
            'DigiSheep kwaliteit verbeterd, vraag explodeert',
            'Nieuwe landbouwtechnologie verhoogt DigiSheep opbrengst',
            'DigiSheep voorraden krap, prijzen stijgen'
          ],
          negative: [
            'DigiSheep verliest momentum, traders nemen winst',
            'Strengere wetgeving raakt DigiSheep sector',
            'Slechte cijfers DigiSheep, beleggers verkopen massaal',
            'Tekort aan grondstoffen remt DigiSheep productie',
            'Droogte treft DigiSheep oogst, koers daalt',
            'Veepest uitbraak bedreigt DigiSheep sector',
            'DigiSheep overproductie leidt tot prijsval',
            'Slechte weersomstandigheden schaden DigiSheep oogst'
          ]
        },
        'ORX': {
          positive: [
            'Orex partnership aangekondigd, koers schiet omhoog',
            'Orex nieuwe mijnvondst, goudprijs stijgt',
            'Nieuwe goudader ontdekt in Orex mijn',
            'Orex productie stijgt, winstcijfers overtreffen verwachtingen',
            'Mijnbouwtechnologie doorbraak verhoogt Orex efficiëntie',
            'Orex sluit grote leveringscontract, vraag stijgt',
            'Goudprijs stijgt, Orex profiteert',
            'Orex uitbreiding mijnbouwactiviteiten aangekondigd'
          ],
          negative: [
            'Orex CEO treedt af, onzekerheid op de markt',
            'Crisis in mijnbouwsector treft Orex hard',
            'Beleggers verkopen Orex massaal na slechte cijfers',
            'Conflict bedreigt Orex toeleveringsketen',
            'Mijnstaking legt Orex productie stil',
            'Mijnongeluk verstoort Orex operaties',
            'Overstroming in Orex mijn, productie daalt',
            'Orex productiekosten stijgen, winstmarges dalen'
          ]
        },
        'LNTR': {
          positive: [
            'Lentra nieuwe update succesvol, adoptie stijgt',
            'Lentra ruimtemissie geslaagd, vertrouwen groeit',
            'Lentra raketlancering succesvol, koers stijgt',
            'Lentra sluit groot contract voor satellietlanceringen',
            'Doorbraak in Lentra raketbrandstof technologie',
            'Lentra behaalt mijlpaal in ruimtevaart',
            'Lentra satelliet netwerk uitgebreid, vraag stijgt',
            'Lentra ruimtestation project goedgekeurd'
          ],
          negative: [
            'Lentra launch gefaald, investeerders verkopen massaal',
            'Strengere wetgeving voor ruimtevaart raakt Lentra',
            'Technische problemen Lentra, koers zakt in',
            'Crisis in ruimtesector, Lentra verliest waarde',
            'Lentra raket explodeert bij lancering',
            'Tekort aan raketbrandstof vertraagt Lentra missies',
            'Lentra satelliet crasht, koers daalt',
            'Lentra ruimtemissies uitgesteld door technische problemen'
          ]
        },
        'SIL': {
          positive: [
            'Silica lanceert revolutionaire AI-chip, beleggers enthousiast',
            'Silica sluit mega-deal met techgigant voor chiplevering',
            'Doorbraak in kwantumprocessor, Silica koers explodeert',
            'Silica AI-model verslaat concurrentie, vraag naar chips stijgt',
            'Silica chipproductie verhoogd, winstcijfers stijgen',
            'Nieuwe chipfabriek Silica geopend, capaciteit verdubbeld',
            'Silica technologie doorbraak in halfgeleiders',
            'Silica marktaandeel groeit, concurrentie verliest terrein'
          ],
          negative: [
            'Chiptekort raakt Silica productielijn, koers zakt in',
            'Nieuwe restricties op AI-chips van Silica',
            'Silica verliest groot contract aan concurrent',
            'Overhitting datacenter legt Silica fabriek stil, paniek op markt',
            'Silica chipfabriek brand, productie verstoord',
            'Silicium tekort remt Silica productie',
            'Silica AI-verbod in meerdere regio\'s, koers daalt',
            'Silica technologie achterhaald door concurrent'
          ]
        },
        'REX': {
          positive: [
            'Rex whale activity gedetecteerd, volume stijgt explosief',
            'Rex nieuwe reserves ontdekt, koers schiet omhoog',
            'Nieuwe energiebron ontdekt, Rex profiteert',
            'Rex productie stijgt, winstcijfers overtreffen verwachtingen',
            'Akkoord verhoogt Rex prijzen, koers stijgt',
            'Rex sluit grote leveringscontract',
            'Energievraag stijgt, Rex profiteert',
            'Rex uitbreiding productiecapaciteit aangekondigd'
          ],
          negative: [
            'Rex regulatie dreigt, beleggers voorzichtig',
            'Strengere wetgeving fossiele brandstoffen raakt Rex',
            'Conflict verstoort Rex toevoer, paniek op markt',
            'Beleggers verkopen Rex massaal na slechte cijfers',
            'Tekort aan brandstof remt Rex productie',
            'Rex pipeline lek, productie verstoord',
            'Energieprijs crash treft Rex hard',
            'Rex productie stilgelegd door technische problemen'
          ]
        },
        'GLX': {
          positive: [
            'Glooma listing op grote exchange, vraag stijgt',
            'Glooma doorbraak in mutatie-onderzoek, investeerders enthousiast',
            'Glooma wetenschappelijke ontdekking, koers stijgt',
            'Glooma onderzoeksproject succesvol afgerond',
            'Glooma sluit samenwerkingsverband met universiteiten',
            'Glooma innovatie wint prestigieuze prijs',
            'Glooma financiering verdubbeld, groei versnelt',
            'Glooma patent goedgekeurd, koers explodeert'
          ],
          negative: [
            'Glooma security lek ontdekt, paniek op de markt',
            'Crisis in mutation sector treft Glooma',
            'Strengere wetgeving bedreigt Glooma projecten',
            'Tekort aan financiering remt Glooma groei',
            'Glooma onderzoek mislukt, investeerders teleurgesteld',
            'Glooma lab brand vernietigt onderzoeksdata',
            'Glooma wetgeving blokkeert belangrijke projecten',
            'Glooma concurrent steelt marktaandeel'
          ]
        }
      }
      
      if (event.type === 'event') {
        // Market-wide events don't need headlines
        return null
      }
      
      const symbol = event.symbol
      const isPositive = event.percentage > 0
      const headlines = newsHeadlines[symbol]?.[isPositive ? 'positive' : 'negative']
      return headlines ? headlines[Math.floor(Math.random() * headlines.length)] : null
    }

    // ⚔️ Helper function to check if macro event should trigger
    const shouldTriggerMacroEvent = (roomCode) => {
      // Initialize tracker if not exists
      if (!roomMacroEventTracker[roomCode]) {
        roomMacroEventTracker[roomCode] = {
          lastMacroEvent: null,
          eventsSinceLastMacro: 0,
          macroEventCooldown: 30 // Minimum 30 events between macro events
        }
      }
      
      const tracker = roomMacroEventTracker[roomCode]
      tracker.eventsSinceLastMacro++
      
      // Check if enough events have passed since last macro event
      if (tracker.eventsSinceLastMacro < tracker.macroEventCooldown) {
        return null // Too soon for another macro event
      }
      
      // 10% chance to trigger macro event after cooldown
      if (Math.random() > 0.10) {
        return null
      }
      
      // Determine which macro event to trigger
      // If last was WAR, trigger PEACE. Otherwise, trigger WAR
      const macroEvent = tracker.lastMacroEvent === 'WAR' ? 'PEACE' : 'WAR'
      
      // Update tracker
      tracker.lastMacroEvent = macroEvent
      tracker.eventsSinceLastMacro = 0
      
      return macroEvent
    }
    
    // ⚔️ Helper function to trigger macro event and set market state
    const triggerMacroEvent = (roomCode, macroEvent) => {
      if (macroEvent === 'WAR') {
        // WAR: 8-12 negative events follow
        const duration = Math.floor(Math.random() * 5) + 8 // 8-12 events
        roomMarketState[roomCode] = {
          state: 'war',
          eventsRemaining: duration,
          triggeredBy: 'WAR'
        }
        console.log(`⚔️ WAR TRIGGERED! Crisis mode for ${duration} events`)
        return {
          type: 'macro',
          event: 'WAR',
          message: 'Conflict uitgebroken!',
          icon: '⚔️',
          duration: duration
        }
      } else if (macroEvent === 'PEACE') {
        // PEACE: 6-8 positive events follow
        const duration = Math.floor(Math.random() * 3) + 6 // 6-8 events
        roomMarketState[roomCode] = {
          state: 'peace',
          eventsRemaining: duration,
          triggeredBy: 'PEACE'
        }
        console.log(`🕊️ PEACE TRIGGERED! Recovery mode for ${duration} events`)
        return {
          type: 'macro',
          event: 'PEACE',
          message: 'Vredesakkoord gesloten!',
          icon: '🕊️',
          duration: duration
        }
      }
      return null
    }

    // Helper function to generate next 10 events for a room
    function generateUpcomingEvents(roomCode) {
      const events = []
      
      // Genereer 9 events - war/peace logica zit in generateRandomEvent()
      let lastWarIndex = -1
      for (let i = 0; i < 9; i++) {
        let event
        let attempts = 0
        do {
          event = generateRandomEvent(roomCode) // War/peace trigger logica zit hierin
          attempts++
          // Handhaaf minimaal 8 events tussen WAR en PEACE in de upcoming queue
          if (event && event.type === 'peace' && lastWarIndex >= 0 && (i - lastWarIndex) < 8) {
            continue // te vroeg voor vrede, probeer een ander event
          }
          break
        } while (attempts < 5)
        
        // Add news headline for individual crypto events
        if (event.type === 'boost' && event.symbol) {
          event.headline = generateNewsHeadline(event)
        } else if (event.type === 'war') {
          event.headline = 'Oorlog uitgebroken'
          lastWarIndex = i
          console.log(`⚔️ WAR EVENT ADDED TO UPCOMING QUEUE (position ${i+1}/9)`)
        } else if (event.type === 'peace') {
          event.headline = 'Vredesakkoord getekend'
          console.log(`🕊️ PEACE EVENT ADDED TO UPCOMING QUEUE (position ${i+1}/9)`)
        }
        
        events.push(event)
      }
      
      // 10e event is altijd Market Forecast
      events.push({ 
        type: 'forecast', 
        symbol: null, 
        percentage: 0,
        message: 'Market Forecast beschikbaar'
      })
      roomUpcomingEvents[roomCode] = events
      console.log(`📋 Generated 9 events + 1 forecast event for room ${roomCode}`)
      return events
    }

    // Helper function to calculate forecast based on upcoming events
    const calculateForecast = (upcomingEvents) => {
      const cryptoSymbols = ['DSHP', 'ORX', 'LNTR', 'SIL', 'REX', 'GLX']
      const cryptoTotals = {}
      
      // Initialize with 0 for each crypto (simpele optelling)
      cryptoSymbols.forEach(symbol => {
        cryptoTotals[symbol] = 0
      })
      
      // Tel alle percentages op (simpele optelling, geen compound)
      upcomingEvents.forEach(event => {
        if (event.type === 'event') {
          // Market-wide events affect all cryptos
          cryptoSymbols.forEach(symbol => {
            cryptoTotals[symbol] += event.percentage
          })
        } else if (event.symbol && event.type !== 'whale' && event.type !== 'forecast') {
          // Individual crypto event (exclude whale alerts and forecast)
          cryptoTotals[event.symbol] += event.percentage
        }
        // Whale alerts and forecast events are ignored in forecast calculation
      })
      
      // Maak predictions array met totale percentages
      const predictions = cryptoSymbols.map(symbol => ({
        symbol,
        percentage: Math.round(cryptoTotals[symbol] * 10) / 10 // Round to 1 decimal
      }))
      
      const sorted = [...predictions].sort((a, b) => b.percentage - a.percentage)
      const topGainer = sorted[0]
      const topLoser = sorted[sorted.length - 1]
      
      return { topGainer, topLoser, predictions }
    }

    // Player requests insider info - send forecast data ONLY to this player
    socket.on('player:requestInsiderInfo', ({ roomCode, playerName }) => {
      console.log(`\n🕵️ === INSIDER INFO REQUESTED ===`)
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`👤 Player: ${playerName}`)
      
      if (!rooms[roomCode]) {
        console.log(`❌ Room ${roomCode} not found`)
        return
      }
      
      // Initialize upcoming events if not exists
      if (!roomUpcomingEvents[roomCode] || roomUpcomingEvents[roomCode].length === 0) {
        generateUpcomingEvents(roomCode)
      }
      
      // Get upcoming events (exclude forecast events)
      const upcomingEvents = roomUpcomingEvents[roomCode].filter(evt => evt.type !== 'forecast')
      
      // Aggregate all events by symbol - sum percentages for each crypto/market
      const symbolAggregates = {}
      const cryptoSymbols = ['DSHP', 'ORX', 'LNTR', 'SIL', 'REX', 'GLX']
      
      // Initialize all cryptos with 0
      cryptoSymbols.forEach(sym => {
        symbolAggregates[sym] = { symbol: sym, totalPercentage: 0, isMarketEvent: false }
      })
      
      // Initialize MARKET with 0
      symbolAggregates['MARKET'] = { symbol: 'MARKET', totalPercentage: 0, isMarketEvent: true }
      
      // Track which symbols actually appear in top 10 events AND their headlines
      const symbolsInTop10 = new Set()
      const symbolHeadlines = {} // Store the first headline for each symbol
      
      // Sum up all percentages per symbol from next 10 events
      upcomingEvents.slice(0, 10).forEach(evt => {
        if (evt.type === 'event' && !evt.symbol) {
          // Market-wide event affects MARKET aggregate
          symbolAggregates['MARKET'].totalPercentage += evt.percentage
          symbolsInTop10.add('MARKET')
        } else if (evt.type === 'war') {
          // War event
          symbolsInTop10.add('WAR')
        } else if (evt.type === 'peace') {
          // Peace event
          symbolsInTop10.add('PEACE')
        } else if (evt.symbol && symbolAggregates[evt.symbol]) {
          // Crypto-specific event
          symbolAggregates[evt.symbol].totalPercentage += evt.percentage
          symbolsInTop10.add(evt.symbol)
          
          // Store the first headline for this symbol (most impactful/first to occur)
          if (!symbolHeadlines[evt.symbol] && evt.headline) {
            symbolHeadlines[evt.symbol] = evt.headline
          }
        }
      })
      
      console.log('📋 Symbols in top 10 events:', Array.from(symbolsInTop10).join(', '))
      
      // Convert to array, filter to only symbols in top 10, and sort by total percentage
      const aggregateArray = Object.values(symbolAggregates).filter(agg => symbolsInTop10.has(agg.symbol))
      const sorted = aggregateArray.sort((a, b) => b.totalPercentage - a.totalPercentage)
      
      console.log('📊 Insider Info Aggregates (next 10 events):')
      sorted.forEach(agg => {
        console.log(`   ${agg.symbol}: ${agg.totalPercentage > 0 ? '+' : ''}${agg.totalPercentage.toFixed(1)}%`)
      })
      
      // Check if MARKET event is significant (>±15%)
      const marketAggregate = symbolAggregates['MARKET']
      const isMarketSignificant = Math.abs(marketAggregate.totalPercentage) > 15
      
      let insiderItems = []
      
      if (isMarketSignificant) {
        // Market event is significant - show 3 items: top crypto gainer + top crypto loser + market
        console.log(`🚨 SIGNIFICANT MARKET EVENT: ${marketAggregate.totalPercentage > 0 ? 'BULL RUN' : 'MARKET CRASH'} (${marketAggregate.totalPercentage > 0 ? '+' : ''}${marketAggregate.totalPercentage.toFixed(1)}%)`)
        
        // Get best and worst crypto (excluding MARKET)
        const cryptoOnly = sorted.filter(agg => agg.symbol !== 'MARKET')
        const topCryptoGainer = cryptoOnly[0]
        const topCryptoLoser = cryptoOnly[cryptoOnly.length - 1]
        
        insiderItems = [
          {
            symbol: topCryptoGainer.symbol,
            percentage: topCryptoGainer.totalPercentage,
            direction: topCryptoGainer.totalPercentage > 0 ? 'up' : 'down',
            isMarketEvent: false,
            headline: symbolHeadlines[topCryptoGainer.symbol] || null
          },
          {
            symbol: topCryptoLoser.symbol,
            percentage: topCryptoLoser.totalPercentage,
            direction: topCryptoLoser.totalPercentage > 0 ? 'up' : 'down',
            isMarketEvent: false,
            headline: symbolHeadlines[topCryptoLoser.symbol] || null
          },
          {
            symbol: 'MARKET',
            percentage: marketAggregate.totalPercentage,
            direction: marketAggregate.totalPercentage > 0 ? 'up' : 'down',
            isMarketEvent: true,
            headline: null
          }
        ]
      } else {
        // No significant market event - show 2 items: top gainer vs top loser
        const topGainer = sorted[0]
        let topLoser = sorted[sorted.length - 1]
        
        // Ensure top gainer and loser are different symbols
        if (topGainer.symbol === topLoser.symbol) {
          topLoser = sorted[sorted.length - 2] || sorted[sorted.length - 1]
        }
        
        insiderItems = [
          {
            symbol: topGainer.symbol,
            percentage: topGainer.totalPercentage,
            direction: topGainer.totalPercentage > 0 ? 'up' : 'down',
            isMarketEvent: topGainer.isMarketEvent,
            headline: symbolHeadlines[topGainer.symbol] || null
          },
          {
            symbol: topLoser.symbol,
            percentage: topLoser.totalPercentage,
            direction: topLoser.totalPercentage > 0 ? 'up' : 'down',
            isMarketEvent: topLoser.isMarketEvent,
            headline: symbolHeadlines[topLoser.symbol] || null
          }
        ]
      }
      
      console.log(`🕵️ Sending insider forecast to ${playerName}:`)
      insiderItems.forEach((item, idx) => {
        console.log(`   📰 Event ${idx + 1}: ${item.symbol} ${item.percentage > 0 ? '+' : ''}${item.percentage}% (${item.direction}) market=${item.isMarketEvent}`)
      })
      
      // Send ONLY to this player (not broadcast)
      socket.emit('player:insiderInfo', {
        items: insiderItems.map(item => ({
          symbol: item.symbol,
          percentage: item.percentage,
          direction: item.direction,
          isMarketEvent: item.isMarketEvent,
          headline: item.headline
        }))
      })
      
      console.log(`✅ Insider info sent privately to ${playerName}`)
      
      // Broadcast to OTHER players that this player used insider info
      const playerData = rooms[roomCode].players[socket.id]
      if (playerData) {
        socket.to(roomCode).emit('player:insiderUsed', {
          playerName: playerName,
          playerAvatar: playerData.avatar || '👤'
        })
        console.log(`📢 Broadcast insider usage notification to other players`)
      }
      
      console.log(`🕵️ === INSIDER INFO COMPLETE ===\n`)
    })

    // Player triggers event - server generates and broadcasts to ALL players
    socket.on('player:triggerEvent', ({ roomCode, playerName, playerAvatar }) => {
      console.log(`\n🎲 === PLAYER TRIGGERED EVENT ===`)
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`👤 Player: ${playerName}`)
      
      if (!rooms[roomCode]) {
        console.log(`❌ Room ${roomCode} not found`)
        return
      }
      
      // Initialize room scan data if not exists
      if (!roomScanData[roomCode]) {
        roomScanData[roomCode] = {
          autoScanActions: [],
          playerScanActions: []
        }
      }
      
      // Initialize scan count for this room
      if (!roomScanCount[roomCode]) {
        roomScanCount[roomCode] = 0
      }
      
      // Initialize upcoming events if not exists
      if (!roomUpcomingEvents[roomCode] || roomUpcomingEvents[roomCode].length === 0) {
        generateUpcomingEvents(roomCode)
      }
      
      // Increment scan count
      roomScanCount[roomCode]++
      console.log(`📊 Scan count for room ${roomCode}: ${roomScanCount[roomCode]}`)
      
      // Every 10 scans, trigger forecast
      const shouldGenerateForecast = roomScanCount[roomCode] % 10 === 0
      
      let randomEvent
      let percentage
      let scanAction
      
      if (shouldGenerateForecast) {
        console.log(`\n🔮 ==================== FORECAST TRIGGERED ====================`)
        console.log(`🔮 Scan #${roomScanCount[roomCode]} - Generating Market Forecast`)
        
        // Gebruik BESTAANDE queue events voor forecast voorspelling
        // Zo worden aankomende events NIET vervangen bij forecast
        const queueWithoutForecast = (roomUpcomingEvents[roomCode] || []).filter(e => e.type !== 'forecast')
        const eventsForForecast = [...queueWithoutForecast].slice(0, 9)
        // Vul aan tot 9 events indien queue te kort is
        while (eventsForForecast.length < 9) {
          eventsForForecast.push(generateRandomEvent(roomCode))
        }
        const newEvents = eventsForForecast
        
        console.log(`🔮 Using ${queueWithoutForecast.length} existing queue events for forecast prediction`)
        
        // Calculate forecast based on NEW events
        const forecast = calculateForecast(newEvents)
        
        console.log(`\n🔮 📋 NEXT 9 EVENTS (forecast prediction):`)
        newEvents.forEach((evt, idx) => {
          const evtDesc = evt.type === 'event' 
            ? `${evt.percentage > 0 ? '🐂 Bull Run' : '🐻 Bear Market'} (${evt.percentage > 0 ? '+' : ''}${evt.percentage}% all)`
            : `${evt.symbol} ${evt.percentage > 0 ? '+' : ''}${evt.percentage}%`
          console.log(`   ${idx + 1}. ${evtDesc}`)
        })
        
        console.log(`\n🔮 📊 FORECAST CALCULATION RESULT:`)
        console.log(`   📈 Top Gainer: ${forecast.topGainer.symbol} ${forecast.topGainer.percentage > 0 ? '+' : ''}${forecast.topGainer.percentage}%`)
        console.log(`   📉 Top Loser: ${forecast.topLoser.symbol} ${forecast.topLoser.percentage > 0 ? '+' : ''}${forecast.topLoser.percentage}%`)
        console.log(`   ✅ Different coins: ${forecast.topGainer.symbol !== forecast.topLoser.symbol}`)
        console.log(`\n🔮 ============================================================\n`)
        
        scanAction = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          player: playerName,
          action: 'Forecast',
          effect: 'Market Forecast',
          avatar: playerAvatar,
          cryptoSymbol: null,
          percentageValue: 0,
          isForecast: true,
          forecastData: {
            topGainer: { symbol: forecast.topGainer.symbol, percentage: forecast.topGainer.percentage },
            topLoser: { symbol: forecast.topLoser.symbol, percentage: forecast.topLoser.percentage },
            predictions: forecast.predictions
          }
        }
        
        console.log(`🔮 Forecast event created with predictions for NEXT 9 events`)
        
        // Reset scan count after forecast
        roomScanCount[roomCode] = 0
        
        // Bewaar de bestaande queue - voeg alleen forecast marker toe aan het einde
        // De aankomende events blijven ONGEWIJZIGD na forecast
        const refreshedQueue = [...queueWithoutForecast]
        refreshedQueue.push({ type: 'forecast', symbol: null, percentage: 0, message: 'Market Forecast beschikbaar' })
        roomUpcomingEvents[roomCode] = refreshedQueue
        console.log(`📋 Queue bewaard na forecast - ${refreshedQueue.length} events (incl. nieuwe forecast)`)
      } else {
        // Use next event from upcoming events queue
        const nextEvent = roomUpcomingEvents[roomCode].shift()
        
        // If queue is empty, generate new batch
        if (!nextEvent) {
          generateUpcomingEvents(roomCode)
          randomEvent = roomUpcomingEvents[roomCode].shift()
        } else {
          randomEvent = nextEvent
        }
        
        // Vul queue altijd aan tot 10 events (9 random + 1 forecast)
        // Forecast moet altijd op laatste positie blijven
        const lastEvent = roomUpcomingEvents[roomCode][roomUpcomingEvents[roomCode].length - 1]
        const isForecastLast = lastEvent && lastEvent.type === 'forecast'
        
        if (isForecastLast) {
          // Forecast staat op laatste positie - voeg nieuwe events toe vóór forecast
          while (roomUpcomingEvents[roomCode].length < 10) {
            const newEvent = generateRandomEvent(roomCode)
            if (newEvent.type === 'boost' && newEvent.symbol) {
              newEvent.headline = generateNewsHeadline(newEvent)
            } else if (newEvent.type === 'war') {
              newEvent.headline = 'Oorlog uitgebroken'
            } else if (newEvent.type === 'peace') {
              newEvent.headline = 'Vredesakkoord getekend'
            }
            // Voeg toe op voorlaatste positie (voor forecast)
            roomUpcomingEvents[roomCode].splice(roomUpcomingEvents[roomCode].length - 1, 0, newEvent)
          }
        } else {
          // Forecast is weg of niet op laatste positie - voeg forecast toe
          while (roomUpcomingEvents[roomCode].length < 9) {
            const newEvent = generateRandomEvent(roomCode)
            if (newEvent.type === 'boost' && newEvent.symbol) {
              newEvent.headline = generateNewsHeadline(newEvent)
            } else if (newEvent.type === 'war') {
              newEvent.headline = 'Oorlog uitgebroken'
            } else if (newEvent.type === 'peace') {
              newEvent.headline = 'Vredesakkoord getekend'
            }
            roomUpcomingEvents[roomCode].push(newEvent)
          }
          // Voeg forecast toe als 10de event
          roomUpcomingEvents[roomCode].push({ 
            type: 'forecast', 
            symbol: null, 
            percentage: 0,
            message: 'Market Forecast beschikbaar'
          })
        }
        
        console.log(`📋 Queue bijgevuld - nu ${roomUpcomingEvents[roomCode].length} events`)
        
        percentage = randomEvent.percentage
        
        // Create message based on event type
        let effectMessage
        let targetSymbol = randomEvent.symbol
        
        if (randomEvent.type === 'war') {
          effectMessage = 'Oorlog uitgebroken'
          targetSymbol = null
        } else if (randomEvent.type === 'peace') {
          effectMessage = 'Vredesakkoord getekend'
          targetSymbol = null
        } else if (randomEvent.type === 'event') {
          const absPct = Math.abs(randomEvent.percentage)
          effectMessage = randomEvent.percentage > 0 ? `Bull Run (+${randomEvent.percentage}%)` : `Bear Market (-${absPct}%)`
        } else if (randomEvent.type === 'whale') {
          // Whale alert: kies random crypto
          const cryptoSymbols = ['DSHP', 'ORX', 'LNTR', 'SIL', 'REX', 'GLX']
          targetSymbol = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)]
          const cryptoNames = {
            'DSHP': 'DigiSheep',
            'ORX': 'Orex',
            'LNTR': 'Lentra',
            'SIL': 'Silica',
            'REX': 'Rex',
            'GLX': 'Glooma'
          }
          const name = cryptoNames[targetSymbol]
          effectMessage = `Whale Alert! ${name} +50%`
        } else {
          // Use pre-generated headline from queue if available (prevents mismatch with upcoming events list)
          // If no headline exists, fall back to simple format
          effectMessage = randomEvent.headline || 
                         `${randomEvent.symbol} ${percentage > 0 ? 'stijgt' : 'daalt'} ${percentage > 0 ? '+' : ''}${percentage}%`
        }
        
        scanAction = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          player: playerName,
          action: 'Event',
          effect: effectMessage,
          avatar: playerAvatar,
          cryptoSymbol: targetSymbol,
          percentageValue: percentage,
          headline: randomEvent.headline // Pass headline from queue to client (for consistency)
        }
        
        console.log(`🎲 Using pre-generated event: ${scanAction.effect}`)
        console.log(`📊 Symbol: ${scanAction.cryptoSymbol}, Percentage: ${scanAction.percentageValue}`)
        console.log(`📋 Remaining events in queue: ${roomUpcomingEvents[roomCode].length}`)
      }
      
      // Apply WAR/PEACE state immediately when the event is applied (priority over bull/bear)
      if (!shouldGenerateForecast && randomEvent.type === 'war') {
        const duration = Math.floor(Math.random() * 5) + 10 // 10-14 events
        roomMarketState[roomCode] = {
          state: 'war',
          eventsRemaining: duration,
          triggeredBy: 'War'
        }
        io.to(roomCode).emit('market:stateUpdate', {
          change24h: roomMarketChange24h[roomCode] || {},
          marketState: roomMarketState[roomCode]?.state || 'normal',
          stateEventsRemaining: roomMarketState[roomCode]?.eventsRemaining || 0
        })
        console.log(`⚔️ WAR APPLIED! War mode for ${duration} events (85% negative bias)`)
      } else if (!shouldGenerateForecast && randomEvent.type === 'peace') {
        const duration = Math.floor(Math.random() * 5) + 6 // 6-10 events
        roomMarketState[roomCode] = {
          state: 'peace',
          eventsRemaining: duration,
          triggeredBy: 'Peace'
        }
        io.to(roomCode).emit('market:stateUpdate', {
          change24h: roomMarketChange24h[roomCode] || {},
          marketState: roomMarketState[roomCode]?.state || 'normal',
          stateEventsRemaining: roomMarketState[roomCode]?.eventsRemaining || 0
        })
        console.log(`🕊️ PEACE APPLIED! Peace mode for ${duration} events (75% positive bias)`)
      }

      // Apply price changes (skip for forecast)
      if (!shouldGenerateForecast && randomEvent.type === 'event') {
        // Market-wide events
        if (scanAction.effect.includes('Bull Run')) {
          const bullPct = randomEvent.percentage
          const bullMultiplier = 1 + bullPct / 100
          Object.keys(globalCryptoPrices).forEach(symbol => {
            globalCryptoPrices[symbol] = Math.round(globalCryptoPrices[symbol] * bullMultiplier * 100) / 100
            // Track price history for candlestick chart
            if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][symbol]) {
              roomPriceHistory[roomCode][symbol].push({ percentage: bullPct, timestamp: Date.now() })
              if (roomPriceHistory[roomCode][symbol].length > 10) {
                roomPriceHistory[roomCode][symbol].shift()
              }
              console.log(`📊 AUTO EVENT: ${symbol} price history updated (+${bullPct}%) - now ${roomPriceHistory[roomCode][symbol].length} events`)
            }
            // 📈 Update momentum tracking for market-wide event
            if (!roomMomentum[roomCode]) roomMomentum[roomCode] = {}
            if (!roomMomentum[roomCode][symbol]) roomMomentum[roomCode][symbol] = []
            roomMomentum[roomCode][symbol].push(bullPct)
            if (roomMomentum[roomCode][symbol].length > 5) {
              roomMomentum[roomCode][symbol].shift() // Keep last 5 moves
            }
          })
          console.log(`🐂 Bull Run applied: All cryptos +${bullPct}%`)
        } else if (scanAction.effect.includes('Bear Market')) {
          const bearPct = randomEvent.percentage // variable -5% to -25%
          const bearMultiplier = 1 + bearPct / 100
          Object.keys(globalCryptoPrices).forEach(symbol => {
            globalCryptoPrices[symbol] = Math.round(globalCryptoPrices[symbol] * bearMultiplier * 100) / 100
            // Track price history for candlestick chart
            if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][symbol]) {
              roomPriceHistory[roomCode][symbol].push({ percentage: bearPct, timestamp: Date.now() })
              if (roomPriceHistory[roomCode][symbol].length > 10) {
                roomPriceHistory[roomCode][symbol].shift()
              }
              console.log(`📊 AUTO EVENT: ${symbol} price history updated (${bearPct}%) - now ${roomPriceHistory[roomCode][symbol].length} events`)
            }
            // 📈 Update momentum tracking for market-wide event
            if (!roomMomentum[roomCode]) roomMomentum[roomCode] = {}
            if (!roomMomentum[roomCode][symbol]) roomMomentum[roomCode][symbol] = []
            roomMomentum[roomCode][symbol].push(bearPct)
            if (roomMomentum[roomCode][symbol].length > 5) {
              roomMomentum[roomCode][symbol].shift() // Keep last 5 moves
            }
          })
          console.log(`🐻 Bear Market applied: All cryptos ${bearPct}%`)
        }
      } else if (!shouldGenerateForecast && scanAction.cryptoSymbol && scanAction.percentageValue !== undefined) {
        // Single crypto event (skip for forecast)
        const symbol = scanAction.cryptoSymbol
        const oldPrice = globalCryptoPrices[symbol]
        const newPrice = oldPrice * (1 + scanAction.percentageValue / 100)
        globalCryptoPrices[symbol] = Math.max(0.01, Math.round(newPrice * 100) / 100)
        // Track price history for candlestick chart
        if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][symbol]) {
          roomPriceHistory[roomCode][symbol].push({ percentage: scanAction.percentageValue, timestamp: Date.now() })
          if (roomPriceHistory[roomCode][symbol].length > 10) {
            roomPriceHistory[roomCode][symbol].shift()
          }
          console.log(`📊 AUTO EVENT: ${symbol} price history updated (${scanAction.percentageValue > 0 ? '+' : ''}${scanAction.percentageValue}%) - now ${roomPriceHistory[roomCode][symbol].length} events`)
        }
        // 📈 Update momentum tracking for individual crypto event
        if (!roomMomentum[roomCode]) roomMomentum[roomCode] = {}
        if (!roomMomentum[roomCode][symbol]) roomMomentum[roomCode][symbol] = []
        roomMomentum[roomCode][symbol].push(scanAction.percentageValue)
        if (roomMomentum[roomCode][symbol].length > 5) {
          roomMomentum[roomCode][symbol].shift() // Keep last 5 moves
        }
        console.log(`💰 ${symbol}: ${oldPrice.toFixed(2)} → ${globalCryptoPrices[symbol].toFixed(2)}`)
        
        // 🌍 MARKET STATE COUNTDOWN: Decrease eventsRemaining after each event
        if (roomMarketState[roomCode] && roomMarketState[roomCode].eventsRemaining > 0) {
          roomMarketState[roomCode].eventsRemaining--
          const remaining = roomMarketState[roomCode].eventsRemaining
          const currentState = roomMarketState[roomCode].state
          console.log(`🌍 STATE: ${currentState.toUpperCase()} - ${remaining} events remaining`)
          
          // Auto-transition when countdown reaches 0
          if (remaining === 0) {
            if (currentState === 'war') {
              // War ends → Peace begins (automatic transition)
              const peaceDuration = Math.floor(Math.random() * 3) + 6 // 6-8 events
              roomMarketState[roomCode] = {
                state: 'peace',
                eventsRemaining: peaceDuration,
                triggeredBy: 'Auto transition from war'
              }
              console.log(`🕊️ PEACE TRIGGERED! Recovery from war for ${peaceDuration} events`)
            } else if (currentState === 'peace') {
              // Peace ends → Back to normal
              delete roomMarketState[roomCode]
              console.log(`✅ PEACE ENDED! Back to normal state`)
            }
          }
        }
        
        // 🔗 CORRELATION SYSTEM: ORX leader coin effect
        // When ORX (Orex) makes a big move (>15%), other coins follow partially
        // This mimics Bitcoin's influence on altcoins in real crypto markets
        const LEADER_COIN = 'ORX'
        const CORRELATION_THRESHOLD = 15 // Only trigger on moves >15%
        const CORRELATION_STRENGTH = 0.5 // Altcoins follow 50% of leader movement
        
        if (symbol === LEADER_COIN && Math.abs(scanAction.percentageValue) >= CORRELATION_THRESHOLD) {
          const correlationPercentage = scanAction.percentageValue * CORRELATION_STRENGTH
          const altcoins = ['DSHP', 'LNTR', 'SIL', 'REX', 'GLX']
          
          console.log(`\n🔗 === ORX LEADER EFFECT TRIGGERED ===`)
          console.log(`🔗 ORX movement: ${scanAction.percentageValue > 0 ? '+' : ''}${scanAction.percentageValue}%`)
          console.log(`🔗 Altcoins will follow: ${correlationPercentage > 0 ? '+' : ''}${correlationPercentage.toFixed(1)}%`)
          
          altcoins.forEach(altcoin => {
            const altOldPrice = globalCryptoPrices[altcoin]
            const altNewPrice = altOldPrice * (1 + correlationPercentage / 100)
            globalCryptoPrices[altcoin] = Math.max(0.01, Math.round(altNewPrice * 100) / 100)
            
            // Track price history for correlation effect
            if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][altcoin]) {
              roomPriceHistory[roomCode][altcoin].push({ 
                percentage: parseFloat(correlationPercentage.toFixed(1)), 
                timestamp: Date.now() 
              })
              if (roomPriceHistory[roomCode][altcoin].length > 10) {
                roomPriceHistory[roomCode][altcoin].shift()
              }
            }
            
            // Update momentum for correlation effect
            if (!roomMomentum[roomCode]) roomMomentum[roomCode] = {}
            if (!roomMomentum[roomCode][altcoin]) roomMomentum[roomCode][altcoin] = []
            roomMomentum[roomCode][altcoin].push(parseFloat(correlationPercentage.toFixed(1)))
            if (roomMomentum[roomCode][altcoin].length > 5) {
              roomMomentum[roomCode][altcoin].shift()
            }
            
            console.log(`🔗 ${altcoin}: ⚘${altOldPrice.toFixed(2)} → ⚘${globalCryptoPrices[altcoin].toFixed(2)} (${correlationPercentage > 0 ? '+' : ''}${correlationPercentage.toFixed(1)}%)`)
          })
          
          console.log(`🔗 === ORX LEADER EFFECT COMPLETE ===\n`)
        }
      }
      
      // Add to room scan data
      roomScanData[roomCode].playerScanActions.unshift(scanAction)
      if (roomScanData[roomCode].playerScanActions.length > 10) {
        roomScanData[roomCode].playerScanActions = roomScanData[roomCode].playerScanActions.slice(0, 10)
      }
      
      // Broadcast to ALL players in room (including trigger)
      io.to(roomCode).emit('scanData:update', {
        autoScanActions: roomScanData[roomCode].autoScanActions,
        playerScanActions: roomScanData[roomCode].playerScanActions,
        upcomingEvents: roomUpcomingEvents[roomCode] || [],
        scanCount: roomScanCount[roomCode] || 0
      })
      
      // Broadcast price update with price history
      io.to(roomCode).emit('crypto:priceUpdate', globalCryptoPrices)
      io.to(roomCode).emit('crypto:priceHistory', roomPriceHistory[roomCode] || {})
      
      // Broadcast market state update na scan (voor sidebar war/peace indicator)
      io.to(roomCode).emit('market:stateUpdate', {
        change24h: roomMarketChange24h[roomCode] || {},
        marketState: roomMarketState[roomCode]?.state || 'normal',
        stateEventsRemaining: roomMarketState[roomCode]?.eventsRemaining || 0
      })
      
      console.log(`✅ Event broadcast to all players in room ${roomCode}`)
      console.log(`📊 Price history broadcast:`, Object.keys(roomPriceHistory[roomCode] || {}).map(sym => `${sym}:${roomPriceHistory[roomCode][sym].length}`).join(', '))
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
            
            // Price history tracking happens in scan:event handler to avoid duplicates
            try {
              if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][symbol]) {
                roomPriceHistory[roomCode][symbol].push({ percentage: percentageChange, timestamp: Date.now() })
                if (roomPriceHistory[roomCode][symbol].length > 10) {
                  roomPriceHistory[roomCode][symbol].shift()
                }
              }
            } catch {}
            console.log(`� PLAYER SCAN: ${symbol} price updated (history tracked in scan:event handler)`)
            
            console.log(`💰 MANUELE SCAN PRICE UPDATE: ${symbol} ${oldPrice.toFixed(2)} → ${globalCryptoPrices[symbol].toFixed(2)} (${percentageChange > 0 ? '+' : ''}${percentageChange}%)`)
          } else {
            console.warn(`⚠️ Unknown crypto symbol in scan: ${symbol}`)
          }
        }
        
        // 🚨 CRITICAL: Handle market-wide events
        let whaleAlertSymbol = null
        if (scanAction.effect) {
          if (scanAction.effect.includes('Bull Run')) {
            console.log('🚀 SERVER: Applying Bull Run - All coins +5%')
            Object.keys(globalCryptoPrices).forEach(symbol => {
              const oldPrice = globalCryptoPrices[symbol]
              globalCryptoPrices[symbol] = Math.max(0.01, Math.round(oldPrice * 1.05 * 100) / 100)
              // Price history tracking happens in scan:event handler to avoid duplicates
              try {
                if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][symbol]) {
                  roomPriceHistory[roomCode][symbol].push({ percentage: 5, timestamp: Date.now() })
                  if (roomPriceHistory[roomCode][symbol].length > 10) {
                    roomPriceHistory[roomCode][symbol].shift()
                  }
                }
              } catch {}
              console.log(`  ${symbol}: ⚘${oldPrice.toFixed(2)} → ⚘${globalCryptoPrices[symbol].toFixed(2)}`)
            })
          } else if (scanAction.effect.includes('Bear Market')) {
            console.log('🐻 SERVER: Applying Bear Market - All coins -10%')
            Object.keys(globalCryptoPrices).forEach(symbol => {
              const oldPrice = globalCryptoPrices[symbol]
              globalCryptoPrices[symbol] = Math.max(0.01, Math.round(oldPrice * 0.9 * 100) / 100)
              // Price history tracking happens in scan:event handler to avoid duplicates
              try {
                if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][symbol]) {
                  roomPriceHistory[roomCode][symbol].push({ percentage: -10, timestamp: Date.now() })
                  if (roomPriceHistory[roomCode][symbol].length > 10) {
                    roomPriceHistory[roomCode][symbol].shift()
                  }
                }
              } catch {}
              console.log(`  ${symbol}: ⚘${oldPrice.toFixed(2)} → ⚘${globalCryptoPrices[symbol].toFixed(2)}`)
            })
          } else if (scanAction.effect.includes('Whale Alert')) {
            let targetSymbol = scanAction.cryptoSymbol
            if (targetSymbol && globalCryptoPrices[targetSymbol]) {
              console.log(`🐋 SERVER: Applying Whale Alert - ${targetSymbol} +50%`)
            } else {
              console.log('🐋 SERVER: Applying Whale Alert - No valid symbol in scan, picking random coin +50%')
              const symbols = Object.keys(globalCryptoPrices)
              targetSymbol = symbols[Math.floor(Math.random() * symbols.length)]
            }

            whaleAlertSymbol = targetSymbol
            const oldPrice = globalCryptoPrices[whaleAlertSymbol]
            globalCryptoPrices[whaleAlertSymbol] = Math.max(0.01, Math.round(oldPrice * 1.5 * 100) / 100)
            // Price history tracking happens in scan:event handler to avoid duplicates
            try {
              if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][whaleAlertSymbol]) {
                roomPriceHistory[roomCode][whaleAlertSymbol].push({ percentage: 50, timestamp: Date.now() })
                if (roomPriceHistory[roomCode][whaleAlertSymbol].length > 10) {
                  roomPriceHistory[roomCode][whaleAlertSymbol].shift()
                }
              }
            } catch {}
            console.log(`  ${whaleAlertSymbol}: ⚘${oldPrice.toFixed(2)} → ⚘${globalCryptoPrices[whaleAlertSymbol].toFixed(2)} (+50%)`)
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
          const prev = roomMarketChange24h[roomCode][sym] ?? defaultMarketChange24h[sym] ?? 0
          roomMarketChange24h[roomCode][sym] = Math.round((prev + scanAction.percentageValue) * 10) / 10
        }
        
        // Update change24h for market-wide events
        if (scanAction.effect) {
          if (scanAction.effect.includes('Bull Run')) {
            Object.keys(globalCryptoPrices).forEach(symbol => {
              const prev = roomMarketChange24h[roomCode][symbol] ?? defaultMarketChange24h[symbol] ?? 0
              roomMarketChange24h[roomCode][symbol] = Math.round((prev + 5) * 10) / 10
            })
          } else if (scanAction.effect.includes('Bear Market')) {
            Object.keys(globalCryptoPrices).forEach(symbol => {
              const prev = roomMarketChange24h[roomCode][symbol] ?? defaultMarketChange24h[symbol] ?? 0
              roomMarketChange24h[roomCode][symbol] = Math.round((prev - 10) * 10) / 10
            })
          } else if (scanAction.effect.includes('Whale Alert') && whaleAlertSymbol) {
            const prev = roomMarketChange24h[roomCode][whaleAlertSymbol] ?? defaultMarketChange24h[whaleAlertSymbol] ?? 0
            roomMarketChange24h[roomCode][whaleAlertSymbol] = Math.round((prev + 50) * 10) / 10
          }
        }
        
        // Broadcast updated crypto prices to ALL clients in room
        console.log(`📡 Broadcasting updated crypto prices to room ${roomCode}`)
        io.to(roomCode).emit('crypto:priceUpdate', globalCryptoPrices)
        io.to(roomCode).emit('crypto:priceHistory', roomPriceHistory[roomCode] || {})
        
        // 🔮 CRITICAL: Broadcast scan data with forecast filtering per player
        // Each player gets their own filtered version of playerScanActions
        const socketsForBroadcast = io.sockets.adapter.rooms.get(roomCode)
        if (socketsForBroadcast) {
          socketsForBroadcast.forEach(socketId => {
            const targetSocket = io.sockets.sockets.get(socketId)
            if (targetSocket) {
              // Get the player name for this socket
              const targetPlayerName = rooms[roomCode]?.players[socketId]?.name || 'Market Dashboard'
              
              // Filter forecast data: only show full forecast to trigger player
              const filteredPlayerScans = roomScanData[roomCode].playerScanActions.map(scan => {
                if (scan.isForecast && scan.forecastData) {
                  // Normalize names for comparison (case-insensitive, trim whitespace)
                  const normalizedScanPlayer = (scan.player || '').trim().toLowerCase()
                  const normalizedTargetPlayer = (targetPlayerName || '').trim().toLowerCase()
                  
                  console.log(`🔮 Forecast filtering:`)
                  console.log(`   📊 Scan player: "${scan.player}" (normalized: "${normalizedScanPlayer}")`)
                  console.log(`   👤 Target player: "${targetPlayerName}" (normalized: "${normalizedTargetPlayer}")`)
                  console.log(`   ✅ Match: ${normalizedScanPlayer === normalizedTargetPlayer}`)
                  
                  // Market Dashboard is the operator - always sees full forecast
                  const isMarketDashboard = targetPlayerName === 'Market Dashboard'
                  // If this is a forecast and the target player is NOT the trigger player AND not Market Dashboard
                  if (normalizedScanPlayer !== normalizedTargetPlayer && !isMarketDashboard) {
                    // Remove forecast data for other players
                    console.log(`   ❌ Removing forecastData for ${targetPlayerName}`)
                    const { forecastData, ...scanWithoutForecast } = scan
                    return scanWithoutForecast
                  } else {
                    console.log(`   ✅ Keeping forecastData for ${isMarketDashboard ? 'Market Dashboard (operator)' : `trigger player ${targetPlayerName}`}`)
                  }
                }
                // Return full scan data for trigger player or non-forecast events
                return scan
              })
              
              // Send filtered data to this specific socket
              targetSocket.emit('scanData:update', {
                autoScanActions: roomScanData[roomCode].autoScanActions,
                playerScanActions: filteredPlayerScans,
                upcomingEvents: roomUpcomingEvents[roomCode] || [],
                scanCount: roomScanCount[roomCode] || 0
              })
              
              console.log(`📤 Sent ${targetPlayerName === scanAction.player ? 'FULL' : 'FILTERED'} scan data to ${targetPlayerName}`)
              
              // DEBUG: Log what forecast data was sent
              const forecastScans = filteredPlayerScans.filter(s => s.isForecast)
              if (forecastScans.length > 0) {
                forecastScans.forEach(fs => {
                  console.log(`   🔮 Forecast in sent data:`, {
                    player: fs.player,
                    hasForecastData: !!fs.forecastData,
                    topGainer: fs.forecastData?.topGainer,
                    topLoser: fs.forecastData?.topLoser
                  })
                })
              }
            }
          })
        } else {
          // Fallback: broadcast to room (should not happen)
          io.to(roomCode).emit('scanData:update', {
            autoScanActions: roomScanData[roomCode].autoScanActions,
            playerScanActions: roomScanData[roomCode].playerScanActions,
            upcomingEvents: roomUpcomingEvents[roomCode] || [],
            scanCount: roomScanCount[roomCode] || 0
          })
        }
        // Broadcast authoritative market change map
        io.to(roomCode).emit('market:stateUpdate', {
          change24h: roomMarketChange24h[roomCode] || {},
          marketState: roomMarketState[roomCode]?.state || 'normal',
          stateEventsRemaining: roomMarketState[roomCode]?.eventsRemaining || 0
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
        
        // Initialize upcoming events if not exists
        if (!roomUpcomingEvents[roomCode] || roomUpcomingEvents[roomCode].length === 0) {
          generateUpcomingEvents(roomCode)
        }
        
        const upcomingEvents = roomUpcomingEvents[roomCode] || []
        console.log(`📋 Upcoming events: ${upcomingEvents.length}`)
        
        socket.emit('scanData:update', {
          autoScanActions: roomScanData[roomCode].autoScanActions,
          playerScanActions: roomScanData[roomCode].playerScanActions,
          upcomingEvents: upcomingEvents,
          scanCount: roomScanCount[roomCode] || 0
        })
      } else {
        console.log(`❌ Room ${roomCode} not found or no scan data`)
        socket.emit('scanData:update', {
          autoScanActions: [],
          playerScanActions: [],
          upcomingEvents: [],
          scanCount: 0
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

    // Admin: Undo action - reverse a specific action
    socket.on('admin:undoAction', ({ roomCode, actionId }) => {
      console.log(`\n🔄 === UNDO ACTION REQUEST ===`)
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`🆔 Action ID: ${actionId}`)
      
      if (!rooms[roomCode] || !roomScanData[roomCode]) {
        console.warn(`⚠️ Room ${roomCode} not found`)
        return
      }
      
      // Find the action in either player or auto scan actions
      const playerAction = roomScanData[roomCode].playerScanActions.find(a => a.id === actionId)
      const autoAction = roomScanData[roomCode].autoScanActions.find(a => a.id === actionId)
      const action = playerAction || autoAction
      
      if (!action) {
        console.warn(`⚠️ Action ${actionId} not found`)
        return
      }
      
      console.log(`📋 Found action: ${action.effect}`)
      console.log(`👤 Player: ${action.player}`)
      console.log(`🎬 Action type: ${action.action}`)
      
      // Handle speeljaar (new year) actions
      if (action.action === 'Nieuwjaar bonus' || action.effect?.includes('START BONUS')) {
        console.log(`🗓️ Detected speeljaar action - reversing year and cash bonus`)
        
        // Extract cash amount from effect (e.g. "START BONUS +⚘500")
        const cashMatch = action.effect?.match(/\+⚘(\d+)/)
        const cashAmount = cashMatch ? parseInt(cashMatch[1]) : 500
        
        // Find the player who triggered this action
        const playerSocketId = Object.keys(rooms[roomCode].players).find(
          sid => rooms[roomCode].players[sid].name === action.player
        )
        
        if (playerSocketId && rooms[roomCode].players[playerSocketId]) {
          const player = rooms[roomCode].players[playerSocketId]
          
          // Reverse cash balance
          const oldCash = player.cashBalance || 0
          player.cashBalance = Math.max(0, oldCash - cashAmount)
          
          console.log(`💰 UNDO: ${action.player} cash ${oldCash.toFixed(2)} → ${player.cashBalance.toFixed(2)} (-⚘${cashAmount})`)
          
          // Broadcast player update to trigger year decrease AND cash update on client
          io.to(roomCode).emit('player:yearUndo', {
            playerName: action.player,
            actionId: actionId,
            cashAmount: cashAmount
          })
          
          console.log(`🗓️ Sent year undo signal to ${action.player} with cash adjustment -⚘${cashAmount}`)
        } else {
          console.warn(`⚠️ Player ${action.player} not found in room`)
        }
      }
      
      // Handle koop (buy) actions
      if (action.action === 'Koop' || action.effect?.includes('gekocht')) {
        console.log(`🛒 Detected koop action - reversing purchase`)
        
        // Extract crypto symbol and amount from effect
        // Format: "1x DigiSheep gekocht voor ⚘100"
        const amountMatch = action.effect?.match(/(\d+)x/)
        const amount = amountMatch ? parseInt(amountMatch[1]) : 1
        
        const symbolMatch = action.effect?.match(/\b(DSHP|ORX|LNTR|SIL|REX|GLX)\b/) || 
                           action.effect?.match(/(DigiSheep|Orex|Lentra|Silica|Rex|Glooma)/)
        
        const nameToSymbol = {
          'DigiSheep': 'DSHP', 'Orex': 'ORX', 'Lentra': 'LNTR',
          'Silica': 'SIL', 'Rex': 'REX', 'Glooma': 'GLX'
        }
        
        const cryptoSymbol = symbolMatch ? (nameToSymbol[symbolMatch[0]] || symbolMatch[0]) : null
        
        // Extract price from effect
        const priceMatch = action.effect?.match(/⚘(\d+(?:\.\d+)?)/)
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0
        
        if (cryptoSymbol && price > 0) {
          console.log(`🔄 Reversing: ${amount}x ${cryptoSymbol} for ⚘${price}`)
          
          io.to(roomCode).emit('player:undoAction', {
            playerName: action.player,
            actionId: actionId,
            actionType: 'buy',
            cryptoSymbol: cryptoSymbol,
            amount: amount,
            cashRefund: price
          })
          
          console.log(`✅ Sent buy undo signal to ${action.player}`)
        }
      }
      
      // Handle verkoop (sell) actions
      if (action.action === 'Verkoop' || action.effect?.includes('verkocht')) {
        console.log(`💰 Detected verkoop action - reversing sale`)
        
        // Extract crypto symbol and amount from effect
        const amountMatch = action.effect?.match(/(\d+)x/)
        const amount = amountMatch ? parseInt(amountMatch[1]) : 1
        
        const symbolMatch = action.effect?.match(/\b(DSHP|ORX|LNTR|SIL|REX|GLX)\b/) || 
                           action.effect?.match(/(DigiSheep|Orex|Lentra|Silica|Rex|Glooma)/)
        
        const nameToSymbol = {
          'DigiSheep': 'DSHP', 'Orex': 'ORX', 'Lentra': 'LNTR',
          'Silica': 'SIL', 'Rex': 'REX', 'Glooma': 'GLX'
        }
        
        const cryptoSymbol = symbolMatch ? (nameToSymbol[symbolMatch[0]] || symbolMatch[0]) : null
        
        // Extract price from effect
        const priceMatch = action.effect?.match(/⚘(\d+(?:\.\d+)?)/)
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0
        
        if (cryptoSymbol && price > 0) {
          console.log(`🔄 Reversing: ${amount}x ${cryptoSymbol} for ⚘${price}`)
          
          io.to(roomCode).emit('player:undoAction', {
            playerName: action.player,
            actionId: actionId,
            actionType: 'sell',
            cryptoSymbol: cryptoSymbol,
            amount: amount,
            cashDeduction: price
          })
          
          console.log(`✅ Sent sell undo signal to ${action.player}`)
        }
      }
      
      // Reverse the price change
      if (action.cryptoSymbol && action.percentageValue !== undefined) {
        const symbol = action.cryptoSymbol
        const percentage = action.percentageValue
        
        // Reverse the percentage change
        const reversePercentage = -percentage
        const oldPrice = globalCryptoPrices[symbol]
        const newPrice = oldPrice * (1 + reversePercentage / 100)
        globalCryptoPrices[symbol] = Math.max(0.01, Math.round(newPrice * 100) / 100)
        
        console.log(`💰 UNDO: ${symbol} ${oldPrice.toFixed(2)} → ${globalCryptoPrices[symbol].toFixed(2)} (reverse ${percentage}%)`)
        
        // Update market change 24h
        if (roomMarketChange24h[roomCode]) {
          const prevChange = roomMarketChange24h[roomCode][symbol] || 0
          roomMarketChange24h[roomCode][symbol] = Math.round((prevChange + reversePercentage) * 10) / 10
        }
        
        // Remove from price history
        if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][symbol]) {
          const historyIndex = roomPriceHistory[roomCode][symbol].findIndex(h => 
            Math.abs(h.timestamp - action.timestamp) < 1000 && h.percentage === percentage
          )
          if (historyIndex !== -1) {
            roomPriceHistory[roomCode][symbol].splice(historyIndex, 1)
            console.log(`📊 Removed from price history: ${symbol} at index ${historyIndex}`)
          }
        }
      }
      
      // Handle market-wide events (Bull Run, Bear Market)
      if (action.effect.includes('Bull Run')) {
        Object.keys(globalCryptoPrices).forEach(symbol => {
          const oldPrice = globalCryptoPrices[symbol]
          globalCryptoPrices[symbol] = Math.round(oldPrice / 1.05 * 100) / 100
          
          if (roomMarketChange24h[roomCode]) {
            const prevChange = roomMarketChange24h[roomCode][symbol] || 0
            roomMarketChange24h[roomCode][symbol] = Math.round((prevChange - 5) * 10) / 10
          }
          
          if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][symbol]) {
            const historyIndex = roomPriceHistory[roomCode][symbol].findIndex(h => 
              Math.abs(h.timestamp - action.timestamp) < 1000 && h.percentage === 5
            )
            if (historyIndex !== -1) {
              roomPriceHistory[roomCode][symbol].splice(historyIndex, 1)
            }
          }
        })
        console.log(`🔄 UNDO: Bull Run reversed - All cryptos -${Math.abs(action.percentageValue || 5)}%`)
      } else if (action.effect.includes('Bear Market')) {
        Object.keys(globalCryptoPrices).forEach(symbol => {
          const oldPrice = globalCryptoPrices[symbol]
          globalCryptoPrices[symbol] = Math.round(oldPrice / 0.9 * 100) / 100
          
          if (roomMarketChange24h[roomCode]) {
            const prevChange = roomMarketChange24h[roomCode][symbol] || 0
            roomMarketChange24h[roomCode][symbol] = Math.round((prevChange + 10) * 10) / 10
          }
          
          if (roomPriceHistory[roomCode] && roomPriceHistory[roomCode][symbol]) {
            const historyIndex = roomPriceHistory[roomCode][symbol].findIndex(h => 
              Math.abs(h.timestamp - action.timestamp) < 1000 && h.percentage === -10
            )
            if (historyIndex !== -1) {
              roomPriceHistory[roomCode][symbol].splice(historyIndex, 1)
            }
          }
        })
        console.log(`🔄 UNDO: Bear Market reversed - All cryptos +10%`)
      }
      
      // Remove action from scan data
      if (playerAction) {
        roomScanData[roomCode].playerScanActions = roomScanData[roomCode].playerScanActions.filter(a => a.id !== actionId)
        console.log(`🗑️ Removed from player scan actions`)
      }
      if (autoAction) {
        roomScanData[roomCode].autoScanActions = roomScanData[roomCode].autoScanActions.filter(a => a.id !== actionId)
        console.log(`🗑️ Removed from auto scan actions`)
      }
      
      // Broadcast undo event to show CORRECTIE popup
      io.to(roomCode).emit('action:undone', {
        action: action,
        isUndo: true
      })
      
      // Broadcast updates to all clients
      io.to(roomCode).emit('crypto:priceUpdate', globalCryptoPrices)
      io.to(roomCode).emit('crypto:priceHistory', roomPriceHistory[roomCode] || {})
      io.to(roomCode).emit('scanData:update', {
        autoScanActions: roomScanData[roomCode].autoScanActions,
        playerScanActions: roomScanData[roomCode].playerScanActions,
        upcomingEvents: roomUpcomingEvents[roomCode] || [],
        scanCount: roomScanCount[roomCode] || 0
      })
      io.to(roomCode).emit('market:stateUpdate', {
        change24h: roomMarketChange24h[roomCode] || {}
      })
      
      console.log(`✅ Action ${actionId} successfully undone and broadcasted`)
      console.log(`🔄 === UNDO COMPLETE ===\n`)
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
      console.log(`💯 Total Value: ⚘${playerData.totalValue}`)
      
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

      // ✅ TRUST CLIENT CALCULATIONS - Client has most up-to-date prices and portfolio state
      // Only validate that totalValue = portfolioValue + cashBalance (basic sanity check)
      const clientTotal = Math.round(playerData.totalValue * 100) / 100
      const expectedTotal = Math.round((playerData.portfolioValue + playerData.cashBalance) * 100) / 100
      
      console.log(`🔍 VALIDATION CHECK:`)
      console.log(`💎 Client Portfolio: ⚘${playerData.portfolioValue}`)
      console.log(`💰 Cash: ⚘${playerData.cashBalance}`)
      console.log(`💯 Client Total: ⚘${clientTotal}`)
      console.log(`🧮 Expected (Portfolio + Cash): ⚘${expectedTotal}`)
      
      // If client's total doesn't match their own portfolio+cash, fix it
      if (Math.abs(clientTotal - expectedTotal) > 0.01) {
        console.log(`⚠️ Client total mismatch - correcting to portfolio + cash`)
        playerData.totalValue = expectedTotal
      }

      // 📊 UPDATE SERVER STATE (Single Source of Truth)
      const timestamp = Date.now()
      rooms[roomCode].players[socket.id] = {
        ...rooms[roomCode].players[socket.id],
        ...playerData,
        lastUpdate: timestamp,
        socketId: socket.id
      }
      
      const isHostPlayer = rooms[roomCode].players[socket.id]?.isHost
      console.log(`✅ Server state updated for ${playerData.name} ${isHostPlayer ? '(HOST)' : ''}`)
      console.log(`💰 Cash: ⚘${playerData.cashBalance}`)
      console.log(`💎 Portfolio: ⚘${playerData.portfolioValue}`)
      console.log(`💯 Total: ⚘${playerData.totalValue}`)

      // 📡 BROADCAST TO ALL PLAYERS IN ROOM (EXCLUDING HOST AS PLAYER)
      if (isHostPlayer) {
        console.log(`⏭️ Host update detected – skipping dashboard:livePlayerUpdate broadcast (host is geen speler)`)
        return
      }

      const broadcastData = {
        playerId: socket.id,
        playerName: playerData.name,
        playerAvatar: playerData.avatar,
        totalValue: playerData.totalValue,
        portfolioValue: playerData.portfolioValue,
        cashBalance: playerData.cashBalance,
        portfolio: playerData.portfolio || {},
        timestamp: timestamp
      }
      
      console.log(`📡 Broadcasting dashboard:livePlayerUpdate to room ${roomCode}:`)
      console.log(`   Player ID: ${socket.id}`)
      console.log(`   Player Name: ${playerData.name}`)
      console.log(`   Player Avatar: ${playerData.avatar}`)
      console.log(`   Total Value: ⚘${playerData.totalValue.toFixed(2)}`)
      console.log(`   Portfolio Value: ⚘${playerData.portfolioValue.toFixed(2)}`)
      console.log(`   Cash Balance: ⚘${playerData.cashBalance.toFixed(2)}`)
      console.log(`   Clients in room: ${io.sockets.adapter.rooms.get(roomCode)?.size || 0}`)
      
      io.to(roomCode).emit('dashboard:livePlayerUpdate', broadcastData)

      console.log(`✅ Broadcast complete`)
      console.log(`🎯 === UNIFIED UPDATE COMPLETE ===\n`)
    })

    // ==========================================
    // ROOM-WIDE SOUND EFFECTS SYNC
    // ==========================================
    socket.on('room:soundEffectsUpdated', ({ roomCode, enabled }) => {
      io.to(roomCode).emit('room:soundEffectsUpdated', { enabled })
      console.log(`🔔 room:soundEffectsUpdated → room ${roomCode}: enabled=${enabled}`)
    })

    // ==========================================
    // MARKETPLACE BIDDING SYSTEM
    // ==========================================
    
    // Store active bidding timers (per socket, fine since timer fires before disconnect)
    const biddingTimers = new Map()
    
    // Handle new marketplace order creation
    socket.on('marketplace:createOrder', ({ roomCode, order }) => {
      console.log('\n📦 === MARKETPLACE ORDER CREATED ===')
      console.log('📦 Order:', order)
      console.log('🏠 Room:', roomCode)
      
      // Store order in global map - persists if seller socket reconnects
      globalMarketplaceOrders.set(order.id, { order, roomCode })
      console.log(`📦 Stored order ${order.id} for seller ${order.playerName} (total stored: ${globalMarketplaceOrders.size})`)

      // Pause turn timer during bidding so the turn doesn't advance mid-bid
      if (rooms[roomCode]) {
        rooms[roomCode]._activeBiddingOrderId = order.id
        if (turnTimers.has(roomCode)) {
          clearTimeout(turnTimers.get(roomCode))
          turnTimers.delete(roomCode)
          console.log(`⏸️ Turn timer PAUSED for room ${roomCode} during bidding`)
        }
      }

      // Broadcast order to ALL players in the room
      io.to(roomCode).emit('marketplace:newOrder', { order })
      
      console.log('📡 Broadcast marketplace:newOrder to room:', roomCode)
      console.log(`👥 Players in room: ${io.sockets.adapter.rooms.get(roomCode)?.size || 0}`)
      
      // Start 10-second bidding timer
      const timerId = setTimeout(() => {
        console.log('⏰ Bidding time ended for order:', order.id)
        io.to(roomCode).emit('marketplace:biddingEnded', { orderId: order.id })
        biddingTimers.delete(order.id)
        // Resume turn timer after bidding ends
        if (rooms[roomCode]?._activeBiddingOrderId === order.id) {
          delete rooms[roomCode]._activeBiddingOrderId
          console.log(`▶️ Turn timer RESUMED after bidding ended for room ${roomCode}`)
          startTurnTimer(roomCode, io)
        }
      }, 10000) // 10 seconds
      
      biddingTimers.set(order.id, timerId)
      console.log('✅ Bidding timer started (10 seconds)')
      console.log('📦 === ORDER BROADCAST COMPLETE ===\n')
    })
    
    // Handle bid placement
    socket.on('marketplace:placeBid', ({ roomCode, orderId, bid }) => {
      console.log('\n💰 === BID RECEIVED ===')
      console.log('💰 Bid:', bid)
      console.log('📦 Order ID:', orderId)
      console.log('🏠 Room:', roomCode)
      
      // Broadcast bid to all players (seller will filter it)
      io.to(roomCode).emit('marketplace:bidReceived', { orderId, bid })
      
      console.log('📡 Broadcast bid to room:', roomCode)
      console.log('✅ === BID BROADCAST COMPLETE ===\n')
    })
    
    // Handle bid acceptance
    socket.on('marketplace:acceptBid', ({ roomCode, orderId, winningBid }) => {
      console.log('\n✅ === BID ACCEPTED ===')
      console.log('✅ Winning bid:', winningBid)
      console.log('📦 Order ID:', orderId)
      console.log('🏠 Room:', roomCode)
      
      // Clear the bidding timer if still active
      if (biddingTimers.has(orderId)) {
        clearTimeout(biddingTimers.get(orderId))
        biddingTimers.delete(orderId)
        console.log('⏰ Cleared bidding timer')
      }

      // Resume turn timer - bidding ended early via acceptance
      if (rooms[roomCode]?._activeBiddingOrderId === orderId) {
        delete rooms[roomCode]._activeBiddingOrderId
        console.log(`▶️ Turn timer RESUMED after bid accepted for room ${roomCode}`)
        startTurnTimer(roomCode, io)
      }
      
      // Retrieve stored order from global map
      const stored = globalMarketplaceOrders.get(orderId)
      if (!stored) {
        console.log(`❌ Order ${orderId} not found in globalMarketplaceOrders (size: ${globalMarketplaceOrders.size})`)
        console.log('❌ Available orders:', Array.from(globalMarketplaceOrders.keys()))
        // Still broadcast so UI closes
        io.to(roomCode).emit('marketplace:bidAccepted', { orderId, winningBid: winningBid.amount, winnerName: winningBid.playerName, winnerId: winningBid.playerId })
        return
      }
      const { order: storedOrder } = stored
      globalMarketplaceOrders.delete(orderId)
      console.log(`✅ Order found: seller=${storedOrder.playerName}, crypto=${storedOrder.crypto}, amount=${storedOrder.amount}`)

      if (!rooms[roomCode]) {
        console.log('❌ Room not found')
        return
      }

      // Find seller and buyer WITH their socket IDs
      const sellerEntry = Object.entries(rooms[roomCode].players).find(([, p]) => p.name === storedOrder.playerName)
      const buyerEntry = Object.entries(rooms[roomCode].players).find(([, p]) => p.name === winningBid.playerName)

      if (!sellerEntry || !buyerEntry) {
        console.log('❌ Seller or buyer not found:', { sellerName: storedOrder.playerName, buyerName: winningBid.playerName })
        console.log('❌ Available players:', Object.values(rooms[roomCode].players).map(p => p.name))
        io.to(roomCode).emit('marketplace:bidAccepted', { orderId, winningBid: winningBid.amount, winnerName: winningBid.playerName, winnerId: winningBid.playerId })
        return
      }

      const [sellerSocketId, seller] = sellerEntry
      const [buyerSocketId, buyer] = buyerEntry

      // Sanitize amounts
      const bidAmount = typeof winningBid.amount === 'number'
        ? winningBid.amount
        : parseFloat(String(winningBid.amount).replace(/[^\d.]/g, ''))
      const quantity = typeof storedOrder.amount === 'number' ? storedOrder.amount : Number(storedOrder.amount)
      const cryptoSymbol = storedOrder.crypto

      if (isNaN(bidAmount) || isNaN(quantity) || bidAmount <= 0 || quantity <= 0) {
        console.log('❌ Invalid amounts:', { bidAmount, quantity })
        return
      }

      // Init portfolios
      if (!seller.portfolio) seller.portfolio = {}
      if (!buyer.portfolio) buyer.portfolio = {}

      console.log('💰 TRANSACTION START')
      console.log(`  Seller ${seller.name}: cash=⚘${seller.cashBalance}, ${cryptoSymbol}=${seller.portfolio[cryptoSymbol] || 0}`)
      console.log(`  Buyer  ${buyer.name}: cash=⚘${buyer.cashBalance}, ${cryptoSymbol}=${buyer.portfolio[cryptoSymbol] || 0}`)

      // CRYPTO: seller loses, buyer gains
      seller.portfolio[cryptoSymbol] = (seller.portfolio[cryptoSymbol] || 0) - quantity
      buyer.portfolio[cryptoSymbol] = (buyer.portfolio[cryptoSymbol] || 0) + quantity

      // CASH: buyer loses, seller gains
      buyer.cashBalance = Number((buyer.cashBalance - bidAmount).toFixed(2))
      seller.cashBalance = Number((seller.cashBalance + bidAmount).toFixed(2))

      console.log(`  ✅ Seller ${seller.name}: cash=⚘${seller.cashBalance} (+${bidAmount}), ${cryptoSymbol}=${seller.portfolio[cryptoSymbol]} (-${quantity})`)
      console.log(`  ✅ Buyer  ${buyer.name}: cash=⚘${buyer.cashBalance} (-${bidAmount}), ${cryptoSymbol}=${buyer.portfolio[cryptoSymbol]} (+${quantity})`)

      // Emit DIRECTLY to each player's socket by ID - no name matching needed
      const sellerSocket = io.sockets.sockets.get(sellerSocketId)
      const buyerSocket = io.sockets.sockets.get(buyerSocketId)

      if (sellerSocket) {
        sellerSocket.emit('player:balanceUpdate', {
          cashBalance: seller.cashBalance,
          portfolio: { ...seller.portfolio }
        })
        console.log(`📩 Sent balanceUpdate directly to SELLER ${seller.name} (${sellerSocketId})`)
      } else {
        console.warn(`⚠️ Seller socket not found: ${sellerSocketId}`)
      }

      if (buyerSocket) {
        buyerSocket.emit('player:balanceUpdate', {
          cashBalance: buyer.cashBalance,
          portfolio: { ...buyer.portfolio }
        })
        console.log(`📩 Sent balanceUpdate directly to BUYER ${buyer.name} (${buyerSocketId})`)
      } else {
        console.warn(`⚠️ Buyer socket not found: ${buyerSocketId}`)
      }

      // Broadcast to room so all UIs close (bidAccepted still used for modal/popup close)
      io.to(roomCode).emit('marketplace:bidAccepted', {
        orderId,
        winningBid: bidAmount,
        winnerName: winningBid.playerName,
        winnerId: winningBid.playerId,
        sellerName: storedOrder.playerName,
        crypto: cryptoSymbol,
        quantity
      })

      // Update room rankings
      io.to(roomCode).emit('lobby:update', rooms[roomCode])

      console.log('📡 Broadcast bid acceptance + player updates to room:', roomCode)
      console.log('✅ === BID ACCEPTANCE COMPLETE ===\n')
    })
    
    // Handle order cancellation
    socket.on('marketplace:cancelOrder', ({ roomCode, orderId }) => {
      console.log('\n🚫 === ORDER CANCELLED ===')
      console.log('📦 Order ID:', orderId)
      console.log('🏠 Room:', roomCode)
      
      // Clear the bidding timer if active
      if (biddingTimers.has(orderId)) {
        clearTimeout(biddingTimers.get(orderId))
        biddingTimers.delete(orderId)
        console.log('⏰ Cleared bidding timer')
      }
      
      // Broadcast cancellation to all players
      io.to(roomCode).emit('marketplace:orderCancelled', { orderId })
      
      console.log('📡 Broadcast order cancellation to room:', roomCode)
      console.log('✅ === ORDER CANCELLATION COMPLETE ===\n')
    })

    // 🔄 PLAYER SWAP - Exchange 1 crypto coin between two players
    socket.on('player:swap', ({ roomCode, fromPlayerId, toPlayerId, fromCryptoId, toCryptoId }) => {
      console.log(`\n🔄 === PLAYER SWAP REQUEST ===`)
      console.log(`🏠 Room: ${roomCode}`)
      console.log(`👤 From Player: ${fromPlayerId}`)
      console.log(`👤 To Player: ${toPlayerId}`)
      console.log(`💎 Swap: 1x ${fromCryptoId} ↔️ 1x ${toCryptoId}`)
      
      if (!rooms[roomCode]) {
        console.log(`❌ Room ${roomCode} not found`)
        return
      }

      const fromPlayer = rooms[roomCode].players[fromPlayerId]
      const toPlayer = rooms[roomCode].players[toPlayerId]

      if (!fromPlayer || !toPlayer) {
        console.log(`❌ One or both players not found in room`)
        return
      }

      // Initialize portfolios if needed
      if (!fromPlayer.portfolio) fromPlayer.portfolio = {}
      if (!toPlayer.portfolio) toPlayer.portfolio = {}

      // Validate both players have the coins to swap
      const fromPlayerHasCoin = (fromPlayer.portfolio[fromCryptoId] || 0) >= 1
      const toPlayerHasCoin = (toPlayer.portfolio[toCryptoId] || 0) >= 1

      if (!fromPlayerHasCoin) {
        console.log(`❌ ${fromPlayer.name} doesn't have 1x ${fromCryptoId}`)
        return
      }

      if (!toPlayerHasCoin) {
        console.log(`❌ ${toPlayer.name} doesn't have 1x ${toCryptoId}`)
        return
      }

      // Execute the swap: server is single source of truth
      // From player: -1 fromCrypto, +1 toCrypto
      fromPlayer.portfolio[fromCryptoId] = (fromPlayer.portfolio[fromCryptoId] || 0) - 1
      fromPlayer.portfolio[toCryptoId] = (fromPlayer.portfolio[toCryptoId] || 0) + 1

      // To player: -1 toCrypto, +1 fromCrypto
      toPlayer.portfolio[toCryptoId] = (toPlayer.portfolio[toCryptoId] || 0) - 1
      toPlayer.portfolio[fromCryptoId] = (toPlayer.portfolio[fromCryptoId] || 0) + 1

      console.log(`✅ Swap executed:`)
      console.log(`   ${fromPlayer.name}: -1 ${fromCryptoId}, +1 ${toCryptoId}`)
      console.log(`   ${toPlayer.name}: -1 ${toCryptoId}, +1 ${fromCryptoId}`)

      // Notify BEIDE spelers - ieder krijgt zijn eigen perspectief
      io.to(fromPlayerId).emit('player:swapReceived', {
        fromPlayerName: toPlayer.name,
        fromPlayerAvatar: toPlayer.avatar,
        receivedCryptoId: toCryptoId,
        receivedAmount: 1,
        lostCryptoId: fromCryptoId,
        lostAmount: 1
      })

      io.to(toPlayerId).emit('player:swapReceived', {
        fromPlayerName: fromPlayer.name,
        fromPlayerAvatar: fromPlayer.avatar,
        receivedCryptoId: fromCryptoId,
        receivedAmount: 1,
        lostCryptoId: toCryptoId,
        lostAmount: 1
      })
      
      console.log(`📤 Swap notificaties gestuurd naar beide spelers`)

      // Broadcast room update so rankings update
      io.to(roomCode).emit('lobby:update', rooms[roomCode])

      console.log(`✅ Swap completed successfully`)
      console.log(`🔄 === SWAP COMPLETE ===\n`)
    })
  })

  // 🚨 REMOVED: Pre-created room 123 logic
  // Rooms should ONLY exist when a host explicitly creates them
  // This prevents "ghost rooms" that players can join but hosts can't see
  console.log(`✅ Server ready - rooms will be created by hosts only`)

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
