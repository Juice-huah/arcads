// src/games/WordQuest.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import "./WordQuest.css";
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

import bgmMenu from "../assets/wordquest/sounds/bgm_menu.wav";
import bgmGame from "../assets/wordquest/sounds/bgm_game.wav";
import sfxClick from "../assets/wordquest/sounds/click.wav";

import {
  SCREENS, MODES, LADDERS, SNAKES,
  POWER_UP_TILES, TRAP_TILES, WILD_TILES, DOUBLE_TILES, STEAL_TILES,
  POWER_UP_EFFECTS, TRAP_EFFECTS, WILD_EFFECTS,
} from "../constants/gameData";

import Starfield       from "../components/Starfield";
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

  const [winner, setWinner] = useState(null);
  const [scoreSaved, setScoreSaved] = useState(false);

  // 🟢 NEW: SCHEDULING STATES
  const [timeLeft, setTimeLeft] = useState(null);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const timeLimitR = useRef(0);

  const playersRef = useRef(null);
  useEffect(() => { playersRef.current = players; }, [players]);

  const allQsRef = useRef([]);       
  const userDeckRef = useRef([]);   
  const aiDeckRef = useRef([]);     
  const answerLog = useRef([]);     
  const answerHandledRef = useRef(false);

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
        // 🟢 Fetch Schedule
        if (auth.currentUser) {
            const resG = await fetch(`http://localhost:8081/api/student-games/${auth.currentUser.uid}`);
            const allGames = await resG.json();
            const currentGame = allGames.find(g => g.game_id === parseInt(gameId));
            if (currentGame && currentGame.time_limit > 0) {
                timeLimitR.current = currentGame.time_limit;
            }
        }

        const res = await fetch(`http://localhost:8081/api/game-questions/${gameId}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          
          const sortedData = [...data].sort((a, b) => {
              const numA = parseInt(a.question_number || a.id || a.question_id || 0, 10);
              const numB = parseInt(b.question_number || b.id || b.question_id || 0, 10);
              return numA - numB;
          });

          const formattedQs = sortedData.map(q => {
            const opts = [q.choice_a, q.choice_b, q.choice_c, q.choice_d].slice(0, 4);
            return {
              id: q.id || q.question_id, 
              question: q.question_text,
              options: opts,
              correct: opts[q.correct_answer] || opts[0], 
              category: "Quest", 
              difficulty: "medium" 
            };
          });
          
          setQuestions(formattedQs);
          allQsRef.current = formattedQs;
        }
      } catch(e) { console.error("Error fetching questions:", e); }
    };
    if (gameId) fetchQuestions();
  }, [gameId]);

  // 🟢 NEW: TIMER COUNTDOWN LOGIC
  useEffect(() => {
      if (screen === SCREENS.GAME && timeLeft !== null && !showTimeUp && players) {
          if (timeLeft <= 0) {
              setShowTimeUp(true);
              const finalWinner = players[0].score >= players[1].score ? players[0] : players[1];
              setWinner(finalWinner);
              setScreen(SCREENS.WIN);
              return;
          }
          const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
          return () => clearInterval(timerId);
      }
  }, [screen, timeLeft, showTimeUp, players]);

  useEffect(() => {
      if (screen === SCREENS.WIN && winner && !scoreSaved) {
          const autoSave = async () => {
              if (!auth.currentUser || !gameId || !players) return;
              try {
                  const humanAcademicScore = players[0].correctAnswers;
                  const maxPossibleQuestions = allQsRef.current.length || 1;
                  const cappedScore = Math.min(humanAcademicScore, maxPossibleQuestions);

                  await fetch('http://localhost:8081/api/save-score', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          student_fid: auth.currentUser.uid,
                          game_id: gameId,
                          score: cappedScore, 
                          time_taken: 0
                      })
                  });

                  if (answerLog.current.length > 0) {
                      await fetch('http://localhost:8081/api/save-answers', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ answers: answerLog.current })
                      });
                  }

                  setScoreSaved(true);
              } catch (e) {
                  console.error("Error saving score:", e);
              }
          };
          autoSave();
      }
  }, [screen, winner, scoreSaved, gameId, players]);

  const handleGameEnd = (finalPlayers) => {
    setTimeout(() => setScreen(SCREENS.WIN), 600);
  };

  const handleSelectMode = () => {
    if (questions.length === 0) return alert("Loading questions from server, please wait...");
    setMode(MODES.VS_AI);
    setScreen("difficulty");
  };

  const handleDifficultySelect = (diff) => {
    setAiDifficulty(diff);
    setScreen(SCREENS.CHAR);
  };

  const handleCharConfirm = (chars) => {
    setCharSel(chars);
    
    userDeckRef.current = JSON.parse(JSON.stringify(allQsRef.current));
    aiDeckRef.current = JSON.parse(JSON.stringify(allQsRef.current)).sort(() => Math.random() - 0.5);
    
    answerLog.current = []; 
    answerHandledRef.current = false;

    const ps = chars.map((charObj, idx) => ({
        id: idx,
        name: idx === 1 ? "Computer" : `Student`,
        char: charObj, 
        score: 0,
        correctAnswers: 0, 
        health: 100, 
        pos: 1,
        streak: 0,
        skipTurn: false
    }));

    setPlayers(ps);
    setCurrentPlayer(0);
    setMovingPlayer(null);
    setLog([]);
    setDiceVal(null);
    setModal(null);
    setWinner(null); 
    setScoreSaved(false); 

    // 🟢 START CLOCK
    if (timeLimitR.current > 0) setTimeLeft(timeLimitR.current * 60);
    setShowTimeUp(false);

    setScreen(SCREENS.GAME);
    addLog("⚔️ The adventure begins! Race to Tile 100!");
  };

  const checkDeath = (ps) => {
    if (ps[0].health <= 0) { setWinner(ps[1]); handleGameEnd(ps); return true; }
    if (ps[1].health <= 0) { setWinner(ps[0]); handleGameEnd(ps); return true; }
    return false;
  };

  function applyPowerUp(ps, idx, eff) {
    const p = ps[idx];
    if (eff.includes("15 HP")) p.health = Math.min(100, p.health + 15);
    if (eff.includes("10 HP")) p.health = Math.min(100, p.health + 10);
    if (eff.includes("forward 3")) p.pos = Math.min(100, p.pos + 3);
  }
  
  function applyTrap(ps, idx, eff) {
    const p = ps[idx];
    if (eff.includes("15 HP")) p.health = Math.max(0, p.health - 15);
    if (eff.includes("back 3"))    p.pos   = Math.max(1, p.pos - 3);
    if (eff.includes("Skip"))      p.skipTurn = true;
  }
  
  function applyWild(ps, idx, eff) {
    const p = ps[idx]; const opp = ps[1 - idx];
    switch (eff.effect) {
      case "forward5": p.pos   = Math.min(100, p.pos + 5);    break;
      case "heal20":   p.health = Math.min(100, p.health + 20); break;
      case "back3":    p.pos   = Math.max(1, p.pos - 3);      break;
      case "damage15": p.health = Math.max(0, p.health - 15);    break;
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
        
        let q;
        if (playerIdx === 0) {
            if (userDeckRef.current.length === 0) {
                 userDeckRef.current = JSON.parse(JSON.stringify(allQsRef.current));
            }
            q = userDeckRef.current[0]; 
        } else {
            if (aiDeckRef.current.length === 0) {
                aiDeckRef.current = JSON.parse(JSON.stringify(allQsRef.current)).sort(() => Math.random() - 0.5);
            }
            q = aiDeckRef.current[0]; 
        }

        const pristineQ = JSON.parse(JSON.stringify(q));
        pristineQ.options = pristineQ.options.slice(0, 4);

        setModal({ type: "question", question: pristineQ, playerIdx, ps: [...ps], originalId: pristineQ.id });
    } else {
        endTurn(playerIdx, ps);
    }
  }, [endTurn]);

  const processTile = useCallback((ps, playerIdx) => {
    const p = ps[playerIdx]; const tile = p.pos;

    let eventHandled = false;
    const closeEvent = () => {
        if (eventHandled) return;
        eventHandled = true;
        setModal(null);
        afterTileEvent(ps, playerIdx);
    };

    if (tile >= 100) { 
        ps[playerIdx].pos = 100;
        addLog(`🏆 ${ps[playerIdx].name} reached the castle! Game Finished!`);
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
      setModal({ type:"event", event:{icon:"🪜",title:"Ladder Boost!",desc:`Climbing to tile ${ladderDest}!`}, onClose: closeEvent });
      return;
    }
    
    if (snakeDest) {
      ps[playerIdx].health = Math.max(0, ps[playerIdx].health - 10);
      addLog(`🐍 ${p.name} bitten! ${tile}→${snakeDest} (-10 HP)`);
      ps[playerIdx].pos = snakeDest;
      setPlayers([...ps]); setHighlightTile(snakeDest);
      if (checkDeath(ps)) return;
      setModal({ type:"event", event:{icon:"🐍",title:"Snake Bite!",desc:`Oh no! Sliding down to tile ${snakeDest} and lost 10 HP!`}, onClose: closeEvent });
      return;
    }

    if (POWER_UP_TILES.includes(tile)) {
      const eff = POWER_UP_EFFECTS[Math.floor(Math.random() * POWER_UP_EFFECTS.length)];
      applyPowerUp(ps, playerIdx, eff); addLog(`⚡ ${p.name}: Power up!`);
      setPlayers([...ps]);
      setModal({ type:"event", event:{icon:"⚡",title:"Power Up!",desc:eff}, onClose: closeEvent });
      return;
    }
    
    if (TRAP_TILES.includes(tile)) {
      const eff = TRAP_EFFECTS[Math.floor(Math.random() * TRAP_EFFECTS.length)];
      applyTrap(ps, playerIdx, eff); addLog(`💀 ${p.name}: Trap! ${eff}`);
      setPlayers([...ps]);
      if (checkDeath(ps)) return;
      setModal({ type:"event", event:{icon:"💀",title:"Trap Sprung!",desc:eff}, onClose: closeEvent });
      return;
    }
    
    if (DOUBLE_TILES.includes(tile)) { 
      addLog(`✨ ${p.name} lands on a Bonus Question!`); 
      setModal({ type:"event", event:{icon:"✨",title:"Bonus Question!",desc:`Answer carefully to gain 1 extra point!`}, onClose: closeEvent });
      return;
    }
    
    if (WILD_TILES.includes(tile)) {
      const eff = WILD_EFFECTS[Math.floor(Math.random() * WILD_EFFECTS.length)];
      applyWild(ps, playerIdx, eff); addLog(`🃏 ${p.name}: ${eff.label}`);
      setPlayers([...ps]);
      if (checkDeath(ps)) return;
      setModal({ type:"event", event:{icon:"🃏",title:eff.label,desc:eff.desc}, onClose: closeEvent });
      return;
    }

    if (STEAL_TILES.includes(tile)) {
      const opp = ps[1-playerIdx];
      opp.health = Math.max(0, opp.health - 5); 
      p.health = Math.min(100, p.health + 5);
      addLog(`💉 ${p.name} steals 5 HP from ${opp.name}!`); 
      setPlayers([...ps]);
      if (checkDeath(ps)) return;
      setModal({ type:"event", event:{icon:"💉",title:"Drain!",desc:`Stole 5 HP from ${opp.name}!`}, onClose: closeEvent });
      return;
    }
    afterTileEvent(ps, playerIdx);
  }, [afterTileEvent]);

  const handleAnswer = (correctOrSignal) => {
    if (!modal || answerHandledRef.current) return;
    answerHandledRef.current = true; 

    const { playerIdx, ps, originalId } = modal;
    
    if (playerIdx === 0) {
        userDeckRef.current.shift();
    } else {
        aiDeckRef.current.shift();
    }

    const updated = ps.map(p => ({ ...p }));
    const p = updated[playerIdx];

    let correct;
    if (correctOrSignal === "__ai_resolve__") {
      correct = Math.random() < (aiDifficulty?.accuracy ?? 0.5);
      addLog(`🤖 AI ${correct ? "answered correctly!" : "got it wrong!"}`);
    } else {
      correct = correctOrSignal;
      
      if (auth.currentUser && gameId) {
          answerLog.current.push({
              student_fid: auth.currentUser.uid,
              game_id: parseInt(gameId),
              question_id: originalId,
              is_correct: correct ? 1 : 0
          });
      }
    }

    if (correct) {
      p.score += 1; 
      if (playerIdx === 0) p.correctAnswers += 1; 
      p.streak = (p.streak || 0) + 1;
      if (correctOrSignal !== "__ai_resolve__")
        addLog(`✅ ${p.name} correct! +1 pt ${p.streak >= 3 ? ` 🔥×${p.streak}` : ""}`);
    } else {
      p.streak = 0;
      p.health = Math.max(0, p.health - 10);
      
      if (correctOrSignal !== "__ai_resolve__") {
        addLog(`❌ ${p.name} answered incorrectly! Lost 10 HP.`);
      }
    }
    
    setModal(null); 
    setPlayers(updated);

    if (checkDeath(updated)) return; 

    if (playerIdx === 0 && userDeckRef.current.length === 0) {
        setTimeout(() => {
            const finalWinner = updated[0].score >= updated[1].score ? updated[0] : updated[1];
            setWinner(finalWinner);
            handleGameEnd(updated);
        }, 500);
        return;
    }

    setTimeout(() => {
        answerHandledRef.current = false; 
        endTurn(playerIdx, updated);
    }, 200);
  };

  const handleSkip = useCallback(() => {
    if (!modal || answerHandledRef.current) return;
    answerHandledRef.current = true;

    const { playerIdx, ps } = modal;
    
    if (playerIdx === 0) userDeckRef.current.shift();
    else aiDeckRef.current.shift();

    addLog(`⏭ ${ps[playerIdx].name} skipped.`);
    setModal(null);

    if (playerIdx === 0 && userDeckRef.current.length === 0) {
        setTimeout(() => {
            const finalWinner = ps[0].score >= ps[1].score ? ps[0] : ps[1];
            setWinner(finalWinner);
            handleGameEnd(ps);
        }, 500);
        return;
    }

    setTimeout(() => {
        answerHandledRef.current = false;
        endTurn(playerIdx, ps);
    }, 100);
  }, [modal, endTurn]);

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
    <div className="screen" style={{ padding: 0 }}>
      <Starfield />
      
      <audio ref={bgmRef} src={bgmMenu} loop autoPlay />

      {/* 🟢 GLOBAL TIMER RENDER */}
      {timeLeft !== null && screen === SCREENS.GAME && (
          <div style={{ position: 'absolute', top: 20, right: 30, background: 'rgba(0,0,0,0.8)', border: '2px solid #ce93d8', padding: '10px 20px', borderRadius: '10px', color: '#ce93d8', zIndex: 900, fontSize: '1.2rem', fontWeight: 'bold', fontFamily: "monospace" }}>
              ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
      )}

      {screen === SCREENS.MENU && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '450px' }}>
            <h1 className="game-title">WORD QUEST</h1>
            <p className="game-subtitle">Snakes & Ladders Adventure</p>
            
            <button className="btn" onClick={() => { playSfx(sfxClick); handleSelectMode(); }}>
              START GAME
            </button>
            
            <button className="btn ghost" onClick={() => { playSfx(sfxClick); setScreen('INSTRUCTIONS'); }}>
              HOW TO PLAY
            </button>

            <button className="btn ghost" onClick={() => { playSfx(sfxClick); navigate('/student-menu'); }} style={{ borderColor: '#e53e3e', color: '#e53e3e' }}>
              EXIT TO ARCADE
            </button>
          </div>
        </div>
      )}

      {screen === 'INSTRUCTIONS' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: '550px', textAlign: 'left' }}>
             <h2 className="game-title" style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '25px', color: '#f6ad55' }}>
               HOW TO PLAY
             </h2>
             <ul style={{fontSize: '1rem', color: 'white', lineHeight: '1.8', margin: 0, paddingLeft: '20px', fontFamily: "'Segoe UI', Tahoma, sans-serif"}}>
                <li>1. Roll the dice to move across the board.</li>
                <li>2. Land on <b style={{color: '#3b82f6'}}>❓ Tiles</b> to answer a question.</li>
                <li>3. Correct answers reward points and streaks.</li>
                <li>4. Watch out for Snakes (go down) and Traps.</li>
                <li>5. The game ends when someone reaches Tile 100 or their HP hits 0!</li>
                <li><b style={{color: '#ffd700'}}>6. The game also ends once you finish answering all your questions!</b></li>
             </ul>
             <div style={{marginTop: '30px'}}>
               <button className="btn" onClick={() => { playSfx(sfxClick); setScreen(SCREENS.MENU); }}>
                 BACK
               </button>
             </div>
          </div>
        </div>
      )}

      {screen === "difficulty" && <ModeSelect onConfirm={handleDifficultySelect} onBack={() => setScreen(SCREENS.MENU)} />}
      {screen === SCREENS.CHAR && <CharacterSelect mode={mode} onConfirm={handleCharConfirm} onBack={() => setScreen("difficulty")} />}
      
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
          onRestart={() => {}} 
          onGoMenu={() => {}} 
        />
      )}
      
      {screen === SCREENS.WIN && players && winner && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10, 15, 30, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card" style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                <h2 style={{ color: '#aaa', fontSize: '1rem', marginBottom: '5px', letterSpacing: '2px' }}>GAME FINISHED!</h2>

                {/* 🟢 DYNAMIC TITLE RENDERING FOR TIMEOUT VS WIN */}
                {showTimeUp ? (
                    <>
                        <h1 className="game-title" style={{ color: '#ef4444', fontSize: '2.5rem', marginBottom: '10px' }}>TIME'S UP!</h1>
                        <p className="game-subtitle" style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '20px' }}>Your time has expired.</p>
                    </>
                ) : (
                    winner.id === 1 ? (
                        <>
                            <h1 className="game-title" style={{ color: '#ef4444', fontSize: '2.5rem', marginBottom: '10px' }}>DEFEATED!</h1>
                            <p className="game-subtitle" style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '20px' }}>
                                {players[0].health <= 0 ? "You lost all your HP!" : "Computer Reached the Castle!"}
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="game-title" style={{ color: '#4ade80', fontSize: '2.5rem', marginBottom: '10px' }}>VICTORY!</h1>
                            <p className="game-subtitle" style={{ color: '#ffd700', fontSize: '1.2rem', marginBottom: '20px' }}>
                                {players[1].health <= 0 ? "The Computer lost all its HP!" : `${winner.name} scored the most points!`}
                            </p>
                        </>
                    )
                )}
                
                <div style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '20px', fontFamily: "'Press Start 2P', cursive" }}>
                    SCORE: <span style={{ color: '#ffd700' }}>{winner.score}</span>
                </div>

                <div style={{
                    background: 'rgba(0,0,0,0.5)', 
                    padding: '15px 20px', 
                    borderRadius: '8px', 
                    marginBottom: '30px',
                    border: scoreSaved ? '2px solid #48bb78' : '2px dashed #aaa',
                    width: '100%'
                }}>
                    <p style={{color: scoreSaved ? '#48bb78' : '#fbd38d', fontSize: '1rem', margin: 0, fontFamily: "'Segoe UI', Tahoma, sans-serif", fontWeight: 'bold'}}>
                        {scoreSaved ? '✅ SCORE SAVED' : '⏳ Saving results...'}
                    </p>
                </div>
                
                <div style={{ width: '100%' }}>
                    <button className="btn ghost" onClick={() => { 
                        setScreen(SCREENS.MENU); setPlayers(null); setMode(null); setAiDifficulty(null); navigate('/student-menu'); 
                    }} style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                        EXIT TO MENU
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}