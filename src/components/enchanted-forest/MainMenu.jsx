// src/components/enchanted-forest/MainMenu.jsx
import { useState, useEffect, useRef } from 'react'

// ─── Animated rune background ─────────────────────────────────────────────────
const RUNES = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛊ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛜ','ᛞ','ᛟ']
const BG_RUNES = Array.from({ length: 18 }, (_, i) => ({
  char:  RUNES[i % RUNES.length],
  left:  `${5 + Math.random() * 90}%`,
  dur:   (12 + Math.random() * 14).toFixed(1),
  del:   (Math.random() * 10).toFixed(1),
  size:  14 + Math.random() * 18,
  opacity: 0.06 + Math.random() * 0.1,
}))

// ─── Fireflies ────────────────────────────────────────────────────────────────
const FLIES = Array.from({ length: 22 }, () => ({
  l:   5 + Math.random() * 90,
  t:   10 + Math.random() * 75,
  dur: (3 + Math.random() * 5).toFixed(1),
  del: (Math.random() * 6).toFixed(1),
  dx:  ((Math.random() - 0.5) * 120).toFixed(0),
  dy:  ((Math.random() - 0.5) * 80).toFixed(0),
  dx2: ((Math.random() - 0.5) * 70).toFixed(0),
  dy2: ((Math.random() - 0.5) * 50).toFixed(0),
  clr: ['#4dff91','#7ad4ff','#ffd700','#c084fc','#ff9a3c'][Math.floor(Math.random()*5)],
  sz:  3 + Math.random() * 4,
}))

// ─── Menu Button ──────────────────────────────────────────────────────────────
function MenuBtn({ onClick, children, accent = '#4dff91', glow = 'rgba(77,255,145,0.4)', delay = 0, disabled = false, icon, danger = false }) {
  const [hovered, setHovered] = useState(false)
  const clr = danger ? '#ff6060' : accent
  const glw = danger ? 'rgba(255,80,80,0.4)' : glow

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '0.9rem 1.6rem',
        background: hovered && !disabled
          ? `linear-gradient(135deg, ${clr}18, ${clr}08)`
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered && !disabled ? clr : disabled ? 'rgba(255,255,255,0.08)' : `${clr}35`}`,
        borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: '0.85rem',
        transition: 'all 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
        transform: hovered && !disabled ? 'translateX(6px)' : 'translateX(0)',
        boxShadow: hovered && !disabled ? `0 0 22px ${glw}` : 'none',
        animation: `slideUp 0.5s ${delay}s both ease`,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {icon && (
        <span style={{
          fontSize: '1.3rem', width: 32, textAlign: 'center',
          filter: hovered && !disabled ? `drop-shadow(0 0 6px ${clr})` : 'none',
          transition: 'filter 0.2s',
        }}>{icon}</span>
      )}
      <div style={{ textAlign: 'left' }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '0.88rem', letterSpacing: '0.18em',
          color: disabled ? '#445544' : hovered ? clr : `${clr}cc`,
          transition: 'color 0.2s',
        }}>{children}</div>
      </div>
      {!disabled && (
        <span style={{
          marginLeft: 'auto', color: clr, opacity: hovered ? 0.9 : 0,
          transition: 'opacity 0.2s', fontSize: '0.9rem',
        }}>›</span>
      )}
    </button>
  )
}

// ─── Confirm Dialog / How to Play Overlay ───────────────────────────────────────
function ModalOverlay({ title, children, onClose, accent = '#4dff91' }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.25s ease',
    }}>
      <div style={{
        background: 'rgba(4,12,6,0.98)', border: `1px solid ${accent}50`,
        borderRadius: 16, padding: '2rem', textAlign: 'center',
        maxWidth: 480, width: '90%', boxShadow: `0 0 50px ${accent}20`,
        animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: accent, marginBottom: '1.5rem', letterSpacing: '0.15em' }}>
          {title}
        </h2>
        <div style={{ textAlign: 'left', color: '#c8d8c8', marginBottom: '1.5rem', maxHeight: '50vh', overflowY: 'auto' }}>
          {children}
        </div>
        <button onClick={onClose} style={{
          fontFamily: "'Cinzel', serif", fontSize: '0.8rem', letterSpacing: '0.15em',
          color: '#040f06', background: `linear-gradient(135deg,${accent},#30aa50)`,
          padding: '0.7rem 2rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 'bold'
        }}>Close</button>
      </div>
    </div>
  )
}

