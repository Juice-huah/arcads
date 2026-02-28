import { useState, useEffect } from 'react'

// ─── Confirm Dialog (reused from MainMenu pattern) ────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel, accent = '#ff6060' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        background: 'rgba(4,12,6,0.99)',
        border: `2px solid ${accent}50`,
        borderRadius: 16, padding: '2rem 2.5rem',
        textAlign: 'center', maxWidth: 360,
        boxShadow: `0 0 60px ${accent}20`,
        animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '0.6rem' }}>⚠️</div>
        <div style={{
          fontFamily: "'Crimson Text', serif", fontSize: '1rem',
          color: '#c8d8c8', fontStyle: 'italic', lineHeight: 1.7,
          marginBottom: '1.4rem',
        }}>{message}</div>
        <div style={{ display: 'flex', gap: '0.7rem', justifyContent: 'center' }}>
          <button onClick={onConfirm} style={{
            fontFamily: "'Cinzel', serif", fontSize: '0.72rem', letterSpacing: '0.15em',
            color: '#040f06', background: `linear-gradient(135deg,${accent},${accent}bb)`,
            padding: '0.6rem 1.4rem', borderRadius: 6, border: 'none', cursor: 'pointer',
          }}>Yes</button>
          <button onClick={onCancel} style={{
            fontFamily: "'Cinzel', serif", fontSize: '0.72rem', letterSpacing: '0.15em',
            color: '#789878', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '0.6rem 1.4rem', borderRadius: 6, cursor: 'pointer',
          }}>No</button>
        </div>
      </div>
    </div>
  )
}

