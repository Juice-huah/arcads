// src/games/EnchantedForest.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LOCATIONS } from '../components/enchanted-forest/data/locations_enhanced.js';

import MainMenu from '../components/enchanted-forest/MainMenu.jsx'; 
import IntroScreen from '../components/enchanted-forest/IntroScreen.jsx';
import GameScreen from '../components/enchanted-forest/GameScreen.jsx';
import VictoryScreen from '../components/enchanted-forest/VictoryScreen.jsx';
import WorldMap from '../components/enchanted-forest/map/WorldMap.jsx';

export default function EnchantedForest() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [screen, setScreen] = useState('menu'); 
  const [score, setScore] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [currentLocIdx, setCurrentLocIdx] = useState(0); 
  const [maxUnlockedIdx, setMaxUnlockedIdx] = useState(0); 
  const [hasSave, setHasSave] = useState(false);

  // Check for existing save on load
  useEffect(() => {
    const savedData = localStorage.getItem(`forest_save_${gameId}`);
    if (savedData) setHasSave(true);
  }, [gameId]);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const res = await fetch(`http://localhost:8081/api/game-questions/${gameId}`);
        const data = await res.json();
        const locationsMap = {};
        for (let i = 0; i < 6; i++) { locationsMap[i] = { words: [], bossWords: [] }; }

        data.forEach(q => {
           const locIdx = parseInt(q.choice_b);
           const isBoss = q.choice_c === 'boss';
           const wordObj = {
             answer: q.choice_d, scrambled: q.choice_a, hint: q.question_text,
             desc: q.question_text, question: q.question_text 
           };
           if (isBoss) locationsMap[locIdx].bossWords.push(wordObj);
           else locationsMap[locIdx].words.push(wordObj);
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

  // ─── SAVE LOGIC ───
  const handleSave = () => {
    const saveData = { maxUnlockedIdx, score, inventory };
    localStorage.setItem(`forest_save_${gameId}`, JSON.stringify(saveData));
    setHasSave(true);
    alert("✨ Progress saved to the Ancient Oaks!");
  };

  const handleContinue = () => {
    const savedData = localStorage.getItem(`forest_save_${gameId}`);
    if (savedData) {
      const { maxUnlockedIdx: savedIdx, score: savedScore, inventory: savedInv } = JSON.parse(savedData);
      setMaxUnlockedIdx(savedIdx);
      setScore(savedScore);
      setInventory(savedInv);
      setScreen('map');
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
        
        {/* ── TOP-LEFT: BACK BUTTON ── */}
        <div style={{ position: 'absolute', top: '15px', left: '20px', zIndex: 9999, pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
                {/* 🟢 FIXED: Removed "screen === 'game'" so it hides during actual gameplay */}
                {(screen === 'map' || screen === 'intro') && (
                    <button 
                        onClick={() => setScreen('menu')} 
                        style={{ background: 'rgba(10, 30, 15, 0.7)', border: '1px solid #4dff91', color: '#4dff91', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.8rem', backdropFilter: 'blur(4px)' }}>
                        ◀ Back
                    </button>
                )}
            </div>
        </div>

        {/* ── BOTTOM-LEFT: SAVE PROGRESS BUTTON ── */}
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 9999, pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
                {(screen === 'map' || screen === 'game') && (
                    <button 
                        onClick={handleSave} 
                        style={{ background: 'rgba(10, 20, 35, 0.7)', border: '1px solid #7ad4ff', color: '#7ad4ff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.8rem', backdropFilter: 'blur(4px)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
                        💾 Save Progress
                    </button>
                )}
            </div>
        </div>

        {/* ── SCREENS ── */}
        {screen === 'menu' && (
          <MainMenu 
            hasCheckpoint={hasSave}
            onContinue={handleContinue}
            onNewGame={() => { setMaxUnlockedIdx(0); setScore(0); setInventory([]); setScreen('intro'); }} 
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
            locIdx={currentLocIdx} score={score} inventory={inventory}    
            onMainMenu={() => setScreen('menu')}
            onAreaCleared={(newInventory, newScore, isVictory) => {
              setScore(newScore); setInventory(newInventory);
              if (isVictory) setScreen('victory');
              else {
                const nextLevel = currentLocIdx + 1;
                if (nextLevel > maxUnlockedIdx) setMaxUnlockedIdx(nextLevel);
                setScreen('map'); 
              }
            }}
          />
        )}
        {screen === 'victory' && (
          <VictoryScreen score={score} inventory={inventory} onRestart={() => setScreen('menu')} onExit={() => navigate('/student-menu')} />
        )}
      </div>
    </div>
  );
}