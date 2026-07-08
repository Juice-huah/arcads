// src/startype/Game.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { StarField } from '../games/StarType.jsx'
import { playSound } from './sound.js'

// 🎵 IN-GAME AUDIO
import ingameMusic from './sounds/ingame.mp3';

const GAME_WIDTH = 1200
const GAME_HEIGHT = 750
const SHIP_Y = GAME_HEIGHT - 90
const MAX_LIVES = 3
const SPAWN_COLS = 12 

let idCounter = 0
const uid = () => ++idCounter

export default function Game({ wordsData, user, gameId, onGameOver }) {
  const [enemies, setEnemies] = useState([])
  const [lasers, setLasers] = useState([])
  const [explosions, setExplosions] = useState([])
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [destroyed, setDestroyed] = useState(0)
  const [wave, setWave] = useState(1)
  const [typedTotal, setTypedTotal] = useState(0)
  const [typedCorrect, setTypedCorrect] = useState(0)
  const [bestWpm, setBestWpm] = useState(0)
  const [targetId, setTargetId] = useState(null) 
  const [shakeShip, setShakeShip] = useState(false)
  const [waveMsg, setWaveMsg] = useState(null)
  const [paused, setPaused] = useState(false)
  const [targetScore, setTargetScore] = useState(10);

  const inputRef = useRef(null)
  const gameRef = useRef(null)
  const livesRef = useRef(lives)
  const scoreRef = useRef(score)
  const destroyedRef = useRef(destroyed)
  const typedTotalRef = useRef(typedTotal)
  const typedCorrectRef = useRef(typedCorrect)
  const bestWpmRef = useRef(bestWpm)
  const waveRef = useRef(wave)
  const wordStartTime = useRef(null)
  const pausedRef = useRef(false)
  
  const answerLogRef = useRef([])
  const isGameOverRef = useRef(false)

  const enemiesRef = useRef([]); 

  const allWordsListRef = useRef([]);
  const spawnIndexRef = useRef(0);

  useEffect(() => {
    const bgm = new Audio(ingameMusic);
    bgm.loop = true;
    bgm.volume = 0.4;
    let isMounted = true;
    
    const playPromise = bgm.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        if (!isMounted) bgm.pause();
      }).catch(() => {
        const forcePlay = () => { bgm.play(); window.removeEventListener('keydown', forcePlay); };
        window.addEventListener('keydown', forcePlay);
      });
    }
    
    return () => { 
      isMounted = false; 
      bgm.pause(); 
      bgm.currentTime = 0; 
      bgm.src = "";
    };
  }, []);

  useEffect(() => {
    if (allWordsListRef.current.length > 0) return; 

    const compiledWords = [];
    ['Easy', 'Medium', 'Hard', 'Expert'].forEach(tier => {
        if (wordsData[tier]) {
            const validWords = wordsData[tier].filter(w => w && w.word && w.word !== 'NO_DATA');
            const shuffledTier = [...validWords].sort(() => Math.random() - 0.5);
            compiledWords.push(...shuffledTier);
        }
    });
    
    allWordsListRef.current = compiledWords; 
    setTargetScore(compiledWords.length || 10);
  }, [wordsData]);

  useEffect(() => { livesRef.current = lives }, [lives])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { destroyedRef.current = destroyed }, [destroyed])
  useEffect(() => { typedTotalRef.current = typedTotal }, [typedTotal])
  useEffect(() => { typedCorrectRef.current = typedCorrect }, [typedCorrect])
  useEffect(() => { bestWpmRef.current = bestWpm }, [bestWpm])
  useEffect(() => { waveRef.current = wave }, [wave])
  useEffect(() => { pausedRef.current = paused }, [paused])

  const waveConfig = useCallback((w) => ({
    speed: Math.min(0.08 + w * 0.015, 0.25),      
    spawnInterval: Math.max(2800 - w * 150, 1200), 
    maxOnScreen: Math.min(3 + Math.floor(w / 4), 6),
  }), [])

  // ── SPAWN LOOP ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const cfg = waveConfig(wave)
    const interval = setInterval(() => {
      if (pausedRef.current || isGameOverRef.current) return
      
      const currentEnemies = enemiesRef.current;
      if (currentEnemies.length >= cfg.maxOnScreen) return;

      if (spawnIndexRef.current >= allWordsListRef.current.length) return; 

      const usedCols = new Set(currentEnemies.map(e => e.col));
      const availCols = Array.from({ length: SPAWN_COLS }, (_, i) => i).filter(c => !usedCols.has(c));
      
      if (availCols.length === 0) return;

      const wordObj = allWordsListRef.current[spawnIndexRef.current]; 
      
      const col = availCols[Math.floor(Math.random() * availCols.length)];
      const estimatedWidth = wordObj.word.length * 22; 
      let x = 50 + col * ((GAME_WIDTH - 150) / SPAWN_COLS);
      if (x + estimatedWidth > GAME_WIDTH - 30) { x = GAME_WIDTH - estimatedWidth - 30; }

      const isAsteroid = Math.random() < 0.3;
      const newEnemy = {
        id: uid(),
        questionId: wordObj.id, 
        word: wordObj.word,
        x,
        y: -60,
        col,
        speed: cfg.speed * (0.85 + Math.random() * 0.3),
        type: isAsteroid ? 'asteroid' : 'ship',
        rotation: isAsteroid ? Math.random() * 360 : 0,
        rotSpeed: isAsteroid ? (Math.random() - 0.5) * 2 : 0,
        wobble: Math.random() * Math.PI * 2,
        hp: 1,
      };

      enemiesRef.current = [...enemiesRef.current, newEnemy];
      setEnemies(enemiesRef.current);

      spawnIndexRef.current += 1;

    }, cfg.spawnInterval)
    return () => clearInterval(interval)
  }, [wave, waveConfig])

  // ── GAME LOOP ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let last = performance.now()
    let raf

    const tick = (now) => {
      if (isGameOverRef.current) return 
      const dt = Math.min(now - last, 50)
      last = now

      if (!pausedRef.current) {
        let crashedEnemies = 0; 

        const nextEnemies = enemiesRef.current.map(e => {
          const ny = e.y + e.speed * dt
          const nr = e.rotation + e.rotSpeed * dt * 0.1
          if (ny > GAME_HEIGHT) {
            crashedEnemies++;
            if (user && gameId && e.questionId) {
                answerLogRef.current.push({
                    student_fid: user.uid, game_id: parseInt(gameId), question_id: e.questionId, is_correct: 0
                });
            }
            return null
          }
          return { ...e, y: ny, rotation: nr }
        }).filter(Boolean)

        let currentLives = livesRef.current;

        if (crashedEnemies > 0) {
          currentLives -= crashedEnemies;
          setLives(currentLives);
          playSound('miss');
          setShakeShip(true);
          setTimeout(() => setShakeShip(false), 500);
          setTargetId(null);

          if (currentLives <= 0 && !isGameOverRef.current) {
            isGameOverRef.current = true;
            setPaused(true); 
            setTimeout(() => {
              const acc = typedTotalRef.current > 0 ? Math.round((typedCorrectRef.current / typedTotalRef.current) * 100) : 0;
              onGameOver({
                score: scoreRef.current, destroyed: destroyedRef.current, accuracy: acc, bestWpm: bestWpmRef.current, wave: waveRef.current, lives: currentLives, targetScore: targetScore
              }, answerLogRef.current);
            }, 400);
          }
        }

        const allSpawned = spawnIndexRef.current >= allWordsListRef.current.length;
        if (allSpawned && nextEnemies.length === 0 && currentLives > 0 && !isGameOverRef.current) {
            isGameOverRef.current = true;
            setPaused(true); 
            setTimeout(() => {
                const acc = typedTotalRef.current > 0 ? Math.round((typedCorrectRef.current / typedTotalRef.current) * 100) : 0;
                onGameOver({
                    score: scoreRef.current, destroyed: destroyedRef.current, accuracy: acc, bestWpm: bestWpmRef.current, wave: waveRef.current, lives: currentLives, targetScore: targetScore
                }, answerLogRef.current);
            }, 1000); 
        }

        enemiesRef.current = nextEnemies;
        setEnemies(nextEnemies);

        if (!isGameOverRef.current) {
            setLasers(prev => prev.map(l => ({ ...l, life: (l.life || 0) + dt })).filter(l => l.life < 150))
            setExplosions(prev => prev.map(ex => ({ ...ex, age: ex.age + dt })).filter(ex => ex.age < 700))
        }
      }

      if (!isGameOverRef.current) {
          raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onGameOver, user, gameId, targetScore])

  // ── DYNAMIC WAVE PROGRESSION ──────────────────────────────────────
  useEffect(() => {
    const wordsPerWave = Math.max(3, Math.ceil(targetScore / 4));

    if (score > 0 && score % wordsPerWave === 0 && spawnIndexRef.current < allWordsListRef.current.length) {
      const newWave = Math.floor(score / wordsPerWave) + 1
      if (newWave > wave) {
        setWave(newWave)
        setWaveMsg(`WAVE ${newWave}`)
        setTimeout(() => setWaveMsg(null), 2200)
        playSound('wave')
      }
    }
  }, [score, wave, targetScore])

  // ── TYPING LOGIC ────────────────────────────────────────────────────────────
  const handleInput = useCallback((e) => {
    if (isGameOverRef.current || pausedRef.current) return;
    const val = e.target.value.trimStart().toUpperCase() 
    setInput(val)

    if (!wordStartTime.current && val.length === 1) {
      wordStartTime.current = performance.now()
    }

    const hit = enemiesRef.current.find(en => en.word === val);

    if (hit) {
      enemiesRef.current = enemiesRef.current.filter(en => en.id !== hit.id);
      setEnemies(enemiesRef.current);
      
      setScore(s => s + 1);
      setDestroyed(d => d + 1);
      
      const originalWordDb = allWordsListRef.current.find(w => w.id === hit.questionId)?.word || "";
      if (originalWordDb) {
          setTypedCorrect(tc => tc + originalWordDb.length);
      }
      
      setInput('');
      setTargetId(null);

      if (wordStartTime.current) {
        const elapsed = (performance.now() - wordStartTime.current) / 1000 / 60;
        const wpm = Math.round((val.split(' ').length || 1) / elapsed);
        if (wpm > 0 && wpm < 300) setBestWpm(bw => Math.max(bw, wpm));
        wordStartTime.current = null;
      }

      const shipX = GAME_WIDTH / 2;
      setLasers(ls => [...ls, { id: uid(), x: shipX, y: SHIP_Y - 20, targetX: hit.x + 35, targetY: hit.y + 25, life: 0 }]);

      if (user && gameId && hit.questionId) {
          answerLogRef.current.push({
              student_fid: user.uid, game_id: parseInt(gameId), question_id: hit.questionId, is_correct: 1
          });
      }

      setTimeout(() => {
        if(isGameOverRef.current) return; 
        setExplosions(ex => [...ex, {
          id: uid(), x: hit.x + 30, y: hit.y + 20, age: 0,
          particles: Array.from({ length: 14 }, (_, i) => ({
            angle: (i / 14) * Math.PI * 2 + Math.random() * 0.3,
            speed: 1.5 + Math.random() * 3, size: 3 + Math.random() * 5,
            color: ['#ff6b35', '#ffd700', '#ff4444', '#fff', '#ff8c42'][Math.floor(Math.random() * 5)],
          }))
        }]);
        playSound('explode');
      }, 100);

      playSound('shoot');

    } else {
      let target = targetId ? enemiesRef.current.find(en => en.id === targetId) : null;
      if (target && !target.word.startsWith(val)) {
        target = null;
        setTargetId(null);
      }
      if (!target && val.length > 0) {
        target = [...enemiesRef.current].sort((a, b) => b.y - a.y).find(en => en.word.startsWith(val));
        if (target) setTargetId(target.id);
      }
    }
  }, [targetId, user, gameId])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setPaused(p => !p)
    if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
      setTypedTotal(tt => tt + 1)
      playSound('keypress')
    }
  }, [])

  const accuracy = typedTotal > 0 ? Math.round((typedCorrect / typedTotal) * 100) : 100
  const currentTarget = targetId ? enemies.find(e => e.id === targetId) : null
  const focusInput = () => inputRef.current?.focus()

  return (
    <div className="game-root" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, margin: '0 auto', border: '2px solid #00f5ff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 0 30px rgba(0, 245, 255, 0.2)' }} onClick={focusInput} ref={gameRef}>
      <StarField count={140} />
      <NebulaLayer />
      <HUD score={score} targetScore={targetScore} lives={lives} destroyed={destroyed} wave={wave} accuracy={accuracy} />

      {enemies.map(enemy => (
        <Enemy key={enemy.id} enemy={enemy} input={input} isTarget={enemy.id === targetId} />
      ))}

      {lasers.map(laser => <LaserBeam key={laser.id} laser={laser} />)}
      {explosions.map(ex => <Explosion key={ex.id} ex={ex} />)}

      <PlayerShip x={GAME_WIDTH / 2} y={SHIP_Y} shake={shakeShip} lives={lives} />

      <div className="typing-dock">
        <div className="typing-target-hint">
          {currentTarget
            ? <><span className="hint-arrow">▶</span> <span className="hint-word" style={{fontSize: '1.8rem'}}>{currentTarget.word}</span></>
            : <span className="hint-idle">start typing to lock on...</span>
          }
        </div>
        <div className="typing-input-wrap">
          <span className="input-cursor-icon">⌨</span>
          <input
            ref={inputRef}
            className={`typing-input ${currentTarget ? 'locked' : ''}`}
            style={{ fontSize: '1.8rem', padding: '15px 30px', letterSpacing: '3px', fontWeight: 'bold' }} 
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder="TYPE HERE..."
            autoFocus
            disabled={paused || isGameOverRef.current}
          />
        </div>
      </div>

      {waveMsg && <WaveAnnouncement msg={waveMsg} />}

      {paused && !isGameOverRef.current && (
        <div className="pause-overlay" onClick={() => setPaused(false)}>
          <div className="pause-box">
            <div className="pause-title">PAUSED</div>
            <div className="pause-sub">Press ESC or click to resume</div>
          </div>
        </div>
      )}
    </div>
  )
}

