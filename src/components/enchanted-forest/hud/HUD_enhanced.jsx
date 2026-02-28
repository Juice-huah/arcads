import { useState, useEffect, useRef } from 'react'
import { LOCATIONS, TOTAL_WORDS } from '../data/locations_enhanced.js'

// ─── Heart component ─────────────────────────────────────────────────────────
function Heart({ filled, losing, idx }) {
  return (
    <div
      style={{
        width: 28, height: 28,
        position: 'relative',
        transition: 'transform 0.3s, filter 0.3s',
        transform: losing ? 'scale(1.4)' : 'scale(1)',
        filter: filled
          ? 'drop-shadow(0 0 6px #ff6060)'
          : 'brightness(0.3) saturate(0)',
        animation: filled ? `heartBeat 1.8s ${idx * 0.1}s ease-in-out infinite` : 'none',
      }}
    >
      <svg viewBox="0 0 28 28" width="28" height="28">
        <path
          d="M14,24 C14,24 3,16 3,9 C3,5.7 5.7,3 9,3 C11.1,3 12.9,4.1 14,5.7 C15.1,4.1 16.9,3 19,3 C22.3,3 25,5.7 25,9 C25,16 14,24 14,24Z"
          fill={filled ? '#ff4060' : '#402030'}
          stroke={filled ? '#ff8080' : '#503040'}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

// ─── Combo streak badge ───────────────────────────────────────────────────────
function ComboBadge({ streak, accent, glow }) {
  if (streak < 2) return null
  const size   = streak >= 5 ? 'epic' : streak >= 3 ? 'great' : 'good'
  const labels = { good: '🔥 x2', great: '⚡ STREAK!', epic: '💥 ON FIRE!' }
  const colors = { good: accent, great: '#ffd700', epic: '#ff6040' }
  const clr    = colors[size]

  return (
    <div style={{
      position: 'absolute',
      top: '4.5rem', left: '50%', transform: 'translateX(-50%)',
      zIndex: 35, pointerEvents: 'none',
      animation: 'streakPop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{
        background: `${clr}18`,
        border: `2px solid ${clr}`,
        borderRadius: 20, padding: '0.35rem 1.2rem',
        fontFamily: "'Cinzel', serif", fontSize: '0.95rem',
        color: clr, letterSpacing: '0.15em',
        boxShadow: `0 0 20px ${clr}60, 0 0 40px ${clr}30`,
        textShadow: `0 0 10px ${clr}`,
      }}>{labels[size]} COMBO {streak}</div>
    </div>
  )
}

// ─── Timer bar ───────────────────────────────────────────────────────────────
function TimerBar({ total, remaining, accent, glow }) {
  const pct    = (remaining / total) * 100
  const urgent = remaining <= 10
  const color  = urgent ? '#ff5050' : remaining <= total * 0.4 ? '#ffaa40' : accent

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 4, zIndex: 35, pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: color,
        boxShadow: `0 0 8px ${color}`,
        transition: 'width 1s linear, background 0.5s',
        animation: urgent ? 'timerUrgentPulse 0.5s ease-in-out infinite' : 'none',
      }} />
    </div>
  )
}

