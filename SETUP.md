# CryptoClash - Setup & Quick Start

## 🚀 Quick Start

### 1. Installatie
```bash
npm install
```

### 2. Start Server
```bash
npm run dev
```

Server draait op: `http://localhost:3000`

## 🎮 Game Flow

### Host Setup
1. Ga naar `http://localhost:3000`
2. Kies "Host"
3. Creëer room met unieke code (bijv. "123")
4. Configureer settings:
   - Starting Cash
   - Game Duration
   - Volatility
5. Klik "Start Game"
6. **Dashboard verschijnt** → Dit is het algemene markt scherm

### Player Setup
1. Ga naar `http://localhost:3000` (op ander device/browser)
2. Kies "Player"
3. Voer dezelfde room code in
4. Kies naam + avatar
5. Join room
6. Wacht tot host game start
7. **Player interface verschijnt** → Persoonlijk scherm

## 📱 Interfaces

### Dashboard (Host View)
- **Doel**: Algemeen markt scherm voor alle spelers
- **Componenten**:
  - Live markt overzicht met alle coins
  - Beurs widget (automatische bot events)
  - Scans widget (manuele player scans)
  - Rankings (top 3 spelers)
  - Markt Impact Analyse

### Player Interface
- **Doel**: Persoonlijke interface per speler
- **Componenten**:
  - Portfolio (eigen crypto's)
  - Cash balance
  - Scan functie (QR scanner)
  - Rankings (positie in leaderboard)
  - Markt overzicht (zelfde als dashboard)

## 🎯 Gameplay

### Automatische Events (Beurs)
- Om de 30 seconden genereert bot een event
- Random crypto krijgt random percentage (-10% tot +10%)
- **Effect**: 
  - Prijs verandert
  - Percentage verandert
  - Zichtbaar in "Beurs" widget
  - Invloed op alle player portfolios

### Manuele Scans
- Player klikt "Scannen" of "QR Scanner"
- Scant QR code met camera (of simuleer scan)
- Random effect wordt geselecteerd
- **Effect**:
  - Prijs verandert
  - Percentage verandert
  - Zichtbaar in "Scans" widget
  - Invloed op alle player portfolios

## 📊 Markt Overzicht

De markt toont:
- **Coin naam & symbool** (bijv. DigiSheep - DSHEEP)
- **Huidige prijs** (bijv. €1,420.75)
- **Percentage verandering** (bijv. +7.3% of -3.2%)
  - Groen = stijging
  - Rood = daling

**Let op**: Percentages zijn **cumulatief**:
- Start: DSHEEP 0%
- Na event +5%: DSHEEP +5%
- Na event +3%: DSHEEP +8%
- Na event -2%: DSHEEP +6%

## 🔍 Markt Impact Analyse

De analyse widget toont per event:
```
DSHEEP 5.5% (markt) +3% = 8.5%
       ↑           ↑      ↑
    baseline    event  current
```

Dit helpt spelers begrijpen hoe events de markt beïnvloeden.

## 🐛 Debugging

### Check Server Console
```
📈 LIVE BEURS PRICE UPDATE: DSHEEP 1420.75 → 1462.88 (+3.0%)
📡 Broadcasting updated crypto prices to room 123
📊 Sent initial market state to Player1: { DSHEEP: 8.5, ... }
```

### Check Client Console
```
💰 Received server crypto prices: { DSHEEP: 1462.88, ... }
📡 market:stateUpdate received: { DSHEEP: 8.5, ... }
📊 === SERVER SCAN DATA UPDATE ===
```

### Verificatie
1. Open dashboard + 2 players
2. Trigger event (beurs of scan)
3. **Verwacht**: Alle 3 devices tonen exact dezelfde percentages

## ⚙️ Technische Details

### Stack
- **Frontend**: Next.js 14 + React + TypeScript
- **Backend**: Node.js + Express + Socket.io
- **Styling**: Tailwind CSS
- **State**: React hooks + Socket events

### Key Files
- `server.js` - Server logic & socket events
- `app/page.tsx` - Main client logic
- `components/MarketDashboard.tsx` - Dashboard component
- `components/MainMenu.tsx` - Player interface
- `components/QRScanner.tsx` - Scan functionality

### Environment
- Node.js 18+
- Next.js 14
- Socket.io 4.x

## 🎨 UI Labels

- **Markt** - Overzicht van alle coins (was: "Markt overzicht")
- **Beurs** - Automatische bot events (was: "Live beurs")
- **Scans** - Manuele player scans (was: "Manuele scans")

## 🔐 Best Practices

### Voor Host
1. Start altijd eerst het dashboard
2. Wacht tot alle players gejoined zijn
3. Start dan de game
4. Dashboard blijft zichtbaar als algemeen scherm

### Voor Players
1. Join alleen actieve rooms
2. Kies unieke naam + avatar combinatie
3. Scan regelmatig om je portfolio te beïnvloeden
4. Monitor markt voor beste trading moments

### Voor Development
1. Test altijd met meerdere devices/browsers
2. Check console logs voor debugging
3. Verify socket connections in server logs
4. Test edge cases (disconnect/reconnect)

## 📚 Meer Info

Zie [ARCHITECTURE.md](./ARCHITECTURE.md) voor gedetailleerde technische documentatie.

## ❓ FAQ

**Q: Waarom zijn percentages verschillend tussen dashboard en player?**
A: Dit zou niet moeten gebeuren. Server beheert één autoritatieve bron. Check console logs.

**Q: Events verschijnen niet op dashboard**
A: Check of room correct gejoined is. Verify socket connection in console.

**Q: Scans hebben geen effect op markt**
A: Check of `player:scanAction` event correct emitted wordt. Verify server logs.

**Q: Prijzen updaten niet**
A: Check of `crypto:priceUpdate` en `market:stateUpdate` events ontvangen worden.

## 🆘 Support

Bij problemen:
1. Check server console voor errors
2. Check client console voor missing events
3. Verify room codes match
4. Test met fresh browser/incognito
5. Restart server en probeer opnieuw

Happy trading! 🚀📈