function HUD({ score, targetScore, lives, destroyed, wave, accuracy }) {
  const hearts = Array.from({ length: MAX_LIVES }, (_, i) => i < lives)
  return (
    <div className="hud">
      <div className="hud-left">
        <div className="hud-stat">
            <span className="hud-label">SCORE</span>
            <span className="hud-val score-val" style={{fontSize: '1.5rem'}}>{score} / {targetScore}</span>
        </div>
        <div className="hud-stat">
            <span className="hud-label">WAVE</span>
            <span className="hud-val wave-val" style={{fontSize: '1.5rem'}}>{wave}</span>
        </div>
      </div>
      <div className="hud-center">
        <div className="lives-display">
          {hearts.map((alive, i) => <span key={i} className={`heart ${alive ? 'alive' : 'dead'}`}>{alive ? '♥' : '♡'}</span>)}
        </div>
      </div>
      <div className="hud-right">
        <div className="hud-stat"><span className="hud-label">DESTROYED</span><span className="hud-val" style={{fontSize: '1.5rem'}}>{destroyed}</span></div>
        <div className="hud-stat"><span className="hud-label">ACCURACY</span><span className="hud-val" style={{fontSize: '1.5rem'}}>{accuracy}%</span></div>
      </div>
    </div>
  )
}

