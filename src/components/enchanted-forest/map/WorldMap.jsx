import { useState, useRef } from 'react'
import { LOCATIONS } from '../data/locations_enhanced.js'

// ─── Map path definitions ─────────────────────────────────────────────────────
const PATHS = [
  { id: 'p01', d: 'M130,500 C180,500 218,380 268,378' },
  { id: 'p12', d: 'M268,378 C318,376 380,455 430,455' },
  { id: 'p23', d: 'M430,455 C480,455 510,330 560,330' },
  { id: 'p34', d: 'M560,330 C610,330 650,415 700,415' },
  { id: 'p45', d: 'M700,415 C720,370 745,270 762,185' },
]

// ─── Map icons ────────────────────────────────────────────────────────────────
function MapIcon({ type, size = 28 }) {
  const s = size
  switch (type) {
    case 'entrance': return (
      <svg width={s} height={s} viewBox="0 0 28 28">
        <ellipse cx="14" cy="20" rx="10" ry="5" fill="#2a5a18" opacity=".7"/>
        <path d="M14,4 L10,14 L8,14 L14,20 L20,14 L18,14 Z" fill="#4dff91" opacity=".9"/>
        <circle cx="14" cy="14" r="3" fill="#c9ffd0"/>
      </svg>
    )
    case 'mist': return (
      <svg width={s} height={s} viewBox="0 0 28 28">
        <ellipse cx="14" cy="18" rx="12" ry="5" fill="#7ad4ff" opacity=".3"/>
        <ellipse cx="10" cy="14" rx="8"  ry="3" fill="#7ad4ff" opacity=".5"/>
        <ellipse cx="17" cy="11" rx="7"  ry="3" fill="#c8eeff" opacity=".6"/>
        <circle cx="14" cy="10" r="4" fill="#eef8ff" opacity=".8"/>
      </svg>
    )
    case 'river': return (
      <svg width={s} height={s} viewBox="0 0 28 28">
        <path d="M4,18 Q14,10 24,18" stroke="#4fc3f7" strokeWidth="2.5" fill="none" opacity=".8"/>
        <path d="M4,22 Q14,14 24,22" stroke="#4fc3f7" strokeWidth="2"   fill="none" opacity=".5"/>
        <rect x="11" y="6" width="6" height="14" fill="#a0c8e0" opacity=".9" rx="1"/>
        <rect x="8"  y="8" width="12" height="2"  fill="#c8e8ff" opacity=".7"/>
      </svg>
    )
    case 'fire': return (
      <svg width={s} height={s} viewBox="0 0 28 28">
        <ellipse cx="14" cy="22" rx="8" ry="3" fill="#ff7020" opacity=".4"/>
        <path d="M14,4 Q18,10 16,14 Q20,10 18,16 Q22,12 20,19 Q17,24 14,24 Q11,24 8,19 Q6,12 10,16 Q8,10 12,14 Q10,10 14,4Z" fill="#ff9a3c"/>
        <path d="M14,10 Q16,14 15,17 Q14,20 13,17 Q12,14 14,10Z" fill="#fff3a0" opacity=".8"/>
      </svg>
    )
    case 'shadow': return (
      <svg width={s} height={s} viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="11" fill="#1a0835" stroke="#c084fc" strokeWidth="1.5" opacity=".9"/>
        <circle cx="14" cy="14" r="7" fill="#2a0850" opacity=".9"/>
        <circle cx="11" cy="12" r="2.5" fill="#c084fc" opacity=".8"/>
        <circle cx="17" cy="12" r="2.5" fill="#c084fc" opacity=".8"/>
        <path d="M10,18 Q14,21 18,18" stroke="#c084fc" strokeWidth="1.5" fill="none" opacity=".6"/>
      </svg>
    )
    case 'tree': return (
      <svg width={s} height={s} viewBox="0 0 28 28">
        <rect x="11" y="18" width="6" height="8" fill="#6a4828" rx="1"/>
        <circle cx="14" cy="9"  r="7"  fill="#4a8050"/>
        <circle cx="9"  cy="13" r="5"  fill="#3a7040"/>
        <circle cx="19" cy="13" r="5"  fill="#3a7040"/>
        <circle cx="14" cy="12" r="5"  fill="#5a9060"/>
        <circle cx="14" cy="8"  r="4"  fill="#ffd700" opacity=".7"/>
      </svg>
    )
    default: return null
  }
}

