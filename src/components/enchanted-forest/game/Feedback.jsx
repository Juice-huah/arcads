export default function Feedback({ type, message, accent, glow, onDismiss }) {
  const ok = type === 'correct'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.58)',
        animation: 'fadeScaleIn 0.25s ease',
      }}
    >
      <div
        style={{
          background: ok ? 'rgba(4,18,8,0.98)' : 'rgba(18,4,4,0.98)',
          border: `2px solid ${ok ? accent : '#e05050'}`,
          borderRadius: 18,
          padding: '2rem 2.5rem',
          textAlign: 'center',
          maxWidth: 460,
          boxShadow: `0 0 60px ${ok ? glow : 'rgba(200,60,60,0.5)'}`,
          animation: ok ? 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1)' : 'shakeX 0.45s ease',
        }}
      >
        <div style={{ fontSize: '2.8rem', marginBottom: '0.8rem' }}>{ok ? '✨' : '💫'}</div>

        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '1.15rem',
            color: ok ? accent : '#f07070',
            marginBottom: '0.7rem',
            letterSpacing: '0.1em',
          }}
        >
          {ok ? 'Word Restored!' : 'Not quite…'}
        </div>

        <div
          style={{
            fontFamily: "'Crimson Text', serif",
            fontSize: '1.05rem',
            color: '#c8d8c8',
            fontStyle: 'italic',
            lineHeight: 1.65,
            marginBottom: '1.2rem',
          }}
        >
          {message}
        </div>

        <button
          onClick={onDismiss}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = '' }}
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            color: '#040f06',
            background: ok
              ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
              : 'linear-gradient(135deg, #e08080, #c05050)',
            padding: '0.6rem 1.6rem',
            borderRadius: 6,
            boxShadow: `0 0 14px ${ok ? glow : 'rgba(200,60,60,0.5)'}`,
            transition: 'transform 0.2s',
          }}
        >
          {ok ? 'Continue ✦' : 'Try Again ↩'}
        </button>
      </div>
    </div>
  )
}
