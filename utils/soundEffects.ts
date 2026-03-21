// Sound effects utility - Uses your custom MP3 files from public/sounds/

// Sound file URLs
const SOUND_URLS = {
  positive: '/sounds/positive.mp3',
  negative: '/sounds/negative.mp3',
  forecast: '/sounds/forecast.mp3',
  background: '/sounds/background_music.mp3'
}

// Background music element (persistent)
let backgroundMusic: HTMLAudioElement | null = null

// MASTER sound toggle - controls ALL sounds (music + effects)
let masterSoundEnabled = false

// Initialize background music only
if (typeof window !== 'undefined') {
  try {
    backgroundMusic = new Audio(SOUND_URLS.background)
    backgroundMusic.loop = true
    backgroundMusic.volume = 0.3
    backgroundMusic.preload = 'auto'
    console.log('✅ Sound system initialized')
  } catch (error) {
    console.error('❌ Failed to initialize sound system:', error)
  }
}

// Helper: Play a one-shot sound effect
const playSoundEffect = (url: string, volume: number = 0.8) => {
  if (!masterSoundEnabled) {
    console.log('🔇 Sound muted - master toggle is OFF')
    return
  }
  
  try {
    const audio = new Audio(url)
    audio.volume = volume
    audio.play()
      .then(() => console.log(`🔊 Sound played: ${url}`))
      .catch(err => console.warn(`⚠️ Could not play sound: ${err.message}`))
  } catch (error) {
    console.error('❌ Error playing sound:', error)
  }
}

// Set master sound state (controls ALL sounds)
export const setMasterSoundEnabled = (enabled: boolean) => {
  console.log(`🔊 Master sound: ${enabled ? 'ON' : 'OFF'}`)
  masterSoundEnabled = enabled
  
  if (enabled) {
    // Start background music
    if (backgroundMusic) {
      backgroundMusic.play().catch(err => {
        console.warn('⚠️ Could not autoplay music:', err.message)
      })
    }
  } else {
    // Stop background music
    if (backgroundMusic) {
      backgroundMusic.pause()
      backgroundMusic.currentTime = 0
    }
  }
}

// Check if master sound is enabled
export const isMasterSoundEnabled = () => masterSoundEnabled

// Play positive sound (stijging)
export const playPositiveSound = (forceMuted: boolean = false) => {
  if (forceMuted) return
  playSoundEffect(SOUND_URLS.positive, 0.8)
}

// Play negative sound (daling)
export const playNegativeSound = (forceMuted: boolean = false) => {
  if (forceMuted) return
  playSoundEffect(SOUND_URLS.negative, 0.8)
}

// Play forecast sound (market forecast popup)
export const playForecastSound = () => {
  playSoundEffect(SOUND_URLS.forecast, 0.8)
}

// Play background music
export const playBackgroundMusic = () => {
  setMasterSoundEnabled(true)
}

// Pause background music
export const pauseBackgroundMusic = () => {
  setMasterSoundEnabled(false)
}

// Toggle all sounds
export const toggleBackgroundMusic = (isPlaying: boolean) => {
  setMasterSoundEnabled(isPlaying)
}

// Check if sounds are enabled
export const isBackgroundMusicPlaying = () => {
  return masterSoundEnabled
}

// Determine if event is positive based on keywords
export const isPositiveEvent = (effect: string): boolean => {
  const positiveKeywords = ['stijgt', 'boost', 'bull run', 'rally', 'gain', '+', 'omhoog', 'groei', 'winst']
  const negativeKeywords = ['daalt', 'crash', 'dip', 'market crash', 'verlies', '-', 'omlaag', 'daling']
  
  const lowerEffect = effect.toLowerCase()
  
  if (negativeKeywords.some(keyword => lowerEffect.includes(keyword))) {
    return false
  }
  
  if (positiveKeywords.some(keyword => lowerEffect.includes(keyword))) {
    return true
  }
  
  return false
}

// Play event sound based on effect type
export const playEventSound = (effect: string) => {
  if (isPositiveEvent(effect)) {
    playPositiveSound()
  } else {
    playNegativeSound()
  }
}
