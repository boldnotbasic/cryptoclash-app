'use client'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-dark-card text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-neon-gold">Privacybeleid CryptoClash</h1>
        
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. Inleiding</h2>
            <p>
              Welkom bij CryptoClash. Wij respecteren uw privacy en zijn toegewijd aan het beschermen van uw persoonlijke gegevens. 
              Dit privacybeleid legt uit hoe wij uw persoonlijke informatie verzamelen, gebruiken, delen en beschermen wanneer u onze applicatie gebruikt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. Gegevensverzameling</h2>
            <h3 className="text-xl font-semibold text-neon-blue mb-2">2.1 Gegevens die wij verzamelen</h3>
            <p className="mb-3">Wij verzamelen de volgende soorten gegevens:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Accountgegevens:</strong> E-mailadres, wachtwoord (versleuteld), gebruikersnaam</li>
              <li><strong>Profielgegevens:</strong> Avatar-selectie, spelersnaam</li>
              <li><strong>Spelgegevens:</strong> Spelstatistieken, portfolio-informatie, transactiegeschiedenis binnen het spel</li>
              <li><strong>Technische gegevens:</strong> IP-adres, browsertype, apparaatinformatie, sessiegegevens</li>
              <li><strong>Betalingsgegevens:</strong> Abonnementsinformatie (verwerkt via Stripe)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. Gebruik van gegevens</h2>
            <p className="mb-3">Wij gebruiken uw gegevens voor de volgende doeleinden:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Het leveren en verbeteren van onze diensten</li>
              <li>Het beheren van uw account en authenticatie</li>
              <li>Het verwerken van abonnementen en betalingen</li>
              <li>Het personaliseren van uw spelervaring</li>
              <li>Het verzenden van belangrijke mededelingen over de service</li>
              <li>Het analyseren van gebruik om de app te verbeteren</li>
              <li>Het waarborgen van de veiligheid en integriteit van onze diensten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">4. Gegevensdeling</h2>
            <p className="mb-3">Wij delen uw gegevens alleen in de volgende gevallen:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Dienstverleners:</strong> Wij werken samen met Supabase (database en authenticatie) en Stripe (betalingsverwerking)</li>
              <li><strong>Wettelijke verplichtingen:</strong> Wanneer dit wettelijk verplicht is of noodzakelijk is om onze rechten te beschermen</li>
              <li><strong>Met uw toestemming:</strong> In andere gevallen alleen met uw expliciete toestemming</li>
            </ul>
            <p className="mt-3">
              <strong>Wij verkopen uw persoonlijke gegevens nooit aan derden.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">5. Gegevensbeveiliging</h2>
            <p>
              Wij nemen de beveiliging van uw gegevens serieus en implementeren passende technische en organisatorische maatregelen:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
              <li>Wachtwoorden worden versleuteld opgeslagen met bcrypt hashing</li>
              <li>Communicatie verloopt via beveiligde HTTPS-verbindingen</li>
              <li>Toegang tot gegevens is beperkt tot geautoriseerd personeel</li>
              <li>Regelmatige beveiligingsupdates en monitoring</li>
              <li>Betalingsgegevens worden veilig verwerkt door Stripe (PCI-DSS compliant)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">6. Cookies en tracking</h2>
            <p className="mb-3">
              Wij gebruiken cookies en vergelijkbare technologieën voor:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Sessiemanagement en authenticatie</li>
              <li>Het onthouden van uw voorkeuren</li>
              <li>Analyse van gebruik en prestaties</li>
            </ul>
            <p className="mt-3">
              U kunt cookies beheren via uw browserinstellingen, maar dit kan de functionaliteit van de app beperken.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">7. Uw rechten</h2>
            <p className="mb-3">Onder de AVG (Algemene Verordening Gegevensbescherming) heeft u de volgende rechten:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Recht op inzage:</strong> U kunt opvragen welke gegevens wij van u hebben</li>
              <li><strong>Recht op rectificatie:</strong> U kunt onjuiste gegevens laten corrigeren</li>
              <li><strong>Recht op verwijdering:</strong> U kunt verzoeken uw gegevens te verwijderen</li>
              <li><strong>Recht op beperking:</strong> U kunt de verwerking van uw gegevens beperken</li>
              <li><strong>Recht op dataportabiliteit:</strong> U kunt uw gegevens in een gestructureerd formaat ontvangen</li>
              <li><strong>Recht van bezwaar:</strong> U kunt bezwaar maken tegen bepaalde verwerkingen</li>
            </ul>
            <p className="mt-3">
              Om deze rechten uit te oefenen, kunt u contact met ons opnemen via de onderstaande contactgegevens.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">8. Gegevensbewaring</h2>
            <p>
              Wij bewaren uw gegevens zolang uw account actief is of zolang nodig is om onze diensten te leveren. 
              Na verwijdering van uw account worden uw persoonlijke gegevens binnen 30 dagen permanent verwijderd, 
              tenzij wij wettelijk verplicht zijn deze langer te bewaren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">9. Kinderen</h2>
            <p>
              Onze dienst is niet gericht op kinderen onder de 16 jaar. Wij verzamelen niet bewust persoonlijke gegevens 
              van kinderen onder de 16. Als u ontdekt dat een kind onder de 16 ons persoonlijke gegevens heeft verstrekt, 
              neem dan contact met ons op zodat wij passende actie kunnen ondernemen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">10. Internationale gegevensoverdracht</h2>
            <p>
              Uw gegevens kunnen worden opgeslagen en verwerkt in landen buiten de Europese Economische Ruimte (EER). 
              In dergelijke gevallen zorgen wij ervoor dat passende waarborgen zijn getroffen om uw gegevens te beschermen 
              in overeenstemming met de AVG.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">11. Wijzigingen in dit privacybeleid</h2>
            <p>
              Wij kunnen dit privacybeleid van tijd tot tijd bijwerken. Wijzigingen worden op deze pagina gepubliceerd 
              met een bijgewerkte datum. Wij raden u aan dit privacybeleid regelmatig te controleren. 
              Belangrijke wijzigingen zullen wij u per e-mail melden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">12. Contact</h2>
            <p className="mb-3">
              Voor vragen over dit privacybeleid of over hoe wij uw gegevens verwerken, kunt u contact met ons opnemen:
            </p>
            <div className="bg-dark-card/50 p-4 rounded-lg border border-neon-gold/20">
              <p><strong>E-mail:</strong> privacy@cryptoclash.app</p>
              <p><strong>Website:</strong> www.cryptoclash.app</p>
            </div>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              <strong>Laatste update:</strong> {new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/"
            className="inline-block px-6 py-3 bg-neon-gold text-dark-bg font-bold rounded-lg hover:bg-neon-gold/80 transition-colors"
          >
            Terug naar CryptoClash
          </a>
        </div>
      </div>
    </div>
  )
}