function Enemy({ enemy, input, isTarget }) {
  const { word, x, y, type, rotation } = enemy
  const typed = isTarget ? input : ''
  const matchLen = typed.length
  const correct = word.startsWith(typed)

  return (
    <div className={`enemy ${type} ${isTarget ? 'targeted' : ''}`} style={{ left: x, top: y, transform: `rotate(${rotation}deg)` }}>
      {type === 'ship' ? <EnemyShipSVG targeted={isTarget} /> : <AsteroidSVG targeted={isTarget} />}
      
      <div 
        className={`enemy-word ${isTarget ? 'word-targeted' : ''}`}
        style={{
            fontFamily: "Verdana, Arial, Helvetica, sans-serif",
            fontSize: "1.5rem",
            fontWeight: "900",
            letterSpacing: "2px",
            textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 4px 8px rgba(0,0,0,0.9)",
            marginTop: "8px",
            textTransform: "uppercase"
        }}
      >
        {word.split('').map((ch, i) => {
          let cls = 'ch-pending'
          if (isTarget) {
            if (i < matchLen) cls = correct ? 'ch-correct' : 'ch-wrong'
            else if (i === matchLen) cls = 'ch-cursor'
          }
          return <span key={i} className={`ch ${cls}`}>{ch}</span>
        })}
      </div>
    </div>
  )
}

