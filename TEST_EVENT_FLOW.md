# 🔍 EVENT POP-UP FLOW ANALYSE

## ✅ SERVER SIDE - VERIFIED

### 1. Room Creation (`host:createRoom`)
- ✅ `generateUpcomingEvents(roomCode)` wordt aangeroepen (regel 750)
- ✅ Genereert 9 events + 1 forecast
- ✅ Broadcast via `scanData:update` met `upcomingEvents` array (regel 762-768)

### 2. Event Generation (`generateUpcomingEvents`)
- ✅ Genereert 9 random events (regel 2248-2291)
- ✅ Voegt headlines toe via `generateNewsHeadline()` (regel 2268)
- ✅ Voorbeelden:
  - "DigiSheep breekt door weerstandsniveau, investeerders optimistisch"
  - "Orex partnership aangekondigd, koers schiet omhoog"
  - "Oorlog uitgebroken" (voor war events)
  - "Vredesakkoord getekend" (voor peace events)

### 3. Player Triggers Event (`player:triggerEvent`)
- ✅ Haalt event uit queue: `roomUpcomingEvents[roomCode].shift()` (regel 2596)
- ✅ Gebruikt pre-generated headline: `randomEvent.headline` (regel 2688)
- ✅ Stuurt naar client in `scanAction`:
  ```javascript
  scanAction = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    player: playerName,
    action: 'Event',
    effect: effectMessage,  // "DigiSheep breekt door..."
    avatar: playerAvatar,
    cryptoSymbol: targetSymbol,  // "DSHP"
    percentageValue: percentage,  // 10
    headline: randomEvent.headline  // "DigiSheep breekt door..."
  }
  ```
- ✅ Broadcast via `scanData:update` (regel 2888-2893)

## ✅ CLIENT SIDE - VERIFIED

### 4. Client Receives Event (`handleScanDataUpdate`)
- ✅ Ontvangt `scanData:update` event
- ✅ Filtert qualifying events (regel 2266-2285)
- ✅ Bepaalt `eventType` op basis van `effect` (regel 2395-2413):
  - Forecast → `'forecast'`
  - Bull Run/Bear Market/Whale Alert → `'event'`
  - Percentage < 0 → `'crash'`
  - Percentage > 0 → `'boost'`
- ✅ Maakt `ScanEffect` object (regel 2416-2434):
  ```typescript
  const scanEffect: ScanEffect = {
    type: eventType,  // 'boost' of 'crash'
    cryptoSymbol: newestEvent.cryptoSymbol,  // "DSHP"
    percentage: newestEvent.percentageValue,  // 10
    message: newestEvent.effect,  // "DigiSheep breekt door..."
    icon: newestEvent.cryptoSymbol || '',
    color: eventType === 'crash' ? 'red-500' : 'neon-green',
    headline: (newestEvent as any).headline  // "DigiSheep breekt door..."
  }
  ```
- ✅ Geeft door aan `EventPopup` via `setOtherPlayerEventData(scanEffect)` (regel 2467)

### 5. EventPopup Component
- ✅ Ontvangt `externalScenario` prop (regel 152)
- ✅ Normaliseert headline (regel 456-458):
  ```typescript
  const normalizedHeadline = typeof (currentScenario as any).headline === 'string'
    ? (currentScenario as any).headline.replace(/\bOrlo\b/g, 'Glooma').replace(/\bORLO\b/g, 'GLX')
    : (currentScenario as any).headline
  ```
- ✅ Toont headline ALLEEN voor crypto events (regel 655):
  ```typescript
  {currentScenario.type !== 'forecast' && 
   currentScenario.type !== 'event' && 
   !isWarEvent && 
   !isPeaceEvent && (
    <div className="mb-6 px-2">
      <p className="text-sm text-white font-semibold leading-relaxed break-words">
        {normalizedHeadline && normalizedHeadline !== 'Beurs update' ? (
          <>&ldquo;{normalizedHeadline}&rdquo;</>
        ) : (
          <>&ldquo;{normalizedMessage}&rdquo;</>
        )}
      </p>
    </div>
  )}
  ```

