// src/startype/StarType.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Game from '../startype/Game';
import '../startype/index.css'; 

// 🎵 AUDIO IMPORTS
import clickSound from '../startype/sounds/click.mp3';
import mainMenuMusic from '../startype/sounds/main-menu.mp3';
import victoryMusic from '../startype/sounds/victory.mp3';

// 🎵 CLICK AUDIO HELPER
export const playClick = () => {
  const audio = new Audio(clickSound);
  audio.volume = 0.8;
  audio.play().catch(() => {}); 
};

export default function StarType() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [screen, setScreen] = useState('title'); 
  const [finalStats, setFinalStats] = useState(null);
  
  const [user, setUser] = useState(null);
  const [wordsData, setWordsData] = useState({ Easy: [], Medium: [], Hard: [], Expert: [] });
  const [loading, setLoading] = useState(true);
  const [isScoreSaved, setIsScoreSaved] = useState(false);
  
  // 🟢 NEW SCHEDULING STATES
  const [timeLeft, setTimeLeft] = useState(null);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const timeLimitR = useRef(0);

  const isSavingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
    });

    const fetchWords = async () => {
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
        
        if (data && data.length > 0) {
          const sortedWords = { Easy: [], Medium: [], Hard: [], Expert: [] };
          
          data.forEach(q => {
            const tier = q.choice_a || 'Easy';
            const wordObj = { id: q.id || q.question_id, word: q.question_text.toUpperCase() };
            if (sortedWords[tier]) {
              sortedWords[tier].push(wordObj);
            } else {
              sortedWords.Easy.push(wordObj); 
            }
          });

          if (sortedWords.Easy.length === 0) sortedWords.Easy = [{id: 0, word: "NO_DATA"}];
          setWordsData(sortedWords);
        }
      } catch (err) {
        console.error("Error fetching custom words:", err);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) fetchWords();
    else setLoading(false);

    return () => unsubscribe();
  }, [gameId]);

  // 🟢 NEW TIMER COUNTDOWN LOGIC
  useEffect(() => {
      if (screen === 'game' && timeLeft !== null && !showTimeUp) {
          if (timeLeft <= 0) {
              setShowTimeUp(true);
              setScreen('timeup');
              return;
          }
          const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
          return () => clearInterval(timerId);
      }
  }, [screen, timeLeft, showTimeUp]);

  // 🟢 AUTO-SAVE FOR TIME UP
  useEffect(() => {
      if (screen === 'timeup' && !isScoreSaved && !isSavingRef.current && user) {
          isSavingRef.current = true;
          const saveToDb = async () => {
              try {
                  await fetch('http://localhost:8081/api/save-score', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          student_fid: user.uid,
                          game_id: gameId,
                          score: 0, 
                          time_taken: 0
                      })
                  });
                  setIsScoreSaved(true);
              } catch (err) {
                  console.error(err);
              }
          };
          saveToDb();
      }
  }, [screen, isScoreSaved, gameId, user]);

  const handleGameOver = useCallback(async (stats, answerLog) => {
    if (isSavingRef.current) return; 
    isSavingRef.current = true;

    setFinalStats(stats);
    setScreen('gameover');

    if (!user || !gameId) return;

    try {
      await fetch('http://localhost:8081/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_fid: user.uid,
          game_id: gameId,
          score: stats.score,
          time_taken: 0
        })
      });

      if (answerLog && answerLog.length > 0) {
        await fetch('http://localhost:8081/api/save-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: answerLog })
        });
      }

      setIsScoreSaved(true);
    } catch (err) {
      console.error("Error saving score:", err);
    }
  }, [user, gameId]);

  if (loading) {
    return <div style={{ color: '#00f5ff', textAlign: 'center', marginTop: '45vh', fontFamily: "'Orbitron', sans-serif", fontSize: '2rem' }}>INITIALIZING FLEET DATA...</div>;
  }

  const hasWords = wordsData?.Easy?.length > 0 && wordsData.Easy[0]?.word !== "NO_DATA";

  return (
    <div className="startype-wrapper">

      {/* 🟢 GLOBAL TIMER RENDER */}
      {timeLeft !== null && screen === 'game' && (
          <div style={{ position: 'absolute', top: 20, right: 30, background: 'rgba(0,0,0,0.8)', border: '2px solid #00f5ff', padding: '10px 20px', borderRadius: '10px', color: '#00f5ff', zIndex: 900, fontSize: '1.2rem', fontWeight: 'bold', fontFamily: '"Share Tech Mono", monospace' }}>
              ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
      )}

      {screen === 'title' && (
        <TitleScreen 
          onStart={() => { 
              playClick(); 
              if (timeLimitR.current > 0) setTimeLeft(timeLimitR.current * 60); 
              setShowTimeUp(false);
              setScreen('game'); 
          }} 
          onHowTo={() => { playClick(); setScreen('howto'); }}
          onExit={() => { playClick(); navigate('/student-menu'); }}
          disabled={!hasWords}
        />
      )}

      {screen === 'howto' && (
        <HowToPlayScreen onBack={() => { playClick(); setScreen('title'); }} />
      )}
      
      {screen === 'game' && (
        <Game 
          wordsData={wordsData} 
          user={user}
          gameId={gameId}
          onGameOver={handleGameOver} 
        />
      )}
      
      {screen === 'gameover' && (
        <GameOverScreen
          stats={finalStats}
          isScoreSaved={isScoreSaved}
          onMenu={() => { playClick(); navigate('/student-menu'); }}
        />
      )}

      {/* 🟢 CUSTOM TIME'S UP OVERLAY */}
      {screen === 'timeup' && (
        <div className="gameover-screen">
          <StarField count={80} />
          <div className="gameover-content">
            <div className="go-alert" style={{color: '#ff4c4c'}}>⚠ TIME'S UP ⚠</div>
            <h2 className="go-title" style={{color: '#ff4c4c'}}>MISSION FAILED</h2>
            
            <div style={{ marginTop: '20px', color: isScoreSaved ? '#39ff14' : '#ffd700', fontFamily: "'Share Tech Mono', monospace", fontSize: '1rem' }}>
              {isScoreSaved ? '✅ COMBAT LOG SAVED TO DATABASE' : '⏳ UPLOADING COMBAT LOG...'}
            </div>

            <div className="go-actions" style={{marginTop: '30px'}}>
              <button className="btn-launch" onClick={() => { playClick(); navigate('/student-menu'); }}>
                <span className="btn-launch-inner">RETURN TO COMMAND</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

// 🟢 NEW Component: Neon Flickering Title 
function FlickeringTitle() {
  const flickerKeyframes = `
    @keyframes neonTitleFlicker {
      0%, 18%, 22%, 25%, 53%, 57%, 100% {
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.8),
                     0 0 20px rgba(0, 245, 255, 0.8),
                     0 0 40px rgba(0, 245, 255, 0.6),
                     0 0 80px rgba(0, 245, 255, 0.4);
        opacity: 1;
      }
      20%, 24%, 55% {
        text-shadow: none;
        opacity: 0.5;
      }
    }
  `;

  return (
    <>
      <style>{flickerKeyframes}</style>
      <h1 className="title-logo" style={{ animation: 'neonTitleFlicker 3s infinite alternate' }}>
        <span className="logo-star">★</span>
        STAR<span className="logo-type">TYPE</span>
        <span className="logo-star">★</span>
      </h1>
    </>
  );
}

function TitleScreen({ onStart, onHowTo, onExit, disabled }) {
  useEffect(() => {
    const bgm = new Audio(mainMenuMusic);
    bgm.loop = true; 
    bgm.volume = 0.5;
    let isMounted = true;
    
    const playPromise = bgm.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        if (!isMounted) bgm.pause(); 
      }).catch(() => {
        const forcePlay = () => { bgm.play(); window.removeEventListener('click', forcePlay); };
        window.addEventListener('click', forcePlay);
      });
    }

    return () => { 
      isMounted = false; 
      bgm.pause(); 
      bgm.currentTime = 0; 
      bgm.src = ""; 
    };
  }, []);

  return (
    <div className="title-screen">
      <StarField count={120} />
      <div className="title-content">
        <div className="title-badge">GALACTIC TYPING COMBAT</div>
        
        <FlickeringTitle />
        
        <p className="title-tagline">Your keyboard is your weapon. Type to survive.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px', width: '100%', maxWidth: '300px' }}>
          <button 
            className="btn-launch" 
            onClick={disabled ? undefined : onStart}
            style={{ 
              opacity: disabled ? 0.5 : 1, 
              cursor: disabled ? 'not-allowed' : 'pointer', 
              width: '100%', 
              background: disabled ? 'transparent' : 'rgba(0, 245, 255, 0.05)',
              border: disabled ? '2px solid rgba(0, 245, 255, 0.2)' : '2px solid #00f5ff'
            }}
          >
            <span className="btn-launch-inner" style={{ padding: '15px 0' }}>
              {disabled ? "AWAITING DATA" : "START"}
            </span>
          </button>
          
          <button className="btn-secondary" onClick={onHowTo} style={{ padding: '15px', fontSize: '1rem', width: '100%' }}>
            HOW TO PLAY
          </button>

          <button 
            className="btn-secondary" 
            onClick={onExit} 
            style={{ padding: '15px', fontSize: '1rem', width: '100%', borderColor: '#ff2244', color: '#ff2244' }}
            onMouseOver={(e) => { e.target.style.backgroundColor = 'rgba(255,34,68,0.1)' }}
            onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent' }}
          >
            EXIT TO ARCADE
          </button>
        </div>
      </div>
    </div>
  );
}

