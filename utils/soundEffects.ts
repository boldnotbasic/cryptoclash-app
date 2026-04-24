// Sound effects utility - Uses your custom MP3 files from public/sounds/

// Sound file URLs
const SOUND_URLS = {
  positive: '/sounds/positive.mp3',
  negative: '/sounds/negative.mp3',
  forecast: '/sounds/forecast.mp3',
  war: '/sounds/oorlog.mp3',
  peace: '/sounds/vrede.mp3',
  background: '/sounds/background_music.mp3'
}

// Background music element (persistent)
let backgroundMusic: HTMLAudioElement | null = null

// Separate controls for background music and sound effects
let backgroundMusicEnabled = false
let soundEffectsEnabled = true

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
  if (!soundEffectsEnabled) {
    console.log('🔇 Sound effects muted')
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

// Set background music state
export const setBackgroundMusicEnabled = (enabled: boolean) => {
  console.log(`🎵 Background music: ${enabled ? 'ON' : 'OFF'}`)
  backgroundMusicEnabled = enabled
  
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

// Set sound effects state
export const setSoundEffectsEnabled = (enabled: boolean) => {
  console.log(`🔊 Sound effects: ${enabled ? 'ON' : 'OFF'}`)
  soundEffectsEnabled = enabled
}

// Check if background music is enabled
export const isBackgroundMusicEnabled = () => backgroundMusicEnabled

// Check if sound effects are enabled
export const areSoundEffectsEnabled = () => soundEffectsEnabled

// Play positive sound (stijging)
export const playPositiveSound = () => {
  playSoundEffect(SOUND_URLS.positive, 0.8)
}

// Play negative sound (daling)
export const playNegativeSound = () => {
  playSoundEffect(SOUND_URLS.negative, 0.8)
}

// Play forecast sound (market forecast popup)
export const playForecastSound = () => {
  playSoundEffect(SOUND_URLS.forecast, 0.8)
}

// Play war sound (war event triggered)
export const playWarSound = () => {
  playSoundEffect(SOUND_URLS.war, 0.8)
}

// Play peace sound (peace event triggered)
export const playPeaceSound = () => {
  playSoundEffect(SOUND_URLS.peace, 0.8)
}

// Play background music
export const playBackgroundMusic = () => {
  setBackgroundMusicEnabled(true)
}

// Pause background music
export const pauseBackgroundMusic = () => {
  setBackgroundMusicEnabled(false)
}

// Toggle background music
export const toggleBackgroundMusic = (isPlaying: boolean) => {
  setBackgroundMusicEnabled(isPlaying)
}

// Check if background music is playing
export const isBackgroundMusicPlaying = () => {
  return backgroundMusicEnabled
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

// Play event sound based on percentage value (more reliable than parsing text)
// Use this when you have the percentage directly - it's 100% accurate
export const playEventSoundByPercentage = (percentage: number | undefined | null) => {
  if (percentage === undefined || percentage === null || percentage === 0) {
    // Fallback: no percentage info, play positive by default
    playPositiveSound()
    return
  }
  if (percentage > 0) {
    playPositiveSound()
  } else {
    playNegativeSound()
  }
}
