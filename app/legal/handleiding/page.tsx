'use client'

import { ArrowLeft, Users, Smartphone, Coins, TrendingUp, Dices, Trophy } from 'lucide-react'
import Link from 'next/link'

export default function HandleidingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link 
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Handleiding</h1>
            <p className="text-sm text-gray-400">Hoe speel je CryptoClash?</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Intro */}
        <section className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">Welkom bij CryptoClash!</h2>
          <p className="text-gray-300 leading-relaxed">
            CryptoClash is een innovatief bordspel gecombineerd met een digitale app waarin je strijdt om de grootste cryptovermogens op te bouwen. 
            Handel slim, voorspel marktbewegingen en gebruik strategische acties om je tegenstanders voor te blijven.
          </p>
        </section>

        {/* Spelvoorbereiding */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">Spelvoorbereiding</h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <p className="font-semibold text-white mb-1">Host maakt een kamer aan</p>
                <p className="text-sm">De gastheer kiest "Nieuw Spel", stelt het aantal rondes, startkapitaal en volatiliteit in, en krijgt een unieke kamercode.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <p className="font-semibold text-white mb-1">Spelers joinen via QR-code of kamercode</p>
                <p className="text-sm">Scan de QR-code of voer de 6-cijferige kamercode in. Kies je naam en avatar.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <p className="font-semibold text-white mb-1">Host start het spel</p>
                <p className="text-sm">Zodra alle spelers klaar zijn, klikt de host op "Start Spel".</p>
              </div>
            </div>
          </div>
        </section>

        {/* Spelverloop */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Dices className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold">Spelverloop</h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <span className="text-purple-400">→</span> Dobbelsteenworp
              </h3>
              <p className="text-sm">Elke beurt gooi je de dobbelsteen. Het aantal ogen bepaalt hoeveel vakjes je vooruit gaat op het bord.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <span className="text-purple-400">→</span> Vaktype bepaalt je actie
              </h3>
              <ul className="text-sm space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span><strong className="text-white">Koop-vak:</strong> Koop crypto met je beschikbare cash</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span><strong className="text-white">Verkoop-vak:</strong> Verkoop je crypto voor cash</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span><strong className="text-white">Kans-vak:</strong> Trek een kanskaart — dit kan een marktgebeurtenis triggeren (Bull Run, Bear Market, Whale Alert...)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span><strong className="text-white">Scan-vak:</strong> Scan een QR-code op het bord voor speciale acties of events</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <span className="text-purple-400">→</span> Marktbewegingen
              </h3>
              <p className="text-sm">Crypto-prijzen fluctueren elke ronde. Let op de markt-dashboard om trends te spotten en slim te handelen.</p>
            </div>
          </div>
        </section>

        {/* Acties & Events */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold">Acties & Events</h2>
          </div>
          <div className="space-y-3 text-gray-300">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="font-semibold text-green-400 mb-1">🐂 Bull Run</p>
              <p className="text-sm">Alle crypto's stijgen met een bepaald percentage. Ideaal moment om te verkopen!</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="font-semibold text-red-400 mb-1">🐻 Bear Market</p>
              <p className="text-sm">Alle crypto's dalen met 10%. Wacht met verkopen of koop juist bij de dip.</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="font-semibold text-blue-400 mb-1">🐋 Whale Alert</p>
              <p className="text-sm">Een grote speler beïnvloedt de markt — specifieke crypto's krijgen een boost of crash.</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <p className="font-semibold text-purple-400 mb-1">🔮 Market Forecast</p>
              <p className="text-sm">Krijg een voorspelling over welke crypto's waarschijnlijk zullen stijgen of dalen.</p>
            </div>
          </div>
        </section>

        {/* Winnen */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold">Hoe win je?</h2>
          </div>
          <div className="space-y-3 text-gray-300">
            <p>
              Aan het einde van het spel (na het ingestelde aantal rondes) wordt je <strong className="text-white">totale vermogen</strong> berekend:
            </p>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-center text-lg font-mono">
                <span className="text-purple-400">Totaal Vermogen</span> = 
                <span className="text-green-400"> Cash</span> + 
                <span className="text-blue-400"> Crypto Waarde</span>
              </p>
            </div>
            <p>
              De speler met het <strong className="text-yellow-400">hoogste totale vermogen</strong> wint het spel! 🏆
            </p>
          </div>
        </section>

        {/* Tips */}
        <section className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Coins className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold">Strategische Tips</h2>
          </div>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">💡</span>
              <span>Diversifieer je portfolio — investeer niet alles in één crypto</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">💡</span>
              <span>Let op de markt-dashboard om trends te herkennen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">💡</span>
              <span>Verkoop tijdens een Bull Run, koop tijdens een Bear Market</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">💡</span>
              <span>Gebruik Market Forecasts om vooruit te plannen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">💡</span>
              <span>Hou altijd wat cash achter de hand voor koopmogelijkheden</span>
            </li>
          </ul>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>Veel plezier met CryptoClash! 🚀</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link href="/legal/privacy" className="hover:text-purple-400 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/legal/voorwaarden" className="hover:text-purple-400 transition-colors">
              Algemene Voorwaarden
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
