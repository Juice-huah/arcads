import { useState, useEffect, useRef } from 'react'
import { partialReveal } from '../data/locations_enhanced.js'

export default function WordPuzzle({
  loc, word, attempts, onSubmit, showHint,
  revealedLetter,   // string | null
  skipCharges,      // number
  onSkip,           // () => void
  revealCharges,    // number
  onReveal,         // () => void
  timedMode,        // bool
  timeLeft,         // number | null
}) {
  const [val, setVal] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    setVal('')
    inputRef.current?.focus()
  }, [word])

  const letters  = word.scrambled.split('')
  const maxTileW = 46 
  const tileW    = Math.min(maxTileW, Math.floor(Math.min(window.innerWidth * 0.78, 640) / letters.length) - 4)

  const handleKey = (e) => {
    if (e.key === 'Enter' && val.trim()) { onSubmit(val); setVal('') }
  }
  const handleClick = () => {
    if (val.trim()) { onSubmit(val); setVal('') }
  }

  const urgent = timedMode && timeLeft !== null && timeLeft <= 10

  return (
    <div
      style={{
        position: 'absolute',
        top: '12%', // 🟢 MOVED TO THE TOP (Matches Dialogue Box position)
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(620px, 90vw)', 
        background: 'rgba(4, 12, 6, 0.25)', 
        border: `1px solid ${urgent ? '#ff505070' : `${loc.accent}50`}`,
        borderRadius: 16,
        padding: '1.2rem 1.4rem', 
        zIndex: 20,
        backdropFilter: 'blur(5px)', 
        boxShadow: `0 10px 40px ${urgent ? 'rgba(255,50,50,0.1)' : 'rgba(0,0,0,0.4)'}, inset 0 0 15px rgba(0,0,0,0.3)`,
        animation: 'fadeScaleIn 0.35s ease',
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}
    >
      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: '0.65rem', 
          letterSpacing: '0.16em', color: urgent ? '#ff8060' : loc.accent, opacity: 0.9,
          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
        }}>
          ✦ {loc.npc.name} — unscramble this word
        </div>

        {/* Timer badge */}
        {timedMode && timeLeft !== null && (
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: '0.9rem',
            color: urgent ? '#ff5050' : '#ffd700',
            textShadow: urgent ? '0 0 12px #ff505080' : '0 0 8px #ffd70060',
            animation: urgent ? 'timerUrgentPulse 0.5s ease-in-out infinite' : 'none',
            fontWeight: 700,
          }}>
            ⏱ {timeLeft}s
          </div>
        )}
      </div>

      {/* ── THE QUESTION (Now always visible!) ── */}
      <div style={{
        textAlign: 'center',
        fontFamily: "'Crimson Text', serif",
        fontSize: '1.2rem',
        color: '#ffffff',
        fontStyle: 'italic',
        margin: '0.8rem 0',
        lineHeight: 1.4,
        textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.6)'
      }}>
        {word.hint}
      </div>

      {/* ── Scrambled letter tiles ── */}
      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap', margin: '0.6rem 0' }}>
        {letters.map((ch, i) => {
          const isRevealed = revealedLetter && i === 0
          return (
            <div
              key={i}
              style={{
                width: tileW, height: tileW,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isRevealed ? `${loc.accent}45` : `rgba(0,0,0,0.6)`, 
                border: `1px solid ${isRevealed ? loc.accent : `${loc.accent}55`}`,
                borderRadius: 8,
                fontFamily: "'Cinzel', serif", fontWeight: 700,
                fontSize: tileW > 38 ? '1.2rem' : '0.9rem',
                color: isRevealed ? '#fff' : loc.accent,
                boxShadow: isRevealed
                  ? `0 0 16px ${loc.glow}80`
                  : `0 4px 10px rgba(0,0,0,0.7)`,
                animation: urgent
                  ? `tileShake ${0.4 + i * 0.05}s ease-in-out infinite`
                  : `tileFloat ${1.4 + i * 0.14}s ${i * 0.05}s ease-in-out infinite alternate`,
                transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
              }}
            >
              {ch}
            </div>
          )
        })}
      </div>

      {/* ── Revealed letter hint ── */}
      {revealedLetter && (
        <div style={{
          textAlign: 'center',
          fontFamily: "'Cinzel', serif", fontSize: '0.72rem',
          color: loc.accent, letterSpacing: '0.2em',
          marginBottom: '0.5rem', opacity: 0.9,
          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
          animation: 'fadeIn 0.4s ease',
        }}>
          🔮 Starts with: <strong>{revealedLetter}</strong>
        </div>
      )}

      {/* ── Extra Clue / Partial Reveal (Only shows when student uses a hint charge) ── */}
      {showHint && (
        <div style={{
          background: `rgba(0,0,0,0.6)`,
          border: `1px solid ${loc.accent}50`,
          borderRadius: 7, padding: '0.45rem 0.8rem', marginBottom: '0.6rem',
          fontFamily: "'Cinzel', serif", fontSize: '0.8rem', letterSpacing: '0.15em',
          color: loc.accent, textAlign: 'center'
        }}>
          💡 Clue: {partialReveal(word.answer)}
        </div>
      )}

      {/* ── Attempt counter ── */}
      {attempts > 0 && (
        <div style={{
          textAlign: 'center', fontSize: '0.75rem',
          color: attempts >= 3 ? '#ff9060' : '#a0c0a0',
          marginBottom: '0.4rem',
          fontFamily: "'Crimson Text', serif",
          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
        }}>
          {attempts >= 3
            ? `${attempts} attempts — you're so close, don't give up!`
            : `Attempt ${attempts}`}
        </div>
      )}

      {/* ── Input row ── */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          ref={inputRef}
          value={val}
          onChange={e => setVal(e.target.value.toUpperCase())}
          onKeyDown={handleKey}
          placeholder="Type the word here…"
          style={{
            flex: 1, padding: '0.6rem 1rem',
            background: 'rgba(0,0,0,0.6)',
            border: `1px solid ${urgent ? '#ff505055' : `${loc.accent}55`}`,
            borderRadius: 7, color: '#e8f4ea',
            fontFamily: "'Cinzel', serif", fontSize: '0.9rem',
            letterSpacing: '0.15em', outline: 'none',
            transition: 'border-color 0.4s',
          }}
        />
        <button
          onClick={handleClick}
          style={{
            fontFamily: "'Cinzel', serif", fontSize: '0.7rem', fontWeight: 'bold',
            letterSpacing: '0.1em', color: '#040f06', cursor: 'pointer',
            background: `linear-gradient(135deg, ${loc.accent}, ${loc.accent}cc)`,
            padding: '0.6rem 1.4rem', borderRadius: 7, border: 'none',
            boxShadow: `0 0 12px ${loc.glow}`, whiteSpace: 'nowrap',
          }}
        >
          Submit
        </button>
      </div>

      {/* ── Power-up buttons row ── */}
      {((skipCharges > 0) || (revealCharges > 0)) && (
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.6rem', justifyContent: 'flex-end' }}>
          {/* Reveal letter */}
          {revealCharges > 0 && (
            <button
              onClick={onReveal}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
              style={{
                fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.1em',
                color: '#d0a0ff', cursor: 'pointer',
                background: 'rgba(20, 10, 40, 0.7)', border: '1px solid rgba(176, 128, 240, 0.5)',
                padding: '0.3rem 0.6rem', borderRadius: 5,
                opacity: 0.85, transition: 'opacity 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}
            >
              🔮 Reveal ({revealCharges})
            </button>
          )}

          {/* Skip word */}
          {skipCharges > 0 && (
            <button
              onClick={onSkip}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
              style={{
                fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.1em',
                color: '#ffe060', cursor: 'pointer',
                background: 'rgba(40, 30, 10, 0.7)', border: '1px solid rgba(224, 192, 64, 0.5)',
                padding: '0.3rem 0.6rem', borderRadius: 5,
                opacity: 0.85, transition: 'opacity 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}
            >
              ⚡ Skip ({skipCharges})
            </button>
          )}
        </div>
      )}
    </div>
  )
}