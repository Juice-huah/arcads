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

// Utility to shuffle array
const shuffleArray = (array) => {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};

const AdventureBattle = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  
  const [screen, setScreen] = useState('MENU'); 
  const [selectedHero, setSelectedHero] = useState(CHARACTERS[0]);
  
  // Keep original questions safe for Retries
  const [originalQuestions, setOriginalQuestions] = useState([]); 
  const [questions, setQuestions] = useState([]);
  
  const [monsterHp, setMonsterHp] = useState(5);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  
  // Track if score is saved
  const [isScoreSaved, setIsScoreSaved] = useState(false);

  // --- AUDIO REFS ---
  const menuMusic = useRef(new Audio(SOUNDS.menu));
  const gameMusic = useRef(new Audio(SOUNDS.bgm));

  // --- SOUND HELPER ---
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

  // 1. FETCH DATA
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(`http://localhost:8081/api/game-questions/${gameId}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOriginalQuestions(data); // Save raw data for retries
          setQuestions(shuffleArray([...data])); // Shuffle for first playthrough
          setMonsterHp(data.length); // 1 HP per question
          setMaxScore(data.length);  // 1 Point per question
        } else {
          alert("No questions found.");
          navigate('/student-menu');
        }
      } catch (err) { console.error(err); }
    };
    fetchGame();
  }, [gameId, navigate]);

  // 2. BACKGROUND MUSIC LOGIC
  useEffect(() => {
    menuMusic.current.loop = true;
    menuMusic.current.volume = 0.3;
    gameMusic.current.loop = true;
    gameMusic.current.volume = 0.2;

    if (screen === 'MENU' || screen === 'INSTRUCTIONS' || screen === 'CHAR_SELECT') {
        gameMusic.current.pause();
        gameMusic.current.currentTime = 0; 
        menuMusic.current.play().catch(e => {});
    } 
    else if (screen === 'DIALOGUE' || screen === 'BATTLE') {
        menuMusic.current.pause();
        menuMusic.current.currentTime = 0; 
        if (gameMusic.current.paused) {
            gameMusic.current.play().catch(e => {});
        }
    } 
    else if (screen === 'WIN' || screen === 'LOSE') {
        menuMusic.current.pause();
        gameMusic.current.pause();
    }

    return () => {
        menuMusic.current.pause();
        gameMusic.current.pause();
    };
  }, [screen]);

  // --- MANUAL SAVE & RETRY HANDLERS ---
  const handleSaveScore = async () => {
    if (!auth.currentUser || !gameId || isScoreSaved) return;
    try {
        await fetch('http://localhost:8081/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_fid: auth.currentUser.uid,
                game_id: gameId,
                score: score,
                time_taken: 0
            })
        });
        setIsScoreSaved(true);
        alert("Score saved successfully!");
    } catch (e) {
        console.error("Error saving score:", e);
        alert("Failed to save score.");
    }
  };

  const handleRetry = () => {
    playClick();
    // Resets everything cleanly for a fresh retry!
    setQuestions(shuffleArray([...originalQuestions]));
    setMonsterHp(originalQuestions.length);
    setScore(0);
    setIsScoreSaved(false);
    setScreen('CHAR_SELECT');
  };

  // --- SCREEN RENDERERS ---

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
          <div style={{
             ...overlayStyle, 
             textAlign: 'center', 
             padding: '40px',
             display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
             <h2 style={{color: '#f6ad55', marginBottom: '20px'}}>HOW TO PLAY</h2>
             <div style={{textAlign: 'left', display: 'inline-block'}}>
                 <ul style={{fontSize: '1.1rem', color: 'white', lineHeight: '1.8', margin: 0, paddingLeft: '20px'}}>
                    <li>1. Choose your Hero.</li>
                    <li>2. Answer correctly to ATTACK.</li>
                    <li>3. Wrong answers make the Monster ATTACK YOU.</li>
                    <li>4. Win by defeating the monster!</li>
                 </ul>
             </div>
             <div style={{marginTop: '25px'}}> 
               <button onClick={() => { playClick(); setScreen('MENU'); }} style={mainBtnStyle}>BACK</button>
             </div>
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
            <div style={{display: 'flex', gap: '30px', justifyContent:'center'}}>
              {CHARACTERS.map(char => (
                <div key={char.id} onClick={() => { playClick(); setSelectedHero(char); }} 
                  style={{
                    ...cardStyle, 
                    borderColor: selectedHero.id === char.id ? '#3182ce' : '#555',
                    transform: selectedHero.id === char.id ? 'scale(1.1)' : 'scale(1)',
                    background: selectedHero.id === char.id ? 'rgba(49, 130, 206, 0.6)' : 'rgba(0,0,0,0.6)'
                  }}>
                  <img src={`/assets/${char.id}.png`} alt={char.name} style={{width:'80px', height:'80px', objectFit:'contain'}} />
                  <p style={{color:'white', marginTop:'5px', fontWeight:'bold'}}>{char.name}</p>
                </div>
              ))}
            </div>
            <div style={{marginTop:'40px', display:'flex', gap:'20px', justifyContent:'center'}}>
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
            playClick={playClick} 
            playSoundEffect={playSoundEffect}
            
            // Removed Auto-Save. It now only navigates to WIN/LOSE screen.
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

  // The new Game Over screen with Manual Save, Retry, and Menu buttons!
  if (screen === 'WIN' || screen === 'LOSE') {
      return (
        <div style={pageStyle}>
          <div style={gameBoxStyle}>
            <div style={{...bgStyle, background:'#1a202c'}}></div>
            <div style={overlayStyle}>
              <h1 style={{fontSize: '3.5rem', margin: '0 0 10px 0', color: screen === 'WIN' ? '#48bb78' : '#e53e3e', textShadow:'3px 3px #000'}}>
                {screen === 'WIN' ? 'VICTORY!' : 'DEFEATED'}
              </h1>
              <p style={{fontSize: '2rem', color:'#fff', margin: '10px 0 30px 0', fontWeight: 'bold'}}>
                  Final Score: <span style={{color: '#fbd38d'}}>{score}</span> / {maxScore}
              </p>
              
              <div style={{display: 'flex', gap: '15px'}}>
                  <button onClick={handleRetry} style={{...mainBtnStyle, background: '#38a169', fontSize: '1rem'}}>
                      ⚔️ PLAY AGAIN
                  </button>
                  <button 
                      onClick={handleSaveScore} 
                      disabled={isScoreSaved}
                      style={{...mainBtnStyle, background: isScoreSaved ? '#718096' : '#3182ce', fontSize: '1rem'}}
                  >
                      {isScoreSaved ? '✅ SAVED' : '💾 SAVE SCORE'}
                  </button>
                  <button onClick={() => { playClick(); navigate('/student-menu'); }} style={{...mainBtnStyle, background: '#e53e3e', fontSize: '1rem'}}>
                      🚪 MAIN MENU
                  </button>
              </div>
            </div>
          </div>
        </div>
      );
  }

  return null;
};

// ==========================================
// SCENE: DIALOGUE
// ==========================================
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
      setLineIdx(prev => prev + 1);
      setCharIdx(0);
      setText('');
    } else {
      onFinish();
    }
  };

  const isHero = lines[lineIdx].speaker === 'Hero';

  return (
    <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden'}}>
      <img src="/assets/bg.png" style={{width: '100%', height: '100%', objectFit: 'cover'}} />

      <button 
        onClick={() => { playClick(); onFinish(); }} 
        style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid white',
          padding: '5px 10px', cursor: 'pointer', zIndex: 100, fontSize: '0.8rem'
        }}
      >
        SKIP {'>>'}
      </button>

      <img 
        src={`/assets/${heroId}.png`} 
        style={{
          position:'absolute', bottom:'160px', left:'100px', width:'120px', 
          filter: isHero ? 'brightness(1.1) drop-shadow(0 0 10px gold)' : 'brightness(0.4)', transition:'0.3s'
        }} 
      />
      <img 
        src="/assets/monster_idle.png" 
        style={{
          position:'absolute', bottom:'160px', right:'100px', width:'150px', 
          filter: !isHero ? 'brightness(1.1) drop-shadow(0 0 10px red)' : 'brightness(0.4)', transition:'0.3s'
        }} 
      />

      <div style={{position:'absolute', bottom:'0', width:'100%', height: '140px', background:'rgba(0,0,0,0.9)', borderTop: '3px solid #fff', padding:'20px', boxSizing: 'border-box'}}>
        <h3 style={{color: isHero ? '#63b3ed' : '#ff6b6b', margin: '0 0 10px 0', fontSize: '1.4rem', textTransform: 'uppercase'}}>{lines[lineIdx].speaker}</h3>
        <p style={{color: '#fff', fontSize: '1.2rem', fontFamily:'monospace', lineHeight: '1.4'}}>{text}</p>
        <button onClick={nextLine} style={{position:'absolute', bottom:'20px', right:'30px', background:'transparent', border:'1px solid #aaa', color:'#fff', padding: '5px 15px', cursor:'pointer', fontSize:'0.9rem'}}>NEXT ▶</button>
      </div>
    </div>
  );
};

// ==========================================
// SCENE: BATTLE ENGINE
// ==========================================
const BattleEngine = ({ gameId, questions, setQuestions, heroData, initialMonsterHp, maxScore, onGameEnd, playClick, playSoundEffect }) => {
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
    heroX: 120, heroY: 190,  
    monX: 580,  monY: 170,   
    projX: 0,   projY: 0,
    projActive: false,
    phase: 'idle',    
    shake: 0,
    particles: [] 
  });

  const spawnParticles = (x, y, color) => {
    for (let i = 0; i < 20; i++) {
      animState.current.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0, color: color
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
    const monAtk = new Image(); monAtk.src = '/assets/monster_attack.png';
    const monHit = new Image(); monHit.src = '/assets/monster_hit.png';
    const monDead = new Image(); monDead.src = '/assets/monster_dead.png';
    
    const mageEffect = new Image(); mageEffect.src = '/assets/hero_2_attack_effect.png';
    const archerEffect = new Image(); archerEffect.src = '/assets/hero_3_attack_effect.png';
    const monsterEffect = new Image(); monsterEffect.src = '/assets/monster_attack_effect.png';

    let frame = 0;
    let animId;

    const render = () => {
      frame++;
      const state = animState.current;
      ctx.clearRect(0, 0, 800, 400);

      // --- PHYSICS UPDATE ---
      if (state.phase === 'hero_attack') {
        if (heroData.type === 'melee') {
          if (state.heroX < 500) {
             state.heroX += 5; 
          } else {
             playSoundEffect('slash'); 
             setHeroState('attack'); 
             setMonState('hit');     
             spawnParticles(state.monX + 75, state.monY + 75, '#ff0000'); 
             state.shake = 10;
             state.phase = 'impact_hold';
             setTimeout(() => {
                setHeroState('idle'); 
                state.phase = 'hero_return';
                if (monsterHp > 0) setMonState('idle'); 
             }, 500);
          }
        } else {
          if (heroData.id === 'hero_2') {
             state.heroY += (150 - state.heroY) * 0.08; 
          }
          if (!state.projActive) {
            state.projActive = true; 
            state.projX = state.heroX + 80; 
            state.projY = state.heroY + 50; 
            setHeroState('attack'); 
            playSoundEffect('slash');
          }
          state.projX += 10; 
          if (state.projX > state.monX + 40) {
            state.projActive = false; 
            state.phase = 'hero_return'; 
            playSoundEffect('hit'); 
            setMonState('hit'); 
            state.shake = 10;
            const pColor = heroData.id === 'hero_2' ? '#a020f0' : '#ffff00';
            spawnParticles(state.monX + 75, state.monY + 75, pColor);
            setTimeout(() => {
                if (monsterHp > 0) setMonState('idle'); 
            }, 500);
          }
        }
      } 
      else if (state.phase === 'hero_return') {
        if (heroData.id === 'hero_2') {
            state.heroY += (190 - state.heroY) * 0.08;
        }
        if (state.heroX > 120) {
            state.heroX -= 8; 
            setHeroState('idle'); 
        } else {
            state.heroX = 120; 
            if (heroData.id === 'hero_2') state.heroY = 190;
            state.phase = 'idle'; 
            setHeroState('idle');
        }
      } 
      else if (state.phase === 'mon_attack') {
        if (!state.projActive) {
            state.projActive = true; state.projX = state.monX - 50; state.projY = state.monY + 60; playSoundEffect('slash');
        }
        state.projX -= 8; 
        if (state.projX < state.heroX + 60) {
            state.projActive = false; 
            state.phase = 'idle'; 
            playSoundEffect('hit'); 
            setHeroState('hit'); 
            state.shake = 15;
            spawnParticles(state.heroX + 60, state.heroY + 60, '#ff4500'); 
            setMonState('idle');
            setTimeout(() => setHeroState('idle'), 500);
        }
      }

      if (state.shake > 0) state.shake -= 1;

      // --- DRAWING ---
      ctx.save();
      if (state.shake > 0) ctx.translate(Math.random()*8 - 4, Math.random()*8 - 4);
      if (bg.complete) ctx.drawImage(bg, 0, 0, 800, 400);

      // Hero
      let currentHero = heroIdle;
      if (heroState === 'dead') currentHero = heroDead; 
      else if (heroState === 'attack') currentHero = heroAtk;
      else if (heroState === 'hit') currentHero = heroHit;
      
      let hY = state.heroY;
      if (state.phase === 'idle' && heroState !== 'dead') hY += Math.sin(frame*0.05)*3; 
      if (currentHero.complete) ctx.drawImage(currentHero, state.heroX, hY, 120, 120);

      // Monster
      let currentMon = monIdle;
      if (monState === 'attack') currentMon = monAtk;
      if (monState === 'hit') currentMon = monHit; 
      if (monsterHp <= 0) currentMon = monDead;
      
      const mY = state.monY + (state.phase === 'idle' ? Math.sin(frame*0.04)*3 : 0);
      if (currentMon.complete) ctx.drawImage(currentMon, state.monX, mY, 150, 150);

      // Projectiles
      if (state.projActive) {
        if (state.phase === 'hero_attack') {
           let pImg = heroData.id === 'hero_2' ? mageEffect : archerEffect;
           if (pImg.complete) ctx.drawImage(pImg, state.projX, state.projY, 60, 30);
        } else if (state.phase === 'mon_attack') {
           if (monsterEffect.complete) ctx.drawImage(monsterEffect, state.projX, state.projY, 60, 60);
           else { ctx.fillStyle = '#39ff14'; ctx.beginPath(); ctx.arc(state.projX, state.projY, 15, 0, Math.PI * 2); ctx.fill(); }
        }
      }

      // Particles
      state.particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.05;
        ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0;
      });
      state.particles = state.particles.filter(p => p.life > 0);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [heroData, monsterHp, heroState, monState]);

  // Answer Logic
  const handleAnswer = (val) => {
    if (buttonsDisabled) return;
    const q = questions[qIndex];
    let correct = false;
    if (q.question_type === 'identification') {
      if (inputValue.trim().toLowerCase() === q.choice_a.toLowerCase()) correct = true;
    } else {
      if (parseInt(val) === q.correct_answer) correct = true;
    }
    setButtonsDisabled(true);

    if (correct) {
      playClick(); 
      setFeedback('Your Answer Is Correct! Hero Attack!');
      animState.current.phase = 'hero_attack';
      
      setTimeout(() => {
        setMonsterHp(h => h - 1); 
        setScore(s => s + 1); // Exact 1 point given
        nextTurn(true);
      }, 2000); 
    } else {
      playClick(); 
      setFeedback('Your Answer Is Wrong! MONSTER ATTACKS!');
      setMonState('attack');
      animState.current.phase = 'mon_attack';
      setTimeout(() => {
        setPlayerHp(h => h - 1); nextTurn(false);
      }, 2000);
    }
  };

  const nextTurn = (wasCorrect) => {
    const newPlayerHp = wasCorrect ? playerHp : playerHp - 1;
    const newMonsterHp = wasCorrect ? monsterHp - 1 : monsterHp;
    
    // --- CHECK FOR DEFEAT ---
    if (newPlayerHp <= 0) { 
        setHeroState('dead'); 
        setTimeout(() => onGameEnd(false, score), 2000); 
        return; 
    }
    
    // --- CHECK FOR VICTORY ---
    if (newMonsterHp <= 0) { 
        playSoundEffect('death'); 
        setTimeout(() => onGameEnd(true, score + 1), 2000); 
        return; 
    }

    if (wasCorrect) {
        if (qIndex < questions.length - 1) {
            setQIndex(q => q + 1); setInputValue(''); setFeedback(''); setButtonsDisabled(false);
        } else {
            onGameEnd(true, score + 1); 
        }
    } else {
        const newQs = [...questions];
        const currentQ = newQs[qIndex];
        newQs.splice(qIndex, 1);
        const remainingSlots = newQs.length - qIndex;
        if (remainingSlots > 0) {
            const randomOffset = Math.floor(Math.random() * (remainingSlots + 1));
            newQs.splice(qIndex + randomOffset, 0, currentQ);
        } else {
            newQs.push(currentQ);
        }
        setQuestions(newQs);
        setInputValue(''); 
        setFeedback(''); 
        setButtonsDisabled(false);
    }
  };

  const currentQ = questions[qIndex];

  if (!currentQ) return <div style={{color:'white'}}>Loading Next...</div>;

  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
      {/* GAME BOX */}
      <div style={{position: 'relative', width:'800px', height:'400px', border:'4px solid #4a5568', borderRadius:'12px 12px 0 0', overflow:'hidden', boxShadow:'0 0 30px rgba(0,0,0,0.8)'}}>
        
        {/* HUD */}
        <div style={{width:'100%', display:'flex', justifyContent:'space-between', padding:'10px', position:'absolute', top:0, left:0, zIndex:10, boxSizing:'border-box'}}>
          <div style={{color:'#9ae6b4', fontSize:'1.2rem', fontWeight:'bold', textShadow:'2px 2px 0 #000'}}>HERO: {'❤️'.repeat(Math.max(0, playerHp))}</div>
          <div style={{color:'#ffd166', fontSize:'1.2rem', fontWeight:'bold', textShadow:'2px 2px 0 #000'}}>SCORE: {score} / {maxScore}</div>
          <div style={{color:'#ff6b6b', fontSize:'1.2rem', fontWeight:'bold', textShadow:'2px 2px 0 #000'}}>BOSS: {'💀'.repeat(Math.max(0, monsterHp))}</div>
        </div>

        <canvas ref={canvasRef} width={800} height={400} />
      </div>

      {/* QUESTION BOX */}
      {currentQ && monsterHp > 0 && playerHp > 0 && (
        <div style={{width:'800px', background:'#2d3748', padding:'20px', border:'4px solid #4a5568', borderTop:'none', borderRadius:'0 0 12px 12px', textAlign:'center', boxSizing:'border-box'}}>
          <h3 style={{margin:'0 0 15px 0', color:'#fff', fontSize:'1.1rem'}}>{currentQ.question_text}</h3>
          
          {feedback ? <h3 style={{color: feedback.includes('Correct') ? '#48bb78' : '#e53e3e', marginTop:'20px', fontSize:'1.2rem', textShadow:'2px 2px 0 #000'}}>{feedback}</h3> : (
            <>
              {currentQ.question_type === 'multiple_choice' && (
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                  {[currentQ.choice_a, currentQ.choice_b, currentQ.choice_c, currentQ.choice_d].map((c, i) => (
                    <button key={i} onClick={() => handleAnswer(i)} disabled={buttonsDisabled} style={optionBtnStyle}>{c}</button>
                  ))}
                </div>
              )}
              {currentQ.question_type === 'true_false' && (
                <div style={{display:'flex', justifyContent:'center', gap:'20px', marginTop:'10px'}}>
                  <button onClick={() => handleAnswer(0)} disabled={buttonsDisabled} style={{...optionBtnStyle, background:'#38a169', width:'150px'}}>TRUE</button>
                  <button onClick={() => handleAnswer(1)} disabled={buttonsDisabled} style={{...optionBtnStyle, background:'#e53e3e', width:'150px'}}>FALSE</button>
                </div>
              )}
              {currentQ.question_type === 'identification' && (
                <div style={{display:'flex', justifyContent:'center', gap:'10px', marginTop:'10px'}}>
                  <input value={inputValue} onChange={e=>setInputValue(e.target.value)} placeholder="Type answer..." style={{padding:'10px', fontSize:'1.1rem', borderRadius:'5px', border:'none', width:'60%'}} />
                  <button onClick={() => handleAnswer(null)} disabled={buttonsDisabled} style={{...optionBtnStyle, width:'auto', background:'#3182ce', padding:'10px 20px'}}>ATTACK</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const pageStyle = { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#000' };
const gameBoxStyle = { position: 'relative', width: '800px', height: '400px', border: '4px solid #4a5568', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 30px rgba(0,0,0,0.8)' };
const bgStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center' };
const overlayStyle = { position: 'relative', zIndex: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const titleStyle = { fontFamily: 'monospace', color: '#fbd38d', textShadow: '3px 3px #000', fontSize: '2.5rem', marginBottom: '30px' };
const mainBtnStyle = { padding: '10px 30px', fontSize: '1.2rem', cursor: 'pointer', background: '#3182ce', color: '#fff', border: '2px solid #fff', borderRadius: '8px', fontWeight: 'bold' };
const subBtnStyle = { ...mainBtnStyle, background: '#4a5568', marginTop: '15px' };
const cardStyle = { width:'90px', padding: '10px', borderRadius: '10px', cursor: 'pointer', border: '2px solid #555', textAlign: 'center', transition: '0.2s' };
const optionBtnStyle = { padding: '10px', background: '#1a202c', color: '#fff', border: '1px solid #4a5568', cursor: 'pointer', fontSize: '0.9rem', width: '100%', borderRadius: '5px' };

export default AdventureBattle;