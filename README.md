# 🎮 CryptoClash - Innovatief Bordspel met Digitale Interactie

Een modern real-time multiplayer bordspel dat fysieke en digitale elementen combineert voor een unieke crypto trading ervaring. Spelers kunnen crypto's verhandelen, QR-codes scannen voor speciale acties, en concurreren in een live marktomgeving.

## 🚀 Recent Optimizations & Improvements

### Performance Optimizations
- **Memoized calculations** voor portfolio waardes en crypto prijzen
- **Optimized data syncing** met throttling en debouncing
- **Reduced re-renders** door smart state management
- **Crypto price lookup cache** voor snellere berekeningen
- **Server-side room cleanup** en memory management

### Code Quality Improvements
- **Centralized error handling** met logging utilities
- **React Error Boundaries** voor graceful error recovery
- **Performance monitoring** component voor real-time debugging
- **TypeScript optimizations** voor betere type safety
- **Consistent styling** met utility functions

### UI/UX Enhancements
- **Fixed tile highlighting** voor non-clickable elements
- **Consistent border styling** tussen components
- **Improved responsive design** voor mobile devices
- **Better visual feedback** voor user interactions

## 🎮 Features

### Core Gameplay
- **Real-time multiplayer** ondersteuning via Socket.io
- **Live crypto market** met automatische prijswijzigingen
- **QR code scanning** voor speciale game acties
- **Portfolio management** met real-time waardes
- **Live rankings** en leaderboards
- **Host/Player roles** met verschillende interfaces

### Technical Features
- **Cross-device synchronization** voor consistent gameplay
- **Offline capability** met PWA ondersteuning
- **Mobile-first design** met responsive layouts
- **Real-time data sync** tussen alle spelers
- **Performance monitoring** en error tracking

## 🧩 Conceptoverzicht
CryptoClash is een innovatief bordspel gecombineerd met een webgame waarin spelers strijden om de grootste cryptovermogens. Het unieke element: echte digitale interactie via QR-codes die koerswijzigingen, bonussen of verrassingen activeren.

## 🚀 Features
- **Inlogscherm**: Spelers kunnen hun naam invoeren om het spel te starten
- **Crypto Dashboard**: Interactieve sliders voor 4 verschillende cryptomunten
- **Markt Overzicht**: Volledig koersoverzicht met marktstatistieken
- **Multiplayer Support**: Zie andere spelers met avatars en rankings
- **Real-time Scores**: Live berekening van portefeuillewaarde
- **QR Code Scanner**: Scan kaarten voor koerswijzigingen en events
- **Futuristische UI**: Neon styling met paars, blauw, turquoise en goud

## 🎯 Cryptomunten
1. **Virticoin (VTC)** ⚡ - Paars neon thema
2. **Crypta (CRP)** 🔷 - Blauw neon thema  
3. **LedgerX (LDX)** 📊 - Turquoise neon thema
4. **BlockChain (BCH)** 🔗 - Goud neon thema

## 🛠️ Technologie Stack

### Frontend
- **Next.js 14** - React framework met App Router
- **React 18** - UI library met concurrent features
- **TypeScript** - Type safety en developer experience
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library

### Backend & Real-time
- **Socket.io** - Real-time bidirectional communication
- **Node.js** - Server runtime
- **Express** - Web framework (via Next.js)

### Mobile & PWA
- **QR Scanner** - Camera-based QR code scanning
- **PWA Support** - Offline capability en app-like experience
- **Responsive Design** - Mobile-first approach

### Performance & Monitoring
- **React.memo** - Component memoization
- **useMemo/useCallback** - Hook optimizations
- **Error Boundaries** - Graceful error handling
- **Performance Monitor** - Real-time debugging tools

## 🏗️ Architecture Overview

### Data Flow
```
Client (React) ↔ Socket.io ↔ Server (Node.js) ↔ Room Storage
     ↓                                              ↓
Performance Monitor                            Cleanup System
     ↓                                              ↓
Error Handler                               Activity Generator
```

### Key Components
- **Main Page** (`app/page.tsx`) - Central game state management
- **Socket Context** - Global WebSocket connection
- **Data Sync Utils** - Centralized synchronization logic
- **Error Handler** - Logging and error recovery
- **Performance Monitor** - Real-time performance tracking

## 🚀 Installatie & Setup

### Vereisten
- Node.js 18+ 
- npm of yarn

### Stappen
1. **Dependencies installeren**:
   ```bash
   npm install
   ```

2. **Development server starten**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   ```
   http://localhost:3000
   ```

## 🎮 Gameplay Features

### 📱 Inlogscherm
- Voer spelernaam in (max 20 karakters)
- Futuristische animaties en styling
- Spelregels uitleg

### 🏪 Crypto Dashboard
- **4 Cryptomunten** met real-time koersen
- **Interactieve sliders** om aantal munten aan te passen
- **Live portefeuillewaarde** berekening
- **Markt statistieken**: beste investering, totaal munten, markt status
- **Koers animaties**: groene pijl omhoog, rode pijl omlaag
- **Navigatie** naar markt overzicht en QR scanner

### 📊 Markt Overzicht
- **Volledige koerslijst** van alle cryptomunten
- **Marktstatistieken**: totale marktwaarde, volume, stijgers/dalers
- **Speler leaderboard** met avatars en rankings
- **Portfolio breakdown** per speler
- **Uitleg markt update functie**

