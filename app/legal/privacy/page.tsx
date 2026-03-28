'use client'

import { ArrowLeft, Shield, Database, Lock, Eye, Mail } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
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
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-gray-400">Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Intro */}
        <section className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">Jouw Privacy is Belangrijk</h2>
          </div>
          <p className="text-gray-300 leading-relaxed">
            CryptoClash respecteert je privacy. Deze privacy policy legt uit welke gegevens we verzamelen, 
            hoe we ze gebruiken en welke rechten je hebt.
          </p>
        </section>

        {/* Welke gegevens verzamelen we */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold">Welke Gegevens Verzamelen We?</h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">Spelgegevens</h3>
              <ul className="space-y-1 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span><strong>Spelersnaam:</strong> De naam die je kiest bij het joinen van een spel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span><strong>Avatar:</strong> De emoji die je als avatar selecteert</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span><strong>Spelstatistieken:</strong> Je crypto-portfolio, cash, transacties en ranking tijdens het spel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span><strong>Kamercode:</strong> De unieke code van de spelkamer waarin je speelt</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Technische Gegevens</h3>
              <ul className="space-y-1 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span><strong>Sessie-informatie:</strong> Tijdelijke data om je verbinding met de spelserver te beheren</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span><strong>Browser-informatie:</strong> Type browser en apparaat (voor optimale weergave)</span>
                </li>
              </ul>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-4">
              <p className="text-sm text-green-400">
                ✓ We verzamelen <strong>geen</strong> persoonlijke identificeerbare informatie zoals e-mailadressen, telefoonnummers of adressen.
              </p>
            </div>
          </div>
        </section>

        {/* Hoe gebruiken we je gegevens */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold">Hoe Gebruiken We Je Gegevens?</h2>
          </div>
          <div className="space-y-3 text-gray-300 text-sm">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="font-semibold text-white mb-1">Spelervaring mogelijk maken</p>
                <p>Je naam en avatar worden getoond aan andere spelers in dezelfde kamer. Je spelstatistieken worden gebruikt om de ranking en marktdashboard bij te werken.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <p className="font-semibold text-white mb-1">Technische werking</p>
                <p>Sessie-informatie wordt gebruikt om je verbinding met de server te beheren en real-time updates mogelijk te maken.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <p className="font-semibold text-white mb-1">Verbetering van de app</p>
                <p>We kunnen anonieme spelstatistieken analyseren om bugs te vinden en de spelervaring te verbeteren.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Gegevensbewaring */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold">Hoe Lang Bewaren We Gegevens?</h2>
          </div>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>
              <strong className="text-white">Tijdens het spel:</strong> Je gegevens worden opgeslagen in het geheugen van de server zolang de spelkamer actief is.
            </p>
            <p>
              <strong className="text-white">Na het spel:</strong> Zodra een spelkamer wordt gesloten of alle spelers de kamer verlaten, worden alle spelgegevens automatisch verwijderd.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-3">
              <p className="text-blue-400">
                ℹ️ We bewaren <strong>geen</strong> permanente spelgeschiedenis of persoonlijke gegevens na afloop van een spel.
              </p>
            </div>
          </div>
        </section>

        {/* Delen met derden */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">Delen We Gegevens Met Derden?</h2>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 font-semibold mb-2">Nee, we delen geen gegevens met derden.</p>
            <p className="text-gray-300 text-sm">
              Je spelgegevens blijven binnen de CryptoClash app en worden niet verkocht, verhuurd of gedeeld met externe partijen, 
              adverteerders of data-brokers.
            </p>
          </div>
        </section>

        {/* Cookies */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">Cookies & Lokale Opslag</h2>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>
              CryptoClash gebruikt <strong className="text-white">lokale opslag</strong> in je browser om:
            </p>
            <ul className="space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Je taalvoorkeur te onthouden (NL/EN/FR)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Je spelernaam en avatar te bewaren voor toekomstige sessies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Je actieve spelkamer te onthouden als je de app herlaadt</span>
              </li>
            </ul>
            <p className="mt-3">
              Deze gegevens worden <strong className="text-white">alleen op jouw apparaat</strong> opgeslagen en kunnen door jou worden gewist via je browser-instellingen.
            </p>
          </div>
        </section>

        {/* Jouw rechten */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">Jouw Rechten</h2>
          <div className="space-y-2 text-gray-300 text-sm">
            <p>Je hebt het recht om:</p>
            <ul className="space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Je spelersnaam en avatar op elk moment te wijzigen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Een spelkamer te verlaten (je gegevens worden dan verwijderd)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Lokale opslag in je browser te wissen</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold">Vragen?</h2>
          </div>
          <p className="text-gray-300 text-sm">
            Heb je vragen over deze privacy policy of over hoe we met je gegevens omgaan? 
            Neem dan contact met ons op via <a href="mailto:privacy@cryptoclash.app" className="text-purple-400 hover:text-purple-300 underline">privacy@cryptoclash.app</a>
          </p>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <div className="flex items-center justify-center gap-4">
            <Link href="/legal/handleiding" className="hover:text-purple-400 transition-colors">
              Handleiding
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
