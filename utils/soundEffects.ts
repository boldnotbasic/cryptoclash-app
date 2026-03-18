// Sound effects utility - Uses your custom MP3 files from public/sounds/

let positiveAudio: HTMLAudioElement | null = null
let negativeAudio: HTMLAudioElement | null = null
let backgroundMusic: HTMLAudioElement | null = null

// Initialize audio elements
if (typeof window !== 'undefined') {
  try {
    console.log('🔊 Initializing sound system with your MP3 files...')
    
    // Create audio elements with full URLs for debugging
    const positiveUrl = '/sounds/positive.mp3'
    const negativeUrl = '/sounds/negative.mp3'
    const backgroundUrl = '/sounds/background_music.mp3'
    
    console.log('🎵 Loading sounds from:')
    console.log(`   Positive: ${window.location.origin}${positiveUrl}`)
    console.log(`   Negative: ${window.location.origin}${negativeUrl}`)
    console.log(`   Background: ${window.location.origin}${backgroundUrl}`)
    
    positiveAudio = new Audio(positiveUrl)
    negativeAudio = new Audio(negativeUrl)
    backgroundMusic = new Audio(backgroundUrl)
    
    // Configure audio elements
    positiveAudio.volume = 0.5
    negativeAudio.volume = 0.5
    
    if (backgroundMusic) {
      backgroundMusic.loop = true
      backgroundMusic.volume = 0.3
    }
    
    // Add comprehensive error handlers
    positiveAudio.addEventListener('error', (e) => {
      console.error('❌ Failed to load positive.mp3:', e)
      console.log('   URL attempted:', `${window.location.origin}${positiveUrl}`)
      console.log('   Check if file exists at: public/sounds/positive.mp3')
      
      // Try to fetch the file to see if it exists
      fetch(positiveUrl)
        .then(response => {
          console.log('🔍 Fetch response for positive.mp3:', response.status, response.statusText)
        })
        .catch(err => {
          console.log('🔍 Fetch failed for positive.mp3:', err)
        })
    })
    
    negativeAudio.addEventListener('error', (e) => {
      console.error('❌ Failed to load negative.mp3:', e)
      console.log('   URL attempted:', `${window.location.origin}${negativeUrl}`)
      console.log('   Check if file exists at: public/sounds/negative.mp3')
      
      fetch(negativeUrl)
        .then(response => {
          console.log('🔍 Fetch response for negative.mp3:', response.status, response.statusText)
        })
        .catch(err => {
          console.log('🔍 Fetch failed for negative.mp3:', err)
        })
    })
    
    backgroundMusic.addEventListener('error', (e) => {
      console.error('❌ Failed to load background_music.mp3:', e)
      console.log('   URL attempted:', `${window.location.origin}${backgroundUrl}`)
      console.log('   Check if file exists at: public/sounds/background_music.mp3')
      
      fetch(backgroundUrl)
        .then(response => {
          console.log('🔍 Fetch response for background_music.mp3:', response.status, response.statusText)
        })
        .catch(err => {
          console.log('🔍 Fetch failed for background_music.mp3:', err)
        })
    })
    
    // Success handlers
    positiveAudio.addEventListener('canplaythrough', () => {
      console.log('✅ Positive sound loaded successfully')
    })
    
    negativeAudio.addEventListener('canplaythrough', () => {
      console.log('✅ Negative sound loaded successfully')
    })
    
    backgroundMusic.addEventListener('canplaythrough', () => {
      console.log('✅ Background music loaded successfully')
    })
    
    console.log('🔊 Sound system initialized with custom MP3 files')
  } catch (error) {
    console.error('❌ Failed to initialize sound system:', error)
  }
}

// Play positive sound (only if music is enabled)
export const playPositiveSound = (forceMuted: boolean = false) => {
  if (forceMuted || !backgroundMusic || backgroundMusic.paused) {
    console.log('🔇 Sound muted (music toggle OFF)')
    return
  }

  if (!positiveAudio) {
    console.warn('⚠️ Positive audio not initialized')
    return
  }

  try {
    console.log('🎵 Playing POSITIVE sound (your custom MP3)')
    positiveAudio.currentTime = 0 // Reset to start
    positiveAudio.play().catch(err => {
      console.error('❌ Failed to play positive sound:', err)
      console.log('   Tip: Some browsers block autoplay. Click somewhere first.')
    })
  } catch (error) {
    console.error('❌ Error playing positive sound:', error)
  }
}

// Play negative sound (only if music is enabled)
export const playNegativeSound = (forceMuted: boolean = false) => {
  if (forceMuted || !backgroundMusic || backgroundMusic.paused) {
    console.log('🔇 Sound muted (music toggle OFF)')
    return
  }

  if (!negativeAudio) {
    console.warn('⚠️ Negative audio not initialized')
    return
  }

  try {
    console.log('🔻 Playing NEGATIVE sound (your custom MP3)')
    negativeAudio.currentTime = 0 // Reset to start
    negativeAudio.play().catch(err => {
      console.error('❌ Failed to play negative sound:', err)
      console.log('   Tip: Some browsers block autoplay. Click somewhere first.')
    })
  } catch (error) {
    console.error('❌ Error playing negative sound:', error)
  }
}

// Play background music
export const playBackgroundMusic = () => {
  if (!backgroundMusic) {
    console.warn('⚠️ Background music not initialized')
    return
  }

  try {
    console.log('🎶 Starting background music (your custom MP3)')
    backgroundMusic.play().catch(err => {
      console.error('❌ Failed to play background music:', err)
      console.log('   Tip: Some browsers block autoplay. Click somewhere first.')
    })
  } catch (error) {
    console.error('❌ Error playing background music:', error)
  }
}

// Pause background music
export const pauseBackgroundMusic = () => {
  if (!backgroundMusic) {
    return
  }

  try {
    console.log('⏸️ Pausing background music')
    backgroundMusic.pause()
  } catch (error) {
    console.error('❌ Failed to pause background music:', error)
  }
}

// Toggle background music
export const toggleBackgroundMusic = (isPlaying: boolean) => {
  if (isPlaying) {
    playBackgroundMusic()
  } else {
    pauseBackgroundMusic()
  }
}

// Check if background music is playing
export const isBackgroundMusicPlaying = () => {
  return backgroundMusic ? !backgroundMusic.paused : false
}

// Determine if event is positive
export const isPositiveEvent = (effect: string): boolean => {
  const positiveKeywords = ['stijgt', 'boost', 'bull run', 'rally', 'gain', '+', 'omhoog', 'groei']
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
