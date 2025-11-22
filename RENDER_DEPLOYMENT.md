# CryptoClash - Render Deployment Guide

## ✅ Pre-Deployment Checklist

Dit project is nu volledig geoptimaliseerd voor Render deployment!

### Wat is er klaar:

- ✅ Health check endpoint: `/api/health`
- ✅ Socket.IO configuratie voor Render's proxy
- ✅ Automatic polling → websocket upgrade
- ✅ XHR poll error fallback
- ✅ Next.js production build
- ✅ Environment variables geconfigureerd
- ✅ Proper error logging

## 🚀 Deployment Stappen

### 1. Render Account Setup

1. Ga naar [render.com](https://render.com)
2. Sign up of login met je GitHub account
3. Klik "New +" → "Web Service"

### 2. Repository Connectie

1. Selecteer je `cryptoclash-app` repository
2. Render detecteert automatisch `render.yaml` ✅
3. Controleer deze settings:
   - **Name**: `cryptoclash-app`
   - **Region**: `Frankfurt` (EU, snelst voor jou)
   - **Branch**: `main`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `node server.js`
   - **Plan**: Free

### 3. Environment Variables

Deze zijn al geconfigureerd in `render.yaml`:
- `NODE_ENV`: `production`

### 4. Deploy!

1. Klik "Create Web Service"
2. Wacht 5-10 minuten voor de eerste build
3. Status moet "Live" worden

### 5. Verify Deployment

Check deze URLs (vervang met je Render URL):

#### Health Check
```
https://cryptoclash-app.onrender.com/api/health
```

Verwacht response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-22T17:00:00.000Z",
  "connections": 0,
  "rooms": 1,
  "uptime": 120
}
```

#### App Homepage
```
https://cryptoclash-app.onrender.com
```

Je moet de CryptoClash login/lobby screen zien.

## 📱 Testing

### Desktop (Host):
1. Open `https://cryptoclash-app.onrender.com`
2. Klik "Host Spel"
3. Vul je naam in
4. Klik "Start Lobby"
5. Noteer de lobby code (bijv. `ABC123`)

### Mobile (Player):
1. Open `https://cryptoclash-app.onrender.com` op je telefoon
2. Klik "Join Lobby"
3. Vul de lobby code in
4. Vul je naam in
5. Klik "Join"

**Verwacht resultaat**: "Verbonden" (geen "xhr poll error")!

## 🔧 Troubleshooting

### Build fails met dependency errors:
```bash
# Lokaal:
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
git add package-lock.json
git commit -m "Update lock file"
git push
```

### Socket.IO verbinding faalt:
1. Check Render logs: Dashboard → "Logs" tab
2. Zoek naar: `✅ Socket.IO initialized`
3. Bij mobile join, zoek naar: `🎉 === NEW CONNECTION ===`

Als je NIET ziet dat er verbindingen binnenkomen:
- Check of Web Sockets enabled zijn in Render Settings
- Probeer Manual Deploy → Clear build cache

### "Your free instance will spin down...":
Dit is normaal voor Render Free tier. Eerste request duurt 50 seconden (cold start).
Vervolgens werkt alles snel.

## 📊 Monitoring

### Render Logs
Real-time logs zie je in Dashboard → Logs tab.

Belangrijke log entries:
```
🚀 CryptoClash Server Successfully Started!
🔌 Socket.IO: Enabled (polling → websocket)
🎮 Ready to accept players!
```

Bij player join:
```
🎉 === NEW CONNECTION ===
🔌 Socket ID: abc123
🌐 Transport: polling
📍 Remote address: 1.2.3.4
```

### Health Check Monitoring
Gebruik de health check URL om te monitoren:
```bash
curl https://cryptoclash-app.onrender.com/api/health
```

## 🎯 Performance Tips

### Cold Starts
- Free tier spin down na 15 min inactiviteit
- Eerste request daarna duurt ~50 sec
- Oplossing: upgrade naar Starter ($7/maand) voor 24/7 uptime

### Socket.IO Performance
- Polling is stabiel maar iets trager dan websocket
- Na eerste succesvolle verbinding upgrade automatisch naar websocket
- Mobile devices blijven vaak op polling (firewall/proxy restrictions)

## 🔐 Security Notes

Voor production (als je met echte users gaat):

1. Update CORS in `server.js`:
```javascript
cors: {
  origin: "https://cryptoclash-app.onrender.com", // Specifieke origin
  methods: ["GET", "POST"],
  credentials: true
}
```

2. Add rate limiting voor lobby creation
3. Add authentication voor admin features

## 🆘 Support

Als er nog problemen zijn na deployment:

1. Check Render logs
2. Check browser console (F12)
3. Stuur screenshots van beide
4. Include de error messages

## 🎉 Success!

Als je lobby kunt starten op desktop en kunt joinen op mobile, dan werkt alles!

**Geniet van je live CryptoClash app! 🚀**
