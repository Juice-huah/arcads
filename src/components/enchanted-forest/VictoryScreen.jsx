import { TOTAL_WORDS } from '../../data/locations_enhanced.js'

const CONFETTI = Array.from({ length: 42 }, () => ({
  left: (Math.random() * 100).toFixed(1),
  sz:   5 + Math.random() * 8,
  dur:  (5 + Math.random() * 8).toFixed(1),
  del:  (Math.random() * 6).toFixed(1),
  dx:   ((Math.random() - 0.5) * 110).toFixed(0),
  clr:  ['#ffd700', '#4dff91', '#7ad4ff', '#c084fc', '#ff9a3c', '#ff6b8a'][Math.floor(Math.random() * 6)],
}))

export default function VictoryScreen({ inventory, score, onRestart }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'radial-gradient(ellipse at 50% 40%, #1e1200 0%, #0a0600 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', padding: '2rem',
    }}>
      {/* Confetti */}
      {CONFETTI.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${c.left}%`, top: '-15px',
          width: c.sz, height: c.sz, borderRadius: '50% 0 50% 0',
          background: c.clr, opacity: 0,
          animation: `particleFall ${c.dur}s ${c.del}s infinite ease-in`,
          '--dx': `${c.dx}px`,
        }} />
      ))}

      {/* Title */}
      <div style={{
        fontFamily: "'Cinzel', serif", fontWeight: 800, textAlign: 'center',
        fontSize: 'clamp(1.8rem,5vw,3.5rem)', color: '#ffd700',
        textShadow: '0 0 40px rgba(255,215,0,0.9),0 0 80px rgba(255,215,0,0.4)',
        marginBottom: '0.4rem',
        animation: 'titlePulse 2s ease-in-out infinite, victoryFloat 3s ease-in-out infinite',
      }}>
        The Forest is Restored!
      </div>

      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: '0.9rem', color: '#aa8030',
        letterSpacing: '0.2em', marginBottom: '1.2rem',
      }}>
        The Unraveler is defeated. The curse is broken.
      </div>

      {/* Story resolution */}
      <div style={{
        fontFamily: "'Crimson Text', serif",
        fontSize: 'clamp(0.9rem,1.8vw,1.1rem)', color: '#c8b060', fontStyle: 'italic',
        textAlign: 'center', maxWidth: 580, lineHeight: 1.9, marginBottom: '1.2rem',
      }}>
        The Ancient Tree's roots glow golden. Every leaf remembers its name.
        Every stream sings its song once more. You faced six guardians, six bosses,
        and unraveled every curse in the forest — and you did it word by word.
      </div>

      {/* Stats */}
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: '0.82rem', color: '#ffd700',
        letterSpacing: '0.15em', marginBottom: '0.9rem',
      }}>
        {inventory.length} / {TOTAL_WORDS} WORDS RESTORED · SCORE: {score}
      </div>

      {/* Word grid */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
        justifyContent: 'center', maxWidth: 580, marginBottom: '2rem',
      }}>
        {inventory.map((w, i) => (
          <span key={i} style={{
            background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.4)',
            color: '#ffd700', fontFamily: "'Cinzel', serif",
            fontSize: '0.68rem', padding: '0.2rem 0.6rem', borderRadius: 4, letterSpacing: '0.1em',
          }}>{w}</span>
        ))}
      </div>

      {/* Restart */}
      <button
        onClick={onRestart}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 45px rgba(255,215,0,0.9)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 28px rgba(255,215,0,0.7)' }}
        style={{
          fontFamily: "'Cinzel', serif", fontSize: '0.9rem', letterSpacing: '0.2em',
          color: '#060400', background: 'linear-gradient(135deg,#ffd700,#ffaa00)',
          padding: '0.9rem 2.5rem', borderRadius: 7,
          boxShadow: '0 0 28px rgba(255,215,0,0.7)', transition: 'all 0.3s',
        }}
      >
        ✦ JOURNEY AGAIN ✦
      </button>
    </div>
  )
}