function EnemyShipSVG({ targeted }) {
  return (
    <svg width="65" height="55" viewBox="0 0 52 44" className={`enemy-svg ${targeted ? 'svg-targeted' : ''}`}>
      <ellipse cx="26" cy="40" rx="10" ry="4" fill={targeted ? '#ff4444' : '#ff6600'} opacity="0.6" />
      <polygon points="26,2 46,38 38,34 26,40 14,34 6,38" fill={targeted ? '#cc0000' : '#8b0000'} />
      <polygon points="26,2 40,34 26,38 12,34" fill={targeted ? '#ff2222' : '#cc1111'} />
      <ellipse cx="26" cy="18" rx="7" ry="5" fill={targeted ? '#ffaaaa' : '#ff6666'} opacity="0.9" />
      <line x1="14" y1="28" x2="22" y2="34" stroke={targeted ? '#ff8888' : '#ff4444'} strokeWidth="1.5" opacity="0.7" />
      <line x1="38" y1="28" x2="30" y2="34" stroke={targeted ? '#ff8888' : '#ff4444'} strokeWidth="1.5" opacity="0.7" />
      <circle cx="20" cy="37" r="2" fill="#ffaa00" opacity="0.8" />
      <circle cx="32" cy="37" r="2" fill="#ffaa00" opacity="0.8" />
    </svg>
  )
}

