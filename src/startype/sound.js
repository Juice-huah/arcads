// Synthesized sounds using Web Audio API — no audio files required!
let ctx = null

function getCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      return null
    }
  }
  // Resume context (needed after user gesture)
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone({ freq = 440, type = 'sine', duration = 0.15, gain = 0.3,
  freqEnd = null, gainEnd = 0, startDelay = 0 } = {}) {
  const c = getCtx()
  if (!c) return
  const now = c.currentTime + startDelay
  const osc = c.createOscillator()
  const gainNode = c.createGain()
  osc.connect(gainNode)
  gainNode.connect(c.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration)
  gainNode.gain.setValueAtTime(gain, now)
  gainNode.gain.exponentialRampToValueAtTime(Math.max(gainEnd, 0.001), now + duration)
  osc.start(now)
  osc.stop(now + duration + 0.01)
}

function playNoise({ duration = 0.1, gain = 0.15, startDelay = 0 } = {}) {
  const c = getCtx()
  if (!c) return
  const bufferSize = c.sampleRate * duration
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
  const source = c.createBufferSource()
  source.buffer = buffer
  const gainNode = c.createGain()
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 800
  source.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(c.destination)
  const now = c.currentTime + startDelay
  gainNode.gain.setValueAtTime(gain, now)
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)
  source.start(now)
  source.stop(now + duration + 0.01)
}

const SOUNDS = {
  shoot: () => {
    // Laser zap: descending high frequency
    playTone({ freq: 1200, freqEnd: 300, type: 'sawtooth', duration: 0.12, gain: 0.25 })
    playTone({ freq: 800, freqEnd: 200, type: 'square', duration: 0.1, gain: 0.1 })
  },
  explode: () => {
    // Explosion: noise burst + low thud
    playNoise({ duration: 0.25, gain: 0.35 })
    playTone({ freq: 120, freqEnd: 40, type: 'sine', duration: 0.3, gain: 0.4 })
    playTone({ freq: 80, freqEnd: 30, type: 'sine', duration: 0.2, gain: 0.2, startDelay: 0.05 })
  },
  miss: () => {
    // Miss: sad descending tones
    playTone({ freq: 300, freqEnd: 150, type: 'square', duration: 0.2, gain: 0.2 })
    playTone({ freq: 250, freqEnd: 120, type: 'square', duration: 0.25, gain: 0.15, startDelay: 0.1 })
    playNoise({ duration: 0.1, gain: 0.1 })
  },
  wave: () => {
    // Wave up: ascending arpeggio
    [0, 0.08, 0.16, 0.24].forEach((delay, i) => {
      playTone({ freq: [440, 550, 660, 880][i], type: 'sine', duration: 0.18, gain: 0.15, startDelay: delay })
    })
  },
  keypress: () => {
    // Soft click
    playTone({ freq: 600, freqEnd: 500, type: 'sine', duration: 0.04, gain: 0.06 })
  },
}

export function playSound(name) {
  try {
    SOUNDS[name]?.()
  } catch (e) {
    // Silently fail if audio context unavailable
  }
}
