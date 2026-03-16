// src/games/Maze.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; 

const TILE = 30; 
const WALL_COLOR = "#323232";  
const PATH_COLOR = "#ffffff";  
const BG_COLOR = "#0c0e17";    

//S=Start, E=End, 1-9/A=Locks. #=Wall, .=Path
const MAZE_LIBRARY = {
  EASY: [
    [
      "#####################",
      "#S..1.......#.......#",
      "###.#######.#.#####.#",
      "#...#3....#...#.....#",
      "#.#######.#####.###.#",
      "#...#...#.......#...#",
      "#.###.#.#########.###",
      "#...#.#....4......#E#",
      "###.#.#############.#",
      "#2..#.........5.....#",
      "#####################"
    ],
    [
      "#####################",
      "#S..#...........1...#",
      "###.#######.#.#.###.#",
      "#2....#.....#.#.#...#",
      "#.#####.#####.###.###",
      "#.#3....#.........#E#",
      "#.#.#####.#######.#.#",
      "#.#.....#.#.....#4#.#",
      "#.#####.#.#.###.###.#",
      "#.......#...#5......#",
      "#####################"
    ],
    [
      "#####################",
      "#S....#.......#.....#",
      "#####.#.#####.#.###.#",
      "#1....#.#2..#.#.#...#",
      "#.#####.#.#.#.#.#.###",
      "#.......#.#3#...#..5#",
      "#########.#.#######.#",
      "#.........#.......#.#",
      "#.###############.#.#",
      "#4.........E#.......#",
      "#####################"
    ]
  ],
  NORMAL: [
    [
      "#####################",
      "#S.1..#...2...#....3#",
      "#.###.#.#####.#.###.#",
      "#.4.#...#5....#.#...#",
      "#.#######.#####.#.###",
      "#.#...6...#7....#...#",
      "#.#.#######.#######.#",
      "#8..#.....#.......#.#",
      "#####.###.#######.#.#",
      "#9....#A..........#E#",
      "#####################"
    ],
    [
      "#####################",
      "#S.1.#..2.....#3....#",
      "####.#.######.#.###.#",
      "#4...#......#...#5..#",
      "#.####.####.#####.###",
      "#....#.#6.#.#7....#.#",
      "####.#.#..#.#.#####.#",
      "#8...#.#.##.#.....#.#",
      "#.####.#..#.#####.#.#",
      "#......#9.#......A.E#",
      "#####################"
    ],
    [
      "#####################",
      "#S.1......#2......3.#",
      "#########.#.#######.#",
      "#4......#.#...#.....#",
      "#.#####.###.#.#.#####",
      "#5..#6......#7#....8#",
      "###.#.#######.#####.#",
      "#...#.#.....#.#.....#",
      "#.###.#.###.#.#.#####",
      "#.....#9..#...#A...E#",
      "#####################"
    ]
  ],
  HARD: [
    [
      "#########################",
      "#S.1....#.......#...2...#",
      "#######.#.#####.#.#####.#",
      "#.......#.#3....#.#.....#",
      "#.#######.#.#####.#.#####",
      "#.#.....#.#.....#.#A....#",
      "#.#.###.#.#####.#.#####.#",
      "#5..#...#.....#.#.....#.#",
      "#####.#######.#.#####.#.#",
      "#6..#.#7......#.#.....#E#",
      "###.#.#.#######.#.#######",
      "#...#.#.......#.#8......#",
      "#.###.#######.#.#######.#",
      "#9............#4........#",
      "#########################"
    ],
    [
      "#########################",
      "#S..#1.......2..........#",
      "###.#.#####.#.#########.#",
      "#...#...#...#.........#.#",
      "#.#####.#.###########.#.#",
      "#3....#.#4..#5......#.#.#",
      "#####.#.###.#.#####.#.#.#",
      "#.....#...#.#.#.AE#.#.#.#",
      "#.#######.#.#.#.###.#.#.#",
      "#6......#.#.#.#...#.#.#.#",
      "#######.#.#.#.###.#.#.#.#",
      "#7......#...#8..#...#9..#",
      "#.#########.###.#######.#",
      "#...........#...........#",
      "#########################"
    ],
    [
      "#########################",
      "#S.1..#.....#...2...#...#",
      "#.###.#.###.#.#####.#.#.#",
      "#.3...#...#.#.....#...#.#",
      "#.#######.#######.#####.#",
      "#.4.......#...5.#...AE#.#",
      "#.###########.#.#######.#",
      "#.........#...#.......#.#",
      "#########.#.#########.#.#",
      "#6......#.#7#.......#.#.#",
      "#.#####.#.#.#######.#.#.#",
      "#.#8..#...#.........#.#.#",
      "#.#.#.###########.#.#.#.#",
      "#...#9............#.....#",
      "#########################"
    ]
  ]
};