### 👥 Multiplayer Features
- **Speler avatars**: 👑 🚀 💎 ⚡ en meer
- **Live rankings** gebaseerd op portefeuillewaarde
- **Portfolio vergelijking** tussen spelers
- **Rang indicatoren**: kroon voor #1, medaille voor #2, trofee voor #3

### 📷 QR Scanner
- **Camera toegang** voor echte QR code scanning
- **Simulatie modus** als camera niet beschikbaar is
- **Mock QR codes** voor testing:
  - `CRYPTO_BOOST_VTC_+15%` - Virticoin stijgt 15%
  - `CRYPTO_DROP_CRP_-8%` - Crypta daalt 8%  
  - `EVENT_BULL_RUN_ALL_+10%` - Alle munten stijgen 10%
  - `EVENT_HACK_LDX_-20%` - LedgerX hack event
  - `BONUS_COINS_+500` - Bonus munten
  - `FORK_EVENT_BCH_SPLIT` - BlockChain fork event

### ⚡ Markt Update Functionaliteit
**Wat doet "Markt Update"?**
- **Koersveranderingen**: Simuleert realistische marktbewegingen (-10% tot +10%)
- **Willekeurig element**: Voegt spanning toe - niemand weet wat er gebeurt!
- **Instant updates**: Alle spelers zien direct de nieuwe koersen
- **Strategie element**: Gebruik updates strategisch voor timing van koop/verkoop

## 🎨 Design System

### Kleuren
- **Neon Purple**: `#8B5CF6` - Primaire kleur
- **Neon Blue**: `#3B82F6` - Secundaire kleur
- **Neon Turquoise**: `#06B6D4` - Accent kleur
- **Neon Gold**: `#F59E0B` - Highlight kleur
- **Dark Background**: `#0F0F23` - Achtergrond
- **Card Background**: `#1A1A2E` - Kaart achtergrond

### Effecten
- **Neon glow** effecten op borders en schaduwen
- **Pulse animaties** voor belangrijke elementen
- **Hover effecten** met kleur transities
- **Gradient backgrounds** voor buttons en headers

## 📱 Responsive Design
- **Desktop**: Volledige grid layout met alle features
- **Tablet**: Aangepaste grid voor medium schermen
- **Mobile**: Gestapelde layout, geoptimaliseerd voor touch

## 🔧 Development

### Project Structuur
```
cryptoclash/
├── app/
│   ├── globals.css          # Styling en Tailwind
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main app component
├── components/
│   ├── LoginScreen.tsx      # Inlog component
│   ├── GameDashboard.tsx    # Hoofd game interface
│   └── QRScanner.tsx        # QR scanner component
├── package.json             # Dependencies
├── tailwind.config.js       # Tailwind configuratie
└── README.md               # Deze file
```

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build voor productie
- `npm run start` - Start productie server
- `npm run lint` - Run ESLint

## 🔧 Development & Debugging

### Performance Monitoring
Het project bevat een ingebouwde performance monitor die je kunt activeren:

```typescript
import { usePerformanceMonitor } from '@/components/PerformanceMonitor'

const { PerformanceMonitor } = usePerformanceMonitor()
// Render <PerformanceMonitor /> in je component
```

### Error Handling
Gebruik de centralized error handler voor consistent logging:

```typescript
import { ErrorHandler } from '@/utils/errorHandler'

// Log errors
ErrorHandler.logError('Something went wrong', error, context)

// Safe async operations
const result = await ErrorHandler.safeAsync(
  () => riskyOperation(),
  'Operation failed'
)
```

### Debug Commands
Server debug endpoints via Socket.io:
- `debug:listRooms` - Toon alle actieve rooms
- `debug:serverStats` - Server performance statistieken
- `debug:clearTestConnections` - Verwijder test verbindingen

### Performance Tips
1. **Memoization**: Gebruik `useMemo` voor expensive calculations
2. **Component splitting**: Splits grote components op
3. **Lazy loading**: Gebruik `React.lazy` voor code splitting
4. **Error boundaries**: Wrap components in ErrorBoundary
5. **Monitor performance**: Gebruik de PerformanceMonitor component

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables
```env
NODE_ENV=production
PORT=3000
```

### Server Optimizations
- Automatic room cleanup na inactiviteit
- Connection pooling voor Socket.io
- Memory usage monitoring
- Error logging en recovery

## 🎯 Toekomstige Features
- **Advanced analytics** voor gameplay metrics
- **Tournament mode** met brackets
- **Custom crypto creation** door spelers
- **Mobile app** met native features
- **Blockchain integration** voor echte crypto rewards
- **Persistente scores** met database
- **Meer cryptomunten** en events
- **Sound effecten** voor acties
- **Achievements systeem**
- **Leaderboard** functionaliteit

## 🐛 Troubleshooting

### Camera Problemen
- Zorg dat browser camera toegang heeft
- Gebruik HTTPS voor camera functionaliteit
- Fallback naar simulatie modus beschikbaar

### Styling Issues
- Zorg dat Tailwind correct gecompileerd is
- Check browser support voor CSS custom properties
- Gebruik fallback kleuren voor oudere browsers

## 📄 Licentie
Dit project is gemaakt voor educatieve doeleinden.

---

**Veel plezier met CryptoClash! 🚀💎**