function AsteroidSVG({ targeted }) {
  return (
    <svg width="65" height="65" viewBox="0 0 52 52" className={`enemy-svg ${targeted ? 'svg-targeted' : ''}`}>
      <polygon points="26,3 39,8 48,18 48,32 40,44 28,49 14,46 5,36 4,22 12,10" fill={targeted ? '#6b4c2a' : '#4a3520'} stroke={targeted ? '#ffaa44' : '#7c6040'} strokeWidth="1.5" />
      <circle cx="18" cy="18" r="4" fill={targeted ? '#8b6030' : '#5c4228'} />
      <circle cx="34" cy="28" r="3" fill={targeted ? '#8b6030' : '#5c4228'} />
      <circle cx="22" cy="36" r="2" fill={targeted ? '#8b6030' : '#5c4228'} />
      <circle cx="36" cy="15" r="2.5" fill={targeted ? '#8b6030' : '#5c4228'} />
    </svg>
  )
}

function PlayerShip({ x, y, shake, lives }) {
  const damaged = lives < MAX_LIVES;
  return (
    <div 
      className={`player-ship ${shake ? 'ship-shake' : ''} ${damaged ? 'ship-damaged' : ''}`} 
      style={{ 
        position: 'absolute', 
        left: x - 30, 
        top: y - 30, 
        width: '60px', 
        height: '60px', 
        zIndex: 10 
      }}
    >
      <svg 
        viewBox="0 0 100 100" 
        style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 10px #00f5ff)' }}
      >
        <polygon 
          points="50,10 90,90 50,75 10,90" 
          fill="rgba(0, 245, 255, 0.1)" 
          stroke="#00f5ff" 
          strokeWidth="3" 
          strokeLinejoin="round" 
        />
        <polygon 
          points="50,35 65,70 50,65 35,70" 
          fill="rgba(255, 255, 255, 0.9)" 
        />
        <circle cx="50" cy="85" r="8" fill="#fff" filter="blur(4px)" className="thruster-pulse" />
        <circle cx="50" cy="85" r="4" fill="#00f5ff" />
        {damaged && <circle cx="50" cy="45" r="6" fill="#ff4444" opacity="0.9" className="damage-blink" />}
      </svg>
    </div>
  );
}

function LaserBeam({ laser }) {
  const dx = laser.targetX - laser.x
  const dy = laser.targetY - laser.y
  const angle = Math.atan2(dy, dx) * (180 / Math.PI) - 90 
  const len = Math.sqrt(dx * dx + dy * dy)
  
  return (
    <div className="laser" style={{ 
      position: 'absolute',
      left: laser.x, 
      top: laser.y, 
      height: len, 
      width: '6px',
      background: 'linear-gradient(to bottom, #ffffff, #00f5ff)',
      boxShadow: '0 0 20px #00f5ff, 0 0 10px #ffffff',
      borderRadius: '4px',
      transform: `rotate(${angle}deg)`, 
      transformOrigin: 'top center',
      zIndex: 10
    }} />
  )
}

function Explosion({ ex }) {
  return (
    <div className="explosion" style={{ left: ex.x, top: ex.y }}>
      {ex.particles.map((p, i) => {
        const progress = ex.age / 700
        const dist = p.speed * 50 * progress
        const px = Math.cos(p.angle) * dist
        const py = Math.sin(p.angle) * dist
        return (
          <div key={i} className="particle" style={{ width: p.size * (1 - progress * 0.7), height: p.size * (1 - progress * 0.7), background: p.color, transform: `translate(${px}px, ${py}px)`, opacity: 1 - progress, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }} />
        )
      })}
      <div className="explosion-ring" style={{ width: ex.age * 0.25, height: ex.age * 0.25, opacity: Math.max(0, 0.8 - ex.age / 300) }} />
    </div>
  )
}

function WaveAnnouncement({ msg }) {
  return (
    <div className="wave-announcement" style={{fontSize: '3rem', letterSpacing: '10px'}}>
      <div className="wave-text">{msg}</div>
      <div className="wave-sub" style={{fontSize: '1.5rem'}}>INCOMING</div>
    </div>
  )
}

function NebulaLayer() {
  return (
    <div className="nebula-layer" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: 'radial-gradient(circle at 50% 30%, rgba(0, 245, 255, 0.05) 0%, transparent 70%)', zIndex: 1 }} />
  )
}