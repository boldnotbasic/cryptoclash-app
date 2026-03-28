# Marketplace Bidding System - Server Implementation Guide

## Required Socket Events for server.js

Add these event handlers to your `server.js` file to enable the marketplace bidding system:

```javascript
// ==========================================
// MARKETPLACE BIDDING SYSTEM
// ==========================================

// Store active bidding timers
const biddingTimers = new Map()

// Handle new marketplace order creation
socket.on('marketplace:createOrder', ({ roomCode, order }) => {
  console.log('📦 Received marketplace order:', order)
  
  // Broadcast order to ALL players in the room (including sender for testing)
  io.to(roomCode).emit('marketplace:newOrder', { order })
  
  console.log('📡 Broadcast order to room:', roomCode)
  
  // Start 10-second bidding timer
  const timerId = setTimeout(() => {
    console.log('⏰ Bidding time ended for order:', order.id)
    io.to(roomCode).emit('marketplace:biddingEnded', { orderId: order.id })
    biddingTimers.delete(order.id)
  }, 10000) // 10 seconds
  
  biddingTimers.set(order.id, timerId)
})

// Handle bid placement
socket.on('marketplace:placeBid', ({ roomCode, orderId, bid }) => {
  console.log('💰 Bid received:', bid)
  
  // Broadcast bid to all players (seller will filter it)
  io.to(roomCode).emit('marketplace:bidReceived', { orderId, bid })
  
  console.log('📡 Broadcast bid to room:', roomCode)
})

// Handle bid acceptance
socket.on('marketplace:acceptBid', ({ roomCode, orderId, winningBid }) => {
  console.log('✅ Bid accepted:', winningBid)
  
  // Clear the bidding timer if still active
  if (biddingTimers.has(orderId)) {
    clearTimeout(biddingTimers.get(orderId))
    biddingTimers.delete(orderId)
  }
  
  // TODO: Update player balances and crypto amounts here
  // Example:
  // - Deduct cash from buyer (winningBid.amount)
  // - Add cash to seller
  // - Transfer crypto from seller to buyer
  
  // Broadcast acceptance to all players
  io.to(roomCode).emit('marketplace:bidAccepted', {
    orderId,
    winningBid: winningBid.amount,
    winnerName: winningBid.playerName,
    winnerId: winningBid.playerId
  })
  
  console.log('📡 Broadcast bid acceptance to room:', roomCode)
})

// Handle order cancellation
socket.on('marketplace:cancelOrder', ({ roomCode, orderId }) => {
  console.log('🚫 Order cancelled:', orderId)
  
  // Clear the bidding timer if active
  if (biddingTimers.has(orderId)) {
    clearTimeout(biddingTimers.get(orderId))
    biddingTimers.delete(orderId)
  }
  
  // Broadcast cancellation to all players
  io.to(roomCode).emit('marketplace:orderCancelled', { orderId })
  
  console.log('📡 Broadcast order cancellation to room:', roomCode)
})

// Clean up timers on disconnect
socket.on('disconnect', () => {
  // Clear any active bidding timers for this socket
  // (You may want to track which orders belong to which socket)
  console.log('🔌 Socket disconnected, cleaning up...')
})
```

## Testing the Implementation

1. **Start your server** with the above code added
2. **Open two browser windows** (or use incognito mode for second player)
3. **Join the same room** with both players
4. **Player 1**: Go to Marketplace → Select crypto → Click "➕ Nieuw Aanbod"
5. **Player 2**: Should immediately see the BiddingPopup with 10-second timer
6. **Player 2**: Enter bid amount and click "Bod Plaatsen"
7. **Player 1**: After 10 seconds, should see BidAcceptanceModal with received bids
8. **Player 1**: Click on a bid to accept it

## Debug Checklist

If popup doesn't appear, check browser console for:

✅ `📤 Emitting marketplace:createOrder event...`
✅ `✅ Event emitted successfully`
✅ `🔔 New marketplace order received:`
✅ `✅ Showing bidding popup to buyer`
✅ `🎯 BiddingPopup render check: { showBiddingPopup: true, ... }`

If any of these are missing, the issue is at that step.

## Server Console Output

You should see:
```
📦 Received marketplace order: { id: 'order-...', ... }
📡 Broadcast order to room: ROOM_CODE
💰 Bid received: { playerId: '...', amount: 150, ... }
📡 Broadcast bid to room: ROOM_CODE
⏰ Bidding time ended for order: order-...
✅ Bid accepted: { playerId: '...', amount: 150, ... }
📡 Broadcast bid acceptance to room: ROOM_CODE
```