// ─── Ambient particles ────────────────────────────────────────────────────
const MAP_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x:   (10 + Math.random() * 80).toFixed(1),
  y:   (10 + Math.random() * 80).toFixed(1),
  dur: (4 + Math.random() * 6).toFixed(1),
  del: (Math.random() * 6).toFixed(1),
  mpx: ((Math.random() - 0.5) * 50).toFixed(0),
  mpy: (-(10 + Math.random() * 40)).toFixed(0),
  clr: ['#4dff91', '#7ad4ff', '#ffd700', '#c084fc', '#ff9a3c'][i % 5],
  sz:  3 + Math.random() * 4,
}))

// ─── Node status helper (STRICT FIX) ──────────────────────────────────────────
function nodeStatus(id, completedCount) {
  if (id < completedCount)   return 'completed'
  if (id === completedCount) return 'available' // Only the current level is available
  return 'locked' // Everything else is locked
}

// ─── World Map Component ──────────────────────────────────────────────────────
export default function WorldMap({ completedCount, onSelectLocation }) {
  const [hoveredId, setHoveredId]     = useState(null)
  const [lockedWarn, setLockedWarn]   = useState(null)
  const shakeTimers = useRef({})

  const handleNodeClick = (id) => {
    const status = nodeStatus(id, completedCount)
    if (status === 'locked') {
      setLockedWarn(id)
      clearTimeout(shakeTimers.current[id])
      shakeTimers.current[id] = setTimeout(() => setLockedWarn(null), 600)
      return
    }
    onSelectLocation(id)
  }

  return (
    <div style={{
      position: 'absolute', 
      inset: 0, zIndex: 50,
      background: 'radial-gradient(ellipse at 50% 40%, #0e2a14 0%, #060f08 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      animation: 'bossArenaIn 0.7s ease',
    }}>
      {/* ── Ambient particles ─────────────────────────────── */}
      {MAP_PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.sz, height: p.sz, borderRadius: '50%',
          background: p.clr, boxShadow: `0 0 5px 2px ${p.clr}80`,
          opacity: 0,
          animation: `mapParticle ${p.dur}s ${p.del}s infinite ease-in-out`,
          '--mpx': `${p.mpx}px`, '--mpy': `${p.mpy}px`,
          pointerEvents: 'none', zIndex: 1,
        }} />
      ))}

      {/* ── Title ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', zIndex: 10, pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'Cinzel', serif", fontWeight: 800,
          fontSize: 'clamp(1.2rem, 3vw, 2rem)', color: '#c9a84c',
          textShadow: '0 0 25px rgba(201,168,76,0.8)',
          animation: 'titlePulse 3s ease-in-out infinite',
          letterSpacing: '0.18em',
        }}>THE ENCHANTED FOREST</div>
        <div style={{
          fontFamily: "'Crimson Text', serif", fontSize: '0.9rem',
          color: '#688a68', fontStyle: 'italic', marginTop: '0.2rem',
        }}>Select a location to begin</div>
      </div>

      {/* ── Legend ────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: '5%', left: '3%', zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: '0.4rem',
        pointerEvents: 'none',
      }}>
        {[
          { clr: '#4dff91', label: 'Available' },
          { clr: '#ffd700', label: 'Completed' },
          { clr: 'rgba(255,255,255,0.2)', label: 'Locked' },
        ].map(({ clr, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: clr, boxShadow: `0 0 6px ${clr}` }} />
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.62rem', color: '#688a68', letterSpacing: '0.08em' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Progress tracker ──────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: '5%', right: '3%', zIndex: 10,
        textAlign: 'right', pointerEvents: 'none',
      }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.65rem', color: '#4dff91', letterSpacing: '0.12em' }}>
          AREAS CLEARED: {completedCount} / {LOCATIONS.length}
        </div>
        <div style={{ width: 120, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: '0.3rem', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${(completedCount / LOCATIONS.length) * 100}%`,
            background: 'linear-gradient(to right,#4dff91,#ffd700)',
            transition: 'width 0.8s ease',
            boxShadow: '0 0 6px #4dff91',
          }} />
        </div>
      </div>

      {/* ── SVG map ───────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 5,
        width: 'min(900px, 95vw)',
        height: 'min(600px, 80vh)',
      }}>
        <svg
          viewBox="0 0 900 600"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="fogGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#1a4a28" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#050f08" stopOpacity="0.05" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ── Paths (STRICT FIX: Only glow if Level i is completed) ── */}
          {PATHS.map((p, i) => {
            const isPathCleared = i < completedCount
            return (
              <g key={p.id}>
                <path d={p.d} fill="none"
                  stroke={isPathCleared ? 'rgba(77,255,145,0.15)' : 'rgba(255,255,255,0.05)'}
                  strokeWidth="12" strokeLinecap="round" />
                <path d={p.d} fill="none"
                  stroke={isPathCleared ? 'rgba(77,255,145,0.35)' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="3" strokeLinecap="round" strokeDasharray={isPathCleared ? 'none' : '6 8'} />
                {isPathCleared && (
                  <path d={p.d} fill="none"
                    stroke="#4dff91" strokeWidth="1.5" strokeLinecap="round" opacity=".6"
                    style={{ animation: 'pathGlow 3s ease-in-out infinite', animationDelay: `${i * 0.4}s` }} />
                )}
              </g>
            )
          })}

          {/* ── Location nodes ──────────────────────────── */}
          {LOCATIONS.map((loc) => {
            const { cx, cy } = loc.mapPos
            const status = nodeStatus(loc.id, completedCount)
            const isHovered = hoveredId === loc.id
            const isLocked  = status === 'locked'
            const isDone    = status === 'completed'
            const isCurrent = status === 'available'
            const nodeClr   = isDone ? '#ffd700' : isCurrent ? loc.accent : 'rgba(255,255,255,0.18)'
            const warned    = lockedWarn === loc.id

            return (
              <g key={loc.id}
                style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                onClick={() => handleNodeClick(loc.id)}
                onMouseEnter={() => !isLocked && setHoveredId(loc.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Current node pulsing glow */}
                {isCurrent && (
                  <circle cx={cx} cy={cy} r="38"
                    fill="none" stroke={nodeClr} strokeWidth="1" opacity=".3"
                    style={{
                      animation: 'mapNodePulse 2.5s ease-in-out infinite',
                      animationDelay: `${loc.id * 0.3}s`,
                      '--node-clr': nodeClr,
                    }} />
                )}

                {/* Node background */}
                <circle cx={cx} cy={cy} r={isHovered ? 32 : 28}
                  fill={isDone ? 'rgba(50,35,0,0.95)' : !isLocked ? 'rgba(5,20,10,0.95)' : 'rgba(5,5,8,0.85)'}
                  stroke={nodeClr}
                  strokeWidth={isHovered ? 3 : isDone ? 2.5 : 1.5}
                  filter={!isLocked ? 'url(#glow)' : 'none'}
                  style={{
                    transition: 'r 0.2s, stroke-width 0.2s',
                    animation: warned ? 'lockedShake 0.5s ease' : isDone ? 'mapNodeGlow 3s ease-in-out infinite' : 'none',
                    '--node-clr': nodeClr,
                  }}
                />

                <foreignObject x={cx - 14} y={cy - 16} width="28" height="28">
                  <div style={{ opacity: isLocked ? 0.3 : 1 }}>
                    <MapIcon type={loc.mapIcon} size={28} />
                  </div>
                </foreignObject>

                {isLocked && (
                  <text x={cx} y={cy + 18} textAnchor="middle" fontSize="14" fill="rgba(255,255,255,0.25)">🔒</text>
                )}

                <text x={cx} y={cy + 46} textAnchor="middle"
                  fontSize="11" fontFamily="Cinzel, serif"
                  fill={isLocked ? 'rgba(255,255,255,0.2)' : isDone ? '#ffd700' : nodeClr}
                  style={{ letterSpacing: '0.05em', textShadow: !isLocked ? `0 0 8px ${nodeClr}` : 'none' }}>
                  {loc.name}
                </text>
                
                <text x={cx} y={cy + 60} textAnchor="middle"
                  fontSize="8.5" fontFamily="Cinzel, serif" 
                  fill={isLocked ? 'rgba(255,255,255,0.18)' : isDone ? '#a08030' : nodeClr} opacity=".7">
                  {isDone ? 'Cleared' : isLocked ? 'Locked' : 'Enter'}
                </text>

                {isHovered && !isLocked && (
                  <g>
                    <rect x={cx - 80} y={cy - 72} width="160" height="28"
                      rx="5" fill="rgba(4,14,6,0.95)" stroke={nodeClr} strokeWidth="1" opacity=".9"/>
                    <text x={cx} y={cy - 54} textAnchor="middle"
                      fontSize="9" fontFamily="Crimson Text, serif"
                      fill={nodeClr} fontStyle="italic">
                      {loc.subtitle}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}