const Maze = () => {
  const { gameId } = useParams(); 
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  const [loading, setLoading] = useState(true); 
  const [errorMsg, setErrorMsg] = useState(null);
  const [saveStatus, setSaveStatus] = useState(""); 
  const [difficulty, setDifficulty] = useState("NORMAL");

  const [alertData, setAlertData] = useState(null); 

  const gameState = useRef({
    screen: 'menu',
    player: { tileX: 0, tileY: 0, px: 0, py: 0 },
    moving: false,
    target: { x: 0, y: 0 },
    score: 0,
    startTime: 0,
    activePopup: null,
    particles: [],
    questions: {}, 
    lockPos: {},  
    gameEnded: false,
    answerLog: [],
    answeredCount: 0,
    mapData: [],
    startPos: {x:0, y:0},
    exitPos: {x:0, y:0},
    totalQs: 0,
    isAlertOpen: false
  });

  const [activeScreen, setActiveScreen] = useState('menu'); 

  useEffect(() => {
    if (!gameId) {
        setErrorMsg("No Game ID found.");
        setLoading(false);
        return;
    }

    const fetchGameData = async () => {
        try {
            const resQ = await fetch(`http://localhost:8081/api/game-questions/${gameId}`);
            const data = await resQ.json();

            let diff = "NORMAL";
            if (auth.currentUser) {
                const resG = await fetch(`http://localhost:8081/api/student-games/${auth.currentUser.uid}`);
                const allGames = await resG.json();
                const currentGame = allGames.find(g => g.game_id === parseInt(gameId));
                if (currentGame && currentGame.game_type) {
                    diff = currentGame.game_type.split('_')[1] || "NORMAL";
                } else if (data.length === 5) {
                    diff = "EASY";
                }
            } else if (data.length === 5) diff = "EASY";
            
            setDifficulty(diff);
            gameState.current.totalQs = data.length;

            if (Array.isArray(data) && data.length > 0) {
                const formattedQuestions = {};
                data.forEach((q, index) => {
                    formattedQuestions[index + 1] = {
                        db_id: q.id, 
                        q: q.question_text,
                        choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
                        correct: q.correct_answer
                    };
                });
                gameState.current.questions = formattedQuestions;

                const maps = MAZE_LIBRARY[diff] || MAZE_LIBRARY.NORMAL;
                const chosenMap = maps[Math.floor(Math.random() * maps.length)];
                
                const processedMap = [];
                const locks = {};
                let start = {x:1, y:1};
                let end = {x:1, y:1};

                chosenMap.forEach((row, r) => {
                    const gameRow = [];
                    for(let c = 0; c < row.length; c++) {
                        const char = row[c];
                        const isLock = (char >= '1' && char <= '9') || char === 'A';

                        if (char === '#') gameRow.push(1); 
                        else if (char === 'S') { gameRow.push(0); start = {x:c, y:r}; }
                        else if (char === 'E') { gameRow.push(4); end = {x:c, y:r}; }
                        else if (char === '.') { gameRow.push(0); }
                        else if (isLock) {
                            gameRow.push(3); 
                            let qIdx = char === 'A' ? 10 : parseInt(char);
                            locks[`${r},${c}`] = qIdx;
                        }
                    }
                    processedMap.push(gameRow);
                });

                gameState.current.mapData = processedMap;
                gameState.current.lockPos = locks;
                gameState.current.startPos = start;
                gameState.current.exitPos = end;
                setLoading(false);
            } else {
                setErrorMsg("Game has no questions configured.");
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

  const saveScoreToDB = async (finalScore, timeTaken) => {
    if (!auth.currentUser) return;
    setSaveStatus("Saving score...");
    try {
        await fetch('http://localhost:8081/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_fid: auth.currentUser.uid, game_id: gameId, score: finalScore, time_taken: timeTaken })
        });

        if (gameState.current.answerLog.length > 0) {
            await fetch('http://localhost:8081/api/save-answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: gameState.current.answerLog })
            });
        }
        setSaveStatus("Score Saved Successfully!");
    } catch (err) {
        console.error("Save error:", err);
        setSaveStatus("Error saving score.");
    }
  };

  useEffect(() => {
    if (loading || errorMsg) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resetPlayer = () => {
      gameState.current.player.tileX = gameState.current.startPos.x;
      gameState.current.player.tileY = gameState.current.startPos.y;
      gameState.current.player.px = gameState.current.startPos.x * TILE;
      gameState.current.player.py = gameState.current.startPos.y * TILE;
      gameState.current.moving = false;
    };
    resetPlayer();

    for (let i = 0; i < 60; i++) {
      gameState.current.particles.push({
        x: Math.random() * 800, y: Math.random() * 550,
        vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 4 + 2, alpha: Math.random() * 0.7 + 0.3
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
      update(keys);
      draw(ctx);
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading, errorMsg]);

  const update = (keys) => {
    const state = gameState.current;
    
    if (state.screen !== 'playing' || state.isAlertOpen) return;

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
        checkTileEvents();
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
        
        if (state.mapData[nextY] && state.mapData[nextY][nextX] !== undefined && state.mapData[nextY][nextX] !== 1) {
          state.moving = true;
          state.target = { x: nextX, y: nextY };
        }
      }
    }
  };

  const checkTileEvents = () => {
    const s = gameState.current;
    const { tileX, tileY } = s.player;
    const cell = s.mapData[tileY][tileX];

    if (cell === 3) {
      s.screen = 'question';
      const qId = s.lockPos[`${tileY},${tileX}`];
      const qData = s.questions[qId];
      
      if (qData) {
          s.activePopup = { ...qData, loc: {x: tileX, y: tileY} };
          setActiveScreen('question');
      } else {
          s.mapData[tileY][tileX] = 0;
          s.answeredCount++;
          s.screen = 'playing';
      }
    }

    if (cell === 4) {
      if (s.answeredCount >= s.totalQs) {
        if (!s.gameEnded) {
            s.gameEnded = true;
            const time = Math.floor((Date.now() - s.startTime) / 1000);
            s.screen = 'win';
            s.activePopup = { score: s.score, time: time };
            setActiveScreen('win');
            saveScoreToDB(s.score, time);
        }
      } else {
        setAlertData({ 
            title: "PATH LOCKED", 
            message: `You must unlock all paths first! (${s.answeredCount}/${s.totalQs} unlocked)`, 
            color: "#ff9900" 
        });
        s.isAlertOpen = true;

        s.player.tileX = s.startPos.x; 
        s.player.tileY = s.startPos.y;
        s.player.px = s.startPos.x * TILE; 
        s.player.py = s.startPos.y * TILE;
      }
    }
  };

  const handleAnswer = (choiceIndex) => {
    const s = gameState.current;
    const q = s.activePopup;
    const isCorrect = (choiceIndex === q.correct);

    if (q.db_id && auth.currentUser) {
        s.answerLog.push({
            student_fid: auth.currentUser.uid,
            game_id: parseInt(gameId),
            question_id: q.db_id,
            is_correct: isCorrect
        });
    }
    
    if (isCorrect) {
      s.score += 1;
      setAlertData({ title: "CORRECT", message: "+1 Point. The path is open.", color: "#48bb78" });
    } else {
      setAlertData({ title: "INCORRECT", message: "0 Points. The path is open.", color: "#f56565" });
    }
    s.isAlertOpen = true;

    s.answeredCount++;
    s.mapData[q.loc.y][q.loc.x] = 0;

    s.screen = 'playing'; 
    setActiveScreen('playing'); 
  };

  const draw = (ctx) => {
    const s = gameState.current;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, 800, 550);

    if (s.screen === 'menu') { 
        s.particles.forEach(p => {
          ctx.fillStyle = "#0ac8f0"; ctx.globalAlpha = p.alpha;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1.0;
        return; 
    }

    const cols = s.mapData[0].length;
    const rows = s.mapData.length;
    const offsetX = (800 - (cols * TILE)) / 2;
    const offsetY = (500 - (rows * TILE)) / 2;

    s.mapData.forEach((row, r) => {
      row.forEach((cell, c) => {
        const x = offsetX + c * TILE;
        const y = offsetY + r * TILE;
        
        if (cell === 1) { ctx.fillStyle = WALL_COLOR; ctx.fillRect(x, y, TILE, TILE); } 
        else { ctx.fillStyle = PATH_COLOR; ctx.fillRect(x, y, TILE, TILE); } 

        ctx.font = "20px Arial"; 
        ctx.textAlign = "center"; 
        ctx.textBaseline = "middle";

        if (cell === 3) ctx.fillText("🔒", x + TILE/2, y + TILE/2);
        if (cell === 4) ctx.fillText("🏁", x + TILE/2, y + TILE/2);
      });
    });

    const px = offsetX + s.player.px;
    const py = offsetY + s.player.py;
    ctx.fillText("🏃", px + TILE/2, py + TILE/2);

    ctx.fillStyle = "#111"; 
    ctx.fillRect(0, 500, 800, 50);
    ctx.strokeStyle = "#0ac8f0"; 
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 500); ctx.lineTo(800, 500); ctx.stroke();
    
    ctx.fillStyle = "#0ac8f0"; 
    ctx.font = "18px monospace"; 
    ctx.textAlign = "left"; 
    ctx.fillText(`${difficulty} | SCORE: ${s.score}/${s.totalQs}`, 20, 530);
    
    ctx.textAlign = "right"; 
    const time = Math.floor((Date.now() - s.startTime) / 1000);
    ctx.fillText(`TIME: ${time}s`, 780, 530);
  };

  const startGame = () => {
    gameState.current.screen = 'playing';
    gameState.current.score = 0;
    gameState.current.startTime = Date.now();
    setActiveScreen('playing');
  };

  const overlayStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(12, 14, 23, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>Loading Game Data...</div>;
  if (errorMsg) return <div style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>{errorMsg}<br/><button className="btn btn-secondary" onClick={()=>navigate('/student-menu')}>Back</button></div>;

  return (
    <div style={{ position: 'relative', width: 800, height: 550, margin: '50px auto' }}>
      <canvas ref={canvasRef} width={800} height={550} style={{ border: `4px solid #00b4ff`, borderRadius: '8px', background: '#0c0e17' }} />

      {activeScreen === 'menu' && (
        <div style={overlayStyle}>
          <h1 style={{ color: '#0ac8f0', fontSize: '3rem', marginBottom: '40px' }}>MAZE ESCAPE</h1>
          <button onClick={startGame} className="btn btn-primary" style={{ fontSize: '1.5rem', padding: '15px 40px' }}>START GAME</button>
        </div>
      )}

      {activeScreen === 'question' && (
        <div style={overlayStyle}>
          <div className="modal-box" style={{ width: '80%', backgroundColor:'#222', padding:'30px', borderRadius:'10px', textAlign:'center' }}>
            <h2 style={{ color: 'white', marginBottom: '30px', fontSize:'1.5rem' }}>{gameState.current.activePopup?.q}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {gameState.current.activePopup?.choices.map((choice, idx) => (
                <button key={idx} onClick={() => handleAnswer(idx)} className="btn btn-secondary" style={{ textAlign: 'left', padding:'15px', fontSize: '1.2rem' }}>
                  {String.fromCharCode(65 + idx)}. {choice}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeScreen === 'win' && (
        <div style={overlayStyle}>
          <h1 style={{ color: '#14a014', fontSize: '3rem' }}>CONGRATULATIONS!</h1>
          <p style={{ color: 'white', margin: '20px 0', fontSize: '1.5rem' }}>
            Score: <span style={{color: '#0ac8f0'}}>{gameState.current.activePopup?.score} / {gameState.current.totalQs}</span><br/>
            Time: <span style={{color: '#0ac8f0'}}>{gameState.current.activePopup?.time}s</span>
          </p>
          <p style={{fontSize: '1rem', color: '#aaa', marginBottom: '20px'}}>
             {saveStatus}
          </p>
          <button onClick={() => navigate('/student-menu')} className="btn btn-primary" style={{fontSize: '1.2rem', padding: '10px 30px'}}>RETURN TO MENU</button>
        </div>
      )}

      {alertData && (
          <div style={{...overlayStyle, zIndex: 1000}}>
              <div className="modal-box" style={{backgroundColor: '#222', border: `2px solid ${alertData.color}`, padding: '30px', borderRadius: '10px', textAlign: 'center', maxWidth: '400px'}}>
                  <h2 style={{color: alertData.color, marginBottom: '20px'}}>{alertData.title}</h2>
                  <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '30px'}}>{alertData.message}</p>
                  <button className="btn-primary" onClick={() => {
                      setAlertData(null);
                      gameState.current.isAlertOpen = false;
                  }}>OK</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Maze;