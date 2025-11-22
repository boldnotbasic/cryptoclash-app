'use client'

interface HeaderProps {
  playerName: string
  playerAvatar: string
  onLogoClick?: () => void
}

export default function Header({ playerName, playerAvatar, onLogoClick }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8 p-4 crypto-card bg-gradient-to-r from-neon-purple/10 to-neon-blue/10">
      {/* Logo Links */}
      <div 
        className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={onLogoClick}
      >
        <img
          src="/cryptoclash-logo-horizontal.png"
          alt="CryptoClash"
          className="h-16 md:h-10"
        />
      </div>
      
      {/* User Info Rechts */}
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <p className="text-xl font-bold text-white">{playerName}</p>
        </div>
        <span className="text-3xl">{playerAvatar}</span>
      </div>
    </div>
  )
}
