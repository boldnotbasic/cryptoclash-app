# 🧪 COMPREHENSIVE TESTING GUIDE - Marketplace Bidding System

## ✅ ALL CHANGES IMPLEMENTED

### 1. ✅ Server-Side Socket Events Added
**File:** `server.js` (lines 2919-3014)

**Events Implemented:**
- ✅ `marketplace:createOrder` - Broadcasts new orders to all players
- ✅ `marketplace:placeBid` - Forwards bids to all players
- ✅ `marketplace:biddingEnded` - Triggered after 10-second timer
- ✅ `marketplace:acceptBid` - Processes winning bid
- ✅ `marketplace:cancelOrder` - Handles order cancellation

### 2. ✅ UI Styling Fixed
- ✅ **Nieuw Aanbod button**: Now GREEN (like Valideren button)
- ✅ **Background Music button**: GREEN when ON, RED when OFF
- ✅ **Sound Effects button**: GREEN when ON, RED when OFF
- ✅ All audio buttons match Timer button styling

### 3. ✅ Sound Effects Fixed
- ✅ Removed `forceMuted` parameter from sound functions
- ✅ Sound effects now properly respect `soundEffectsEnabled` state
- ✅ When disabled, NO sound effects will play

---

## 🧪 TESTING PROCEDURE

### Step 1: Restart Server
```bash
# CRITICAL: You MUST restart the server for socket events to work!
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
# OR
node server.js
```

**Expected Server Output:**
```
🚀 CryptoClash Server Successfully Started!
📍 Environment: DEVELOPMENT
🌐 Server URL: http://0.0.0.0:3000
🔌 Socket.IO: Enabled (polling → websocket)
```

### Step 2: Clear Browser Cache
**IMPORTANT: Clear cache to avoid caching issues!**

