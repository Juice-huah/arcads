export default function AreaComplete({ loc, onProceed, postBossText }) {
  const text = postBossText && postBossText !== 'VICTORY' ? postBossText : loc.outro

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.68)',
      animation: 'fadeScaleIn 0.3s ease',
    }}>
      <div style={{
        background: 'rgba(4,14,6,0.98)',
        border: `2px solid ${loc.accent}`,
        borderRadius: 18, padding: '2.2rem 2.8rem',
        textAlign: 'center', maxWidth: 540,
        boxShadow: `0 0 80px ${loc.glow}`,
        animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'victoryFloat 2s ease-in-out infinite' }}>
          🌟
        </div>

        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: '1.3rem', color: loc.accent,
          marginBottom: '0.8rem', letterSpacing: '0.12em',
          textShadow: `0 0 20px ${loc.glow}`,
        }}>
          {loc.name} — Cleared!
        </div>

        <div style={{
          fontFamily: "'Crimson Text', serif", fontSize: '1.05rem',
          color: '#d0e8d0', fontStyle: 'italic', lineHeight: 1.85,
          marginBottom: '1.6rem',
        }}>
          {text}
        </div>

        <button
          onClick={onProceed}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.currentTarget.style.transform = ''}
          style={{
            fontFamily: "'Cinzel', serif", fontSize: '0.8rem', letterSpacing: '0.18em',
            color: '#040f06',
            background: `linear-gradient(135deg, ${loc.accent}, ${loc.accent}bb)`,
            padding: '0.75rem 2rem', borderRadius: 6,
            boxShadow: `0 0 20px ${loc.glow}`,
            transition: 'all 0.25s',
          }}
        >
          {postBossText === 'VICTORY' ? 'The Final Victory ✦' : 'Return to Map ✦'}
        </button>
      </div>
    </div>
  )
}
