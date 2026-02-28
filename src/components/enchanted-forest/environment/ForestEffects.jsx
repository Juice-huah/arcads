import { useState, useEffect, useRef } from 'react'

// ─── Glowing ambient lights (firefly-style but bigger, more atmospheric) ────
const GLOW_LIGHTS = Array.from({ length: 8 }, (_, i) => ({
  left:  `${10 + Math.random() * 80}%`,
  top:   `${15 + Math.random() * 55}%`,
  size:  12 + Math.random() * 20,
  dur:   (2.5 + Math.random() * 3).toFixed(1),
  del:   (Math.random() * 5).toFixed(1),
  fdur:  (4 + Math.random() * 4).toFixed(1),
  fdel:  (Math.random() * 3).toFixed(1),
  glx:   `${(Math.random() - 0.5) * 60}px`,
  gly:   `${(Math.random() - 0.5) * 40}px`,
  glx2:  `${(Math.random() - 0.5) * 40}px`,
  gly2:  `${(Math.random() - 0.5) * 30}px`,
}))

// ─── Wind particles ─────────────────────────────────────────────────────────
const WIND_PARTICLES = Array.from({ length: 12 }, () => ({
  top:   `${25 + Math.random() * 50}%`,
  dur:   (3 + Math.random() * 4).toFixed(1),
  del:   (Math.random() * 8).toFixed(1),
  wx:    `${120 + Math.random() * 200}px`,
  wy:    `${(Math.random() - 0.5) * 40}px`,
  width: 20 + Math.random() * 40,
  opacity: 0.15 + Math.random() * 0.2,
}))

// ─── Tree sway (applied via CSS class in animations.css) ────────────────────
function SwayingTrees({ color }) {
  return (
    <svg
      style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '72%',
        zIndex: 5, pointerEvents: 'none',
        animation: 'windSway 6s ease-in-out infinite',
        transformOrigin: 'bottom center',
      }}
      viewBox="0 0 1000 520"
      preserveAspectRatio="xMidYMax slice"
    >
      {/* Left trees — each given a slight offset wind sway */}
      <g style={{ transformOrigin: '0% 100%', animation: 'windSway 7s 0.3s ease-in-out infinite' }}>
        <path d="M0,520 L0,200 Q25,130 50,200 L50,520Z" fill={color} />
        <path d="M15,520 L15,160 Q45,85 75,160 L75,520Z" fill={color} opacity=".92" />
        <path d="M60,520 L60,220 Q82,165 104,220 L104,520Z" fill={color} />
        <path d="M100,520 L100,175 Q130,105 160,175 L160,520Z" fill={color} opacity=".85" />
        <path d="M145,520 L145,240 Q162,200 179,240 L179,520Z" fill={color} opacity=".7" />
        <path d="M170,520 L170,210 Q192,155 214,210 L214,520Z" fill={color} opacity=".55" />
      </g>
      {/* Right trees */}
      <g style={{ transformOrigin: '100% 100%', animation: 'windSway 7.5s 1s ease-in-out infinite' }}>
        <path d="M786,520 L786,215 Q804,174 822,215 L822,520Z" fill={color} opacity=".55" />
        <path d="M820,520 L820,230 Q838,190 856,230 L856,520Z" fill={color} opacity=".7" />
        <path d="M840,520 L840,185 Q870,115 900,185 L900,520Z" fill={color} opacity=".85" />
        <path d="M888,520 L888,170 Q918,95 948,170 L948,520Z" fill={color} />
        <path d="M935,520 L935,195 Q957,140 979,195 L979,520Z" fill={color} opacity=".92" />
        <path d="M965,520 L965,210 Q983,165 1001,210 L1001,520Z" fill={color} />
      </g>
      {/* Ground cover */}
      <rect x="0" y="480" width="1000" height="45" fill={color} />
    </svg>
  )
}

// ─── Ambient glowing orbs ────────────────────────────────────────────────────
function GlowOrbs({ color }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none', overflow: 'hidden' }}>
      {GLOW_LIGHTS.map((g, i) => (
        <div
          key={i}
          className="ambient-light"
          style={{
            left: g.left, top: g.top,
            width: g.size, height: g.size,
            background: color,
            boxShadow: `0 0 ${g.size * 2}px ${g.size}px ${color}`,
            '--gl-dur':  `${g.dur}s`,
            '--gl-del':  `${g.del}s`,
            '--gl-fdur': `${g.fdur}s`,
            '--gl-fdel': `${g.fdel}s`,
            '--glx':  g.glx, '--gly':  g.gly,
            '--glx2': g.glx2, '--gly2': g.gly2,
          }}
        />
      ))}
    </div>
  )
}

// ─── Wind streaks ─────────────────────────────────────────────────────────────
function WindStreaks({ color }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', overflow: 'hidden' }}>
      {WIND_PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '-5%', top: p.top,
            width: p.width, height: 2,
            borderRadius: 2,
            background: `linear-gradient(to right, transparent, ${color}${Math.floor(p.opacity * 255).toString(16).padStart(2,'0')}, transparent)`,
            opacity: 0,
            animation: `windParticle ${p.dur}s ${p.del}s ease-in-out infinite`,
            '--wx': p.wx, '--wy': p.wy,
          }}
        />
      ))}
    </div>
  )
}

// ─── Death overlay ────────────────────────────────────────────────────────────
export function DeathOverlay({ onComplete }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2800)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0)',
      animation: 'deathFade 2.8s ease forwards',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        textAlign: 'center',
        animation: 'deathShatter 2.8s ease forwards',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💀</div>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: '1.8rem', color: '#ff4060',
          letterSpacing: '0.25em', textShadow: '0 0 30px #ff406080',
        }}>DEFEATED</div>
        <div style={{
          fontFamily: "'Crimson Text', serif", color: '#789878',
          fontSize: '0.9rem', fontStyle: 'italic', marginTop: '0.5rem',
        }}>Returning to last checkpoint…</div>
      </div>
    </div>
  )
}

// ─── Main ForestEffects component ─────────────────────────────────────────────
export default function ForestEffects({ loc, intensity = 'normal' }) {
  const glowColor = loc.glow || 'rgba(77,255,145,0.3)'
  const windColor = loc.ptcClr || loc.accent

  // Intensity multiplier for how visible effects are
  const alpha = intensity === 'calm' ? 0.4 : intensity === 'storm' ? 1.2 : 0.7

  return (
    <>
      <SwayingTrees color={loc.treeClr} />
      <GlowOrbs  color={glowColor.replace(/[\d.]+\)$/, `${alpha * 0.35})`)} />
      <WindStreaks color={windColor} />
    </>
  )
}