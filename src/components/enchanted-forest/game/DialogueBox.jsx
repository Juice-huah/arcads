export default function DialogueBox({ loc, lineIdx, onNext, onStartPuzzle, choiceNode, onChoice, choiceMade }) {
  const lines  = loc.intro
  const isLast = lineIdx >= lines.length - 1

  // When a choice node is active for this line, show choices instead of Continue
  const showChoices = choiceNode && !choiceMade

  return (
    <div
      style={{
        position: 'absolute',
        top: '12%', // 🟢 MOVED TO TOP
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(680px, 90vw)',
        background: 'rgba(4,12,6,0.85)', // 🟢 Slightly more transparent
        border: `1px solid ${loc.accent}55`,
        borderRadius: 14,
        padding: '1.3rem 1.6rem',
        zIndex: 20,
        backdropFilter: 'blur(8px)',
        boxShadow: `0 10px 40px ${loc.glow}25, inset 0 0 30px rgba(0,0,0,0.5)`,
        animation: 'fadeScaleIn 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}
    >
      {/* NPC label */}
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '0.72rem', letterSpacing: '0.18em',
        color: loc.accent, marginBottom: '0.55rem', opacity: 0.9,
      }}>
        ✦ {loc.npc.name}
      </div>

      {/* Dialogue text */}
      <div style={{
        fontFamily: "'Crimson Text', Georgia, serif",
        fontSize: '1.1rem', lineHeight: 1.75,
        color: '#e0eee2', fontStyle: 'italic', minHeight: '3rem',
      }}>
        {lines[lineIdx]}
      </div>

      {/* ── Branching choices ── */}
      {showChoices ? (
        <div style={{ marginTop: '1rem' }}>
          <div style={{
            fontFamily: "'Crimson Text', serif", fontSize: '0.85rem',
            color: '#789878', fontStyle: 'italic', marginBottom: '0.7rem',
          }}>
            {choiceNode.prompt}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {choiceNode.options.map(opt => (
              <button
                key={opt.key}
                onClick={() => onChoice(opt)}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = loc.accent
                  e.currentTarget.style.background  = `${loc.accent}14`
                  e.currentTarget.style.color        = loc.accent
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${loc.accent}40`
                  e.currentTarget.style.background  = `${loc.accent}08`
                  e.currentTarget.style.color        = '#c8e0c8'
                }}
                style={{
                  fontFamily: "'Crimson Text', serif",
                  fontSize: '1rem', fontStyle: 'italic',
                  color: '#c8e0c8', textAlign: 'left',
                  background: `${loc.accent}08`,
                  border: `1px solid ${loc.accent}40`,
                  borderRadius: 7, padding: '0.65rem 1rem',
                  cursor: 'pointer', transition: 'all 0.2s',
                  letterSpacing: '0.02em', lineHeight: 1.5,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── Normal continue / begin button ── */
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.9rem' }}>
          <button
            onClick={isLast ? onStartPuzzle : onNext}
            onMouseEnter={e => {
              e.currentTarget.style.transform  = 'translateY(-2px)'
              e.currentTarget.style.boxShadow  = `0 0 24px ${loc.glow}`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = ''
              e.currentTarget.style.boxShadow = `0 0 14px ${loc.glow}`
            }}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '0.72rem', letterSpacing: '0.15em',
              color: '#050f08',
              background: `linear-gradient(135deg, ${loc.accent}, ${loc.accent}bb)`,
              padding: '0.55rem 1.3rem', borderRadius: 5,
              boxShadow: `0 0 14px ${loc.glow}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
          >
            {isLast ? '⚔ Begin Challenge' : 'Continue ▶'}
          </button>
        </div>
      )}
    </div>
  )
}