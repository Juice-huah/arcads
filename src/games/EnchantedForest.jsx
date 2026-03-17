// src/games/EnchantedForest.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { LOCATIONS } from '../components/enchanted-forest/data/locations_enhanced.js';

import MainMenu from '../components/enchanted-forest/MainMenu.jsx'; 
import IntroScreen from '../components/enchanted-forest/IntroScreen.jsx';
import GameScreen from '../components/enchanted-forest/GameScreen.jsx';
import WorldMap from '../components/enchanted-forest/map/WorldMap.jsx';

// 🟢 SOUND IMPORTS
import menuBGM from '../components/enchanted-forest/sounds/main_menu.mp3';
import gameBGM from '../components/enchanted-forest/sounds/ingame.mp3';
import victorySFX from '../components/enchanted-forest/sounds/victory.mp3';
import clickSFX from '../components/enchanted-forest/sounds/click.mp3'; 

export default function EnchantedForest() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [screen, setScreen] = useState('menu'); 
  const [score, setScore] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [currentLocIdx, setCurrentLocIdx] = useState(0); 
  const [maxUnlockedIdx, setMaxUnlockedIdx] = useState(0); 
  const [scoreSaved, setScoreSaved] = useState(false);

  const [totalActiveLocations, setTotalActiveLocations] = useState(6);

  const answerLog = useRef([]);

  // 🟢 NEW: SCHEDULING STATES
  const [timeLimit, setTimeLimit] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showTimeUp, setShowTimeUp] = useState(false);

  // 🟢 AUDIO REFERENCES
  const bgmMenuR = useRef(null);
  const bgmGameR = useRef(null);
  const victoryAudioR = useRef(null);
  const clickAudioR = useRef(null); 

  useEffect(() => {
    bgmMenuR.current = new Audio(menuBGM);
    bgmMenuR.current.loop = true;
    bgmMenuR.current.volume = 0.5;

    bgmGameR.current = new Audio(gameBGM);
    bgmGameR.current.loop = true;
    bgmGameR.current.volume = 0.4;

    victoryAudioR.current = new Audio(victorySFX);
    victoryAudioR.current.volume = 0.8;

    clickAudioR.current = new Audio(clickSFX);
    clickAudioR.current.volume = 0.6; 

    return () => {
        if (bgmMenuR.current) { bgmMenuR.current.pause(); bgmMenuR.current = null; }
        if (bgmGameR.current) { bgmGameR.current.pause(); bgmGameR.current = null; }
        if (victoryAudioR.current) { victoryAudioR.current.pause(); victoryAudioR.current = null; }
        if (clickAudioR.current) { clickAudioR.current.pause(); clickAudioR.current = null; }
    };
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      const isClickable = e.target.closest('button') || window.getComputedStyle(e.target).cursor === 'pointer';
      if (isClickable && clickAudioR.current) {
        clickAudioR.current.currentTime = 0; 
        clickAudioR.current.play().catch(() => {}); 
      }
    };
    window.addEventListener('click', handleGlobalClick, true);
    return () => { window.removeEventListener('click', handleGlobalClick, true); };
  }, []);

  // 🟢 MUSIC CONTROLLER
  useEffect(() => {
    if (!bgmMenuR.current || !bgmGameR.current || !victoryAudioR.current) return;

    const playSafe = (audio) => {
        const p = audio.play();
        if (p !== undefined) p.catch(e => console.warn("Autoplay blocked. User must interact first."));
    };

    if (screen === 'menu' || screen === 'intro' || screen === 'map') {
        bgmGameR.current.pause();
        bgmGameR.current.currentTime = 0;
        playSafe(bgmMenuR.current);
    } 
    else if (screen === 'game') {
        bgmMenuR.current.pause();
        playSafe(bgmGameR.current);
    } 
    else if (screen === 'game_over') {
        bgmGameR.current.pause();
        bgmMenuR.current.pause();
        
        victoryAudioR.current.currentTime = 0;
        playSafe(victoryAudioR.current);
    }
  }, [screen]);

  // 1. FETCH DATA & SCHEDULE
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const res = await fetch(`http://localhost:8081/api/game-questions/${gameId}`);
        const data = await res.json();
        
        // 🟢 Fetch time limit
        if (auth.currentUser) {
            const resG = await fetch(`http://localhost:8081/api/student-games/${auth.currentUser.uid}`);
            const allGames = await resG.json();
            const currentGame = allGames.find(g => g.game_id === parseInt(gameId));
            if (currentGame && currentGame.time_limit > 0) {
                setTimeLimit(currentGame.time_limit);
            }
        }

        const sortedData = [...data].sort((a, b) => parseInt(a.id || 0) - parseInt(b.id || 0));
        const locationsMap = {};
        for (let i = 0; i < 6; i++) { locationsMap[i] = { words: [], bossWords: [] }; }

        const uniqueLocs = [...new Set(sortedData.map(q => parseInt(q.choice_b)))].sort((a,b) => a-b);
        setTotalActiveLocations(uniqueLocs.length > 0 ? uniqueLocs.length : 1); 

        sortedData.forEach(q => {
           const originalLocIdx = parseInt(q.choice_b);
           const newSequentialIdx = uniqueLocs.indexOf(originalLocIdx);
           
           if (newSequentialIdx === -1) return;

           const isBoss = q.choice_c === 'boss';
           const wordObj = {
             id: q.id || q.question_id, 
             answer: q.choice_d, 
             scrambled: q.choice_a, 
             hint: q.question_text,
             desc: q.question_text, 
             question: q.question_text 
           };
           
           if (isBoss) locationsMap[newSequentialIdx].bossWords.push(wordObj);
           else locationsMap[newSequentialIdx].words.push(wordObj);
        });

        localStorage.setItem('wordforest_teacher_data', JSON.stringify({ locations: locationsMap }));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching game data:", err);
        setLoading(false);
      }
    };
    if (gameId) fetchGameData();
  }, [gameId]);

  // 🟢 NEW: TIMER COUNTDOWN LOGIC
  useEffect(() => {
      if ((screen === 'map' || screen === 'game') && timeLeft !== null && !showTimeUp) {
          if (timeLeft <= 0) {
              handleTimeUp();
              return;
          }
          const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
          return () => clearInterval(timerId);
      }
  }, [screen, timeLeft, showTimeUp]);

  const handleTimeUp = () => {
      setShowTimeUp(true);
      setScreen('game_over'); // Triggers auto-save naturally below
  };

  // --- AUTO SAVE LOGIC ---
  useEffect(() => {
      if (screen === 'game_over' && !scoreSaved) {
          const autoSave = async () => {
              if (!auth.currentUser || !gameId) return;
              try {
                  const finalValidScore = isNaN(score) ? 0 : Number(score);
                  
                  await fetch('http://localhost:8081/api/save-score', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          student_fid: auth.currentUser.uid,
                          game_id: gameId,
                          score: finalValidScore, 
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
  }, [screen, scoreSaved, gameId, score]);

  const handleEndGame = (finalScore) => {
      if (finalScore !== undefined && finalScore !== null && !isNaN(finalScore)) {
          setScore(Number(finalScore));
      }
      setTimeout(() => {
          setScreen('game_over');
      }, 50);
  };

  const handleLogAnswer = (questionId, isCorrect) => {
      if (auth.currentUser && gameId && questionId) {
          answerLog.current.push({
              student_fid: auth.currentUser.uid,
              game_id: parseInt(gameId),
              question_id: questionId,
              is_correct: isCorrect ? 1 : 0
          });
      }
  };

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0f16', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4dff91', fontSize: '2rem', fontFamily: "'Cinzel', serif" }}>
        Summoning the Forest...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', backgroundColor: '#0a0f16', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '1200px', height: '80vh', position: 'relative', borderRadius: '15px', overflow: 'hidden', border: '2px solid rgba(77,255,145,0.4)', boxShadow: '0 15px 50px rgba(0,0,0,0.9)' }}>
        
        {/* 🟢 GLOBAL TIMER RENDER */}
        {timeLeft !== null && (screen === 'map' || screen === 'game') && (
            <div style={{position: 'absolute', top: 20, right: 30, background: 'rgba(0,0,0,0.8)', border: '2px solid #4dff91', padding: '10px 20px', borderRadius: '10px', color: '#4dff91', zIndex: 900, fontSize: '1.2rem', fontWeight: 'bold', fontFamily: "monospace"}}>
                ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
        )}

        {screen === 'menu' && (
          <MainMenu 
            hasCheckpoint={false}
            onContinue={() => {}}
            onNewGame={() => { 
                setMaxUnlockedIdx(0); setScore(0); setInventory([]); setScoreSaved(false); answerLog.current = []; 
                if (timeLimit > 0) setTimeLeft(timeLimit * 60); // 🟢 Start the clock!
                setScreen('intro'); 
            }} 
            onQuit={() => navigate('/student-menu')}
          />
        )}
        
        {screen === 'intro' && ( <IntroScreen onStart={() => setScreen('map')} /> )}
        
        {screen === 'map' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <WorldMap completedCount={maxUnlockedIdx} onSelectLocation={(id) => { setCurrentLocIdx(id); setScreen('game'); }} />
          </div>
        )}
        
        {screen === 'game' && (
          <GameScreen
            locIdx={currentLocIdx} 
            score={score} 
            inventory={inventory}    
            
            onLogAnswer={handleLogAnswer} 
            onGameOver={(finalScore) => handleEndGame(finalScore)}
            onPlayerDeath={(finalScore) => handleEndGame(finalScore)}
            
            onAreaCleared={(newInventory, newScore) => {
              const safeScore = (newScore !== undefined && !isNaN(newScore)) ? Number(newScore) : score;
              setScore(safeScore); 
              setInventory(newInventory || []);
              
              const nextLevel = currentLocIdx + 1;
              if (nextLevel >= totalActiveLocations) {
                handleEndGame(safeScore);
              } else {
                if (nextLevel > maxUnlockedIdx) setMaxUnlockedIdx(nextLevel);
                setTimeout(() => { setScreen('map'); }, 50);
              }
            }}
          />
        )}
        
        {screen === 'game_over' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10, 15, 30, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
             
             {/* 🟢 DYNAMIC TITLE RENDERING */}
             {showTimeUp ? (
                 <h1 style={{ color: '#ff4c4c', fontSize: '3.5rem', fontFamily: "'Cinzel', serif", textShadow: '0 0 20px rgba(255, 76, 76, 0.5)', marginBottom: '10px' }}>
                    TIME'S UP!
                 </h1>
             ) : (
                 <h1 style={{ color: '#4dff91', fontSize: '3.5rem', fontFamily: "'Cinzel', serif", textShadow: '0 0 20px rgba(77,255,145,0.5)', marginBottom: '10px' }}>
                    GAME FINISHED
                 </h1>
             )}
             
             <div style={{ background: 'rgba(0,0,0,0.6)', padding: '20px 40px', borderRadius: '12px', border: '1px solid #30363d', textAlign: 'center', marginBottom: '30px' }}>
                 <h2 style={{ color: '#8b949e', fontSize: '1.2rem', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Final Score</h2>
                 <div style={{ color: '#ffd700', fontSize: '3rem', fontFamily: "'Press Start 2P', cursive" }}>
                     {isNaN(score) ? 0 : Number(score)}
                 </div>
             </div>

             <div style={{
                 background: 'rgba(0,0,0,0.5)', 
                 padding: '15px 30px', 
                 borderRadius: '8px', 
                 marginBottom: '40px',
                 border: scoreSaved ? '2px solid #48bb78' : '2px dashed #aaa',
             }}>
                 <p style={{color: scoreSaved ? '#48bb78' : '#fbd38d', fontSize: '1.1rem', margin: 0, fontFamily: "'Segoe UI', Tahoma, sans-serif", fontWeight: 'bold'}}>
                     {scoreSaved ? '✅ SCORE SAVED' : '⏳ Saving results to Gradebook...'}
                 </p>
             </div>

             <button 
                onClick={() => navigate('/student-menu')} 
                style={{ 
                    background: 'transparent', 
                    color: '#e53e3e', 
                    border: '2px solid #e53e3e', 
                    padding: '15px 40px', 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    transition: 'all 0.2s' 
                }}
                onMouseOver={(e) => { e.target.style.background = '#e53e3e'; e.target.style.color = '#fff'; }}
                onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#e53e3e'; }}
             >
               EXIT TO ARCADE
             </button>
          </div>
        )}
      </div>
    </div>
  );
}