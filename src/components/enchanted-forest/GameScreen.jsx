import { useState, useEffect, useCallback, useRef } from 'react'
import { LOCATIONS, LOCATION_CHESTS, DIALOGUE_CHOICES, DIFFICULTY, checkWord } from './data/locations_enhanced.js'
import { useAudio } from './hooks/useAudio.js'

import Stars        from './environment/Stars.jsx'
import Particles    from './environment/Particles.jsx'
import Fireflies    from './environment/Fireflies.jsx'
import Mist         from './environment/Mist.jsx'
import ForestEffects from './environment/ForestEffects.jsx'
import GroundPath   from './environment/GroundPath.jsx'

import Player from './characters/Player.jsx'
import NPC    from './characters/NPC.jsx'

import DialogueBox   from './game/DialogueBox.jsx'
import WordPuzzle    from './game/WordPuzzle.jsx'
import Feedback      from './game/Feedback.jsx'
import AreaComplete  from './game/AreaComplete.jsx'
import BossEncounter from './game/BossEncounter.jsx'
import TreasureChest from './items/TreasureChest.jsx'
import HUD from './hud/HUD_enhanced.jsx'

function getTeacherData() {
  try { return JSON.parse(localStorage.getItem('wordforest_teacher_data')) || {} }
  catch { return {} }
}
function getTeacherWords(locId, isBoss = false) {
  try {
    const data  = getTeacherData()
    const field = isBoss ? 'bossWords' : 'words'
    return data?.locations?.[locId]?.[field] || null
  } catch { return null }
}
function getTeacherDifficulty(locId) {
  try {
    const data = getTeacherData()
    return data?.locations?.[locId]?.difficulty || data?.globalSettings?.defaultDifficulty || 'normal'
  } catch { return 'normal' }
}
function getTeacherSetting(key, fallback) {
  try {
    const data = getTeacherData()
    return data?.globalSettings?.[key] ?? fallback
  } catch { return fallback }
}

function DeathOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 90, // 🟢 FIXED: absolute
      background: 'rgba(0,0,0,0)', animation: 'deathFade 2.8s ease forwards',
      display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
    }}>
      <div style={{ textAlign: 'center', animation: 'deathShatter 2.8s ease forwards' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.8rem' }}>💀</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '2rem', color: '#ff4060', letterSpacing: '0.25em', textShadow: '0 0 30px #ff406080' }}>DEFEATED</div>
        <div style={{ fontFamily: "'Crimson Text', serif", color: '#789878', fontSize: '0.95rem', fontStyle: 'italic', marginTop: '0.5rem' }}>Returning to last checkpoint…</div>
      </div>
    </div>
  )
}

function RevealFlash({ letter, accent }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 85, // 🟢 FIXED: absolute
      display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
    }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: '5rem', fontWeight: 700, color: accent, textShadow: `0 0 40px ${accent}, 0 0 80px ${accent}`, animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)', opacity: 0.9 }}>{letter}</div>
    </div>
  )
}

function TimedEdgeFlash({ urgent }) {
  if (!urgent) return null
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', // 🟢 FIXED: absolute
      boxShadow: 'inset 0 0 80px rgba(255,50,50,0.35)', animation: 'timerUrgentPulse 0.6s ease-in-out infinite',
    }} />
  )
}

