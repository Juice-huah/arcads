import { useState, useEffect } from 'react'
import { CHEST_REWARDS } from '../data/locations_enhanced.js'

// ─── Rarity config ────────────────────────────────────────────────────────────
const RARITY_CONFIG = {
  common:    { label: 'Common',    color: '#a0c880', glow: 'rgba(160,200,128,0.5)',  lid: '#7a5a30', body: '#5a4020', particles: 8,  sfxClass: '' },
  rare:      { label: 'Rare',      color: '#7ad4ff', glow: 'rgba(122,212,255,0.6)', lid: '#204080', body: '#183060', particles: 14, sfxClass: 'rare' },
  legendary: { label: 'Legendary', color: '#ffd700', glow: 'rgba(255,215,0,0.8)',   lid: '#5a3a00', body: '#3a2000', particles: 22, sfxClass: 'legendary' },
}

// ─── Chest Lid SVG ────────────────────────────────────────────────────────────
function ChestSVG({ rarity, open, onOpen, small }) {
  const cfg  = RARITY_CONFIG[rarity]
  const size = small ? 48 : 72

  return (
    <div
      onClick={!open ? onOpen : undefined}
      style={{
        position: 'relative', cursor: open ? 'default' : 'pointer',
        width: size, height: size,
        transition: 'transform 0.2s',
        filter: open ? `drop-shadow(0 0 12px ${cfg.color})` : `drop-shadow(0 0 6px ${cfg.glow})`,
      }}
      onMouseEnter={e => { if (!open) e.currentTarget.style.transform = 'scale(1.1) translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = '' }}
    >
      <svg viewBox="0 0 72 72" width={size} height={size}>
        {/* Base */}
        <rect x="6" y="36" width="60" height="30" rx="4" fill={cfg.body} stroke={cfg.color} strokeWidth="2" />
        {/* Latch */}
        <rect x="28" y="42" width="16" height="12" rx="3" fill={cfg.color} opacity="0.9" />
        <circle cx="36" cy="48" r="3" fill={cfg.body} />
        {/* Horizontal band */}
        <rect x="6" y="52" width="60" height="4" rx="1" fill={cfg.color} opacity="0.35" />
        {/* Lid */}
        <g style={{
          transformOrigin: '36px 36px',
          transform: open ? 'rotate(-80deg) translateY(-8px)' : 'rotate(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.34,1.2,0.64,1)',
        }}>
          <rect x="6" y="18" width="60" height="20" rx="4 4 0 0" fill={cfg.lid} stroke={cfg.color} strokeWidth="2" />
          {/* Lid band */}
          <rect x="6" y="28" width="60" height="4" rx="1" fill={cfg.color} opacity="0.35" />
          {/* Lock keyhole */}
          {!open && <ellipse cx="36" cy="22" rx="5" ry="4" fill={cfg.color} opacity="0.7" />}
          {!open && <rect x="34" y="24" width="4" height="5" rx="1" fill={cfg.color} opacity="0.7" />}
        </g>
        {/* Glow ring when open */}
        {open && <circle cx="36" cy="36" r="30" fill="none" stroke={cfg.color} strokeWidth="1.5" opacity="0.4"
          style={{ animation: 'ringPulse 1.5s ease-in-out infinite' }} />}
      </svg>
      {/* Rarity gem on top */}
      {rarity === 'legendary' && !open && (
        <div style={{
          position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
          fontSize: '0.9rem', animation: 'ancientPulse 2s ease-in-out infinite',
        }}>✦</div>
      )}
    </div>
  )
}

// ─── Burst particles ─────────────────────────────────────────────────────────
function BurstParticles({ count, color }) {
  const pts = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360
    const dist  = 30 + Math.random() * 50
    return {
      dx: Math.cos(angle * Math.PI / 180) * dist,
      dy: Math.sin(angle * Math.PI / 180) * dist - 20,
      size: 3 + Math.random() * 5,
      dur: 0.6 + Math.random() * 0.6,
    }
  })

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {pts.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: p.size, height: p.size,
          borderRadius: '50%', background: color,
          boxShadow: `0 0 6px ${color}`,
          animation: `burstParticle ${p.dur}s ease-out forwards`,
          '--bx': `${p.dx}px`, '--by': `${p.dy}px`,
        }} />
      ))}
    </div>
  )
}

