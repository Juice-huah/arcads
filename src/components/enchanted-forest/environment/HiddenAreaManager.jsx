import { useState, useEffect } from 'react'

// ─── Discovery flash notification ────────────────────────────────────────────
function DiscoveryFlash({ area, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div style={{
      position: 'fixed', top: '12%', left: '50%', transform: 'translateX(-50%)',
      zIndex: 150, pointerEvents: 'none',
      animation: 'hiddenAreaReveal 0.6s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{
        background: 'rgba(4,12,6,0.97)',
        border: `2px solid ${area.accent}`,
        borderRadius: 14, padding: '1rem 2rem',
        textAlign: 'center',
        boxShadow: `0 0 50px ${area.glow}, 0 0 100px ${area.glow}40`,
      }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>🗺️</div>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: '0.65rem', letterSpacing: '0.25em',
          color: '#789878', marginBottom: '0.2rem',
        }}>HIDDEN AREA DISCOVERED!</div>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: '1rem', color: area.accent,
          letterSpacing: '0.15em', textShadow: `0 0 16px ${area.glow}`,
        }}>{area.name}</div>
        <div style={{
          fontFamily: "'Crimson Text', serif", fontSize: '0.82rem',
          color: '#c0d8c0', fontStyle: 'italic', marginTop: '0.2rem',
        }}>{area.subtitle}</div>
      </div>
    </div>
  )
}