export default function GameScreen({
  locIdx, inventory, score, onAreaCleared, onCorrectAnswer, onWrongAnswer, onChestOpened, onDialogueChoice, hudProps, hintCharges, skipCharges, revealCharges, onUseReveal,
}) {
  const audio = useAudio()
  const loc   = LOCATIONS[locIdx]

  const words      = getTeacherWords(locIdx)       || loc.words
  const bossWords  = getTeacherWords(locIdx, true) || loc.boss.words
  const difficulty = getTeacherDifficulty(locIdx)
  const diffCfg    = DIFFICULTY[difficulty] || DIFFICULTY.normal

  const [phase,      setPhase]      = useState('entering')
  const [dlgLine,    setDlgLine]    = useState(0)
  const [choiceMade,setChoiceMade]= useState(false)
  const [wordIdx,    setWordIdx]    = useState(0)
  const [attempts,   setAttempts]   = useState(0)
  const [showHint,   setShowHint]   = useState(false)
  const [fbMsg,      setFbMsg]      = useState('')
  const [revealedLetter, setRevealedLetter] = useState(null)
  const [showRevealFlash, setShowRevealFlash] = useState(false)
  const [localInv,   setLocalInv]   = useState(inventory)
  const [localScore, setLocalScore] = useState(score)
  const [solvedCount,setSolvedCount]= useState(0)
  const [localCombo, setLocalCombo] = useState(0)
  const [playerX,  setPlayerX]  = useState('5%')
  const [walking,  setWalking]  = useState(false)
  const [npcTalk,  setNpcTalk]  = useState(false)
  const [npcHappy, setNpcHappy] = useState(false)
  const [npcShock, setNpcShock] = useState(false)
  const [openedChests, setOpenedChests] = useState(new Set())
  const timeLimit   = diffCfg.timeLimit
  const [timeLeft,  setTimeLeft]  = useState(timeLimit)
  const timerRef    = useRef(null)
  const [showDeath, setShowDeath] = useState(false)

  const word = words[wordIdx]

  const npcReact = (emotion) => {
    if (emotion === 'happy') { setNpcHappy(true); setTimeout(() => setNpcHappy(false), 900) } 
    else if (emotion === 'shock') { setNpcShock(true); setTimeout(() => setNpcShock(false), 700) } 
    else { setNpcTalk(true); setTimeout(() => setNpcTalk(false), 320) }
  }

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  const startTimer = useCallback(() => {
    if (!timeLimit) return
    stopTimer()
    setTimeLeft(timeLimit)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          stopTimer(); setAttempts(a => a + 1); setShowHint(true); setFbMsg("Time's up! The word slipped away… try again."); setPhase('fb-fail'); onWrongAnswer?.(); npcReact('shock'); return timeLimit
        }
        return t - 1
      })
    }, 1000)
  }, [timeLimit, onWrongAnswer])

  useEffect(() => {
    setPhase('entering'); setPlayerX('5%'); setWalking(false); setChoiceMade(false); setWordIdx(0); setAttempts(0); setShowHint(false); setRevealedLetter(null); setLocalCombo(0);
    const t1 = setTimeout(() => { setWalking(true); setPlayerX('32%') }, 300)
    const t2 = setTimeout(() => { setWalking(false); setPhase('dialogue'); setDlgLine(0) }, 2600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [locIdx])

  useEffect(() => { if (phase === 'puzzle') startTimer(); else stopTimer(); return stopTimer }, [phase, wordIdx])

  const advanceDlg = useCallback(() => { npcReact('talk'); setDlgLine(l => l + 1) }, [])
  const startPuzzle = useCallback(() => { setPhase('puzzle'); setWordIdx(0); setAttempts(0); setShowHint(false); setRevealedLetter(null) }, [])

  const handleDialogueChoice = useCallback((option) => {
    setChoiceMade(true); onDialogueChoice?.(option); npcReact('happy');
    if (option.bonus?.type === 'score') setLocalScore(s => s + (option.bonus.value || 0))
    setDlgLine(l => l + 1)
  }, [onDialogueChoice])

  const handleSubmit = useCallback((input) => {
    audio.type?.()
    if (checkWord(input, word.answer)) {
      audio.correct?.(); stopTimer();
      const newCombo = localCombo + 1; setLocalCombo(newCombo);
      const base = Math.max(120 - attempts * 18, 15); const comboBonus = newCombo >= 3 ? (diffCfg.streakBonus || 20) * Math.floor(newCombo / 2) : 0; const newScore = localScore + base + comboBonus;
      setLocalInv([...localInv, word.answer]); setLocalScore(newScore); setSolvedCount(s => s + 1); setRevealedLetter(null);
      onCorrectAnswer?.(word.answer); npcReact('happy'); const msgs = loc.success; setFbMsg(msgs[Math.floor(Math.random() * msgs.length)]); setPhase('fb-ok');
    } else {
      audio.wrong?.(); stopTimer();
      const na = attempts + 1; setAttempts(na); if (na >= diffCfg.hintAfter) setShowHint(true);
      setLocalCombo(0); onWrongAnswer?.();
      if (hudProps?.lives !== undefined && hudProps.lives - 1 <= 0) { setShowDeath(true); setTimeout(() => setShowDeath(false), 2900) }
      npcReact('shock'); const msgs = loc.fail; setFbMsg(msgs[Math.min(Math.floor(na / 2), msgs.length - 1)]); setPhase('fb-fail');
    }
  }, [word, localInv, localScore, localCombo, attempts, loc, audio, diffCfg, onCorrectAnswer, onWrongAnswer, hudProps])

  const handleSkip = useCallback(() => {
    if ((skipCharges || 0) <= 0) return
    stopTimer()
    if (wordIdx < words.length - 1) { setWordIdx(w => w + 1); setAttempts(0); setShowHint(false); setRevealedLetter(null); setPhase('puzzle') } 
    else { audio.area?.(); setTimeout(() => setPhase('boss'), 400) }
  }, [skipCharges, wordIdx, words.length, audio])

  const handleReveal = useCallback(() => {
    if ((revealCharges || 0) <= 0) return
    setRevealedLetter(word.answer[0]); setShowRevealFlash(true); setTimeout(() => setShowRevealFlash(false), 900); onUseReveal?.()
  }, [revealCharges, word, onUseReveal])

  const handleChestOpen = useCallback((id, reward) => {
    setOpenedChests(prev => new Set([...prev, id])); onChestOpened?.(id, reward);
    if (reward === 'score_boost') setLocalScore(s => s + 50)
  }, [onChestOpened])

  const dismissFb = useCallback(() => {
    if (phase === 'fb-ok') {
      if (wordIdx < words.length - 1) { setWordIdx(w => w + 1); setAttempts(0); setShowHint(false); setRevealedLetter(null); setPhase('puzzle') } 
      else { audio.area?.(); setTimeout(() => setPhase('boss'), 400) }
    } else { setPhase('puzzle'); startTimer() }
  }, [phase, wordIdx, words.length, audio, startTimer])

  const handleBossDefeated = useCallback(() => { setPhase('area-complete') }, [])

  const handleProceed = useCallback(() => {
    if (loc.postBoss === 'VICTORY') { audio.victory?.(); onAreaCleared(localInv, localScore, true) } 
    else { setPhase('transitioning'); setWalking(true); setPlayerX('108%'); setTimeout(() => onAreaCleared(localInv, localScore, false), 1500) }
  }, [loc, localInv, localScore, audio, onAreaCleared])

  const chests = LOCATION_CHESTS[locIdx] || []
  const combo  = hudProps?.combo ?? localCombo
  const choiceNode   = DIALOGUE_CHOICES[locIdx]
  const showChoice   = choiceNode && dlgLine === choiceNode.afterLine && !choiceMade && phase === 'dialogue'

  return (
    // 🟢 FIXED: Changed from position: fixed to position: absolute!
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>

      <div style={{ position: 'absolute', inset: 0, background: loc.bg, transition: 'background 1.2s ease', zIndex: 0 }} />
      <Stars />
      <Mist />
      <Particles type={loc.ptcType} color={loc.ptcClr} />
      <Fireflies color={loc.accent} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '30%', background: 'linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 100%)', zIndex: 3 }} />

      <ForestEffects loc={loc} intensity={phase === 'boss' ? 'storm' : 'normal'} />
      <GroundPath accent={loc.accent} />

      {phase !== 'entering' && phase !== 'transitioning' && phase !== 'boss' && (
        chests.map(chest => (
          <TreasureChest
            key={chest.id} {...chest} isUnlocked={openedChests.has(chest.id)}
            isAvailable={ !chest.triggerCondition || (chest.triggerCondition.type === 'solve' && solvedCount >= chest.triggerCondition.count) || (chest.triggerCondition.type === 'streak' && combo >= chest.triggerCondition.count) }
            onOpen={handleChestOpen}
          />
        ))
      )}

      <Player x={playerX} walking={walking} />
      {phase !== 'transitioning' && phase !== 'boss' && ( <NPC loc={loc} talking={npcTalk} happy={npcHappy} shocked={npcShock} /> )}

      {timeLimit && <TimedEdgeFlash urgent={timeLeft !== null && timeLeft <= 10 && phase === 'puzzle'} />}

      <HUD loc={loc} inventory={localInv} score={localScore} {...hudProps} timedMode={!!timeLimit} timerSeconds={phase === 'puzzle' ? timeLeft : null} timerTotal={timeLimit || 30} hintCharges={hintCharges ?? 3} maxHintCharges={getTeacherSetting('hintCharges', 3)} skipCharges={skipCharges ?? 0} onSkip={handleSkip} onUseHint={() => { setShowHint(true); hudProps?.onUseHint?.() }} revealCharges={revealCharges ?? 0} onReveal={handleReveal} />

      {phase === 'dialogue' && ( <DialogueBox loc={loc} lineIdx={dlgLine} onNext={advanceDlg} onStartPuzzle={startPuzzle} choiceNode={showChoice ? choiceNode : null} onChoice={handleDialogueChoice} choiceMade={choiceMade} /> )}
      {phase === 'puzzle' && ( <WordPuzzle loc={loc} word={word} attempts={attempts} onSubmit={handleSubmit} showHint={showHint} revealedLetter={revealedLetter} skipCharges={skipCharges ?? 0} onSkip={handleSkip} revealCharges={revealCharges ?? 0} onReveal={handleReveal} timedMode={!!timeLimit} timeLeft={timeLeft} /> )}
      {showRevealFlash && revealedLetter && ( <RevealFlash letter={revealedLetter} accent={loc.accent} /> )}
      {(phase === 'fb-ok' || phase === 'fb-fail') && ( <Feedback type={phase === 'fb-ok' ? 'correct' : 'wrong'} message={fbMsg} accent={loc.accent} glow={loc.glow} onDismiss={dismissFb} combo={localCombo} showComboBonus={phase === 'fb-ok' && localCombo >= 3} /> )}
      {phase === 'boss' && ( <BossEncounter loc={loc} boss={{ ...loc.boss, words: bossWords }} onDefeat={handleBossDefeated} /> )}
      {phase === 'area-complete' && ( <AreaComplete loc={loc} onProceed={handleProceed} postBossText={loc.postBoss} /> )}
      {showDeath && <DeathOverlay />}

      {phase === 'transitioning' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'bossArenaIn 0.5s ease' }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: '1.1rem', color: 'rgba(200,230,200,0.7)', letterSpacing: '0.25em', animation: 'titlePulse 1.5s ease-in-out infinite' }}>Returning to the world map…</div>
        </div>
      )}

      {phase === 'entering' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.6s ease', pointerEvents: 'none' }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: '1rem', color: loc.accent, letterSpacing: '0.25em', opacity: 0.8, animation: 'titlePulse 1.5s ease-in-out infinite' }}>Entering {loc.name}…</div>
        </div>
      )}
    </div>
  )
}