// ─── Reward popup ─────────────────────────────────────────────────────────────
function RewardPopup({ reward, rarity, onClaim }) {
  const cfg     = RARITY_CONFIG[rarity]
  const rewardCfg = CHEST_REWARDS[reward]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 210,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
      animation: 'fadeScaleIn 0.3s ease',
    }}>
      <div style={{
        background: 'rgba(4,12,6,0.99)',
        border: `2px solid ${cfg.color}`,
        borderRadius: 22, padding: '2.2rem 3rem',
        textAlign: 'center', maxWidth: 400,
        boxShadow: `0 0 80px ${cfg.glow}, 0 0 160px ${cfg.glow}50`,
        animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative', overflow: 'visible',
      }}>
        {/* Rarity label */}
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: '0.65rem', letterSpacing: '0.25em',
          color: cfg.color, marginBottom: '0.7rem', opacity: 0.85,
        }}>✦ {cfg.label.toUpperCase()} CHEST OPENED ✦</div>

        {/* Icon */}
        <div style={{ fontSize: '3.5rem', marginBottom: '0.6rem', animation: 'victoryFloat 2s ease-in-out infinite' }}>
          {rewardCfg?.icon || '🎁'}
        </div>

        {/* Reward label */}
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: '1.2rem', color: cfg.color,
          letterSpacing: '0.1em', marginBottom: '0.4rem',
          textShadow: `0 0 20px ${cfg.glow}`,
        }}>
          {rewardCfg?.label || 'Mystery Reward'}
        </div>

        {/* Flavor */}
        <div style={{
          fontFamily: "'Crimson Text', serif", fontSize: '0.95rem',
          color: '#c0d8c0', fontStyle: 'italic', lineHeight: 1.65,
          marginBottom: '1.4rem',
        }}>
          {getFlavorText(reward, rarity)}
        </div>

        <button
          onClick={onClaim}
          style={{
            fontFamily: "'Cinzel', serif", fontSize: '0.78rem', letterSpacing: '0.15em',
            color: '#040f06',
            background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
            padding: '0.7rem 2.2rem', borderRadius: 8,
            boxShadow: `0 0 20px ${cfg.glow}`,
            border: 'none', cursor: 'pointer', transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = ''}
        >Claim Reward ✦</button>
      </div>
    </div>
  )
}

function getFlavorText(reward, rarity) {
  const texts = {
    hint:        ["A hint crystal — the forest's guidance, bottled.", "Wisdom stored for when the path grows uncertain.", "Even the bravest need a nudge sometimes."],
    heart:       ["A life-leaf! The forest breathes new vitality into you.", "A piece of the Ancient Tree's heartwood, glowing with life.", "One more chance — the forest believes in you."],
    reveal:      ["A letter-sight shard — reveals the first letter of any word.", "Ancient rune magic that parts the scramble's veil.", "The cursor of truth. Use it wisely."],
    score_boost: ["Golden scoring runes awaken your point total!", "The forest recognizes your courage with golden tribute.", "A surge of knowledge, measured in points."],
    skip:        ["A lightning scroll — skip one word without penalty.", "Some words resist even masters. This grants safe passage.", "A strategic retreat that preserves your strength."],
    streak_save: ["A shield rune! Your next wrong answer won't break your combo.", "The forest's protection against a single moment of doubt.", "Your streak is now armor — once."],
    secret_lore: ["Ancient words bloom in your mind — the forest's hidden history.", "A scroll of deep knowledge, never meant for ordinary eyes.", "You have unlocked a secret of this world."],
  }
  const arr = texts[reward] || ["A mysterious reward from the ancient chest!"]
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Main TreasureChest component ────────────────────────────────────────────
export default function TreasureChest({
  id, rarity = 'common', reward,
  isUnlocked, isAvailable = true,
  pos, // { x: percent, y: percent }
  onOpen, // callback(id, reward)
}) {
  const [opened,  setOpened]  = useState(isUnlocked)
  const [bursting, setBursting] = useState(false)
  const [showReward, setShowReward] = useState(false)
  const cfg = RARITY_CONFIG[rarity]

  const handleOpen = () => {
    if (opened || !isAvailable) return
    setOpened(true)
    setBursting(true)
    setTimeout(() => setBursting(false), 1000)
    setTimeout(() => setShowReward(true), 400)
  }

  const handleClaim = () => {
    setShowReward(false)
    if (onOpen) onOpen(id, reward)
  }

  if (!isAvailable && !opened) {
    return (
      <div style={{
        position: 'absolute',
        left: `${pos.x}%`, top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 12, opacity: 0.25, pointerEvents: 'none',
        filter: 'grayscale(1)',
      }}>
        <ChestSVG rarity={rarity} open={false} small />
      </div>
    )
  }

  return (
    <>
      <div style={{
        position: 'absolute',
        left: `${pos.x}%`, top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 12,
        animation: !opened ? `chestFloat ${2 + Math.random() * 1.5}s ease-in-out infinite` : 'none',
      }}>
        {/* Glow beneath chest */}
        {!opened && (
          <div style={{
            position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
            width: 56, height: 16, borderRadius: '50%',
            background: `radial-gradient(ellipse, ${cfg.glow} 0%, transparent 70%)`,
            animation: 'ringPulse 2s ease-in-out infinite',
          }} />
        )}

        <div style={{ position: 'relative' }}>
          <ChestSVG rarity={rarity} open={opened} onOpen={handleOpen} />
          {bursting && <BurstParticles count={cfg.particles} color={cfg.color} />}

          {/* Tooltip on hover */}
          {!opened && isAvailable && (
            <div style={{
              position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(4,12,6,0.95)',
              border: `1px solid ${cfg.color}50`,
              borderRadius: 6, padding: '0.3rem 0.7rem',
              fontFamily: "'Cinzel', serif", fontSize: '0.58rem',
              color: cfg.color, letterSpacing: '0.12em',
              whiteSpace: 'nowrap', pointerEvents: 'none',
              opacity: 0, transition: 'opacity 0.2s',
            }} className="chest-tooltip">
              {cfg.label} Chest
            </div>
          )}
        </div>

        {/* Already opened indicator */}
        {opened && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            fontSize: '1.4rem', opacity: 0.6,
          }}>✓</div>
        )}
      </div>

      {showReward && <RewardPopup reward={reward} rarity={rarity} onClaim={handleClaim} />}
    </>
  )
}