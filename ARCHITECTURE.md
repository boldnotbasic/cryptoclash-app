# CryptoClash - Architectuur Documentatie

## 🎯 Overzicht

CryptoClash is een multiplayer crypto trading game waarbij events (live beurs activiteiten en manuele scans) realtime invloed hebben op de marktwaarden van crypto coins.

## 🏗️ Kern Architectuur

### Single Source of Truth (Server)

De server (`server.js`) beheert de **autoritatieve staat** van het spel:

1. **globalCryptoPrices**: Absolute prijzen van alle crypto coins
2. **roomMarketChange24h**: Percentuele veranderingen (change24h) per room

```javascript
// Voorbeeld:
globalCryptoPrices = {
  DSHEEP: 1420.75,
  WHALE: 3250.90,
  // ...
}

roomMarketChange24h['123'] = {
  DSHEEP: 7.3,    // +7.3%
  WHALE: -1.8,    // -1.8%
  // ...
}
```

### Event-Driven Updates

Alle marktveranderingen worden getriggerd door **events**:

#### 1. Live Beurs Events (Automatisch)
- Gegenereerd door `startActivityInterval()` elke 30 seconden
- Bot scans willekeurige coins met random percentages (-10% tot +10%)
- **Flow:**
  ```
  Bot genereert event
  → Update globalCryptoPrices (prijs)
  → Update roomMarketChange24h (percentage)
  → Broadcast naar alle clients:
    - crypto:priceUpdate (nieuwe prijzen)
    - market:stateUpdate (nieuwe percentages)
    - scanData:update (nieuwe event in lijst)
  ```

#### 2. Manuele Scans (Players)
- Player scant QR code via camera
- Selecteert random crypto + percentage
- **Flow:**
  ```
  Player scant QR
  → Client emit player:scanAction naar server
  → Server update globalCryptoPrices (prijs)
  → Server update roomMarketChange24h (percentage)
  → Broadcast naar alle clients:
    - crypto:priceUpdate (nieuwe prijzen)
    - market:stateUpdate (nieuwe percentages)
    - scanData:update (nieuwe event in lijst)
  ```

## 📡 Socket Events

### Server → Client

| Event | Payload | Doel |
|-------|---------|------|
| `crypto:priceUpdate` | `{ [symbol]: price }` | Update absolute prijzen |
| `market:stateUpdate` | `{ change24h: { [symbol]: percentage } }` | Update percentages (autoritatief) |
| `scanData:update` | `{ autoScanActions, playerScanActions }` | Update event lijsten |
| `crypto:forceRecalculation` | `{ prices, timestamp, triggeredBy }` | Trigger portfolio herberekening |

### Client → Server

| Event | Payload | Doel |
|-------|---------|------|
| `player:scanAction` | `{ roomCode, scanAction }` | Manuele scan van player |
| `dashboard:syncMarketState` | `{ roomCode, changeMap }` | Dashboard initial sync |
| `scanData:request` | `{ roomCode }` | Request huidige scan data |

## 🎮 Client Architecture

### Dashboard (Market Dashboard)
- **Rol**: Algemeen scherm, visible voor alle players
- **Toont**: 
  - Live markt overzicht (coins met prijzen & percentages)
  - Beurs events (automatische bot scans)
  - Scans (manuele player scans)
  - Live rankings van players
  - Markt Impact Analyse widget

### Player Interface (Main Menu)
- **Rol**: Persoonlijke interface per player
- **Toont**:
  - Eigen portfolio
  - Cash balance
  - Rankings
  - Scan mogelijkheid
  - Dezelfde markt percentages als dashboard

## 🔄 Data Synchronisatie Flow

### 1. Initialisatie (Player Join)
```
Player joins room
→ Server emit market:stateUpdate met huidige roomMarketChange24h
→ Player ontvangt en set lokale change24h
→ Player ziet exact dezelfde percentages als dashboard
```

### 2. Dashboard Initialisatie
```
Dashboard laadt
→ Dashboard emit dashboard:syncMarketState met huidige percentages
→ Server update roomMarketChange24h
→ Server broadcast market:stateUpdate naar ALLE clients
→ Alle devices tonen nu dezelfde baseline
```

