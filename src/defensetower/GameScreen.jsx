// src/defensetower/GameScreen.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import HUD              from "./HUD";
import EnemyLane        from "./EnemyLane";
import Castle           from "./Castle";
import BattlefieldBackground from "./BattlefieldBackground";
import { AnswerTower, GameProjectile } from "./Tower";
import WaveAnnouncer    from "./WaveAnnouncer";
import { useHitEffects } from "./HitEffect";
import soundManager     from "./SoundManager";
import { GAME_CONSTANTS, getTowerLevel, ABILITIES } from "./gameData";

const FONT = "'Cinzel', 'Palatino Linotype', serif";
const FONT_B = "'Crimson Text', 'Georgia', serif";
const BASE_SPEED = 0.16;
let enemyIdCounter = 0;

function getDynamicWaveConfig(waveNum, waveSequence, allQuestions) {
  const targetDiff = waveSequence[waveNum - 1] || "Easy";
  const waveQs = allQuestions.filter(q => q.difficulty === targetDiff);
  const count = waveQs.length > 0 ? waveQs.length : 5; 
  const isBoss = targetDiff.toLowerCase() === "boss";
  
  let speedMult = 1.0;
  if (targetDiff === "Easy") speedMult = 0.8;
  if (targetDiff === "Medium") speedMult = 1.0;
  if (targetDiff === "Hard") speedMult = 1.4;
  if (targetDiff === "Boss") speedMult = 1.2;

  return { label: targetDiff, speedMult, count, boxCount: count, isBossWave: isBoss, spawnMs: isBoss ? 2500 : 3500 };
}

const ENEMY_POOL = [
  { id:"goblin",   emoji:"👺", label:"Goblin",      speed:1.0, color:"#4ade80", size:1.0,  deathStyle:"burst",   walkStyle:"hop"    },
  { id:"skeleton", emoji:"💀", label:"Skeleton",    speed:1.3, color:"#e2e8f0", size:1.0,  deathStyle:"collapse",walkStyle:"shuffle" },
  { id:"troll",    emoji:"👹", label:"Troll",       speed:0.7, color:"#f97316", size:1.2,  deathStyle:"fade",    walkStyle:"stomp"   },
  { id:"dragon",   emoji:"🐉", label:"Dragon",      speed:0.5, color:"#ef4444", size:1.3,  deathStyle:"explode", walkStyle:"crawl"   },
  { id:"witch",    emoji:"🧙", label:"Witch",       speed:1.1, color:"#a855f7", size:1.0,  deathStyle:"fade",    walkStyle:"glide"   },
  { id:"orc",      emoji:"👾", label:"Orc Warrior", speed:0.9, color:"#65a30d", size:1.1,  deathStyle:"burst",   walkStyle:"stomp"   },
];
const BOSS_POOL = [
  { id:"goblin_king", emoji:"👑", label:"Goblin King", speed:0.65, color:"#fbbf24", size:1.8, deathStyle:"explode", walkStyle:"stomp", isBoss:true },
  { id:"lich_lord",   emoji:"☠️",  label:"Lich Lord",   speed:0.5,  color:"#818cf8", size:1.9, deathStyle:"implode", walkStyle:"float", isBoss:true },
  { id:"dark_dragon", emoji:"🔥", label:"Dark Dragon",  speed:0.4,  color:"#ef4444", size:2.2, deathStyle:"explode", walkStyle:"crawl", isBoss:true },
];

function pickEnemyType(waveNum, isBoss) {
  if (isBoss) {
    if (waveNum >= 10) return { ...BOSS_POOL[2] };
    if (waveNum >= 8)  return { ...BOSS_POOL[1] };
    return { ...BOSS_POOL[0] };
  }
  const pool = waveNum <= 2 ? ENEMY_POOL.slice(0,3) : ENEMY_POOL;
  return { ...pool[Math.floor(Math.random() * pool.length)] };
}