// ─── Hint charge pills ────────────────────────────────────────────────────────
function HintPills({ charges, maxCharges, accent, onUseHint, disabled }) {
  return (
    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
      <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.58rem', color: '#789878', letterSpacing: '0.08em', marginRight: '0.2rem' }}>HINT</span>
      {Array.from({ length: maxCharges }).map((_, i) => {
        const active = i < charges
        return (
          <div key={i} onClick={active && !disabled ? onUseHint : undefined} style={{
            width: 18, height: 18, borderRadius: '50%',
            background: active ? '#ffd700' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${active ? '#ffd700' : 'rgba(255,255,255,0.15)'}`,
            boxShadow: active ? '0 0 8px #ffd70080' : 'none',
            cursor: active && !disabled ? 'pointer' : 'default',
            transition: 'all 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.55rem',
          }}>
            {active ? '💡' : ''}
          </div>
        )
      })}
    </div>
  )
}

// ─── Skip pill ────────────────────────────────────────────────────────────────
function SkipPill({ count, accent, onUse }) {
  if (!count) return null
  return (
    <div onClick={onUse} style={{
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      background: '#ffd70015', border: '1px solid #ffd70040',
      borderRadius: 10, padding: '0.2rem 0.6rem',
      cursor: 'pointer', transition: 'all 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#ffd70028'}
      onMouseLeave={e => e.currentTarget.style.background = '#ffd70015'}
    >
      <span style={{ fontSize: '0.75rem' }}>⚡</span>
      <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', color: '#ffd700', letterSpacing: '0.08em' }}>SKIP ×{count}</span>
    </div>
  )
}

// ─── Main Enhanced HUD ───────────────────────────────────────────────────────
export default function HUD({
  loc, inventory, score,
  lives, maxLives, losingHeart,
  combo, showCombo,
  timerSeconds, timerTotal, timedMode,
  hintCharges, maxHintCharges, onUseHint,
  skipCharges, onSkip,
  streakShieldActive,
}) {
  const [showInv, setShowInv] = useState(false)
  const pct = (inventory.length / TOTAL_WORDS) * 100
  const prevScore = useRef(score)
  const [scoreDelta, setScoreDelta] = useState(null)

  useEffect(() => {
    if (score !== prevScore.current) {
      const delta = score - prevScore.current
      if (delta > 0) {
        setScoreDelta(`+${delta}`)
        setTimeout(() => setScoreDelta(null), 1400)
      }
      prevScore.current = score
    }
  }, [score])

  return (
    <>
      {/* ── Timer bar (top edge) ───────────────── */}
      {timedMode && timerSeconds !== null && (
        <TimerBar total={timerTotal} remaining={timerSeconds} accent={loc.accent} glow={loc.glow} />
      )}

      {/* ── Location banner ───────────────────── */}
      <div style={{
        position: 'absolute', top: '1.2rem', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', zIndex: 30, pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(0.8rem,2vw,1.1rem)',
          color: loc.accent, letterSpacing: '0.18em',
          textShadow: `0 0 18px ${loc.glow}`,
        }}>{loc.name}</div>
        <div style={{
          fontFamily: "'Crimson Text', serif", fontSize: '0.78rem',
          color: '#789878', fontStyle: 'italic',
        }}>{loc.subtitle}</div>
        {timedMode && timerSeconds !== null && (
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: '1.4rem',
            color: timerSeconds <= 10 ? '#ff5050' : '#ffd700',
            textShadow: `0 0 12px ${timerSeconds <= 10 ? '#ff505080' : '#ffd70060'}`,
            animation: timerSeconds <= 10 ? 'timerUrgentPulse 0.5s ease-in-out infinite' : 'none',
            marginTop: '0.1rem',
          }}>{timerSeconds}s</div>
        )}
      </div>

      {/* ── Combo badge ───────────────────────── */}
      {showCombo && <ComboBadge streak={combo} accent={loc.accent} glow={loc.glow} />}

      {/* ── Hearts (top right area) ───────────── */}
      <div style={{
        position: 'absolute', top: '1rem', right: '1.5rem', zIndex: 30,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem',
      }}>
        {/* Hearts row */}
        <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
          {streakShieldActive && (
            <span title="Streak Shield active — next wrong answer won't break your streak!" style={{
              fontSize: '0.9rem', animation: 'ringPulse 1.5s ease-in-out infinite', marginRight: '0.4rem',
            }}>🛡️</span>
          )}
          {Array.from({ length: maxLives }).map((_, i) => (
            <Heart key={i} filled={i < lives} losing={losingHeart && i === lives} idx={i} />
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', color: loc.accent, letterSpacing: '0.1em', marginBottom: '0.25rem', textAlign: 'right' }}>
            WORDS RESTORED · {Math.round(pct)}%
          </div>
          <div style={{ width: 130, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: `linear-gradient(to right, ${loc.accent}80, ${loc.accent})`,
              borderRadius: 2, transition: 'width 0.6s ease',
              boxShadow: `0 0 6px ${loc.accent}`,
            }} />
          </div>
        </div>

        {/* Score */}
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.65rem', color: '#608060', textAlign: 'right' }}>
            SCORE: {score}
          </div>
          {scoreDelta && (
            <div style={{
              position: 'absolute', right: 0, top: '-1.2rem',
              color: '#ffd700', fontFamily: "'Cinzel', serif", fontSize: '0.75rem',
              animation: 'scoreFloat 1.4s ease-out forwards', pointerEvents: 'none',
            }}>{scoreDelta}</div>
          )}
        </div>

        {/* Hint pills */}
        <HintPills
          charges={hintCharges} maxCharges={maxHintCharges}
          accent={loc.accent} onUseHint={onUseHint} disabled={false}
        />

        {/* Skip charge */}
        {skipCharges > 0 && <SkipPill count={skipCharges} accent={loc.accent} onUse={onSkip} />}
      </div>

      {/* ── Word log button (top left) ────────────── */}
      <button
        onClick={() => setShowInv(s => !s)}
        style={{
          position: 'absolute', top: '1rem', left: '1.5rem', zIndex: 31,
          fontFamily: "'Cinzel', serif", fontSize: '0.62rem', letterSpacing: '0.12em',
          color: loc.accent, background: 'rgba(4,12,6,0.82)',
          border: `1px solid ${loc.accent}40`, padding: '0.42rem 0.85rem', borderRadius: 5,
          transition: 'all 0.25s', cursor: 'pointer',
          boxShadow: showInv ? `0 0 14px ${loc.glow}` : 'none',
        }}
      >
        📜 WORD LOG
      </button>

      {/* ── Inventory panel ───────────────────────── */}
      {showInv && (
        <div style={{
          position: 'absolute', top: '3.5rem', left: '1.5rem', zIndex: 35,
          background: 'rgba(4,12,6,0.97)', border: `1px solid ${loc.accent}55`,
          borderRadius: 10, padding: '1rem 1.1rem',
          maxWidth: 270, maxHeight: 300, overflowY: 'auto',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 0 22px ${loc.glow}20`,
          animation: 'fadeScaleIn 0.3s ease',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.7rem', color: loc.accent, letterSpacing: '0.12em', marginBottom: '0.7rem' }}>
            ✦ RESTORED WORDS ({inventory.length} / {TOTAL_WORDS})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {inventory.length === 0
              ? <div style={{ fontFamily: "'Crimson Text', serif", color: '#506050', fontStyle: 'italic', fontSize: '0.9rem' }}>None yet…</div>
              : inventory.map((w, i) => (
                <span key={i} style={{
                  background: `${loc.accent}14`, border: `1px solid ${loc.accent}35`,
                  color: loc.accent, fontFamily: "'Cinzel', serif",
                  fontSize: '0.68rem', padding: '0.2rem 0.55rem', borderRadius: 3, letterSpacing: '0.08em',
                }}>{w}</span>
              ))
            }
          </div>
        </div>
      )}

      {/* ── Area dots (bottom center) ─────────────── */}
      <div style={{
        position: 'absolute', bottom: '3.2%', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '0.6rem', zIndex: 30, pointerEvents: 'none',
      }}>
        {LOCATIONS.map((l, i) => (
          <div key={i} style={{
            width:  i === loc.id ? 20 : 8,
            height: 8, borderRadius: 4,
            background: i < loc.id ? '#4dff91' : i === loc.id ? loc.accent : 'rgba(255,255,255,0.14)',
            boxShadow: i === loc.id ? `0 0 10px ${loc.glow}` : 'none',
            transition: 'all 0.5s',
          }} />
        ))}
      </div>
    </>
  )
}