// ─── Hidden area puzzle screen ────────────────────────────────────────────────
function HiddenAreaScreen({ area, onComplete, onExit }) {
  const [phase, setPhase] = useState('intro') // intro | puzzle | complete
  const [lineIdx, setLineIdx] = useState(0)
  const [wordIdx, setWordIdx] = useState(0)
  const [val, setVal] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [solved, setSolved] = useState([])
  const [feedback, setFeedback] = useState(null) // 'ok' | 'fail'

  const word = area.words[wordIdx]
  const letters = word?.scrambled.split('') || []

  const advance = () => {
    if (lineIdx < area.intro.length - 1) setLineIdx(i => i + 1)
    else setPhase('puzzle')
  }

  const submit = () => {
    if (!val.trim()) return
    const correct = val.trim().toUpperCase() === word.answer.toUpperCase()
    if (correct) {
      setFeedback('ok')
      setSolved(s => [...s, word.answer])
      setTimeout(() => {
        setFeedback(null)
        if (wordIdx < area.words.length - 1) {
          setWordIdx(i => i + 1); setVal(''); setAttempts(0)
        } else {
          setPhase('complete')
        }
      }, 1200)
    } else {
      setFeedback('fail')
      setAttempts(a => a + 1)
      setTimeout(() => { setFeedback(null); setVal('') }, 1200)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 160,
      background: area.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.5s ease',
    }}>
      {/* Exit button */}
      <button onClick={onExit} style={{
        position: 'absolute', top: '1rem', left: '1rem',
        fontFamily: "'Cinzel', serif", fontSize: '0.65rem', letterSpacing: '0.1em',
        color: '#789878', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '0.4rem 0.8rem', borderRadius: 5, cursor: 'pointer',
      }}>← Leave</button>

      {/* Location name */}
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: '1.2rem',
        color: area.accent, letterSpacing: '0.2em', marginBottom: '0.3rem',
        textShadow: `0 0 20px ${area.glow}`,
        animation: 'titlePulse 3s ease-in-out infinite',
      }}>{area.name}</div>
      <div style={{
        fontFamily: "'Crimson Text', serif", color: '#789878',
        fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '2rem',
      }}>{area.subtitle}</div>

      {/* Lore snippet */}
      <div style={{
        fontFamily: "'Crimson Text', serif", fontSize: '0.9rem',
        color: '#c0d8c0', fontStyle: 'italic', textAlign: 'center',
        maxWidth: 480, lineHeight: 1.7, marginBottom: '1.5rem', opacity: 0.7,
      }}>{area.lore}</div>

      {/* INTRO PHASE */}
      {phase === 'intro' && (
        <div style={{
          background: 'rgba(4,12,6,0.94)', border: `1px solid ${area.accent}55`,
          borderRadius: 14, padding: '1.4rem 1.8rem',
          maxWidth: 560, width: '90vw',
          animation: 'fadeScaleIn 0.4s ease',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.7rem', color: area.accent, letterSpacing: '0.18em', marginBottom: '0.5rem' }}>
            ✦ {area.npc.name}
          </div>
          <div style={{ fontFamily: "'Crimson Text', serif", fontSize: '1.1rem', color: '#e0eee2', fontStyle: 'italic', lineHeight: 1.8 }}>
            {area.intro[lineIdx]}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.9rem' }}>
            <button onClick={advance} style={{
              fontFamily: "'Cinzel', serif", fontSize: '0.72rem', letterSpacing: '0.15em',
              color: '#040f06', background: `linear-gradient(135deg,${area.accent},${area.accent}bb)`,
              padding: '0.55rem 1.3rem', borderRadius: 5, border: 'none', cursor: 'pointer',
            }}>{lineIdx < area.intro.length - 1 ? 'Continue ▶' : '⚔ Begin Puzzle'}</button>
          </div>
        </div>
      )}

      {/* PUZZLE PHASE */}
      {phase === 'puzzle' && (
        <div style={{
          background: 'rgba(4,12,6,0.96)', border: `1px solid ${area.accent}70`,
          borderRadius: 14, padding: '1.5rem 1.8rem',
          maxWidth: 560, width: '90vw',
          animation: feedback ? (feedback === 'ok' ? 'popIn 0.4s ease' : 'shakeX 0.4s ease') : 'fadeScaleIn 0.35s ease',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.7rem', color: area.accent, letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
            Word {wordIdx + 1} of {area.words.length}
          </div>
          {/* Tiles */}
          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap', margin: '0.9rem 0 0.7rem' }}>
            {letters.map((ch, i) => (
              <div key={i} style={{
                width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${area.accent}14`, border: `2px solid ${area.accent}65`, borderRadius: 8,
                fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '1.3rem', color: area.accent,
                boxShadow: `0 0 10px ${area.glow}40`,
                animation: `tileFloat ${1.4 + i * 0.14}s ${i * 0.05}s ease-in-out infinite alternate`,
              }}>{ch}</div>
            ))}
          </div>
          {/* Hint */}
          {(attempts >= 2) && (
            <div style={{
              background: `${area.accent}12`, border: `1px solid ${area.accent}35`,
              borderRadius: 7, padding: '0.55rem 0.9rem', marginBottom: '0.8rem',
              fontFamily: "'Crimson Text', serif", fontSize: '0.92rem', color: '#c0d8c0', fontStyle: 'italic',
            }}>💡 {word.hint}</div>
          )}
          {/* Feedback */}
          {feedback && (
            <div style={{
              textAlign: 'center', fontFamily: "'Cinzel', serif",
              color: feedback === 'ok' ? area.accent : '#ff8080',
              fontSize: '1rem', letterSpacing: '0.1em', marginBottom: '0.6rem',
            }}>
              {feedback === 'ok' ? '✨ Correct!' : '↩ Try Again'}
            </div>
          )}
          {/* NPC response */}
          <div style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.9rem', color: '#9ab89a', fontStyle: 'italic', marginBottom: '0.8rem', minHeight: '1.2rem' }}>
            {feedback === 'ok' && area.success?.[wordIdx % area.success.length]}
            {feedback === 'fail' && area.fail?.[Math.min(attempts - 1, area.fail.length - 1)]}
          </div>
          {/* Input */}
          <div style={{ display: 'flex', gap: '0.7rem' }}>
            <input
              value={val}
              onChange={e => setVal(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && val.trim() && submit()}
              placeholder="Type the word…"
              autoFocus
              style={{
                flex: 1, padding: '0.7rem 1rem',
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${area.accent}45`,
                borderRadius: 7, color: '#e8f4ea',
                fontFamily: "'Cinzel', serif", fontSize: '0.95rem', letterSpacing: '0.2em',
              }}
            />
            <button onClick={submit} style={{
              fontFamily: "'Cinzel', serif", fontSize: '0.72rem', letterSpacing: '0.1em',
              color: '#040f06',
              background: `linear-gradient(135deg,${area.accent},${area.accent}cc)`,
              padding: '0.7rem 1.3rem', borderRadius: 7, border: 'none', cursor: 'pointer',
            }}>Submit</button>
          </div>
        </div>
      )}

      {/* COMPLETE PHASE */}
      {phase === 'complete' && (
        <div style={{
          background: 'rgba(4,12,6,0.98)', border: `2px solid ${area.accent}`,
          borderRadius: 18, padding: '2.2rem 2.8rem',
          textAlign: 'center', maxWidth: 480,
          boxShadow: `0 0 80px ${area.glow}`,
          animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.8rem', animation: 'victoryFloat 2s ease-in-out infinite' }}>🌟</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1.2rem', color: area.accent, letterSpacing: '0.15em', marginBottom: '0.7rem' }}>
            {area.name} — Explored!
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginBottom: '1.2rem' }}>
            {solved.map((w, i) => (
              <span key={i} style={{
                background: `${area.accent}22`, border: `1px solid ${area.accent}50`,
                color: area.accent, fontFamily: "'Cinzel', serif",
                fontSize: '0.75rem', padding: '0.25rem 0.7rem', borderRadius: 4, letterSpacing: '0.1em',
              }}>{w}</span>
            ))}
          </div>
          <button onClick={onComplete} style={{
            fontFamily: "'Cinzel', serif", fontSize: '0.78rem', letterSpacing: '0.18em',
            color: '#040f06', background: `linear-gradient(135deg,${area.accent},${area.accent}bb)`,
            padding: '0.75rem 2rem', borderRadius: 6, border: 'none', cursor: 'pointer',
            boxShadow: `0 0 20px ${area.glow}`,
          }}>Collect Rewards ✦</button>
        </div>
      )}
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function HiddenAreaManager({
  discoveredAreas,     // Set of area ids that have been discovered
  enteredArea,         // area object or null to enter
  onEnterArea,         // (areaId) => void
  onCompleteArea,      // (areaId, words) => void
  onExitArea,          // () => void
  flashArea,           // area object to show discovery flash or null
  onDismissFlash,      // () => void
}) {
  return (
    <>
      {flashArea && <DiscoveryFlash area={flashArea} onDismiss={onDismissFlash} />}
      {enteredArea && (
        <HiddenAreaScreen
          area={enteredArea}
          onComplete={() => onCompleteArea(enteredArea.id, enteredArea.words.map(w => w.answer))}
          onExit={onExitArea}
        />
      )}
    </>
  )
}