// ─── Main Menu ────────────────────────────────────────────────────────────────
export default function MainMenu({ onNewGame, onQuit }) {
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [showHowTo, setShowHowTo] = useState(false)
  const [titleVisible, setTitleVisible] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setTitleVisible(true), 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const updateSize = () => {
      if (canvas.parentElement) {
        canvas.width  = canvas.parentElement.clientWidth
        canvas.height = canvas.parentElement.clientHeight
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    const drops = Array.from({ length: 60 }, () => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 600),
      speed: 0.3 + Math.random() * 0.6,
      size: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.12 + 0.03,
      color: ['#4dff91','#7ad4ff','#ffd700'][Math.floor(Math.random()*3)],
    }))
    let raf
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drops.forEach(d => {
        ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = d.color; ctx.globalAlpha = d.opacity; ctx.fill();
        d.y += d.speed; if (d.y > canvas.height) { d.y = -4; d.x = Math.random() * canvas.width }
      })
      ctx.globalAlpha = 1; raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', updateSize) }
  }, [])

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, #0e2d14 0%, #050f08 55%, #020804 100%)', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
          {BG_RUNES.map((r, i) => (
            <div key={i} style={{ position: 'absolute', left: r.left, fontFamily: 'serif', fontSize: r.size, color: '#4dff91', opacity: r.opacity, animation: `runeFloat ${r.dur}s ${r.del}s linear infinite` }}>{r.char}</div>
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
          {FLIES.map((f, i) => (
            <div key={i} style={{ position: 'absolute', left: `${f.l}%`, top: `${f.t}%`, width: f.sz, height: f.sz, borderRadius: '50%', background: f.clr, boxShadow: `0 0 8px 4px ${f.clr}90`, animation: `fireflyPulse ${f.dur}s ${f.del}s infinite ease-in-out`, '--dx': `${f.dx}px`, '--dy': `${f.dy}px`, '--dx2': `${f.dx2}px`, '--dy2': `${f.dy2}px` }} />
          ))}
        </div>
        
        <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'min(420px, 88vw)' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '2.5rem', opacity: titleVisible ? 1 : 0, transform: titleVisible ? 'translateY(0)' : 'translateY(-20px)', transition: 'opacity 0.9s ease, transform 0.9s ease' }}>
              <div style={{ fontSize: '3.8rem', marginBottom: '0.6rem', animation: 'ancientPulse 3s ease-in-out infinite', filter: 'drop-shadow(0 0 20px rgba(77,255,145,0.5))' }}>🌳</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 700, color: '#4dff91', letterSpacing: '0.22em', textShadow: '0 0 30px rgba(77,255,145,0.6)' }}>ENCHANTED FOREST</div>
              <div style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.88rem', color: '#789878', fontStyle: 'italic', letterSpacing: '0.12em' }}>Restore the words. Heal the forest.</div>
              <div style={{ width: 180, height: 1, margin: '1rem auto 0', background: 'linear-gradient(to right, transparent, #4dff9155, transparent)' }} />
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              
              <MenuBtn onClick={onNewGame} accent="#4dff91" icon="⚔️" delay={0.05}>Start Game</MenuBtn>
              
              <MenuBtn onClick={() => setShowHowTo(true)} accent="#7ad4ff" icon="📖" delay={0.1}>How to Play</MenuBtn>
              
              <div style={{ width: '100%', height: 1, margin: '0.3rem 0', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)' }} />
              
              <MenuBtn onClick={() => setConfirmQuit(true)} accent="#ff8060" icon="🚪" danger delay={0.15}>Quit Game</MenuBtn>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 Detailed How to Play Modal */}
      {showHowTo && (
        <ModalOverlay title="✦ How to Play ✦" onClose={() => setShowHowTo(false)} accent="#7ad4ff">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: "'Crimson Text', serif", fontSize: '1.05rem', lineHeight: 1.5 }}>
            <p>Welcome, Traveler. The magic of the forest has been scrambled. Only you can restore it.</p>
            <div style={{ borderLeft: '2px solid #7ad4ff', paddingLeft: '1rem' }}>
              <strong style={{ color: '#7ad4ff', fontFamily: "'Cinzel', serif", fontSize: '0.8rem' }}>1. THE MAP</strong>
              <p style={{ margin: '4px 0' }}>Select a glowing location on the World Map to travel there.</p>
            </div>
            <div style={{ borderLeft: '2px solid #7ad4ff', paddingLeft: '1rem' }}>
              <strong style={{ color: '#7ad4ff', fontFamily: "'Cinzel', serif", fontSize: '0.8rem' }}>2. UNSCRAMBLE</strong>
              <p style={{ margin: '4px 0' }}>Each location has a scrambled word. Look at the letter tiles and the hint, then type the correct word to heal that area.</p>
            </div>
            <div style={{ borderLeft: '2px solid #7ad4ff', paddingLeft: '1rem' }}>
              <strong style={{ color: '#7ad4ff', fontFamily: "'Cinzel', serif", fontSize: '0.8rem' }}>3. BOSS BATTLES</strong>
              <p style={{ margin: '4px 0' }}>Some areas are guarded by powerful spirits. Solve words quickly to strike them down before they strike you!</p>
            </div>
            <div style={{ borderLeft: '2px solid #7ad4ff', paddingLeft: '1rem' }}>
              <strong style={{ color: '#7ad4ff', fontFamily: "'Cinzel', serif", fontSize: '0.8rem' }}>4. AUTO-SAVE</strong>
              <p style={{ margin: '4px 0' }}>Play carefully! Your score will be automatically saved and submitted once the game is finished or your health runs out.</p>
            </div>
            <p style={{ fontStyle: 'italic', textAlign: 'center', marginTop: '0.5rem', color: '#4dff91' }}>"Let your mind be as keen as a blade."</p>
          </div>
        </ModalOverlay>
      )}

      {/* Confirm Quit Modal */}
      {confirmQuit && (
        <ModalOverlay title="⚠️ Confirm Quit" onClose={() => setConfirmQuit(false)} accent="#ff6060">
          <p style={{ textAlign: 'center', fontSize: '1.1rem' }}>Are you sure you want to leave the forest? Any unfinished progress will be lost!</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button onClick={() => { setConfirmQuit(false); if (onQuit) onQuit(); else window.history.back(); }} style={{ padding: '0.6rem 1.5rem', background: '#ff6060', border: 'none', borderRadius: 6, color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>Yes, Quit</button>
            <button onClick={() => setConfirmQuit(false)} style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid #555', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>Stay</button>
          </div>
        </ModalOverlay>
      )}
    </>
  )
}