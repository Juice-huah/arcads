// src/games/Maze.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; 

// --- CONFIGURATION ---
const TILE = 30; 
const MAP_COLS = 20;
const MAP_ROWS = 19;
const CANVAS_WIDTH = MAP_COLS * TILE + 40; 
const CANVAS_HEIGHT = MAP_ROWS * TILE + 60; 
const WALL_COLOR = "#323232";  
const PATH_COLOR = "#ffffff";  
const BG_COLOR = "#0c0e17";    

// 0=Path, 1=Wall, S=Start, E=End
const RAW_MAP = [
  "####################",
  "#S#................#",
  "#.#.##############.#",
  "#.#.#....#.......#.#",
  "#.#.#.##.#######.#.#",
  "#...#.#..#.......#.#",
  "###.#.####.#######.#",
  "#.#...#....#...#...#",
  "#.########.#.#.#.###",
  "#.....#..#.#.#.#...#",
  "#.###.##.#.#.#.###.#",
  "#.#......#...#...#.#",
  "#.######.#######.#.#",
  "#.#....#.#.......#.#",
  "#.#.#.############.#",
  "#...#............#.#",
  "######.#############",
  "#.................E#",
  "####################"
];

const CLUES_TEXT = {
  1: "The first portal leads to a twisted path.",
  2: "The second door requires a sharp mind.",
  3: "Only those who have the final key may leave."
};

