// src/games/WordQuest.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import "./WordQuest.css";
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

// --- ONLY THE 3 AUDIO IMPORTS YOU HAVE ---
import bgmMenu from "../assets/wordquest/sounds/bgm_menu.wav";
import bgmGame from "../assets/wordquest/sounds/bgm_game.wav";
import sfxClick from "../assets/wordquest/sounds/click.wav";

import {
  SCREENS, MODES, LADDERS, SNAKES,
  POWER_UP_TILES, TRAP_TILES, WILD_TILES, DOUBLE_TILES, STEAL_TILES,
  POWER_UP_EFFECTS, TRAP_EFFECTS, WILD_EFFECTS,
} from "../constants/gameData";

import Starfield       from "../components/Starfield";
import MainMenu        from "../components/MainMenu";
import ModeSelect      from "../components/ModeSelect";
import CharacterSelect from "../components/CharacterSelect";
import GameScreen      from "../components/GameScreen";
import WinScreen       from "../components/WinScreen";

export default function WordQuest() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [screen,        setScreen]      = useState(SCREENS.MENU);
  const [mode,          setMode]        = useState(null);
  const [aiDifficulty,  setAiDifficulty] = useState(null);
  const [aiThinking,    setAiThinking]  = useState(false);
  const [questions,     setQuestions]   = useState([]); 
  const [charSel,       setCharSel]     = useState([null, null]);

  const [players,       setPlayers]       = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [movingPlayer,  setMovingPlayer]  = useState(null);
  const [gameLocked,    setGameLocked]    = useState(false);
  const [diceVal,       setDiceVal]       = useState(null);
  const [diceRolling,   setDiceRolling]   = useState(false);
  const [highlightTile, setHighlightTile] = useState(null);
  const [log,           setLog]           = useState([]);
  const [modal,         setModal]         = useState(null);
  const [doubleNext,    setDoubleNext]    = useState(false);

  const [winner, setWinner] = useState(null);
  const [scoreSaved, setScoreSaved] = useState(false);

  const playersRef = useRef(null);
  useEffect(() => { playersRef.current = players; }, [players]);

  const allQsRef = useRef([]);       
  const availableQsRef = useRef([]); 
  
  // --- AUDIO REFS & GLOBAL SFX ---
  const bgmRef = useRef(null);
  const activeBgmRef = useRef(bgmMenu); // Tracks the current playing song

  const playSfx = (soundFile) => {
    const audio = new Audio(soundFile);
    audio.volume = 0.6; 
    audio.play().catch(e => console.log("SFX Blocked"));
  };

  // GLOBAL BUTTON CLICK LISTENER (Plays click sound instantly on any button)
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (e.target.closest('button') || e.target.closest('.card div')) {
        playSfx(sfxClick);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // START MENU MUSIC INSTANTLY ON LOAD
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = 0.25; // 25% volume
      // Because you clicked "Start Game" on the previous page, the browser allows this instantly!
      bgmRef.current.play().catch(e => console.log("Autoplay blocked by browser:", e));
    }
    
    // Fallback: If they refresh the page directly, wait for ANY click to start the music
    const fallbackPlay = () => {
      if (bgmRef.current && bgmRef.current.paused) {
        bgmRef.current.play();
      }
      window.removeEventListener('click', fallbackPlay);
    };
    window.addEventListener('click', fallbackPlay);
    return () => window.removeEventListener('click', fallbackPlay);
  }, []);

  // SWITCH MUSIC TRACKS WHEN MOVING FROM MENU TO THE BOARD GAME
  useEffect(() => {
    if (!bgmRef.current) return;
    
    const expectedBgm = screen === SCREENS.GAME ? bgmGame : bgmMenu;
    
    if (activeBgmRef.current !== expectedBgm) {
      activeBgmRef.current = expectedBgm;
      bgmRef.current.src = expectedBgm;
      bgmRef.current.volume = 0.25;
      bgmRef.current.play().catch(e => console.log("Play blocked:", e));
    }
  }, [screen]);

  const addLog = (msg) => setLog(l => [msg, ...l].slice(0, 20));

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`http://localhost:8081/api/game-questions/${gameId}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formattedQs = data.map(q => {
            const opts = [q.choice_a, q.choice_b, q.choice_c, q.choice_d].filter(Boolean);
            return {
              id: q.question_id || Math.random(),
              question: q.question_text,
              options: opts,
              correct: opts[q.correct_answer] || opts[0], 
              category: "Quest", 
              difficulty: "medium" 
            };
          });
          setQuestions(formattedQs);
          allQsRef.current = [...formattedQs];
          availableQsRef.current = [...formattedQs];
        }
      } catch(e) { console.error("Error fetching questions:", e); }
    };
    if (gameId) fetchQuestions();
  }, [gameId]);

  const handleGameEnd = async (finalPlayers) => {
    if (scoreSaved) return;
    setScoreSaved(true);

    const humanPlayer = finalPlayers[0];
    
    if (auth.currentUser) {
        try {
            await fetch('http://localhost:8081/api/save-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_fid: auth.currentUser.uid,
                    game_id: gameId,
                    score: humanPlayer.score,
                    time_taken: 0 
                })
            });
            console.log("Player 1 score saved successfully!");
        } catch (e) { console.error(e); }
    }
    setTimeout(() => setScreen(SCREENS.WIN), 600);
  };

  const handleSelectMode = (selectedMode) => {
    if (questions.length === 0) return alert("Loading questions from server, please wait...");
    setMode(selectedMode);
    if (selectedMode === MODES.VS_AI) setScreen("difficulty");
    else setScreen(SCREENS.CHAR);
  };

  const handleDifficultySelect = (diff) => {
    setAiDifficulty(diff);
    setScreen(SCREENS.CHAR);
  };

  const handleCharConfirm = (chars) => {
    setCharSel(chars);
    const ps = chars.map((charObj, idx) => ({
        id: idx,
        name: mode === MODES.VS_AI && idx === 1 ? "Computer" : `Player ${idx + 1}`,
        char: charObj, 
        score: 0,
        pos: 1,
        streak: 0,
        skipTurn: false
    }));
    
    availableQsRef.current = [...allQsRef.current];

    setPlayers(ps);
    setCurrentPlayer(0);
    setMovingPlayer(null);
    setLog([]);
    setDiceVal(null);
    setModal(null);
    setDoubleNext(false);
    setWinner(null); 
    setScoreSaved(false); 
    setScreen(SCREENS.GAME);
    addLog("⚔️ The adventure begins!");
  };

  const restart = useCallback(() => {
    handleCharConfirm(charSel);
  }, [charSel, mode]);

  function applyPowerUp(ps, idx, eff) {
    const p = ps[idx];
    if (eff.includes("15 HP"))     p.score += 15;
    if (eff.includes("10 HP"))     p.score += 10;
    if (eff.includes("20 points")) p.score += 20;
    if (eff.includes("forward 3")) p.pos = Math.min(100, p.pos + 3);
  }
  function applyTrap(ps, idx, eff) {
    const p = ps[idx];
    if (eff.includes("15 HP"))     p.score = Math.max(0, p.score - 15);
    if (eff.includes("back 3"))    p.pos   = Math.max(1, p.pos - 3);
    if (eff.includes("Skip"))      p.skipTurn = true;
    if (eff.includes("10 points")) p.score = Math.max(0, p.score - 10);
  }
  function applyWild(ps, idx, eff) {
    const p = ps[idx]; const opp = ps[1 - idx];
    switch (eff.effect) {
      case "forward5": p.pos   = Math.min(100, p.pos + 5);    break;
      case "heal20":   p.score += 20; break;
      case "double":   setDoubleNext(true);                   break;
      case "back3":    p.pos   = Math.max(1, p.pos - 3);      break;
      case "damage15": p.score = Math.max(0, p.score - 15);   break;
      case "swap": { const t = p.pos; p.pos = opp.pos; opp.pos = t; break; }
      default: break;
    }
  }

  const endTurn = useCallback((playerIdx, ps = null) => {
    const nextIdx = 1 - playerIdx;
    setHighlightTile(null);
    if (ps) setPlayers([...ps]);
    setTimeout(() => {
      setPlayers(prev => {
        const u = prev.map(p => ({ ...p }));
        if (u[nextIdx].skipTurn) {
          u[nextIdx].skipTurn = false;
          addLog(`⏸ ${u[nextIdx].name} skips a turn!`);
          setCurrentPlayer(playerIdx);
          setGameLocked(false);
          return u;
        }
        setCurrentPlayer(nextIdx);
        setGameLocked(false);
        return u;
      });
    }, 200);
  }, []);

  const afterTileEvent = useCallback((ps, playerIdx) => {
    if (availableQsRef.current.length === 0) {
      if (allQsRef.current.length === 0) {
        endTurn(playerIdx); 
        return;
      }
      availableQsRef.current = [...allQsRef.current];
      addLog("🔄 Question pile refilled!");
    }

    const qIndex = Math.floor(Math.random() * availableQsRef.current.length);
    const q = availableQsRef.current[qIndex];
    availableQsRef.current.splice(qIndex, 1);

    const dbl = doubleNext;
    setDoubleNext(false);
    setModal({ type: "question", question: q, doublePoints: dbl, playerIdx, ps: [...ps] });
  }, [doubleNext, endTurn]);

  const processTile = useCallback((ps, playerIdx) => {
    const p = ps[playerIdx]; const tile = p.pos;

    if (tile >= 100) { 
        const loserIdx = 1 - playerIdx;

        if (ps[playerIdx].score <= ps[loserIdx].score) {
            const bonusNeeded = (ps[loserIdx].score - ps[playerIdx].score) + 50;
            ps[playerIdx].score += bonusNeeded;
            addLog(`🏆 ${ps[playerIdx].name} reached the goal! Comeback Bonus: +${bonusNeeded} PTS!`);
        } else {
            ps[playerIdx].score += 50;
            addLog(`🏆 ${ps[playerIdx].name} reached the goal! Finish Bonus: +50 PTS!`);
        }

        setPlayers([...ps]); 
        setWinner(ps[playerIdx]); 
        handleGameEnd([...ps]); 
        return; 
    }

    if (LADDERS[tile]) {
      const dest = LADDERS[tile];
      addLog(`🪜 ${p.name} climbs ladder ${tile}→${dest}!`);
      ps[playerIdx].pos = dest; setPlayers([...ps]); setHighlightTile(dest);
      setModal({ type:"event", event:{icon:"🪜",title:"Ladder Boost!",desc:`Climbing to tile ${dest}!`}, onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} });
      return;
    }
    if (SNAKES[tile]) {
      const dest = SNAKES[tile];
      addLog(`🐍 ${p.name} bitten! ${tile}→${dest}`);
      ps[playerIdx].pos = dest;
      setPlayers([...ps]); setHighlightTile(dest);
      setModal({ type:"event", event:{icon:"🐍",title:"Snake Bite!",desc:`Sliding to tile ${dest}!`}, onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} });
      return;
    }
    if (POWER_UP_TILES.includes(tile)) {
      const eff = POWER_UP_EFFECTS[Math.floor(Math.random() * POWER_UP_EFFECTS.length)];
      applyPowerUp(ps, playerIdx, eff); addLog(`⚡ ${p.name}: ${eff}`);
      setModal({ type:"event", event:{icon:"⚡",title:"Power Up!",desc:eff}, onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} });
      return;
    }
    if (TRAP_TILES.includes(tile)) {
      const eff = TRAP_EFFECTS[Math.floor(Math.random() * TRAP_EFFECTS.length)];
      applyTrap(ps, playerIdx, eff); addLog(`💀 ${p.name}: ${eff}`);
      setModal({ type:"event", event:{icon:"💀",title:"Trap Sprung!",desc:eff}, onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} });
      return;
    }
    if (WILD_TILES.includes(tile)) {
      const eff = WILD_EFFECTS[Math.floor(Math.random() * WILD_EFFECTS.length)];
      applyWild(ps, playerIdx, eff); addLog(`🃏 ${p.name}: ${eff.label}`);
      setModal({ type:"event", event:{icon:"🃏",title:eff.label,desc:eff.desc}, onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} });
      return;
    }
    if (DOUBLE_TILES.includes(tile)) { setDoubleNext(true); addLog(`×2 ${p.name} lands on Double!`); }
    if (STEAL_TILES.includes(tile)) {
      const opp = ps[1-playerIdx];
      opp.score = Math.max(0, opp.score - 10); p.score += 10;
      addLog(`💉 ${p.name} steals 10 PTS from ${opp.name}!`); setPlayers([...ps]);
      setModal({ type:"event", event:{icon:"💉",title:"Drain!",desc:`Stole 10 PTS from ${opp.name}!`}, onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} });
      return;
    }
    afterTileEvent(ps, playerIdx);
  }, [afterTileEvent]);

  const handleAnswer = useCallback((correctOrSignal) => {
    setModal(prev => {
      if (!prev) return null;
      const { playerIdx, ps, doublePoints } = prev;
      const updated = ps.map(p => ({ ...p }));
      const p = updated[playerIdx];

      let correct;
      if (correctOrSignal === "__ai_resolve__") {
        correct = Math.random() < (aiDifficulty?.accuracy ?? 0.5);
        addLog(`🤖 AI ${correct ? "answered correctly!" : "got it wrong!"}`);
      } else {
        correct = correctOrSignal;
      }

      if (correct) {
        const pts = doublePoints ? 20 : 10;
        p.score += pts;
        p.streak = (p.streak || 0) + 1;
        const bonus = p.streak >= 3 ? 5 : 0;
        if (bonus) { p.score += bonus; addLog(`🔥 Streak bonus! +${bonus} pts`); }
        if (correctOrSignal !== "__ai_resolve__")
          addLog(`✅ ${p.name} correct! +${pts} pts${p.streak >= 3 ? ` 🔥×${p.streak}` : ""}`);
      } else {
        p.streak = 0;
        p.pos = Math.max(1, p.pos - 1); 
        
        if (correctOrSignal !== "__ai_resolve__")
          addLog(`❌ ${p.name} wrong! Moved back 1 step.`);
      }
      setPlayers([...updated]);
      setTimeout(() => endTurn(playerIdx, updated), 200);
      return null;
    });
  }, [endTurn, aiDifficulty]);

  const handleSkip = useCallback(() => {
    setModal(prev => {
      if (!prev) return null;
      addLog(`⏭ ${players[prev.playerIdx].name} skipped.`);
      setTimeout(() => endTurn(prev.playerIdx, players), 100);
      return null;
    });
  }, [players, endTurn]);

  const executeTurn = useCallback((playerIdx, currentPlayersState) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceVal(roll);
    addLog(`🎲 ${currentPlayersState[playerIdx].name} rolled ${roll}`);
    
    setMovingPlayer(playerIdx);

    setPlayers(prev => {
      const ps    = prev.map(p => ({ ...p }));
      const steps = Math.min(100, ps[playerIdx].pos + roll) - ps[playerIdx].pos;
      let step = 0;
      
      const doStep = () => {
        if (step >= steps) { 
          setMovingPlayer(null); 
          processTile(ps, playerIdx); 
          return; 
        }
        ps[playerIdx].pos = Math.min(100, ps[playerIdx].pos + 1);
        step++;
        setHighlightTile(ps[playerIdx].pos);
        setPlayers([...ps]);
        setTimeout(doStep, 180);
      };
      setTimeout(doStep, 100);
      return ps;
    });
  }, [processTile]);

  const rollDice = () => {
    if (gameLocked) return;
    setGameLocked(true);
    setDiceRolling(true);

    let count = 0;
    const interval = setInterval(() => {
      setDiceVal(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 8) {
        clearInterval(interval);
        setDiceRolling(false);
        executeTurn(currentPlayer, players);
      }
    }, 80);
  };

  useEffect(() => {
    if (!playersRef.current) return;
    if (mode !== MODES.VS_AI) return;
    if (currentPlayer !== 1) return;
    if (aiThinking) return; 

    setAiThinking(true);
    setGameLocked(true);
    
    const delay = aiDifficulty?.rollDelay ?? 1600;

    const t = setTimeout(() => {
      setAiThinking(false);
      setDiceRolling(true);

      let count = 0;
      const interval = setInterval(() => {
        setDiceVal(Math.floor(Math.random() * 6) + 1);
        count++;
        if (count > 6) {
          clearInterval(interval);
          setDiceRolling(false);
          executeTurn(1, playersRef.current);
        }
      }, 80);
    }, delay);

    return () => clearTimeout(t);
  }, [currentPlayer, mode]); 

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '85vh' }}>
      <Starfield />
      
      {/* --- HIDDEN MUSIC PLAYER (Notice we added autoPlay and the src!) --- */}
      <audio ref={bgmRef} src={bgmMenu} loop autoPlay />

      {/* 🟢 FIXED: Added onExit navigation to the student-menu */}
      {screen === SCREENS.MENU && <MainMenu onSelectMode={handleSelectMode} onExit={() => navigate('/student-menu')} />}
      {screen === "difficulty" && <ModeSelect onConfirm={handleDifficultySelect} onBack={() => setScreen(SCREENS.MENU)} />}
      {screen === SCREENS.CHAR && <CharacterSelect mode={mode} onConfirm={handleCharConfirm} onBack={() => setScreen(mode === MODES.VS_AI ? "difficulty" : SCREENS.MENU)} />}
      
      {screen === SCREENS.GAME && players && (
        <GameScreen 
          players={players} 
          currentPlayer={currentPlayer} 
          movingPlayer={movingPlayer}
          gameLocked={gameLocked} 
          diceVal={diceVal} 
          diceRolling={diceRolling} 
          highlightTile={highlightTile} 
          log={log} 
          modal={modal} 
          mode={mode} 
          aiDifficulty={aiDifficulty} 
          aiThinking={aiThinking} 
          onRoll={rollDice} 
          onAnswer={handleAnswer} 
          onSkip={handleSkip} 
          onRestart={restart} 
          onGoMenu={() => { 
            setScreen(SCREENS.MENU); 
            setPlayers(null); 
            setMode(null); 
            setAiDifficulty(null); 
          }} 
        />
      )}
      
      {screen === SCREENS.WIN && players && (
        <WinScreen 
          players={players} 
          winner={winner}
          mode={mode} 
          onRetry={() => { restart(); setScreen(SCREENS.GAME); }} 
          onMenu={() => { 
            setScreen(SCREENS.MENU); 
            setPlayers(null); 
            setMode(null); 
            setAiDifficulty(null); 
            navigate('/student-menu'); 
          }} 
        />
      )}
    </div>
  );
}