**Chrome/Edge:**
1. Press `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
2. Select "Cached images and files"
3. Click "Clear data"

**Safari:**
1. Press `Cmd+Option+E`
2. Reload page with `Cmd+R`

**OR use Incognito/Private mode for testing**

### Step 3: Test Bidding Popup

#### Player 1 (Seller):
1. ✅ Join room
2. ✅ Go to Marketplace (Sell → Players)
3. ✅ Select a crypto you own
4. ✅ Set quantity with slider
5. ✅ Click **"➕ Nieuw Aanbod"** (should be GREEN)
6. ✅ Check browser console for:
   ```
   🛒 Creating marketplace order directly: {...}
   📡 Socket connected: true
   🏠 Room ID: [your-room-code]
   📦 New order object: {...}
   📤 Emitting marketplace:createOrder event...
   ✅ Event emitted successfully
   ```

#### Server Console (should show):
```
📦 === MARKETPLACE ORDER CREATED ===
📦 Order: { id: 'order-...', crypto: 'LNTR', amount: 1, ... }
🏠 Room: [room-code]
📡 Broadcast marketplace:newOrder to room: [room-code]
👥 Players in room: 2
✅ Bidding timer started (10 seconds)
📦 === ORDER BROADCAST COMPLETE ===
```

#### Player 2 (Buyer):
1. ✅ Should see **BiddingPopup appear IMMEDIATELY**
2. ✅ Check browser console for:
   ```
   🔔 New marketplace order received: {...}
   Current playerName: [player-2-name]
   Order playerName: [player-1-name]
   Should show popup: true
   ✅ Showing bidding popup to buyer
   🎯 BiddingPopup render check: { showBiddingPopup: true, ... }
   ```
3. ✅ Popup should show:
   - Seller name and avatar
   - Crypto image and symbol
   - Quantity
   - Market price
   - 10-second countdown timer
   - Input field for bid amount
   - "Bod Plaatsen" and "Overslaan" buttons

4. ✅ Enter bid amount (e.g., 150)
5. ✅ Click "Bod Plaatsen"
6. ✅ Should see confirmation screen

#### Player 1 (After 10 seconds):
1. ✅ Should see **BidAcceptanceModal**
2. ✅ Should show all received bids
3. ✅ Highest bid should have "HOOGSTE BOD" badge
4. ✅ Click on a bid to accept it

### Step 4: Test Audio Controls

#### Background Music:
1. ✅ Click Background Music button
2. ✅ Should turn GREEN when ON
3. ✅ Should turn RED when OFF
4. ✅ Music should play/stop accordingly

#### Sound Effects:
1. ✅ Click Sound Effects button
2. ✅ Should turn GREEN when ON
3. ✅ Should turn RED when OFF
4. ✅ Scan a QR code with positive/negative effect
5. ✅ When OFF: NO sound should play
6. ✅ When ON: Sound should play

---

## 🐛 TROUBLESHOOTING

### Popup Still Not Appearing?

**Check 1: Server Running?**
```bash
# Make sure server is running with new code
ps aux | grep node
# Should show node server.js process
```

**Check 2: Socket Connected?**
Open browser console and check:
```javascript
// Should see:
📡 Socket connected: true
```

**Check 3: Room Code Correct?**
```javascript
// Both players should see same room code:
🏠 Room ID: [same-code]
```

**Check 4: Server Receiving Event?**
Server console should show:
```
📦 === MARKETPLACE ORDER CREATED ===
```
If NOT showing → Socket event not reaching server

**Check 5: Server Broadcasting?**
Server console should show:
```
📡 Broadcast marketplace:newOrder to room: [room-code]
👥 Players in room: 2
```
If players = 1 → Second player not in room

**Check 6: Client Receiving Event?**
Player 2 browser console should show:
```
🔔 New marketplace order received: {...}
```
If NOT showing → Client not listening to socket event

**Check 7: Popup Rendering?**
Player 2 browser console should show:
```
🎯 BiddingPopup render check: { showBiddingPopup: true, ... }
```
If showBiddingPopup = false → State not updating

### Sound Effects Still Playing When Disabled?

**Check 1: Button State**
- Button should be RED when disabled
- Console should show: `🔊 Sound effects: OFF`

**Check 2: Verify State Sync**
Open browser console:
```javascript
// Should see when toggling:
🔊 Sound effects: ON
🔊 Sound effects: OFF
```

**Check 3: Test with QR Scan**
1. Disable sound effects (RED button)
2. Scan QR code with effect
3. Console should show: `🔇 Sound effects muted`
4. NO sound should play

---

## 📊 SUCCESS CRITERIA

✅ **Server starts without errors**
✅ **Both players can join same room**
✅ **Player 1 can create order (green button)**
✅ **Player 2 sees popup immediately**
✅ **Timer counts down from 10 seconds**
✅ **Player 2 can submit bid**
✅ **Player 1 sees BidAcceptanceModal after 10 sec**
✅ **Player 1 can accept bid**
✅ **Audio buttons are green/red (not blue/gray)**
✅ **Sound effects don't play when disabled**

---

## 🔍 DEBUG COMMANDS

### Check Socket Connection:
```javascript
// In browser console:
window.io
// Should show Socket.IO instance
```

### Check Room Membership:
```javascript
// In browser console (Player 2):
console.log('Room:', roomId)
console.log('Player:', playerName)
```

### Force Trigger Event (Testing):
```javascript
// In browser console (Player 1):
socket.emit('marketplace:createOrder', {
  roomCode: 'YOUR_ROOM_CODE',
  order: {
    id: 'test-order',
    playerName: 'TestSeller',
    playerAvatar: '👨',
    crypto: 'LNTR',
    amount: 1,
    pricePerUnit: 100,
    totalPrice: 100,
    timestamp: Date.now()
  }
})
```

---

## 📝 FINAL CHECKLIST

Before reporting issues, verify:

- [ ] Server restarted after code changes
- [ ] Browser cache cleared OR using incognito mode
- [ ] Both players in SAME room
- [ ] Socket connected (check console)
- [ ] Server console shows marketplace events
- [ ] Client console shows marketplace events
- [ ] Popup state is true in render check
- [ ] Audio buttons show correct colors
- [ ] Sound effects respect enabled/disabled state

If ALL checkboxes are ✅ and popup still doesn't appear:
→ Share FULL browser console output
→ Share FULL server console output
→ Specify exact step where it fails
