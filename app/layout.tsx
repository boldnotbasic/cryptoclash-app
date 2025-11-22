import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/contexts/AppContext'

export const metadata: Metadata = {
  title: 'CryptoClash - Bordspel met Digitale Interactie',
  description: 'Innovatief bordspel gecombineerd met een webgame waarin spelers strijden om de grootste cryptovermogens.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <head>
        <meta name="theme-color" content="#8B5CF6" />
      </head>
      <body className="min-h-screen bg-dark-bg">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
