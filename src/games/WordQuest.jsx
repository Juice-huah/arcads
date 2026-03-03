// src/games/WordQuest.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import "./WordQuest.css";
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

// --- AUDIO IMPORTS ---
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

import { isQuestionTile } from "../components/Board";

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
  const activeBgmRef = useRef(bgmMenu);

  const playSfx = (soundFile) => {
    const audio = new Audio(soundFile);
    audio.volume = 0.6; 
    audio.play().catch(e => console.log("SFX Blocked"));
  };

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (e.target.closest('button') || e.target.closest('.card div')) {
        playSfx(sfxClick);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = 0.25;
      bgmRef.current.play().catch(e => console.log("Autoplay blocked by browser:", e));
    }
    const fallbackPlay = () => {
      if (bgmRef.current && bgmRef.current.paused) {
        bgmRef.current.play();
      }
      window.removeEventListener('click', fallbackPlay);
    };
    window.addEventListener('click', fallbackPlay);
    return () => window.removeEventListener('click', fallbackPlay);
  }, []);

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
            const opts = [q.choice_a, q.choice_b, q.choice_c, q.choice_d].slice(0, 4);
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
          const pristineQs = JSON.parse(JSON.stringify(formattedQs));
          allQsRef.current = pristineQs;
          availableQsRef.current = JSON.parse(JSON.stringify(pristineQs));
        }
      } catch(e) { console.error("Error fetching questions:", e); }
    };
    if (gameId) fetchQuestions();
  }, [gameId]);

  const handleSaveScore = async () => {
    if (scoreSaved || !auth.currentUser || !winner) return;
    try {
        await fetch('http://localhost:8081/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_fid: auth.currentUser.uid,
                game_id: gameId,
                score: winner.score,
                time_taken: 0
            })
        });
        setScoreSaved(true);
        alert("Score saved successfully!");
    } catch (e) {
        console.error(e);
        alert("Failed to save score.");
    }
  };

  const handleGameEnd = (finalPlayers) => {
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
        health: 100, // 🟢 ADDED: Players now start with 100 HP!
        pos: 1,
        streak: 0,
        skipTurn: false
    }));
    
    availableQsRef.current = JSON.parse(JSON.stringify(allQsRef.current));

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
    if (eff.includes("15 HP") || eff.includes("10 HP") || eff.includes("20 points")) p.score += 1;
    if (eff.includes("forward 3")) p.pos = Math.min(100, p.pos + 3);
  }
  function applyTrap(ps, idx, eff) {
    const p = ps[idx];
    if (eff.includes("15 HP") || eff.includes("10 points")) p.score = Math.max(0, p.score - 1);
    if (eff.includes("back 3"))    p.pos   = Math.max(1, p.pos - 3);
    if (eff.includes("Skip"))      p.skipTurn = true;
  }
  function applyWild(ps, idx, eff) {
    const p = ps[idx]; const opp = ps[1 - idx];
    switch (eff.effect) {
      case "forward5": p.pos   = Math.min(100, p.pos + 5);    break;
      case "heal20":   p.score += 1; break;
      case "double":   setDoubleNext(true);                   break;
      case "back3":    p.pos   = Math.max(1, p.pos - 3);      break;
      case "damage15": p.score = Math.max(0, p.score - 1);    break;
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
          addLog(`⏸ ${u[nextIdx].name} is stuck in a trap and loses their turn!`);
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
    const tile = ps[playerIdx].pos;
    
    const isDoubleOrTrap = DOUBLE_TILES.includes(tile) || TRAP_TILES.includes(tile);

    if (isQuestionTile(tile) || isDoubleOrTrap) {
        if (availableQsRef.current.length === 0) {
            if (allQsRef.current.length === 0) {
                endTurn(playerIdx, ps); 
                return;
            }
            availableQsRef.current = JSON.parse(JSON.stringify(allQsRef.current));
            addLog("🔄 Question pile refilled!");
        }

        const q = availableQsRef.current.shift();
        const dbl = DOUBLE_TILES.includes(tile) || doubleNext;
        setDoubleNext(false);

        const pristineQ = JSON.parse(JSON.stringify(q));
        pristineQ.options = pristineQ.options.slice(0, 4);

        setModal({ type: "question", question: pristineQ, doublePoints: dbl, playerIdx, ps: [...ps], originalId: pristineQ.id });
    } else {
        endTurn(playerIdx, ps);
    }
  }, [doubleNext, endTurn]);

  const processTile = useCallback((ps, playerIdx) => {
    const p = ps[playerIdx]; const tile = p.pos;

    if (tile >= 100) { 
        ps[playerIdx].pos = 100;
        ps[playerIdx].score += 5;
        addLog(`🏆 ${ps[playerIdx].name} reached the goal! Finish Bonus: +5 PTS!`);
        
        setPlayers([...ps]); 
        setWinner(ps[playerIdx]); 
        handleGameEnd([...ps]); 
        return; 
    }

    const snakeDest = SNAKES[tile] || SNAKES[String(tile)];
    const ladderDest = LADDERS[tile] || LADDERS[String(tile)];

    if (ladderDest) {
      addLog(`🪜 ${p.name} climbs ladder ${tile}→${ladderDest}!`);
      ps[playerIdx].pos = ladderDest; setPlayers([...ps]); setHighlightTile(ladderDest);
      setModal({ type:"event", event:{icon:"🪜",title:"Ladder Boost!",desc:`Climbing to tile ${ladderDest}!`}, onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} });
      return;
    }
    
    if (snakeDest) {
      addLog(`🐍 ${p.name} bitten! ${tile}→${snakeDest}`);
      ps[playerIdx].pos = snakeDest;
      setPlayers([...ps]); setHighlightTile(snakeDest);
      setModal({ type:"event", event:{icon:"🐍",title:"Snake Bite!",desc:`Oh no! Sliding down to tile ${snakeDest}!`}, onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} });
      return;
    }

    if (POWER_UP_TILES.includes(tile)) {
      const eff = POWER_UP_EFFECTS[Math.floor(Math.random() * POWER_UP_EFFECTS.length)];
      applyPowerUp(ps, playerIdx, eff); addLog(`⚡ ${p.name}: Power up!`);
      setModal({ type:"event", event:{icon:"⚡",title:"Power Up!",desc:"You found an item!"}, onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} });
      return;
    }
    
    if (TRAP_TILES.includes(tile)) {
      ps[playerIdx].skipTurn = true; 
      addLog(`💀 ${p.name} trapped! Misses next turn.`);
      setModal({ 
        type:"event", 
        event:{
          icon:"💀",
          title:"Trap Sprung!",
          desc:"You are stuck in a trap! You will skip your next turn. Answer this question to at least earn 1 point!"
        }, 
        onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} 
      });
      return;
    }
    
    if (DOUBLE_TILES.includes(tile)) { 
      setDoubleNext(true); 
      addLog(`×2 ${p.name} lands on Double!`); 
      setModal({ type:"event", event:{icon:"✨",title:"Double Points!",desc:`You found a Bonus Question worth 2 points!`}, onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} });
      return;
    }
    
    if (WILD_TILES.includes(tile)) {
      const eff = WILD_EFFECTS[Math.floor(Math.random() * WILD_EFFECTS.length)];
      applyWild(ps, playerIdx, eff); addLog(`🃏 ${p.name}: ${eff.label}`);
      setModal({ type:"event", event:{icon:"🃏",title:eff.label,desc:"A wild magic effect occurred!"}, onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} });
      return;
    }
    if (STEAL_TILES.includes(tile)) {
      const opp = ps[1-playerIdx];
      opp.score = Math.max(0, opp.score - 1); p.score += 1;
      addLog(`💉 ${p.name} steals 1 PT from ${opp.name}!`); setPlayers([...ps]);
      setModal({ type:"event", event:{icon:"💉",title:"Drain!",desc:`Stole 1 PT from ${opp.name}!`}, onClose:()=>{setModal(null);afterTileEvent(ps,playerIdx);} });
      return;
    }
    afterTileEvent(ps, playerIdx);
  }, [afterTileEvent]);

  const handleAnswer = useCallback((correctOrSignal) => {
    setModal(prev => {
      if (!prev) return null;
      const { playerIdx, ps, doublePoints, originalId } = prev;
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
        const pts = doublePoints ? 2 : 1; 
        p.score += pts;
        p.streak = (p.streak || 0) + 1;
        if (correctOrSignal !== "__ai_resolve__")
          addLog(`✅ ${p.name} correct! +${pts} pt${pts > 1 ? 's' : ''}${p.streak >= 3 ? ` 🔥×${p.streak}` : ""}`);
      } else {
        p.streak = 0;
        
        // 🟢 ADDED: Subtracts exactly 10 HP when they get it wrong!
        p.health = Math.max(0, p.health - 10);
        
        if (correctOrSignal !== "__ai_resolve__") {
          addLog(`❌ ${p.name} answered incorrectly! Lost 10 HP.`);
        }

        const pristineDatabaseQ = allQsRef.current.find(x => x.id === originalId);
        if (pristineDatabaseQ) {
            availableQsRef.current.push(JSON.parse(JSON.stringify(pristineDatabaseQ)));
        }
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
      
      <audio ref={bgmRef} src={bgmMenu} loop autoPlay />

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
      
      {screen === SCREENS.WIN && players && winner && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10, 15, 30, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card" style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                {mode === MODES.VS_AI && winner.id === 1 ? (
                    <>
                        <h1 style={{ color: '#ef4444', fontSize: '3.5rem', textShadow: '2px 2px #000', marginBottom: '10px' }}>DEFEATED!</h1>
                        <p style={{ color: '#fbbf24', fontSize: '1.5rem', marginBottom: '20px' }}>Computer Reached the Castle!</p>
                    </>
                ) : (
                    <>
                        <h1 style={{ color: '#4ade80', fontSize: '3.5rem', textShadow: '2px 2px #000', marginBottom: '10px' }}>VICTORY!</h1>
                        <p style={{ color: '#ffd700', fontSize: '1.5rem', marginBottom: '20px' }}>{winner.name} Reached the Castle!</p>
                    </>
                )}
                
                <div style={{ fontSize: '2rem', color: '#fff', marginBottom: '30px' }}>
                    Final Score: <span style={{ fontWeight: 'bold', color: '#ffd700', fontSize: '2.5rem' }}>{winner.score}</span> PTS
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '300px' }}>
                    <button className="btn" onClick={() => { restart(); setScreen(SCREENS.GAME); }} style={{ background: '#3b82f6', border: '2px solid #fff' }}>
                        ⚔️ PLAY AGAIN
                    </button>
                    <button 
                        className="btn" 
                        onClick={handleSaveScore} 
                        disabled={scoreSaved}
                        style={{ background: scoreSaved ? '#4b5563' : '#10b981', color: '#fff', border: '2px solid #fff' }}
                    >
                        {scoreSaved ? '✅ SCORE SAVED' : '💾 SAVE SCORE'}
                    </button>
                    <button className="btn" onClick={() => { 
                        setScreen(SCREENS.MENU); setPlayers(null); setMode(null); setAiDifficulty(null); navigate('/student-menu'); 
                    }} style={{ background: '#ef4444', border: '2px solid #fff' }}>
                        🚪 MAIN MENU
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}