function makeEnemy(waveNum, isBoss, question) {
  const type = pickEnemyType(waveNum, isBoss);
  return {
    id         : ++enemyIdCounter,
    questionId : question?.id || question?.question_id, 
    hasLogged  : false,        
    type,
    hp         : 1, 
    maxHp      : 1,
    position   : 100,
    frozen     : false,
    prompt     : question?.prompt   ?? "???",
    answer     : question?.answer   ?? "",
    category   : question?.category ?? "definition",
  };
}

let dmgIdCounter = 0;
function DamageNumber({ x, y, value, correct, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", left: x, top: y, transform: "translateX(-50%)",
      fontFamily: FONT, fontSize: correct ? "1.5rem" : "1.1rem",
      fontWeight: 900, color: correct ? "#10b981" : "#ef4444",
      textShadow: correct ? "0 0 12px #10b981" : "0 0 8px #ef4444",
      pointerEvents: "none", zIndex: 300, animation: "dmgFloat 1s ease-out forwards",
      whiteSpace: "nowrap",
    }}>
      {correct ? `+${value}` : "MISS!"}
    </div>
  );
}

// 🟢 THE FIX: Added onBossWave to the component props
export default function GameScreen({ questions = [], waveSequence = ["Easy"], onGameOver, onExit, mapId = "grasslands", onLogAnswer, onBossWave }) {
  const [wave,         setWave]        = useState(1);
  const [phase,        setPhase]       = useState("announce");
  const [lives,        setLives]       = useState(GAME_CONSTANTS.LIVES_START);
  const [score,        setScore]       = useState(0);
  const [streak,       setStreak]      = useState(0);
  const [enemies,      setEnemies]     = useState([]);
  const [dyingEnemies, setDyingEnemies]= useState([]);
  const [shieldActive, setShieldActive]= useState(false);
  const [abilityCds,   setAbilityCds]  = useState({ freeze:0, storm:0, shield:0 });
  const [targetIdx,    setTargetIdx]   = useState(0);
  const [slotWords,    setSlotWords]   = useState([]);
  
  const [lastClicked,  setLastClicked] = useState(null);
  const [clickResult,  setClickResult] = useState(null);
  const [shotAnim,     setShotAnim]    = useState(false);
  const [shake,        setShake]       = useState(false);
  const [dmgNums,      setDmgNums]     = useState([]);
  const [feedback,     setFeedback]    = useState(null);

  const waveRef      = useRef(1);
  const livesRef     = useRef(GAME_CONSTANTS.LIVES_START);
  const phaseRef     = useRef("announce");
  const shieldRef    = useRef(false);
  const scoreRef     = useRef(0);
  const streakRef    = useRef(0);
  const spawnCount   = useRef(0);
  
  const resolvedCount= useRef(0); 

  const spawnTimer = useRef(null);
  const moveTimer  = useRef(null);

  const { spawnEffect, EffectsLayer } = useHitEffects();
  const towerLevel = getTowerLevel(streak);

  const showFeedback = useCallback((text, type, ms = 1800) => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), ms);
  }, []);

  const triggerShake = useCallback((hard = false) => {
    setShake(hard ? "hard" : "soft");
    setTimeout(() => setShake(false), hard ? 600 : 350);
  }, []);

  const spawnDmg = useCallback((x, y, value, correct) => {
    const id = ++dmgIdCounter;
    setDmgNums(p => [...p, { id, x, y, value, correct }]);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setAbilityCds(prev => {
        const u = { ...prev };
        let changed = false;
        ABILITIES.forEach(a => { if (u[a.id] > 0) { u[a.id] = Math.max(0, u[a.id] - 200); changed = true; } });
        return changed ? u : prev;
      });
    }, 200);
    return () => clearInterval(t);
  }, []);

  const checkWaveDone = useCallback(() => {
    const cfg = getDynamicWaveConfig(waveRef.current, waveSequence, questions);
    if (resolvedCount.current >= cfg.count && phaseRef.current === "spawning") {
      clearInterval(spawnTimer.current);
      clearInterval(moveTimer.current);
      soundManager.playWaveComplete();
      
      if (waveRef.current >= waveSequence.length) {
        phaseRef.current = "victory";
        setPhase("victory");
      } else {
        phaseRef.current = "waveEnd";
        setPhase("waveEnd");
      }
    }
  }, [waveSequence, questions]);

  const startMoveTicker = useCallback(() => {
    clearInterval(moveTimer.current);
    moveTimer.current = setInterval(() => {
      if (["announce","waveEnd","victory","paused"].includes(phaseRef.current)) return;
      
      let enemiesResolvedThisTick = 0;

      setEnemies(prev => {
        const next = [];
        for (const e of prev) {
          if (e.frozen) { next.push(e); continue; }
          const cfg = getDynamicWaveConfig(waveRef.current, waveSequence, questions);
          const spd = BASE_SPEED * cfg.speedMult * e.type.speed;
          const np  = e.position - spd;
          
          if (np <= 8) {
            if (!e.hasLogged && e.questionId) {
                onLogAnswer?.(e.questionId, false);
                e.hasLogged = true;
            }

            if (shieldRef.current) {
              shieldRef.current = false;
              setShieldActive(false);
              showFeedback("🛡️ Shield blocked the hit!", "shield");
            } else {
              livesRef.current = Math.max(0, livesRef.current - 1);
              setLives(livesRef.current);
              setStreak(0); streakRef.current = 0;
              triggerShake(true);
              soundManager.playCastleHit();
              showFeedback(`💔 Enemy reached the castle! (${livesRef.current} lives left)`, "damage");
              
              if (livesRef.current <= 0) {
                clearInterval(spawnTimer.current);
                clearInterval(moveTimer.current);
                setTimeout(() => onGameOver(scoreRef.current, waveRef.current, streakRef.current), 400);
              }
            }
            setDyingEnemies(d => [...d, { ...e, position: 8 }]);
            enemiesResolvedThisTick++; 
          } else {
            next.push({ ...e, position: np });
          }
        }
        if (next.length > 0) setTargetIdx(ti => Math.min(ti, next.length - 1));
        return next;
      });

      if (enemiesResolvedThisTick > 0) {
         resolvedCount.current += enemiesResolvedThisTick;
         checkWaveDone();
      }

    }, GAME_CONSTANTS.TICK_MS);
  }, [showFeedback, triggerShake, onGameOver, waveSequence, questions, onLogAnswer, checkWaveDone]);

  const startSpawning = useCallback((wn) => {
    const cfg = getDynamicWaveConfig(wn, waveSequence, questions);
    spawnCount.current = 0;
    resolvedCount.current = 0; 
    clearInterval(spawnTimer.current);
    
    const targetDiff = waveSequence[wn - 1] || "Easy";
    const waveQs = questions.filter(q => q.difficulty === targetDiff);

    const lockedQuestions = [...waveQs].sort(() => Math.random() - 0.5);
    const waveAnswers = lockedQuestions.map(q => q.answer).sort(() => Math.random() - 0.5);
    
    setSlotWords(waveAnswers);

    let questionQueue = [...lockedQuestions].sort(() => Math.random() - 0.5);

    spawnTimer.current = setInterval(() => {
      if (spawnCount.current >= cfg.count) { clearInterval(spawnTimer.current); return; }
      
      const isBoss = cfg.isBossWave;
      const q = questionQueue.pop() || { prompt: "???", answer: "???" };
      
      const enemy = makeEnemy(wn, isBoss, q);
      spawnCount.current++;
      
      if (isBoss && spawnCount.current === 1) soundManager.playBossAppear();
      
      setEnemies(prev => {
        const updated = [...prev, enemy];
        if (prev.length === 0) setTargetIdx(0);
        return updated;
      });
    }, cfg.spawnMs); 
  }, [questions, waveSequence]);

  const handleAnnounceDone = useCallback(() => {
    const cfg = getDynamicWaveConfig(waveRef.current, waveSequence, questions);
    
    // 🟢 THE FIX: Ask the main component to switch the music to Boss BGM!
    if (cfg.isBossWave && onBossWave) {
        onBossWave();
    }

    phaseRef.current = "spawning";
    setPhase("spawning");
    startMoveTicker();
    startSpawning(waveRef.current);
  }, [startMoveTicker, startSpawning, waveSequence, questions, onBossWave]);

  const tgtEnemy = enemies.length > 0 ? enemies[Math.min(targetIdx, enemies.length - 1)] : null;

  const handleTowerClick = useCallback((idx, word) => {
    if (clickResult || !tgtEnemy) return;

    const isCorrect = word === tgtEnemy.answer;
    
    if (!tgtEnemy.hasLogged && tgtEnemy.questionId) {
        onLogAnswer?.(tgtEnemy.questionId, isCorrect);
        tgtEnemy.hasLogged = true; 
    }

    setLastClicked(idx);
    setClickResult(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      setShotAnim(true);
      setTimeout(() => setShotAnim(false), 600);
      soundManager.playTowerFire(towerLevel.projectile);

      scoreRef.current += 1;
      setScore(s => s + 1);
      
      streakRef.current += 1;
      setStreak(streakRef.current);
      if (streakRef.current === 3 || streakRef.current === 6 || streakRef.current === 10) {
        soundManager.playComboMilestone(Math.floor(streakRef.current / 3) - 1);
      }

      const hitX = (tgtEnemy.position / 100) * window.innerWidth;
      const hitY = window.innerHeight * 0.56;
      spawnDmg(hitX, hitY - 40, 1, true);
      spawnEffect(hitX, hitY, tgtEnemy.type.isBoss ? "boss_kill" : "kill");
      
      triggerShake(tgtEnemy.type.isBoss);
      soundManager.playEnemyDie(tgtEnemy.type.deathStyle);
      showFeedback(`💥 ${tgtEnemy.type.label} defeated! +1`, "correct", 900);

      const remainingEnemies = enemies.filter(e => e.id !== tgtEnemy.id);
      setEnemies(remainingEnemies);
      setDyingEnemies(d => [...d, { ...tgtEnemy }]);

      setTimeout(() => {
        setLastClicked(null);
        setClickResult(null);
        setTargetIdx(prevIdx => Math.min(prevIdx, remainingEnemies.length > 0 ? remainingEnemies.length - 1 : 0));
        
        resolvedCount.current += 1;
        checkWaveDone();
      }, 700);

    } else {
      soundManager.playWrong();
      streakRef.current = 0;
      setStreak(0);
      spawnDmg(window.innerWidth * 0.5, window.innerHeight * 0.5, 0, false);
      showFeedback("❌ Wrong answer! Streak reset.", "wrong", 800);
      setTimeout(() => { setLastClicked(null); setClickResult(null); }, 820);
    }
  }, [clickResult, tgtEnemy, enemies, towerLevel, spawnDmg, spawnEffect, triggerShake, showFeedback, checkWaveDone, onLogAnswer]);

  const handleAbility = useCallback((ability) => {
    setAbilityCds(p => ({ ...p, [ability.id]: ability.cooldownMs }));
    soundManager.playAbility(ability.id);
    
    if (ability.id === "freeze") {
      setEnemies(p => p.map(e => ({ ...e, frozen: true })));
      setTimeout(() => setEnemies(p => p.map(e => ({ ...e, frozen: false }))), 3000);
      showFeedback("❄️ Enemies frozen for 3s!", "ability");
    }
    
    if (ability.id === "storm") {
      const pointsEarned = enemies.length; 
      if (pointsEarned > 0) {
        scoreRef.current += pointsEarned; 
        setScore(s => s + pointsEarned);
        
        enemies.forEach(e => {
            if (!e.hasLogged && e.questionId) {
                onLogAnswer?.(e.questionId, true);
                e.hasLogged = true;
            }
        });

        setDyingEnemies(d => [...d, ...enemies]);
        setEnemies([]); 
        
        setTimeout(() => {
            resolvedCount.current += pointsEarned;
            checkWaveDone();
        }, 800); 
      }
      showFeedback("🏹 Arrow Storm — Field Cleared!", "ability");
    }
    
    if (ability.id === "shield") {
      shieldRef.current = true;
      setShieldActive(true);
      setTimeout(() => { shieldRef.current = false; setShieldActive(false); }, 10000);
      showFeedback("🛡️ Shield Wall active for 10s!", "ability");
    }
  }, [showFeedback, checkWaveDone, enemies, onLogAnswer]);

  const handleNextWave = useCallback(() => {
    const nw = waveRef.current + 1;
    waveRef.current = nw;
    setWave(nw);
    setEnemies([]);
    setDyingEnemies([]);
    setTargetIdx(0);
    spawnCount.current = 0;
    resolvedCount.current = 0; 
    phaseRef.current = "announce";
    setPhase("announce");
  }, []);

  useEffect(() => () => {
    clearInterval(spawnTimer.current);
    clearInterval(moveTimer.current);
  }, []);

  const cfg        = getDynamicWaveConfig(wave, waveSequence, questions);
  const isBossWave = cfg.isBossWave ?? false;
  const category   = "definition";

  return (
    <div style={{
      width: "100%", height: "100%", 
      display: "flex", flexDirection: "column",
      position: "absolute", inset: 0, overflow: "hidden", background: "#050d14",
      animation: shake === "hard" ? "shakeHard 0.5s ease" : shake === "soft" ? "shakeSoft 0.3s ease" : "none",
      borderRadius: "inherit"
    }}>
      <style>{`
        @keyframes shakeHard  { 0%,100%{transform:translate(0);} 15%{transform:translate(-8px,4px);} 30%{transform:translate(8px,-4px);} 50%{transform:translate(-5px,2px);} 70%{transform:translate(5px,-2px);} }
        @keyframes shakeSoft  { 0%,100%{transform:translate(0);} 30%{transform:translate(-4px,2px);} 70%{transform:translate(4px,-2px);} }
        @keyframes dmgFloat   { 0%{opacity:1;transform:translateX(-50%) translateY(0);} 40%{opacity:1;transform:translateX(-50%) translateY(-28px) scale(1.2);} 100%{opacity:0;transform:translateX(-50%) translateY(-62px) scale(0.8);} }
        @keyframes feedbackPop{ from{opacity:0;transform:translateX(-50%) scale(0.85);} to{opacity:1;transform:translateX(-50%) scale(1);} }
      `}</style>

      <EffectsLayer />
      <BattlefieldBackground mapId={mapId} wave={wave} />

      {dmgNums.map(d => (
        <DamageNumber key={d.id} {...d} onDone={() => setDmgNums(p => p.filter(x => x.id !== d.id))} />
      ))}

      <HUD
        wave={wave}
        lives={lives}
        score={score}
        streak={streak}
        towerLevel={towerLevel}
        abilityState={{ cooldowns: abilityCds }}
        onAbility={handleAbility}
        shieldActive={shieldActive}
        isBossWave={isBossWave}
        category={category}
      />

      {feedback && (
        <div style={{
          position: "absolute", top: 80, left: "50%",
          zIndex: 90, padding: "11px 26px", borderRadius: 10,
          fontFamily: FONT, fontSize: "0.92rem", fontWeight: 700,
          color: "#fff", letterSpacing: "0.05em", pointerEvents: "none",
          whiteSpace: "nowrap", backdropFilter: "blur(4px)",
          boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
          animation: "feedbackPop 0.2s ease",
          background: feedback.type === "correct" ? "rgba(16,185,129,0.93)"
            : feedback.type === "wrong"  ? "rgba(239,68,68,0.92)"
            : feedback.type === "damage" ? "rgba(220,38,38,0.92)"
            : feedback.type === "shield" ? "rgba(124,58,237,0.93)"
            : "rgba(59,130,246,0.92)",
        }}>
          {feedback.text}
        </div>
      )}

      {shotAnim && <GameProjectile tier={towerLevel} />}

      <div style={{ flex: 1, position: "relative", minHeight: 310, overflow: "visible" }}>
        <Castle lives={lives} maxLives={GAME_CONSTANTS.LIVES_START} shieldActive={shieldActive} />

        <EnemyLane
          enemies={enemies}
          dyingEnemies={dyingEnemies}
          onDeathDone={(id) => setDyingEnemies(p => p.filter(e => e.id !== id))}
          targetId={tgtEnemy?.id ?? null}
        />

        {enemies.length === 0 && dyingEnemies.length === 0 && phase === "spawning" && (
          <div style={{
            position: "absolute", top: "40%", left: "50%",
            transform: "translate(-50%,-50%)",
            fontFamily: FONT, color: "rgba(255,255,255,0.1)",
            fontSize: "0.9rem", letterSpacing: "0.2em",
            textTransform: "uppercase", pointerEvents: "none",
          }}>
            Awaiting enemies…
          </div>
        )}

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(0deg,rgba(3,7,18,0.99) 0%,rgba(5,10,22,0.95) 75%,transparent 100%)",
          padding: "15px 0 10px 0", 
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          zIndex: 10,
        }}>
          <div style={{
            fontFamily: FONT, display: "flex", alignItems: "center",
            gap: 15, marginBottom: 5, flexWrap: "wrap",
            justifyContent: "center", padding: "10px 30px", textAlign: "center",
            background: "rgba(0,0,0,0.7)", border: "2px solid #334155", 
            borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.6)"
          }}>
            {tgtEnemy ? (
              <>
                <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "1.1rem", letterSpacing: "0.1em" }}>🎯 TARGET:</span>
                <span style={{ 
                    color: "#ffd700", fontStyle: "italic", 
                    fontSize: "1.5rem", fontWeight: "900", 
                    textShadow: "0 0 15px rgba(255,215,0,0.4)" 
                }}>
                  "{tgtEnemy.prompt}"
                </span>
              </>
            ) : (
              <span style={{ color: "#6b7280", fontSize: "1.1rem", letterSpacing: "0.1em" }}>
                  Waiting for enemies to approach…
              </span>
            )}
          </div>

          <div style={{
            display: "flex", gap: 8, justifyContent: "center",
            alignItems: "flex-end", flexWrap: "wrap", padding: "0 10px", width: "100%"
          }}>
            {slotWords.map((w, i) => (
              <AnswerTower
                key={i} idx={i} word={w}
                isCorrect={tgtEnemy != null && w === tgtEnemy.answer}
                onSelect={handleTowerClick}
                disabled={phase !== "spawning" || enemies.length === 0 || !!clickResult || w === "---"}
                lastClicked={lastClicked}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{
        display: "flex", gap: 12, justifyContent: "center", alignItems: "center",
        padding: "5px 20px", borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 20,
      }}>
        <button
          onClick={() => {
            const np = phase === "paused" ? "spawning" : "paused";
            phaseRef.current = np;
            setPhase(np);
          }}
          style={BTN}
        >
          {phase === "paused" ? "▶ Resume" : "⏸ Pause"}
        </button>
        <div style={{ color: "#4b5563", fontSize: "0.68rem", fontFamily: FONT, letterSpacing: "0.1em" }}>
          {String(mapId).toUpperCase()} · Wave {wave} - {cfg.label}
        </div>
        <button onClick={onExit} style={{ ...BTN, color: "#f87171" }}>✕ Exit</button>
      </div>

      {phase === "paused" && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 100, animation: "feedbackPop 0.3s ease"
        }}>
          <h1 style={{ fontFamily: FONT, fontSize: "4rem", color: "#ffd700", textShadow: "0 0 20px rgba(255,215,0,0.5)", margin: 0 }}>PAUSED</h1>
          <p style={{ fontFamily: FONT_B, color: "#9ca3af", fontSize: "1.2rem", letterSpacing: "0.1em", marginBottom: "40px" }}>The battle is on hold.</p>
          <button 
            onClick={() => { phaseRef.current = "spawning"; setPhase("spawning"); }}
            style={{
              padding: "15px 40px", background: "linear-gradient(135deg, #10b981, #059669)",
              color: "white", fontFamily: FONT, fontWeight: "bold", fontSize: "1.2rem",
              border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: "0 5px 15px rgba(16,185,129,0.4)"
            }}
          >
            ▶ RESUME BATTLE
          </button>
        </div>
      )}

      {phase === "announce" && <WaveAnnouncer wave={wave} onDone={handleAnnounceDone} />}

      {phase === "waveEnd" && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 80, backdropFilter: "blur(7px)",
        }}>
          <div style={{
            background: "linear-gradient(135deg,#0d1b2a,#1a2744)", border: "1px solid rgba(255,215,0,0.22)",
            borderRadius: 18, padding: "34px 50px", textAlign: "center", display: "flex", flexDirection: "column",
            gap: 14, alignItems: "center", boxShadow: "0 32px 80px rgba(0,0,0,0.85)", animation: "feedbackPop 0.4s ease",
          }}>
            <div style={{ fontSize: "3rem" }}>🎉</div>
            <h2 style={{
              margin: 0, fontFamily: FONT, fontSize: "1.8rem",
              background: "linear-gradient(135deg,#ffd700,#ff8c00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>Wave {wave} Cleared!</h2>
            <p style={{ color: "#9ca3af", fontFamily: FONT, fontSize: "0.88rem", margin: 0 }}>
              Score: <strong style={{ color: "#ffd700" }}>{score} / {questions.length}</strong> &nbsp;·&nbsp;Streak: <strong style={{ color: "#fbbf24" }}>{streak}×</strong>
            </p>
            <button onClick={handleNextWave} style={{
              background: "linear-gradient(135deg,#b45309,#92400e)", border: "none", borderRadius: 8, color: "#fef3c7", fontFamily: FONT,
              fontSize: "0.98rem", fontWeight: 700, padding: "12px 30px", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", boxShadow: "0 4px 20px rgba(180,83,9,0.45)",
            }}>⚔️ Next: Wave {wave + 1} →</button>
          </div>
        </div>
      )}

      {phase === "victory" && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, backdropFilter: "blur(10px)",
        }}>
          <div style={{
            background: "linear-gradient(135deg, #1e3a8a, #0f172a)", border: "2px solid #ffd700",
            borderRadius: "20px", padding: "40px 60px", textAlign: "center", display: "flex", flexDirection: "column",
            gap: 15, alignItems: "center", boxShadow: "0 0 50px rgba(255,215,0,0.3)", animation: "feedbackPop 0.5s ease",
          }}>
            <div style={{ fontSize: "4rem" }}>🏆</div>
            <h2 style={{
              margin: 0, fontFamily: FONT, fontSize: "2.5rem",
              background: "linear-gradient(135deg, #ffd700, #fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>VICTORY!</h2>
            <p style={{ color: "#e2e8f0", fontFamily: FONT_B, fontSize: "1.2rem", fontStyle: "italic", margin: 0 }}>The Castle is safe. All waves cleared!</p>
            <p style={{ color: "#9ca3af", fontFamily: FONT, fontSize: "1rem", margin: "10px 0 20px 0" }}>
              Final Score: <strong style={{ color: "#ffd700", fontSize: "1.4rem" }}>{score} / {questions.length}</strong>
            </p>
            <button 
              onClick={() => onGameOver(score, wave, streak)} 
              style={{
              background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: "10px", color: "#fff", fontFamily: FONT,
              fontSize: "1.1rem", fontWeight: "bold", padding: "15px 40px", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", boxShadow: "0 4px 20px rgba(16,185,129,0.5)",
            }}>View Final Scoreboard</button>
          </div>
        </div>
      )}
    </div>
  );
}

const BTN = {
  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#c9b99a",
  fontFamily: FONT, fontSize: "0.78rem", padding: "5px 15px", cursor: "pointer", letterSpacing: "0.08em",
};