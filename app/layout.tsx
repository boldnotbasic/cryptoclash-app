import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/contexts/AppContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { IconProvider } from '@/contexts/IconContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'

export const metadata: Metadata = {
  title: 'Battle For Bloom - Crypto boardgame',
  description: 'Innovatief bordspel gecombineerd met een webgame waarin spelers strijden om de grootste cryptovermogens.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon_cryptoyclash.png',
    shortcut: '/favicon_cryptoyclash.png',
    apple: '/favicon_cryptoyclash.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#8B5CF6" />
      </head>
      <body className="min-h-screen bg-dark-bg" suppressHydrationWarning>
        <CurrencyProvider>
          <IconProvider>
            <LanguageProvider>
              <AppProvider>
                {children}
              </AppProvider>
            </LanguageProvider>
          </IconProvider>
        </CurrencyProvider>
      </body>
    </html>
  )
}
