import { useState, useEffect, useRef } from 'react'
import BossSprite from '../boss/BossSprite.jsx'
import { checkWord, partialReveal } from '../data/locations_enhanced.js'

// ─── HP Orbs ─────────────────────────────────────────────────────────────────
function HpOrbs({ total, remaining, clr }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => {
        const alive = i < remaining
        return (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: '50%',
            background: alive ? clr : 'rgba(255,255,255,0.08)',
            border: `2px solid ${alive ? clr : 'rgba(255,255,255,0.15)'}`,
            boxShadow: alive ? `0 0 10px 3px ${clr}` : 'none',
            transition: 'all 0.4s ease',
            animation: alive ? `mapNodeGlow 2s ease-in-out infinite` : 'hpOrbDie 0.5s ease forwards',
            '--node-clr': clr,
          }} />
        )
      })}
    </div>
  )
}

// ─── Lightning BG effect ─────────────────────────────────────────────────────
function LightningBG({ clr }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 65% 35%, ${clr}18 0%, transparent 65%)`,
        animation: 'thunderFlash 8s ease-in-out infinite',
      }} />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: 0, right: 0,
          top: `${8 + i * 12}%`, height: 1,
          background: `linear-gradient(to right, transparent, ${clr}10, transparent)`,
          opacity: 0.4,
        }} />
      ))}
    </div>
  )
}

// ─── Scramble Tiles ───────────────────────────────────────────────────────────
function ScrambleTiles({ word, accent }) {
  const letters = word.scrambled.split('')
  const maxTileW = 46 
  const tileW    = Math.min(maxTileW, Math.floor(Math.min(window.innerWidth * 0.78, 640) / letters.length) - 4)
  return (
    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', flexWrap: 'wrap', margin: '0.6rem 0' }}>
      {letters.map((ch, i) => (
        <div key={i} style={{
          width: tileW, height: tileW,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `rgba(0,0,0,0.6)`, 
          border: `1px solid ${accent}55`, borderRadius: 8,
          fontFamily: "'Cinzel', serif", fontWeight: 700,
          fontSize: tileW > 38 ? '1.2rem' : '0.9rem',
          color: accent,
          boxShadow: `0 4px 10px rgba(0,0,0,0.7)`,
          animation: `tileFloat ${1.4 + i * 0.14}s ${i * 0.05}s ease-in-out infinite alternate`,
        }}>{ch}</div>
      ))}
    </div>
  )
}

export default function BossEncounter({ loc, boss, onDefeat }) {
  const [phase, setPhase] = useState('entrance')
  const [introLine, setIntroLine] = useState(0)
  const [wordIdx, setWordIdx] = useState(0)
  const [hpLeft, setHpLeft] = useState(boss.hp)
  const [attempts, setAttempts] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [isAttacking, setIsAttacking] = useState(false)
  const [isHit, setIsHit] = useState(false)
  const [isDefeated, setIsDefeated] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [fbMsg, setFbMsg] = useState('')
  const [fbType, setFbType] = useState(null)
  const [defeatLine, setDefeatLine] = useState(0)

  const inputRef = useRef(null)
  const shakeRef = useRef(null)
  const word = boss.words[wordIdx]

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('intro')
      setIntroLine(0)
    }, 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase === 'fight') {
      setInputVal('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [phase, wordIdx])

  const advanceIntro = () => {
    if (introLine < boss.introLines.length - 1) setIntroLine(l => l + 1)
    else setPhase('fight')
  }

  const triggerShake = () => {
    setShaking(true)
    clearTimeout(shakeRef.current)
    shakeRef.current = setTimeout(() => setShaking(false), 600)
  }

  const handleSubmit = () => {
    if (!inputVal.trim() || phase !== 'fight') return
    const val = inputVal.toUpperCase()
    setInputVal('')

    if (checkWord(val, word.answer)) {
      setIsHit(true)
      setFbMsg(`✦ "${word.answer}" — Correct!`)
      setFbType('ok')
      setTimeout(() => setIsHit(false), 700)
      const newHp = hpLeft - 1
      setHpLeft(newHp)
      setTimeout(() => setFbMsg(''), 2000)

      if (newHp <= 0) {
        setTimeout(() => {
          setPhase('defeated')
          setIsDefeated(true)
          setDefeatLine(0)
        }, 900)
      } else {
        setWordIdx(w => w + 1)
        setAttempts(0)
        setShowHint(false)
      }
    } else {
      const na = attempts + 1
      setAttempts(na)
      if (na >= 3) setShowHint(true)
      setIsAttacking(true)
      triggerShake()
      setFbMsg(boss.attackLines[Math.floor(Math.random() * boss.attackLines.length)])
      setFbType('fail')
      setTimeout(() => setIsAttacking(false), 600)
      setTimeout(() => { setFbMsg(''); setFbType(null) }, 2500)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  const advanceDefeat = () => {
    if (defeatLine < boss.defeatLines.length - 1) setDefeatLine(l => l + 1)
    else onDefeat()
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 45,
      background: `radial-gradient(ellipse at 65% 40%, ${boss.glowClr}14 0%, #040208 70%)`,
      animation: 'bossArenaIn 0.6s ease', overflow: 'hidden',
    }}>
      <LightningBG clr={boss.clr} />

      <div style={{ position: 'absolute', inset: 0, animation: shaking ? 'screenShake 0.5s ease' : 'none' }}>
        
        {/* ── BOSS HUD (CLEAN & AT THE BOTTOM) ── */}
        {/* 🟢 FIXED: Moved from Top to Bottom-Right to keep the top clean */}
        <div style={{
          position: 'absolute', bottom: '30px', right: '35px',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          zIndex: 15, pointerEvents: 'none', gap: '0.6rem'
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1.2rem', color: boss.clr, letterSpacing: '0.15em', textShadow: `0 2px 10px ${boss.glowClr}, 0 0 5px #000` }}>
              ⚔ {boss.name}
            </div>
            <div style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.85rem', color: '#aaa', fontStyle: 'italic', marginTop: '0.1rem' }}>
              {boss.title}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.7rem', color: boss.clr, opacity: 0.8 }}>HP</div>
            <HpOrbs total={boss.hp} remaining={hpLeft} clr={boss.clr} />
          </div>
        </div>

        {/* ── BOSS SPRITE ── */}
        <div style={{ position: 'absolute', right: '5%', top: '45%', transform: 'translateY(-50%)', zIndex: 5 }}>
          <div style={{
            animation: isHit ? 'bossHit 0.45s ease' : isDefeated ? 'bossDefeat 1.2s ease forwards' : `bossFloat 3.5s ease-in-out infinite, bossIdleGlow 3s ease-in-out infinite`,
            '--boss-clr': boss.glowClr, filter: isDefeated ? undefined : `drop-shadow(0 0 18px ${boss.glowClr})`,
          }}>
            <BossSprite type={boss.type} isAttacking={isAttacking} isDefeated={isDefeated} clr={boss.clr} glowClr={boss.glowClr} />
          </div>
        </div>

        {/* ── PUZZLE / DIALOGUE BOX (Stays at the Top) ── */}
        {(phase === 'fight' || phase === 'intro' || phase === 'defeated') && (
          <div style={{
            position: 'absolute', top: '16%', left: '50%', transform: 'translateX(-50%)',
            width: 'min(620px, 92vw)', zIndex: 20,
            background: 'rgba(4, 12, 6, 0.35)', border: `1px solid ${boss.clr}40`,
            borderRadius: 16, padding: '1.4rem', backdropFilter: 'blur(6px)',
            boxShadow: `0 10px 40px rgba(0,0,0,0.5)`, animation: 'fadeScaleIn 0.4s ease',
          }}>
            {phase === 'intro' && (
              <>
                <div style={{ fontFamily: "'Crimson Text', serif", fontSize: '1.15rem', color: '#e0e0e8', fontStyle: 'italic', marginBottom: '1rem' }}>
                  {boss.introLines[introLine]}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={advanceIntro} style={{ fontFamily: "'Cinzel', serif", color: '#000', background: boss.clr, padding: '0.5rem 1.2rem', borderRadius: 4, cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>
                    {introLine < boss.introLines.length - 1 ? 'Next' : 'Fight!'}
                  </button>
                </div>
              </>
            )}

            {phase === 'fight' && (
              <>
                <div style={{ textAlign: 'center', fontFamily: "'Crimson Text', serif", fontSize: '1.25rem', color: '#fff', fontStyle: 'italic', marginBottom: '0.8rem' }}>
                  {word.hint}
                </div>
                <ScrambleTiles word={word} accent={boss.clr} />
                {showHint && <div style={{ color: boss.clr, textAlign: 'center', fontSize: '0.8rem', margin: '0.5rem 0' }}>💡 {partialReveal(word.answer)}</div>}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <input ref={inputRef} value={inputVal} onChange={e => setInputVal(e.target.value.toUpperCase())} onKeyDown={handleKey} placeholder="Enter answer..." style={{ flex: 1, padding: '0.7rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${boss.clr}50`, color: '#fff', outline: 'none', borderRadius: 8 }} />
                  <button onClick={handleSubmit} style={{ background: boss.clr, color: '#000', padding: '0 1.5rem', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>STRIKE</button>
                </div>
              </>
            )}

            {phase === 'defeated' && (
              <>
                <div style={{ fontFamily: "'Crimson Text', serif", fontSize: '1.15rem', color: '#fff', fontStyle: 'italic', marginBottom: '1rem' }}>
                  {boss.defeatLines[defeatLine]}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={advanceDefeat} style={{ background: boss.clr, color: '#000', padding: '0.6rem 1.5rem', borderRadius: 4, cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>
                    {defeatLine < boss.defeatLines.length - 1 ? 'Next' : 'Victory!'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── FEEDBACK MESSAGES ── */}
        {fbMsg && (
          <div style={{
            position: 'absolute', bottom: '150px', left: '50%', transform: 'translateX(-50%)',
            background: fbType === 'ok' ? 'rgba(20,40,20,0.95)' : 'rgba(40,20,20,0.95)',
            border: `1px solid ${fbType === 'ok' ? boss.clr : '#f55'}`,
            color: '#fff', padding: '0.8rem 1.5rem', borderRadius: 10, zIndex: 100,
            fontFamily: "'Cinzel', serif", fontSize: '0.9rem', boxShadow: '0 5px 20px rgba(0,0,0,0.5)'
          }}>{fbMsg}</div>
        )}
      </div>
    </div>
  )
}