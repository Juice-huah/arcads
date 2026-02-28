import { useRef } from 'react'

function buildAudio() {
  let ctx = null
  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    return ctx
  }
  const tone = (freq, dur, type = 'sine', vol = 0.22, delay = 0) => {
    try {
      const c = getCtx()
      const o = c.createOscillator()
      const g = c.createGain()
      o.connect(g)
      g.connect(c.destination)
      o.type = type
      o.frequency.value = freq
      g.gain.setValueAtTime(0, c.currentTime + delay)
      g.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.01)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur)
      o.start(c.currentTime + delay)
      o.stop(c.currentTime + delay + dur)
    } catch (_) {}
  }
  return {
    type:    () => tone(900, 0.04, 'square', 0.06),
    correct: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'sine', 0.18, i * 0.09)),
    wrong:   () => { tone(220, 0.25, 'sawtooth', 0.14); tone(190, 0.25, 'sawtooth', 0.1, 0.15) },
    area:    () => [523, 587, 659, 784, 880, 1047].forEach((f, i) => tone(f, 0.4, 'sine', 0.2, i * 0.1)),
    victory: () => [523,523,784,784,880,880,784,659,659,587,587,523].forEach((f,i) => tone(f, 0.45, 'sine', 0.22, i * 0.18)),
  }
}

export function useAudio() {
  const ref = useRef(null)
  if (!ref.current) ref.current = buildAudio()
  return ref.current
}