### 3. Event Occurs (Beurs of Scan)
```
Event gebeurt (bot of player scan)
→ Server update:
  - globalCryptoPrices (absolute prijs)
  - roomMarketChange24h (cumulatief percentage)
→ Server broadcast:
  - crypto:priceUpdate (nieuwe prijzen)
  - market:stateUpdate (nieuwe percentages)
  - scanData:update (event in lijst)
→ ALLE clients updaten gelijktijdig:
  - Prijzen (price property)
  - Percentages (change24h property)
  - Event lijsten
```

## 💡 Key Design Decisions

### 1. Server als Single Source of Truth
- **Waarom**: Voorkomt divergentie tussen dashboard en players
- **Hoe**: Server beheert roomMarketChange24h als autoritatieve bron
- **Resultaat**: Alle devices tonen altijd dezelfde waardes

### 2. Geen Client-Side Updates
- **Waarom**: Random client updates veroorzaakten inconsistenties
- **Hoe**: Alle price/percentage updates komen via server events
- **Resultaat**: Voorspelbaar, event-driven systeem

### 3. Cumulatieve Percentages
- **Waarom**: Events stapelen op elkaar (basis + event = nieuw)
- **Hoe**: `roomMarketChange24h[symbol] += eventPercentage`
- **Resultaat**: Duidelijke tracking van alle events

### 4. Separate Price & Percentage Updates
- **Waarom**: Prijs en percentage zijn onafhankelijk
- **Hoe**: 
  - `crypto:priceUpdate` update alleen `price`
  - `market:stateUpdate` update alleen `change24h`
- **Resultaat**: Clean separation of concerns

## 🔍 Markt Impact Analyse Widget

De widget toont expliciete berekeningen:

```
Voorbeeld event: DSHEEP +3%

Voor event: DSHEEP 5.5% (markt)
Event:      +3%
Na event:   DSHEEP 8.5% (= 5.5% + 3%)

Widget toont: "DSHEEP 5.5% (markt) +3% = 8.5%"
```

Deze berekening gebruikt:
- **Baseline**: Waarde vóór dit specifieke event
- **Event**: Percentage van dit event
- **Current**: Actuele waarde uit roomMarketChange24h

## 🚀 Best Practices

### Voor Developers:

1. **Nooit lokaal mutate prices/percentages**: Alleen server mag dit doen
2. **Vertrouw op market:stateUpdate**: Dit is de truth voor percentages
3. **Test met meerdere devices**: Zorg dat alle devices sync blijven
4. **Monitor socket events**: Gebruik console logs om flow te tracken

### Voor Debugging:

1. Check server console voor event flow
2. Check client console voor ontvangen updates
3. Verify dat roomMarketChange24h consistent is
4. Test met dashboard + meerdere players tegelijk

## 📊 Data Flow Diagram

```
┌─────────────┐
│   SERVER    │
│ (Authority) │
└──────┬──────┘
       │
       ├─── globalCryptoPrices (absolute prijzen)
       │
       └─── roomMarketChange24h (percentages per room)
              │
              ├─── Geüpdatet door: Live Beurs Events
              │                    Manuele Scans
              │
              └─── Broadcast naar: Dashboard
                                   Players

┌──────────────────────────────────────────┐
│           ALLE CLIENTS ONTVANGEN:         │
├──────────────────────────────────────────┤
│ crypto:priceUpdate    → Update prijzen   │
│ market:stateUpdate    → Update %         │
│ scanData:update       → Update events    │
└──────────────────────────────────────────┘
```

## 🎯 Conclusie

Het systeem gebruikt een **event-driven, server-authoritative architectuur** waarbij:
- Server beheert alle truth
- Events (beurs + scans) triggeren updates
- Clients consumeren en displayen
- Synchronisatie is gegarandeerd

Dit zorgt voor een robuust, consistent en schaalbaar systeem waarbij het dashboard als algemeen scherm fungeert en alle events direct zichtbaar zijn voor alle spelers.
