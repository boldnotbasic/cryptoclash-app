'use client'

import { ArrowLeft, FileText, AlertTriangle, Scale, Users, Shield } from 'lucide-react'
import Link from 'next/link'

export default function VoorwaardenPage() {
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
            <h1 className="text-2xl font-bold">Algemene Voorwaarden</h1>
            <p className="text-sm text-gray-400">Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Intro */}
        <section className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">Welkom bij CryptoClash</h2>
          </div>
          <p className="text-gray-300 leading-relaxed text-sm">
            Door CryptoClash te gebruiken, ga je akkoord met deze algemene voorwaarden. 
            Lees ze zorgvuldig door voordat je begint met spelen.
          </p>
        </section>

        {/* Acceptatie */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold">1. Acceptatie van Voorwaarden</h2>
          </div>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>
              Door CryptoClash te openen, een spelkamer aan te maken of deel te nemen aan een spel, 
              bevestig je dat je deze algemene voorwaarden hebt gelezen, begrepen en geaccepteerd.
            </p>
            <p>
              Als je niet akkoord gaat met deze voorwaarden, mag je de applicatie niet gebruiken.
            </p>
          </div>
        </section>

        {/* Gebruik van de app */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold">2. Gebruik van de Applicatie</h2>
          </div>
          <div className="space-y-4 text-gray-300 text-sm">
            <div>
              <h3 className="font-semibold text-white mb-2">2.1 Toegestaan Gebruik</h3>
              <p>CryptoClash is bedoeld voor entertainment en educatieve doeleinden. Je mag de app gebruiken om:</p>
              <ul className="space-y-1 ml-4 mt-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Spellen te organiseren en te spelen met vrienden of familie</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>De spelregels en handleiding te raadplegen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Je spelstatistieken tijdens een actieve sessie te bekijken</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">2.2 Verboden Gebruik</h3>
              <p>Het is niet toegestaan om:</p>
              <ul className="space-y-1 ml-4 mt-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>De app te gebruiken voor illegale doeleinden</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Aanstootgevende, beledigende of discriminerende namen of avatars te gebruiken</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>De app te hacken, reverse-engineeren of te manipuleren</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Andere spelers te intimideren, lastig te vallen of te misleiden</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>De server te overbelasten of te verstoren</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Geen echt geld */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold">3. Geen Echt Geld of Waarde</h2>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 font-semibold mb-2">Belangrijke Mededeling</p>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                CryptoClash is een <strong className="text-white">fictief bordspel</strong>. Alle crypto's, cash en transacties in het spel zijn 
                <strong className="text-white"> virtueel en hebben geen echte waarde</strong>.
              </p>
              <p>
                Je kunt <strong className="text-white">geen echt geld winnen of verliezen</strong> door CryptoClash te spelen. 
                Het spel is puur voor entertainment en heeft geen connectie met echte cryptocurrency-markten.
              </p>
              <p>
                CryptoClash is <strong className="text-white">geen financieel advies</strong> en mag niet worden gebruikt als basis voor echte investeringsbeslissingen.
              </p>
            </div>
          </div>
        </section>

        {/* Intellectueel eigendom */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">4. Intellectueel Eigendom</h2>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>
              Alle rechten op CryptoClash, inclusief maar niet beperkt tot de code, design, logo's, afbeeldingen, 
              teksten en spelconcepten, zijn eigendom van de makers van CryptoClash.
            </p>
            <p>
              Je mag de app gebruiken voor persoonlijk, niet-commercieel gebruik. 
              Het is niet toegestaan om delen van de app te kopiëren, distribueren of commercieel te exploiteren zonder schriftelijke toestemming.
            </p>
          </div>
        </section>

        {/* Aansprakelijkheid */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">5. Aansprakelijkheid</h2>
          </div>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>
              CryptoClash wordt aangeboden "as is" zonder enige garantie. We doen ons best om een stabiele en foutloze ervaring te bieden, 
              maar we kunnen niet garanderen dat de app altijd beschikbaar of foutloos is.
            </p>
            <p>
              We zijn <strong className="text-white">niet aansprakelijk</strong> voor:
            </p>
            <ul className="space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Technische storingen, bugs of onderbrekingen van de service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Verlies van speldata als gevolg van server-problemen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Gedrag van andere spelers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Schade aan je apparaat of internetverbinding</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Wijzigingen */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">6. Wijzigingen aan de Voorwaarden</h2>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>
              We behouden ons het recht voor om deze algemene voorwaarden op elk moment te wijzigen. 
              Wijzigingen worden van kracht zodra ze op deze pagina worden gepubliceerd.
            </p>
            <p>
              Het is jouw verantwoordelijkheid om deze voorwaarden regelmatig te controleren. 
              Door de app te blijven gebruiken na wijzigingen, ga je akkoord met de aangepaste voorwaarden.
            </p>
          </div>
        </section>

        {/* Beëindiging */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">7. Beëindiging van Toegang</h2>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>
              We behouden ons het recht voor om je toegang tot CryptoClash te beëindigen of te beperken als je:
            </p>
            <ul className="space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Deze algemene voorwaarden schendt</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Misbruik maakt van de app</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Andere spelers lastigvalt of de spelervaring verstoort</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Toepasselijk recht */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">8. Toepasselijk Recht</h2>
          <div className="text-gray-300 text-sm">
            <p>
              Op deze algemene voorwaarden is het Belgisch recht van toepassing. 
              Eventuele geschillen zullen worden voorgelegd aan de bevoegde rechtbank in België.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">Contact</h2>
          <p className="text-gray-300 text-sm">
            Heb je vragen over deze algemene voorwaarden? 
            Neem contact met ons op via <a href="mailto:info@cryptoclash.app" className="text-purple-400 hover:text-purple-300 underline">info@cryptoclash.app</a>
          </p>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <div className="flex items-center justify-center gap-4">
            <Link href="/legal/handleiding" className="hover:text-purple-400 transition-colors">
              Handleiding
            </Link>
            <span>•</span>
            <Link href="/legal/privacy" className="hover:text-purple-400 transition-colors">
              Privacy Policy
            </Link>
          </div>
          <p className="mt-3 text-xs">© {new Date().getFullYear()} CryptoClash. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </div>
  )
}