## 🔴 POTENTIËLE PROBLEMEN

### Probleem 1: Browser Cache
**Symptoom:** Oude room data, geen events
**Oplossing:** Clear browser data (F12 → Application → Clear site data)

### Probleem 2: Socket.IO Niet Verbonden
**Symptoom:** Events worden niet ontvangen
**Check:** Browser console voor `🔌 Connected to server: [ID]`
**Oplossing:** Refresh pagina, check server draait

### Probleem 3: Room Bestaat Niet
**Symptoom:** Server logs `❌ Room [CODE] not found`
**Oplossing:** Maak nieuwe room, gebruik correcte room code

### Probleem 4: Event Type Mismatch
**Symptoom:** Headline wordt niet getoond
**Check:** `eventType` moet `'boost'` of `'crash'` zijn, NIET `'event'`
**Verificatie:** Browser console log `✅ Created ScanEffect:` moet `type: 'boost'` of `type: 'crash'` tonen

## 🎯 TEST PROCEDURE

1. **Clear browser data**
   - F12 → Application → Clear site data
   - Of gebruik incognito window

2. **Start fresh session**
   - Open `http://localhost:3000`
   - Host Setup → Next → Start Game

3. **Check server logs**
   ```
   📋 Generated initial upcoming events for room [CODE]
   📡 Broadcasted initial upcomingEvents (10) to room [CODE]
   ```

4. **Check MarketDashboard**
   - Widget "Komende 10 Pop-up Events" moet 10 events tonen
   - Elk event moet symbol, percentage en headline hebben

5. **Trigger event**
   - Klik "Event" knop
   - Check browser console:
     ```
     🎲 === CLIENT TRIGGERING EVENT ===
     ✅ player:triggerEvent emitted to server
     📊 === SERVER SCAN DATA UPDATE ===
     ✅ Created ScanEffect: { type: 'boost', headline: '...' }
     ```

6. **Verify pop-up**
   - Pop-up verschijnt met:
     - Symbol (DSHP, ORX, etc.)
     - Headline ("DigiSheep breekt door...")
     - Percentage (+10% of -15%)
     - Correct geluid (positive.mp3 of negative.mp3)

## 📊 EXPECTED CONSOLE LOGS

### Server (Terminal):
```
📋 Generated initial upcoming events for room ABC123
📡 Broadcasted initial upcomingEvents (10) to room ABC123

🎲 === PLAYER TRIGGERED EVENT ===
🏠 Room: ABC123
👤 Player: Gijs
🔌 Socket ID: xyz789
📡 Timestamp: 2026-04-24T10:17:00.000Z
🎲 Using pre-generated event: DigiSheep breekt door weerstandsniveau, investeerders optimistisch
📊 Symbol: DSHP, Percentage: 10
📋 Remaining events in queue: 9
📡 Broadcasting scanData:update to room ABC123
📡 Player scan actions count: 1
✅ Event broadcast to all players in room ABC123
```

### Client (Browser Console):
```
🎲 === CLIENT TRIGGERING EVENT ===
🏠 Room ID: ABC123
👤 Player Name: Gijs
🔌 Socket connected: true
✅ player:triggerEvent emitted to server

📊 === SERVER SCAN DATA UPDATE ===
🤖 Auto scans received: 0
👤 Player scans received: 1
✅ Created ScanEffect: {
  type: 'boost',
  cryptoSymbol: 'DSHP',
  percentage: 10,
  message: 'DigiSheep breekt door weerstandsniveau, investeerders optimistisch',
  headline: 'DigiSheep breekt door weerstandsniveau, investeerders optimistisch',
  icon: 'DSHP',
  color: 'neon-green'
}
🔊 Playing sound for event: boost DigiSheep breekt door... percentage: 10
🔊 Sound played: /sounds/positive.mp3
```
