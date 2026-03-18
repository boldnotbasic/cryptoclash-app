# 🔊 Geluidjes Toevoegen aan CryptoClash

## Probleem
De geluidjes werken niet omdat er nog geen echte MP3 bestanden zijn toegevoegd.

## Oplossing
Voeg de volgende MP3 bestanden toe aan de `public/sounds/` folder:

### 1. **positive.mp3** 
- **Wanneer:** Speelt af bij positieve events (Bull Run, crypto stijgt, +%)
- **Aanbeveling:** Vrolijk, kort geluidje (1-2 seconden)
- **Voorbeelden:** Munten rinkelen, "ding!", opwaartse toon

### 2. **negative.mp3**
- **Wanneer:** Speelt af bij negatieve events (Market Crash, crypto daalt, -%)
- **Aanbeveling:** Negatief, kort geluidje (1-2 seconden)
- **Voorbeelden:** "Buzzer", neerwaartse toon, "ohhh"

### 3. **background_music.mp3**
- **Wanneer:** Achtergrondmuziek voor Market Dashboard (loopt continu)
- **Aanbeveling:** Rustige, instrumentale muziek (2-5 minuten, loopt automatisch)
- **Volume:** Ingesteld op 30% zodat het niet te luid is
- **Toggle:** Kan aan/uit gezet worden via knop in Market Dashboard

## Waar te plaatsen
```
public/
  sounds/
    positive.mp3          ← Voeg hier je bestand toe
    negative.mp3          ← Voeg hier je bestand toe
    background_music.mp3  ← Voeg hier je bestand toe
```

## Gratis MP3 bronnen
- **Freesound.org** - Gratis sound effects
- **Pixabay.com/music** - Gratis muziek en geluiden
- **Zapsplat.com** - Gratis sound effects (registratie vereist)
- **Incompetech.com** - Gratis achtergrondmuziek

## Testen
1. Voeg de MP3 bestanden toe aan `public/sounds/`
2. Herstart de development server (`npm run dev`)
3. Open de browser console (F12)
4. Je zou moeten zien: `🔊 Sound system initialized`
5. Test een event (Kans actie) - je zou het geluidje moeten horen
6. Test background music via de Music toggle knop in Market Dashboard

## Debugging
Als geluiden niet werken:
1. Open browser console (F12)
2. Kijk naar error messages:
   - `❌ Failed to load positive.mp3` = bestand niet gevonden of corrupt
   - `Failed to play positive sound` = browser blokkeert autoplay
3. Sommige browsers blokkeren autoplay - klik eerst ergens op de pagina
4. Check of bestanden echt MP3 zijn (niet .txt of andere formaten)

## Code Locaties
- **Sound system:** `utils/soundEffects.ts`
- **Positief geluid:** Speelt af in `app/page.tsx` bij Bull Run en boost events
- **Negatief geluid:** Speelt af in `app/page.tsx` bij Market Crash en crash events
- **Background music:** Toggle knop in `components/MarketDashboard.tsx`