const Maze = () => {
  const { gameId } = useParams(); 
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true); 
  const [errorMsg, setErrorMsg] = useState(null);
  const [saveStatus, setSaveStatus] = useState(""); 

  const gameState = useRef({
    screen: 'menu',
    player: { tileX: 1, tileY: 1, px: 0, py: 0 },
    moving: false,
    moveDir: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    collectedClues: { 1: false, 2: false, 3: false },
    usedDoors: { 1: false, 2: false, 3: false, 4: false, 5: false },
    score: 0,
    startTime: 0,
    activePopup: null,
    particles: [],
    questions: {},
    gameEnded: false 
  });

  const [activeScreen, setActiveScreen] = useState('menu'); 

  // --- FETCH DATA ---
  useEffect(() => {
    if (!gameId) {
        setErrorMsg("No Game ID found.");
        setLoading(false);
        return;
    }

    const fetchGameData = async () => {
        try {
            const res = await fetch(`http://localhost:8081/api/game-questions/${gameId}`);
            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                const formattedQuestions = {};
                data.forEach((q, index) => {
                    formattedQuestions[index + 1] = {
                        q: q.question_text,
                        choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
                        correct: q.correct_answer
                    };
                });
                gameState.current.questions = formattedQuestions;
                setLoading(false);
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Failed to connect to server.");
            setLoading(false);
        }
    };

    fetchGameData();
  }, [gameId]);

  // --- SAVE SCORE ---
  const saveScoreToDB = async (finalScore, timeTaken) => {
    if (!auth.currentUser) return;
    
    setSaveStatus("Saving score...");
    try {
        const payload = {
            student_fid: auth.currentUser.uid,
            game_id: gameId,
            score: finalScore,
            time_taken: timeTaken
        };

        const res = await fetch('http://localhost:8081/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) setSaveStatus("Score Saved!");
        else setSaveStatus("Error saving score.");
        
    } catch (err) {
        console.error("Save error:", err);
        setSaveStatus("Error saving score.");
    }
  };

  // --- ENGINE ---
  useEffect(() => {
    if (loading || errorMsg) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Initialize Map
    const gameMaze = [];
    let startPos = { x: 1, y: 1 };
    let exitPos = { x: 18, y: 17 };

    RAW_MAP.forEach((row, r) => {
      const gameRow = [];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '#') gameRow.push(1); 
        else if (ch === 'S') { gameRow.push(0); startPos = { x: c, y: r }; }
        else if (ch === 'E') { gameRow.push(4); exitPos = { x: c, y: r }; } 
        else gameRow.push(0); 
      }
      gameMaze.push(gameRow);
    });

    const cluePos = { 1: [5, 7], 2: [7, 7], 3: [13, 8] }; 
    Object.entries(cluePos).forEach(([id, pos]) => { gameMaze[pos[0]][pos[1]] = 2; });

    const doorPos = { 1: [15, 18], 2: [7, 10], 3: [13, 10], 4: [11, 5], 5: [17, 17] };
    Object.entries(doorPos).forEach(([id, pos]) => {
      if (gameMaze[pos[0]][pos[1]] !== 2) gameMaze[pos[0]][pos[1]] = 3;
    });

    const resetPlayer = () => {
      gameState.current.player.tileX = startPos.x;
      gameState.current.player.tileY = startPos.y;
      gameState.current.player.px = startPos.x * TILE;
      gameState.current.player.py = startPos.y * TILE;
      gameState.current.moving = false;
    };
    resetPlayer();

    // Particles
    for (let i = 0; i < 60; i++) {
      gameState.current.particles.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 4 + 2,
        alpha: Math.random() * 0.7 + 0.3
      });
    }

    const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
    const handleKeyDown = (e) => { 
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault();
        if (keys.hasOwnProperty(e.key)) keys[e.key] = true; 
    };
    const handleKeyUp = (e) => { 
        if (keys.hasOwnProperty(e.key)) keys[e.key] = false; 
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const loop = () => {
      update(keys, gameMaze, startPos, exitPos, cluePos, doorPos);
      draw(ctx, gameMaze, cluePos, doorPos);
      animationFrameId = requestAnimationFrame(loop);
    };
    gameState.current.startTime = Date.now();
    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading, errorMsg]);

  const update = (keys, map, startPos, exitPos, cluePos, doorPos) => {
    const state = gameState.current;
    if (state.screen !== 'playing') return;

    if (state.moving) {
      const speed = 4; 
      const targetPx = state.target.x * TILE;
      const targetPy = state.target.y * TILE;
      const p = state.player;

      if (p.px < targetPx) p.px = Math.min(p.px + speed, targetPx);
      else if (p.px > targetPx) p.px = Math.max(p.px - speed, targetPx);
      if (p.py < targetPy) p.py = Math.min(p.py + speed, targetPy);
      else if (p.py > targetPy) p.py = Math.max(p.py - speed, targetPy);

      if (p.px === targetPx && p.py === targetPy) {
        state.moving = false;
        state.player.tileX = state.target.x;
        state.player.tileY = state.target.y;
        checkTileEvents(map, startPos, exitPos, cluePos, doorPos);
      }
    } else {
      let dx = 0, dy = 0;
      if (keys.ArrowLeft) dx = -1;
      else if (keys.ArrowRight) dx = 1;
      else if (keys.ArrowUp) dy = -1;
      else if (keys.ArrowDown) dy = 1;

      if (dx !== 0 || dy !== 0) {
        const nextX = state.player.tileX + dx;
        const nextY = state.player.tileY + dy;
        if (map[nextY][nextX] !== 1) {
          state.moving = true;
          state.target = { x: nextX, y: nextY };
        }
      }
    }
  };

  const checkTileEvents = (map, startPos, exitPos, cluePos, doorPos) => {
    const state = gameState.current;
    const { tileX, tileY } = state.player;
    
    // Clues
    if (map[tileY][tileX] === 2) {
      let cid = Object.keys(cluePos).find(k => cluePos[k][0] === tileY && cluePos[k][1] === tileX);
      if (cid && !state.collectedClues[cid]) {
        state.collectedClues[cid] = true;
        state.screen = 'clue';
        state.activePopup = { text: CLUES_TEXT[cid] || "Key Found!", title: `KEY ${cid} FOUND` };
        setActiveScreen('clue');
      }
    }
    // Doors
    if (map[tileY][tileX] === 3) {
      let did = Object.keys(doorPos).find(k => doorPos[k][0] === tileY && doorPos[k][1] === tileX);
      did = parseInt(did);
      const required = { 1: 1, 3: 2, 5: 3 }[did];
      
      if (required && !state.collectedClues[required]) {
        state.screen = 'clue';
        state.activePopup = { text: `You need to find KEY ${required} first!`, title: "LOCKED" };
        setActiveScreen('clue');
        // Reset position slightly so they don't get stuck in loop
        state.player.tileX = startPos.x; 
        state.player.tileY = startPos.y;
        state.player.px = startPos.x * TILE; 
        state.player.py = startPos.y * TILE;
        return;
      }
      if (!state.usedDoors[did]) {
        state.screen = 'question';
        const qData = state.questions[did] || { q: "No Question in DB", choices: ["A","B","C","D"], correct: 0 };
        state.activePopup = { ...qData, did: did, startPos };
        setActiveScreen('question');
      } else {
        if (did === 1) teleport(10, 3); 
        else if (did === 3) teleport(16, 15);
        else if (did === 5) {
             if (state.usedDoors[1] && state.usedDoors[3]) teleport(18, 17); 
             else { alert("Use previous portals first!"); teleport(1, 1); }
        }
      }
    }

    // --- EXIT LOGIC (GAME OVER) ---
    if (tileX === exitPos.x && tileY === exitPos.y) {
      if (!state.gameEnded && state.usedDoors[5]) {
          state.gameEnded = true;
          const time = Math.floor((Date.now() - state.startTime) / 1000);
          
          state.screen = 'win';
          state.activePopup = { score: state.score, time: time };
          setActiveScreen('win');
          saveScoreToDB(state.score, time);
      }
    }
  };

  // --- DRAWING: RESTORED TO USE EMOJIS/TEXT ---
  const draw = (ctx, map, cluePos, doorPos) => {
    const state = gameState.current;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const offsetX = 20, offsetY = 20;

    if (state.screen === 'menu') { drawMenu(ctx); return; }

    map.forEach((row, r) => {
      row.forEach((cell, c) => {
        const x = offsetX + c * TILE;
        const y = offsetY + r * TILE;
        
        // Walls/Path
        if (cell === 1) { ctx.fillStyle = WALL_COLOR; ctx.fillRect(x, y, TILE, TILE); } 
        else { ctx.fillStyle = PATH_COLOR; ctx.fillRect(x, y, TILE, TILE); } 

        // ITEMS DRAWING
        ctx.font = "20px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";

        if (cell === 2) { 
          // --- KEYS ---
          let cid = Object.keys(cluePos).find(k => cluePos[k][0] === r && cluePos[k][1] === c);
          if (cid && !state.collectedClues[cid]) {
             ctx.fillText("🔑", x + TILE/2, y + TILE/2);
          }
        }
        else if (cell === 3) { 
           // --- DOORS / PORTALS ---
           let did = Object.keys(doorPos).find(k => doorPos[k][0] === r && doorPos[k][1] === c);
           did = parseInt(did);

           // Portals (1, 3, 5) get the Spiral, Others get the Locked Door
           if ([1, 3, 5].includes(did)) {
               ctx.fillText("🌀", x + TILE/2, y + TILE/2);
           } else {
               ctx.fillText("🔒", x + TILE/2, y + TILE/2);
           }
        }
        else if (cell === 4) { 
           // --- FINISH LINE ---
           ctx.fillText("🏁", x + TILE/2, y + TILE/2); 
        }
      });
    });

    // Draw Player
    const px = offsetX + state.player.px;
    const py = offsetY + state.player.py;
    ctx.font = "20px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🏃", px + TILE/2, py + TILE/2);

    // HUD
    const hudY = CANVAS_HEIGHT - 25; 
    ctx.fillStyle = "#111"; ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
    ctx.strokeStyle = "#0ac8f0"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT - 50); ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 50); ctx.stroke();
    ctx.fillStyle = "#0ac8f0"; ctx.font = "16px monospace"; 
    ctx.textAlign = "left"; ctx.fillText(`SCORE: ${state.score}`, 20, hudY);
    ctx.textAlign = "right"; const time = Math.floor((Date.now() - state.startTime) / 1000);
    ctx.fillText(`TIME: ${time}s`, CANVAS_WIDTH - 20, hudY);
  };

  const drawMenu = (ctx) => {
    gameState.current.particles.forEach(p => {
      ctx.fillStyle = "#0ac8f0"; ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;
  };

  const startGame = () => {
    gameState.current.screen = 'playing';
    gameState.current.score = 0;
    gameState.current.startTime = Date.now();
    setActiveScreen('playing');
  };

  const handlePopupClose = () => { 
      gameState.current.screen = 'playing'; 
      setActiveScreen('playing'); 
  };

  // --- LOGIC FIX: TRIGGER WIN ON LAST ANSWER ---
  const handleAnswer = (choiceIndex) => {
    const q = gameState.current.activePopup;
    
    if (choiceIndex === q.correct) {
      gameState.current.score += 100;
      gameState.current.usedDoors[q.did] = true;

      if (q.did === 1) {
          teleport(10, 3);
          handlePopupClose();
      } 
      else if (q.did === 3) {
          teleport(16, 15);
          handlePopupClose();
      } 
      else if (q.did === 5) {
         if (gameState.current.usedDoors[1] && gameState.current.usedDoors[3]) {
             teleport(18, 17); 
             
             // FORCE WIN STATE IMMEDIATELY
             if (!gameState.current.gameEnded) {
                 gameState.current.gameEnded = true;
                 const time = Math.floor((Date.now() - gameState.current.startTime) / 1000);
                 
                 gameState.current.screen = 'win';
                 gameState.current.activePopup = { score: gameState.current.score, time: time };
                 setActiveScreen('win'); 
                 saveScoreToDB(gameState.current.score, time);
             }
         } 
         else { 
             alert("Use previous portals first!"); 
             teleport(1, 1); 
             handlePopupClose();
         }
      } else {
        handlePopupClose();
      }
    } else {
      alert("Wrong! Back to start."); 
      teleport(1, 1); 
      handlePopupClose();
    }
  };

  const teleport = (tx, ty) => {
    gameState.current.player.tileX = tx;
    gameState.current.player.tileY = ty;
    gameState.current.player.px = tx * TILE;
    gameState.current.player.py = ty * TILE;
    gameState.current.moving = false;
  };

  const overlayStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(12, 14, 23, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>Loading Game Data...</div>;
  if (errorMsg) return <div style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>{errorMsg}<br/><button className="btn btn-secondary" onClick={()=>navigate('/student-menu')}>Back</button></div>;

  return (
    <div style={{ position: 'relative', width: CANVAS_WIDTH, height: CANVAS_HEIGHT, margin: '0 auto' }}>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ border: `4px solid #00b4ff`, borderRadius: '8px', maxWidth:'100%' }} />

      {activeScreen === 'menu' && (
        <div style={overlayStyle}>
          <h1 style={{ color: '#0ac8f0', fontSize: '2rem', marginBottom: '40px' }}>MAZE ESCAPE</h1>
          <button onClick={startGame} className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px' }}>START GAME</button>
        </div>
      )}

      {activeScreen === 'clue' && (
        <div style={overlayStyle}>
          <div className="modal-box" style={{ width: '80%', backgroundColor:'#222', padding:'20px', borderRadius:'10px', textAlign:'center', color:'white' }}>
            <h2 style={{ color: '#e6c800' }}>{gameState.current.activePopup?.title}</h2>
            <p style={{ margin: '20px 0' }}>{gameState.current.activePopup?.text}</p>
            <button onClick={handlePopupClose} className="btn btn-primary">CONTINUE</button>
          </div>
        </div>
      )}

      {activeScreen === 'question' && (
        <div style={overlayStyle}>
          <div className="modal-box" style={{ width: '80%', backgroundColor:'#222', padding:'20px', borderRadius:'10px', textAlign:'center' }}>
            <h2 style={{ color: 'white', marginBottom: '30px', fontSize:'1.2rem' }}>{gameState.current.activePopup?.q}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {gameState.current.activePopup?.choices.map((choice, idx) => (
                <button key={idx} onClick={() => handleAnswer(idx)} className="btn btn-secondary" style={{ textAlign: 'left', padding:'10px' }}>
                  {String.fromCharCode(65 + idx)}. {choice}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeScreen === 'win' && (
        <div style={overlayStyle}>
          <h1 style={{ color: '#14a014', fontSize: '2rem' }}>CONGRATULATIONS!</h1>
          <p style={{ color: 'white', margin: '20px 0', fontSize: '1.2rem' }}>
            Score: <span style={{color: '#0ac8f0'}}>{gameState.current.activePopup?.score}</span><br/>
            Time: <span style={{color: '#0ac8f0'}}>{gameState.current.activePopup?.time}s</span>
          </p>
          <p style={{fontSize: '0.9rem', color: '#aaa', marginBottom: '20px'}}>
             {saveStatus}
          </p>
          <button onClick={() => navigate('/student-menu')} className="btn btn-primary">RETURN TO MENU</button>
        </div>
      )}
    </div>
  );
};

export default Maze;