// ─── Pause Menu Item ──────────────────────────────────────────────────────────
function PauseItem({ onClick, icon, children, accent = '#4dff91', glow = 'rgba(77,255,145,0.35)', danger = false, delay = 0 }) {
  const [hov, setHov] = useState(false)
  const clr = danger ? '#ff6060' : accent
  const glw = danger ? 'rgba(255,80,80,0.35)' : glow

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '0.9rem',
        padding: '0.8rem 1.2rem',
        background: hov ? `${clr}12` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hov ? clr : `${clr}28`}`,
        borderRadius: 9, cursor: 'pointer',
        transform: hov ? 'translateX(5px)' : 'translateX(0)',
        boxShadow: hov ? `0 0 18px ${glw}` : 'none',
        transition: 'all 0.2s ease',
        animation: `slideUp 0.4s ${delay}s both ease`,
      }}
    >
      <span style={{
        fontSize: '1.2rem', width: 28, textAlign: 'center',
        filter: hov ? `drop-shadow(0 0 6px ${clr})` : 'none',
        transition: 'filter 0.2s',
      }}>{icon}</span>
      <span style={{
        fontFamily: "'Cinzel', serif", fontSize: '0.82rem',
        letterSpacing: '0.15em', color: hov ? clr : `${clr}bb`,
        transition: 'color 0.2s',
      }}>{children}</span>
      <span style={{
        marginLeft: 'auto', color: clr,
        opacity: hov ? 0.8 : 0, transition: 'opacity 0.2s',
      }}>›</span>
    </button>
  )
}

// ─── Stats row ────────────────────────────────────────────────────────────────
function StatPill({ label, value, accent }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: `${accent}0d`, border: `1px solid ${accent}25`,
      borderRadius: 8, padding: '0.45rem 0.9rem', minWidth: 70,
    }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.95rem', color: accent }}>{value}</div>
      <div style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.65rem', color: '#789878', fontStyle: 'italic' }}>{label}</div>
    </div>
  )
}

// ─── Main PauseMenu component ─────────────────────────────────────────────────
export default function PauseMenu({
  loc,              // current location object (for accent colors)
  score,
  lives,
  maxLives,
  combo,
  wordsRestored,
  onResume,         // () => void
  onRestartArea,    // () => void  — restart current area (keep overall progress)
  onMainMenu,       // () => void  — go back to main menu (progress saved)
  onQuit,           // () => void  — quit game entirely
}) {
  const [confirmRestart, setConfirmRestart] = useState(false)
  const [confirmMenu,    setConfirmMenu]    = useState(false)
  const [confirmQuit,    setConfirmQuit]    = useState(false)

  const accent = loc?.accent || '#4dff91'
  const glow   = loc?.glow   || 'rgba(77,255,145,0.4)'

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onResume() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onResume])

  // Prevent scroll-through
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onResume}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.25s ease',
        }}
      />

      {/* ── Panel ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            pointerEvents: 'all',
            background: 'rgba(3,10,5,0.98)',
            border: `2px solid ${accent}35`,
            borderRadius: 20,
            padding: '1.8rem 2rem',
            width: 'min(380px, 88vw)',
            boxShadow: `0 0 80px ${glow}20, 0 0 160px ${glow}08`,
            animation: 'fadeScaleIn 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        >
          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>⏸</div>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: '1.15rem',
              color: accent, letterSpacing: '0.25em',
              textShadow: `0 0 20px ${glow}`,
            }}>PAUSED</div>
            {loc && (
              <div style={{
                fontFamily: "'Crimson Text', serif", fontSize: '0.8rem',
                color: '#789878', fontStyle: 'italic', marginTop: '0.2rem',
              }}>{loc.name}</div>
            )}

            {/* Decorative divider */}
            <div style={{
              width: 120, height: 1, margin: '0.9rem auto 0',
              background: `linear-gradient(to right, transparent, ${accent}50, transparent)`,
            }} />
          </div>

          {/* ── Quick stats ── */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.4rem', flexWrap: 'wrap' }}>
            <StatPill label="score"   value={score}          accent={accent} />
            <StatPill label="lives"   value={'❤️'.repeat(Math.max(lives, 0)) || '—'} accent="#ff8080" />
            <StatPill label="words"   value={wordsRestored}  accent={accent} />
            {combo >= 2 && <StatPill label="streak" value={`🔥×${combo}`} accent="#ffd700" />}
          </div>

          {/* ── Menu items ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <PauseItem
              onClick={onResume}
              icon="▶️" accent={accent} glow={glow} delay={0.05}
            >Resume</PauseItem>

            <PauseItem
              onClick={() => setConfirmRestart(true)}
              icon="🔄" accent="#7ad4ff" glow="rgba(122,212,255,0.35)" delay={0.1}
            >Restart Area</PauseItem>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0.2rem 0' }} />

            <PauseItem
              onClick={() => setConfirmMenu(true)}
              icon="🗺️" accent="#a0c880" glow="rgba(160,200,128,0.35)" delay={0.15}
            >Main Menu</PauseItem>

            <PauseItem
              onClick={() => setConfirmQuit(true)}
              icon="🚪" accent="#ff6060" glow="rgba(255,80,60,0.35)" danger delay={0.2}
            >Quit Game</PauseItem>
          </div>

          {/* ── ESC hint ── */}
          <div style={{
            textAlign: 'center', marginTop: '1.2rem',
            fontFamily: "'Crimson Text', serif", fontSize: '0.7rem',
            color: '#2a4a2a', fontStyle: 'italic',
          }}>Press ESC or click outside to resume</div>
        </div>
      </div>

      {/* ── Confirm dialogs ── */}
      {confirmRestart && (
        <ConfirmDialog
          message="Restart this area from the beginning? Your overall progress is safe."
          accent="#7ad4ff"
          onConfirm={() => { setConfirmRestart(false); onRestartArea() }}
          onCancel={() => setConfirmRestart(false)}
        />
      )}
      {confirmMenu && (
        <ConfirmDialog
          message="Return to the main menu? Your progress up to this point is saved."
          accent="#a0c880"
          onConfirm={() => { setConfirmMenu(false); onMainMenu() }}
          onCancel={() => setConfirmMenu(false)}
        />
      )}
      {confirmQuit && (
        <ConfirmDialog
          message="Quit the game entirely? Your progress has been saved."
          accent="#ff6060"
          onConfirm={() => { setConfirmQuit(false); onQuit() }}
          onCancel={() => setConfirmQuit(false)}
        />
      )}
    </>
  )
}