import { useState } from 'react'

const CUTSCENE = [
  "Once, the Enchanted Forest spoke in a thousand voices.",
  "Every leaf held a word. Every stream sang a sentence.",
  "The trees, the wind, the very stones — all alive with language.",
  "Then came the Unraveling. A dark curse that scrambled every word in the world.",
  "The forest fell silent. The magic faded. The creatures forgot their very names.",
  "But the Ancient Tree, oldest of all, sent a call across the waking world…",
  "A traveler with a keen mind and a brave heart could restore what was lost.",
  "That traveler… is you.",
]

const RUNES = ['✦', '✧', '⊕', '◈', '⟐', '⊛', '⋆', '⊗']
const FLOATERS = Array.from({ length: 22 }, (_, i) => ({
  sym:  RUNES[i % RUNES.length],
  left: (Math.random() * 100).toFixed(1),
  sz:   18 + Math.random() * 28,
  dur:  (9 + Math.random() * 9).toFixed(1),
  del:  (Math.random() * 6).toFixed(1),
  op:   (0.04 + Math.random() * 0.1).toFixed(2),
}))

export default function IntroScreen({ onStart }) {
  const [phase, setPhase] = useState('title') // title | cutscene | ready
  const [li, setLi]       = useState(0)

  const advance = () => {
    if (li < CUTSCENE.length - 1) {
      setLi(l => l + 1)
    } else {
      setPhase('ready')
    }
  }

  return (
    <div
      style={{
        position: 'absolute', // 🟢 FIXED: Changed from fixed to absolute!
        inset: 0,
        zIndex: 100,
        background: 'radial-gradient(ellipse at 50% 40%, #0d2215 0%, #050f08 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Floating rune characters */}
      {FLOATERS.map((f, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${f.left}%`,
            fontFamily: "'Cinzel', serif",
            color: `rgba(74,200,100,${f.op})`,
            fontSize: f.sz,
            animation: `runeFloat ${f.dur}s ${f.del}s infinite linear`,
            pointerEvents: 'none',
          }}
        >
          {f.sym}
        </div>
      ))}

      {/* ── TITLE ──────────────────────────────────────── */}
      {phase === 'title' && (
        <div style={{ textAlign: 'center', animation: 'fadeScaleIn 1s ease', padding: '0 1.5rem' }}>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 800,
              fontSize: 'clamp(1.8rem,5vw,3.8rem)',
              color: '#c9a84c',
              textShadow: '0 0 30px rgba(201,168,76,0.8),0 0 60px rgba(201,168,76,0.3)',
              marginBottom: '0.3rem',
              animation: 'titlePulse 3s ease-in-out infinite',
            }}
          >
            Words of the
          </div>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 800,
              fontSize: 'clamp(2.2rem,6.5vw,5rem)',
              color: '#4dff91',
              textShadow: '0 0 40px rgba(77,255,145,0.85),0 0 80px rgba(77,255,145,0.35)',
              marginBottom: '1rem',
              animation: 'titlePulse 3s 0.5s ease-in-out infinite',
            }}
          >
            Enchanted Forest
          </div>
          <div
            style={{
              fontFamily: "'Crimson Text', serif",
              fontSize: '1.1rem',
              color: '#70a870',
              fontStyle: 'italic',
              letterSpacing: '0.1em',
              marginBottom: '2.8rem',
            }}
          >
            Restore the lost words. Heal the ancient magic.
          </div>
          <button
            onClick={() => setPhase('cutscene')}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 45px rgba(201,168,76,0.85)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 28px rgba(201,168,76,0.65)' }}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '1rem',
              letterSpacing: '0.22em',
              color: '#040f06',
              background: 'linear-gradient(135deg,#c9a84c 0%,#f0cc76 100%)',
              padding: '1rem 2.6rem',
              borderRadius: 7,
              boxShadow: '0 0 28px rgba(201,168,76,0.65)',
              transition: 'all 0.3s',
            }}
          >
            ✦ BEGIN THE JOURNEY ✦
          </button>
        </div>
      )}

      {/* ── CUTSCENE ────────────────────────────────────── */}
      {phase === 'cutscene' && (
        <div style={{ textAlign: 'center', maxWidth: 580, padding: '0 2rem', animation: 'fadeScaleIn 0.5s ease' }}>
          <div
            style={{
              fontFamily: "'Crimson Text', serif",
              fontSize: '1.3rem',
              lineHeight: 2.1,
              color: '#c0d8c0',
              fontStyle: 'italic',
              marginBottom: '2rem',
              minHeight: '5rem',
              textShadow: '0 0 20px rgba(80,160,100,0.3)',
            }}
          >
            "{CUTSCENE[li]}"
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '2rem' }}>
            {CUTSCENE.map((_, i) => (
              <div
                key={i}
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: i <= li ? '#4dff91' : 'rgba(255,255,255,0.15)',
                  width: i === li ? 24 : i < li ? 14 : 8,
                  transition: 'all 0.35s',
                }}
              />
            ))}
          </div>

          <button
            onClick={advance}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = '' }}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              color: '#040f06',
              background: 'linear-gradient(135deg,#4dff91,#30cc65)',
              padding: '0.72rem 2rem',
              borderRadius: 7,
              boxShadow: '0 0 18px rgba(77,255,145,0.55)',
              transition: 'transform 0.2s',
            }}
          >
            {li < CUTSCENE.length - 1 ? 'Continue ▶' : 'Enter the Forest ✦'}
          </button>
        </div>
      )}

      {/* ── READY ───────────────────────────────────────── */}
      {phase === 'ready' && (
        <div style={{ textAlign: 'center', animation: 'fadeScaleIn 0.6s ease', padding: '0 1.5rem' }}>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '1.6rem',
              color: '#4dff91',
              textShadow: '0 0 25px rgba(77,255,145,0.7)',
              marginBottom: '1.8rem',
              animation: 'titlePulse 2s ease-in-out infinite',
            }}
          >
            The forest awaits…
          </div>
          <button
            onClick={onStart}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = '' }}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '1.05rem',
              letterSpacing: '0.22em',
              color: '#040f06',
              background: 'linear-gradient(135deg,#4dff91,#c9a84c)',
              padding: '1.05rem 2.8rem',
              borderRadius: 7,
              boxShadow: '0 0 35px rgba(77,255,145,0.7)',
              transition: 'transform 0.3s',
            }}
          >
            ✦ STEP FORWARD ✦
          </button>
        </div>
      )}
    </div>
  )
}