function HowToPlayScreen({ onBack }) {
  return (
    <div className="title-screen">
      <StarField count={80} />
      <div style={{ position: 'relative', zIndex: 2, backgroundColor: 'rgba(2, 13, 36, 0.85)', padding: '40px', borderRadius: '15px', border: '1px solid #00f5ff', maxWidth: '600px', textAlign: 'center', boxShadow: '0 0 30px rgba(0,245,255,0.2)', backdropFilter: 'blur(5px)' }}>
        
        {/* 🟢 FIXED SYNTAX ERROR HERE */}
        <h2 style={{ color: '#00f5ff', fontFamily: '"Orbitron", sans-serif', fontSize: '2.2rem', marginBottom: '25px', letterSpacing: '0.1em' }}>MISSION BRIEFING</h2>
        
        <div style={{ textAlign: 'left', fontFamily: '"Share Tech Mono", monospace', fontSize: '1.1rem', lineHeight: '1.8', color: '#c8e8ff', marginBottom: '35px' }}>
          <div style={{ marginBottom: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}><span style={{ fontSize: '2rem' }}>🎯</span><p style={{ margin: 0 }}><strong>OBJECTIVE:</strong> Defend your sector from the incoming vocabulary fleet.</p></div>
          <div style={{ marginBottom: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}><span style={{ fontSize: '2rem' }}>⌨️</span><p style={{ margin: 0 }}><strong>COMBAT:</strong> Type the word attached to an enemy ship to lock on and fire your lasers.</p></div>
          <div style={{ marginBottom: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}><span style={{ fontSize: '2rem' }}>⚡</span><p style={{ margin: 0 }}><strong>SPEED:</strong> As your score increases, the enemy fleet will accelerate.</p></div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}><span style={{ fontSize: '2rem' }}>❤️</span><p style={{ margin: 0 }}><strong>INTEGRITY:</strong> You have 3 lives. If an enemy reaches the bottom, you take damage.</p></div>
        </div>

        <button className="btn-secondary" onClick={onBack} style={{ padding: '12px 40px', fontSize: '1.1rem' }}>
          BACK TO COMMAND
        </button>
      </div>
    </div>
  );
}

function GameOverScreen({ stats, isScoreSaved, onMenu }) {
  const maxScore = stats?.targetScore || 1;
  const rawScore = stats?.score || 0;
  const percentScore = (rawScore / maxScore) * 100;
  
  const grade = getGrade(percentScore, stats?.accuracy || 0);

  useEffect(() => {
    const bgm = new Audio(victoryMusic);
    bgm.loop = true; 
    bgm.volume = 0.6;
    let isMounted = true;
    
    bgm.play().then(() => {
      if (!isMounted) bgm.pause();
    }).catch(() => console.log("Audio blocked"));

    return () => { 
      isMounted = false; 
      bgm.pause(); 
      bgm.currentTime = 0; 
      bgm.src = "";
    };
  }, []);

  return (
    <div className="gameover-screen">
      <StarField count={80} />
      <div className="gameover-content">
        <div className="go-alert">⚠ MISSION TERMINATED ⚠</div>
        <h2 className="go-title">{stats?.lives <= 0 ? "SHIP DESTROYED" : "SECTOR CLEARED"}</h2>

        <div className="go-grade" style={{ color: grade.color }}>
          <span className="go-grade-letter">{grade.letter}</span>
          <span className="go-grade-label">{grade.label}</span>
        </div>

        <div className="go-stats">
          <StatRow icon="🎯" label="Final Score" value={`${stats?.score ?? 0} / ${stats?.targetScore ?? 0}`} />
          <StatRow icon="💥" label="Words Destroyed" value={stats?.destroyed ?? 0} />
          <StatRow icon="📊" label="Accuracy" value={`${stats?.accuracy ?? 0}%`} />
          <StatRow icon="⚡" label="Best WPM" value={stats?.bestWpm ?? 0} />
          <StatRow icon="🌊" label="Max Wave" value={stats?.wave ?? 1} />
        </div>

        <div style={{ marginTop: '10px', color: isScoreSaved ? '#39ff14' : '#ffd700', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem' }}>
          {isScoreSaved ? '✅ COMBAT LOG SAVED TO DATABASE' : '⏳ UPLOADING COMBAT LOG...'}
        </div>

        <div className="go-actions">
          <button className="btn-launch" onClick={onMenu}>
            <span className="btn-launch-inner">RETURN TO COMMAND</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }) {
  return (
    <div className="stat-row">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function getGrade(percentScore, accuracy) {
  if (percentScore >= 90 && accuracy >= 80) return { letter: 'S', label: 'LEGENDARY', color: '#ffd700' };
  if (percentScore >= 80) return { letter: 'A', label: 'ELITE PILOT', color: '#00f5ff' };
  if (percentScore >= 60) return { letter: 'B', label: 'SKILLED', color: '#7c3aed' };
  if (percentScore >= 40) return { letter: 'C', label: 'AVERAGE', color: '#22c55e' };
  return { letter: 'D', label: 'ROOKIE', color: '#f97316' };
}

export function StarField({ count = 150 }) {
  const stars = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 1.5 + 0.5, 
    opacity: Math.random() * 0.5 + 0.2 
  }));

  return (
    <div 
      className="starfield" 
      aria-hidden="true" 
      style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
        background: 'linear-gradient(180deg, #010510 0%, #031530 100%)', zIndex: 0 
      }}
    >
      {stars.map(s => (
        <div key={s.id} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: `${s.size}px`, height: `${s.size}px`, backgroundColor: '#c8e8ff', borderRadius: '50%', opacity: s.opacity }} />
      ))}
    </div>
  );
}