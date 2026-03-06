import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

// --- ASSETS CONFIGURATION ---
const CHARACTERS = [
  { id: 'hero_1', name: 'Warrior', type: 'melee', img: '/assets/hero_1.png' },
  { id: 'hero_2', name: 'Mage',    type: 'range', img: '/assets/hero_2.png' },
  { id: 'hero_3', name: 'Archer',  type: 'range', img: '/assets/hero_3.png' }
];

const SOUNDS = {
  menu: '/assets/sounds/menu_music.mp3',
  bgm: '/assets/sounds/gameplay_music.mp3',
  slash: '/assets/sounds/slash.wav',
  hit: '/assets/sounds/monster_hit.wav',
  death: '/assets/sounds/monster_death.wav',
  win: '/assets/sounds/victory.wav',
  lose: '/assets/sounds/gameover.wav',
  click: '/assets/sounds/click.wav'
};

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const AdventureBattle = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  
  const [screen, setScreen] = useState('MENU'); 
  const [selectedHero, setSelectedHero] = useState(CHARACTERS[0]);
  
  const [originalQuestions, setOriginalQuestions] = useState([]); 
  const [questions, setQuestions] = useState([]);
  
  const [monsterHp, setMonsterHp] = useState(5);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");
  const [isScoreSaved, setIsScoreSaved] = useState(false);

  // --- NEW: Item Analysis Log ---
  const answerLog = useRef([]);

  const menuMusic = useRef(new Audio(SOUNDS.menu));
  const gameMusic = useRef(new Audio(SOUNDS.bgm));

  const playClick = () => {
    const s = new Audio(SOUNDS.click);
    s.volume = 0.6; 
    s.play().catch(e=>{});
  };

  const playSoundEffect = (key) => {
    const s = new Audio(SOUNDS[key]);
    s.volume = 0.5;
    s.play().catch(e=>{});
  };

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(`http://localhost:8081/api/game-questions/${gameId}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOriginalQuestions(data); 
          setQuestions(shuffleArray([...data])); 
          setMonsterHp(data.length); 
          setMaxScore(data.length);  
        } else {
          alert("No questions found.");
          navigate('/student-menu');
        }
      } catch (err) { console.error(err); }
    };
    fetchGame();
  }, [gameId, navigate]);

  useEffect(() => {
    menuMusic.current.loop = true;
    menuMusic.current.volume = 0.3;
    gameMusic.current.loop = true;
    gameMusic.current.volume = 0.2;

    if (['MENU', 'INSTRUCTIONS', 'CHAR_SELECT'].includes(screen)) {
        gameMusic.current.pause();
        gameMusic.current.currentTime = 0; 
        menuMusic.current.play().catch(e => {});
    } 
    else if (['DIALOGUE', 'BATTLE'].includes(screen)) {
        menuMusic.current.pause();
        menuMusic.current.currentTime = 0; 
        if (gameMusic.current.paused) gameMusic.current.play().catch(e => {});
    } 

    return () => {
        menuMusic.current.pause();
        gameMusic.current.pause();
    };
  }, [screen]);

  // --- INTEGRATED SAVE LOGIC (MATCHES MAZE) ---
  const handleSaveScore = async () => {
    if (!auth.currentUser || !gameId || isScoreSaved) return;
    setSaveStatus("Saving...");
    try {
        // 1. Save Final Score
        const resScore = await fetch('http://localhost:8081/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_fid: auth.currentUser.uid,
                game_id: gameId,
                score: score,
                time_taken: 0
            })
        });

        // 2. Save Item Analysis (The Answer Log)
        if (answerLog.current.length > 0) {
            await fetch('http://localhost:8081/api/save-answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: answerLog.current })
            });
        }

        if (resScore.ok) {
            setIsScoreSaved(true);
            setSaveStatus("Saved!");
        }
    } catch (e) {
        console.error(e);
        setSaveStatus("Error saving.");
    }
  };

  const handleRetry = () => {
    playClick();
    answerLog.current = []; // Clear log for retry
    setQuestions(shuffleArray([...originalQuestions]));
    setMonsterHp(originalQuestions.length);
    setScore(0);
    setSaveStatus("");
    setIsScoreSaved(false);
    setScreen('CHAR_SELECT');
  };

  if (screen === 'MENU') {
    return (
      <div style={pageStyle}>
        <div style={gameBoxStyle}>
          <div style={{...bgStyle, backgroundImage: 'url(/assets/bg.png)'}}></div>
          <div style={overlayStyle}>
            <h1 style={titleStyle}>⚔️ ADVENTURE BATTLE ⚔️</h1>
            <button onClick={() => { playClick(); setScreen('CHAR_SELECT'); }} style={mainBtnStyle}>START GAME</button>
            <button onClick={() => { playClick(); setScreen('INSTRUCTIONS'); }} style={subBtnStyle}>INSTRUCTIONS</button>
            <button onClick={() => { playClick(); navigate('/student-menu'); }} style={{...subBtnStyle, background:'#e53e3e'}}>EXIT</button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'INSTRUCTIONS') {
    return (
      <div style={pageStyle}>
        <div style={gameBoxStyle}>
          <div style={{...bgStyle, background:'#2d3748'}}></div>
          <div style={{...overlayStyle, textAlign: 'center', padding: '40px'}}>
             <h2 style={{color: '#f6ad55', marginBottom: '20px'}}>HOW TO PLAY</h2>
             <ul style={{fontSize: '1.1rem', color: 'white', lineHeight: '1.8', textAlign: 'left'}}>
                <li>1. Choose your Hero.</li>
                <li>2. Answer correctly to ATTACK.</li>
                <li>3. Wrong answers make the Monster ATTACK YOU.</li>
                <li>4. Stats are saved automatically for your teacher!</li>
             </ul>
             <button onClick={() => { playClick(); setScreen('MENU'); }} style={mainBtnStyle}>BACK</button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'CHAR_SELECT') {
    return (
      <div style={pageStyle}>
        <div style={gameBoxStyle}>
          <div style={{...bgStyle, backgroundImage: 'url(/assets/bg.png)', filter: 'blur(4px)'}}></div>
          <div style={overlayStyle}>
            <h2 style={{color: '#fff', textShadow:'2px 2px #000', marginBottom: '30px'}}>CHOOSE YOUR HERO</h2>
            <div style={{display: 'flex', gap: '30px'}}>
              {CHARACTERS.map(char => (
                <div key={char.id} onClick={() => { playClick(); setSelectedHero(char); }} 
                  style={{
                    ...cardStyle, 
                    borderColor: selectedHero.id === char.id ? '#3182ce' : '#555',
                    background: selectedHero.id === char.id ? 'rgba(49, 130, 206, 0.6)' : 'rgba(0,0,0,0.6)'
                  }}>
                  <img src={`/assets/${char.id}.png`} alt={char.name} style={{width:'80px', height:'80px', objectFit:'contain'}} />
                  <p style={{color:'white', marginTop:'5px', fontWeight:'bold'}}>{char.name}</p>
                </div>
              ))}
            </div>
            <div style={{marginTop:'40px', display:'flex', gap:'20px'}}>
              <button onClick={() => { playClick(); setScreen('MENU'); }} style={{...mainBtnStyle, background:'#718096'}}>BACK</button>
              <button onClick={() => { playClick(); setScreen('DIALOGUE'); }} style={mainBtnStyle}>CONFIRM</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'DIALOGUE') {
    return (
      <div style={pageStyle}>
        <div style={gameBoxStyle}>
          <DialogueScene heroId={selectedHero.id} onFinish={() => setScreen('BATTLE')} playClick={playClick} />
        </div>
      </div>
    );
  }

  if (screen === 'BATTLE') {
    return (
      <div style={pageStyle}>
        <div style={{width: '800px'}}>
          <BattleEngine 
            gameId={gameId}
            questions={questions}
            setQuestions={setQuestions}
            heroData={selectedHero}
            initialMonsterHp={monsterHp}
            maxScore={maxScore}
            answerLog={answerLog}
            playClick={playClick} 
            playSoundEffect={playSoundEffect}
            onGameEnd={(won, finalScore) => {
              setScore(finalScore);
              setScreen(won ? 'WIN' : 'LOSE');
              if (won) playSoundEffect('win');
              else playSoundEffect('lose');
            }}
          />
        </div>
      </div>
    );
  }

  if (screen === 'WIN' || screen === 'LOSE') {
      return (
        <div style={pageStyle}>
          <div style={gameBoxStyle}>
            <div style={{...bgStyle, background:'#1a202c'}}></div>
            <div style={overlayStyle}>
              <h1 style={{fontSize: '3.5rem', color: screen === 'WIN' ? '#48bb78' : '#e53e3e', textShadow:'3px 3px #000'}}>
                {screen === 'WIN' ? 'VICTORY!' : 'DEFEATED'}
              </h1>
              <p style={{fontSize: '2rem', color:'#fff', fontWeight: 'bold'}}>
                  Score: <span style={{color: '#fbd38d'}}>{score}</span> / {maxScore}
              </p>
              <p style={{color: '#aaa', marginBottom: '20px'}}>{saveStatus}</p>
              <div style={{display: 'flex', gap: '15px'}}>
                  <button onClick={handleRetry} style={{...mainBtnStyle, background: '#38a169'}}>⚔️ RETRY</button>
                  <button onClick={handleSaveScore} disabled={isScoreSaved} style={{...mainBtnStyle, background: isScoreSaved ? '#718096' : '#3182ce'}}>
                      {isScoreSaved ? '✅ SAVED' : '💾 SAVE SCORE'}
                  </button>
                  <button onClick={() => navigate('/student-menu')} style={{...mainBtnStyle, background: '#e53e3e'}}>🚪 MENU</button>
              </div>
            </div>
          </div>
        </div>
      );
  }

  return null;
};

// --- DIALOGUE SCENE (Unchanged) ---
const DialogueScene = ({ heroId, onFinish, playClick }) => {
  const [text, setText] = useState('');
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const lines = [
    { speaker: 'Hero', text: "I have found you at last, monster!" },
    { speaker: 'Monster', text: "Roaar! You dare enter my dungeon?" },
    { speaker: 'Hero', text: "Knowledge is my weapon. Prepare yourself!" },
    { speaker: 'Monster', text: "Then prove your wit... or perish!" }
  ];

  useEffect(() => {
    if (charIdx < lines[lineIdx].text.length) {
      const t = setTimeout(() => {
        setText(prev => prev + lines[lineIdx].text[charIdx]);
        setCharIdx(prev => prev + 1);
      }, 40); 
      return () => clearTimeout(t);
    }
  }, [charIdx, lineIdx]);

  const nextLine = () => {
    playClick(); 
    if (charIdx < lines[lineIdx].text.length) {
      setText(lines[lineIdx].text);
      setCharIdx(lines[lineIdx].text.length);
    } else if (lineIdx < lines.length - 1) {
      setLineIdx(prev => prev + 1); setCharIdx(0); setText('');
    } else onFinish();
  };

  return (
    <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden'}}>
      <img src="/assets/bg.png" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <div style={{position:'absolute', bottom:'0', width:'100%', height: '140px', background:'rgba(0,0,0,0.9)', borderTop: '3px solid #fff', padding:'20px', boxSizing: 'border-box'}}>
        <h3 style={{color: lines[lineIdx].speaker === 'Hero' ? '#63b3ed' : '#ff6b6b'}}>{lines[lineIdx].speaker}</h3>
        <p style={{color: '#fff', fontSize: '1.2rem', fontFamily:'monospace'}}>{text}</p>
        <button onClick={nextLine} style={{position:'absolute', bottom:'20px', right:'30px', background:'transparent', color:'#fff', cursor:'pointer'}}>NEXT ▶</button>
      </div>
    </div>
  );
};

// --- BATTLE ENGINE (With Item Analysis Integration) ---
const BattleEngine = ({ gameId, questions, setQuestions, heroData, initialMonsterHp, maxScore, answerLog, onGameEnd, playClick, playSoundEffect }) => {
  const canvasRef = useRef(null);
  const [qIndex, setQIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(5);
  const [monsterHp, setMonsterHp] = useState(initialMonsterHp);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [heroState, setHeroState] = useState('idle'); 
  const [monState, setMonState] = useState('idle');

  const animState = useRef({
    heroX: 120, heroY: 190, monX: 580, monY: 170, projX: 0, projY: 0, projActive: false, phase: 'idle', shake: 0, particles: [] 
  });

  const spawnParticles = (x, y, color) => {
    for (let i = 0; i < 20; i++) {
      animState.current.particles.push({
        x, y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 1.0, color
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const bg = new Image(); bg.src = '/assets/bg.png';
    const heroIdle = new Image(); heroIdle.src = `/assets/${heroData.id}.png`;
    const heroAtk = new Image(); heroAtk.src = `/assets/${heroData.id}_attack.png`;
    const heroHit = new Image(); heroHit.src = `/assets/${heroData.id}_hit.png`;
    const heroDead = new Image(); heroDead.src = `/assets/${heroData.id}_dead.png`; 
    const monIdle = new Image(); monIdle.src = '/assets/monster_idle.png';
    const monDead = new Image(); monDead.src = '/assets/monster_dead.png';
    
    let frame = 0, animId;
    const render = () => {
      frame++; ctx.clearRect(0, 0, 800, 400);
      const state = animState.current;
      
      if (state.phase === 'hero_attack') {
        if (state.heroX < 500) state.heroX += 10;
        else { 
            playSoundEffect('slash'); setHeroState('attack'); setMonState('hit'); spawnParticles(state.monX+75, state.monY+75, '#f00'); state.shake=10; state.phase='hero_return';
            setTimeout(() => setMonState('idle'), 500);
        }
      } else if (state.phase === 'hero_return') {
        if (state.heroX > 120) state.heroX -= 10;
        else { state.heroX = 120; state.phase = 'idle'; setHeroState('idle'); }
      } else if (state.phase === 'mon_attack') {
        if (!state.projActive) { state.projActive=true; state.projX=state.monX; state.projY=state.monY+60; }
        state.projX -= 12;
        if (state.projX < state.heroX+60) { state.projActive=false; state.phase='idle'; setHeroState('hit'); state.shake=15; spawnParticles(state.heroX+60, state.heroY+60, '#ff4500'); setTimeout(()=>setHeroState('idle'), 500); }
      }

      if (state.shake > 0) state.shake--;
      ctx.save();
      if (state.shake > 0) ctx.translate(Math.random()*8-4, Math.random()*8-4);
      if (bg.complete) ctx.drawImage(bg, 0, 0, 800, 400);
      
      let cHero = heroState === 'dead' ? heroDead : (heroState === 'attack' ? heroAtk : (heroState === 'hit' ? heroHit : heroIdle));
      if (cHero.complete) ctx.drawImage(cHero, state.heroX, state.heroY, 120, 120);
      
      let cMon = monsterHp <= 0 ? monDead : monIdle;
      if (cMon.complete) ctx.drawImage(cMon, state.monX, state.monY, 150, 150);
      
      if (state.projActive) { ctx.fillStyle='#f0f'; ctx.beginPath(); ctx.arc(state.projX, state.projY, 10, 0, Math.PI*2); ctx.fill(); }
      state.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill(); });
      state.particles = state.particles.filter(p => p.life > 0);
      ctx.restore();
      animId = requestAnimationFrame(render);
    };
    render(); return () => cancelAnimationFrame(animId);
  }, [heroData, monsterHp, heroState]);

  const handleAnswer = (val) => {
    if (buttonsDisabled) return;
    const q = questions[qIndex];
    let isCorrect = false;
    
    if (q.question_type === 'identification') {
      if (inputValue.trim().toLowerCase() === q.choice_a.toLowerCase()) isCorrect = true;
    } else {
      if (parseInt(val) === q.correct_answer) isCorrect = true;
    }

    // --- INTEGRATED: Answer Tracking Log ---
    if (q.id && auth.currentUser) {
        answerLog.current.push({
            student_fid: auth.currentUser.uid,
            game_id: parseInt(gameId),
            question_id: q.id,
            is_correct: isCorrect
        });
    }

    setButtonsDisabled(true);
    if (isCorrect) {
      playClick(); setFeedback('CORRECT! HERO ATTACK!');
      animState.current.phase = 'hero_attack';
      setTimeout(() => {
        setMonsterHp(h => h - 1); setScore(s => s + 1); nextTurn(true);
      }, 1500); 
    } else {
      playClick(); setFeedback('WRONG! MONSTER ATTACKS!');
      animState.current.phase = 'mon_attack';
      setTimeout(() => {
        setPlayerHp(h => h - 1); nextTurn(false);
      }, 1500);
    }
  };

  const nextTurn = (wasCorrect) => {
    if (monsterHp - (wasCorrect ? 1 : 0) <= 0) {
        setTimeout(() => onGameEnd(true, score + (wasCorrect ? 1 : 0)), 1000);
        return;
    }
    if (playerHp - (wasCorrect ? 0 : 1) <= 0) {
        setHeroState('dead');
        setTimeout(() => onGameEnd(false, score), 1500);
        return;
    }

    if (wasCorrect) {
        setQIndex(prev => prev + 1);
    } else {
        const newQs = [...questions];
        const currentQ = newQs.splice(qIndex, 1)[0];
        newQs.push(currentQ); // Move wrong question to end
        setQuestions(newQs);
    }
    setInputValue(''); setFeedback(''); setButtonsDisabled(false);
  };

  const currentQ = questions[qIndex];
  if (!currentQ) return <div style={{color:'white'}}>Victory Impending...</div>;

  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
      <div style={gameBoxStyle}>
        <div style={{width:'100%', display:'flex', justifyContent:'space-between', padding:'10px', position:'absolute', zIndex:10}}>
          <div style={{color:'#9ae6b4', fontWeight:'bold'}}>HERO: {'❤️'.repeat(playerHp)}</div>
          <div style={{color:'#ffd166', fontWeight:'bold'}}>SCORE: {score} / {maxScore}</div>
          <div style={{color:'#ff6b6b', fontWeight:'bold'}}>BOSS: {'💀'.repeat(monsterHp)}</div>
        </div>
        <canvas ref={canvasRef} width={800} height={400} />
      </div>
      <div style={{width:'800px', background:'#2d3748', padding:'20px', borderRadius:'0 0 12px 12px', textAlign:'center'}}>
        <h3 style={{color:'#fff'}}>{currentQ.question_text}</h3>
        {feedback ? <h3 style={{color: feedback.includes('CORRECT') ? '#48bb78' : '#e53e3e'}}>{feedback}</h3> : (
          <>
            {currentQ.question_type === 'multiple_choice' && (
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                {[currentQ.choice_a, currentQ.choice_b, currentQ.choice_c, currentQ.choice_d].map((c, i) => (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={buttonsDisabled} style={optionBtnStyle}>{c}</button>
                ))}
              </div>
            )}
            {currentQ.question_type === 'true_false' && (
              <div style={{display:'flex', gap:'20px', justifyContent:'center'}}>
                <button onClick={() => handleAnswer(0)} disabled={buttonsDisabled} style={{...optionBtnStyle, background:'#38a169', width:'150px'}}>TRUE</button>
                <button onClick={() => handleAnswer(1)} disabled={buttonsDisabled} style={{...optionBtnStyle, background:'#e53e3e', width:'150px'}}>FALSE</button>
              </div>
            )}
            {currentQ.question_type === 'identification' && (
              <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                <input value={inputValue} onChange={e=>setInputValue(e.target.value)} placeholder="Type answer..." style={{padding:'10px', borderRadius:'5px', width:'60%'}} />
                <button onClick={() => handleAnswer(null)} disabled={buttonsDisabled} style={{...optionBtnStyle, width:'auto', padding:'10px 20px'}}>ATTACK</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- STYLES (Kept from original) ---
const pageStyle = { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#000' };
const gameBoxStyle = { position: 'relative', width: '800px', height: '400px', border: '4px solid #4a5568', borderRadius: '12px 12px 0 0', overflow: 'hidden' };
const bgStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundSize: 'cover' };
const overlayStyle = { position: 'relative', zIndex: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const titleStyle = { color: '#fbd38d', fontSize: '2.5rem', marginBottom: '30px' };
const mainBtnStyle = { padding: '10px 30px', fontSize: '1.2rem', cursor: 'pointer', background: '#3182ce', color: '#fff', borderRadius: '8px', border: '2px solid #fff' };
const subBtnStyle = { ...mainBtnStyle, background: '#4a5568', marginTop: '15px' };
const cardStyle = { width:'90px', padding: '10px', borderRadius: '10px', cursor: 'pointer', border: '2px solid #555', textAlign: 'center' };
const optionBtnStyle = { padding: '10px', background: '#1a202c', color: '#fff', border: '1px solid #4a5568', cursor: 'pointer', width: '100%', borderRadius: '5px' };

export default AdventureBattle;