// src/games/Maze.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; 

const TILE = 30; 
const WALL_COLOR = "#323232";  
const PATH_COLOR = "#ffffff";  
const BG_COLOR = "#0c0e17";    

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
      "#.######.#.######.###",
      "#....#.#6#.#.7....#E#",
      "####.#.#.#.#.######.#",
      "#8...#.#.#.#......#.#",
      "#.####.#.#.#.####.#.#",
      "#.......9#......#.A.#",
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
  
  const keysRef = useRef({ ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false });
  const bgMusicRef = useRef(new Audio('/assets/sounds/maze_bg.mp3'));
  
  const [loading, setLoading] = useState(true); 
  const [errorMsg, setErrorMsg] = useState(null);
  const [saveStatus, setSaveStatus] = useState(""); 
  const [difficulty, setDifficulty] = useState("NORMAL");

  const [alertData, setAlertData] = useState(null); 
  const [timeLeft, setTimeLeft] = useState(null); 
  const [showTimeUp, setShowTimeUp] = useState(false); 

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
    isAlertOpen: false, 
    timeLimit: 0 
  });

  const [activeScreen, setActiveScreen] = useState('menu'); 

  useEffect(() => {
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.4; 
    return () => {
      bgMusicRef.current.pause();
      bgMusicRef.current.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (!gameId) {
        setErrorMsg("No Game ID found.");
        setLoading(false);
        return;
    }

    const fetchGameData = async () => {
        try {
            const resQ = await fetch(`https://arcads-api.onrender.com/api/game-questions/${gameId}`);
            const data = await resQ.json();

            let diff = "NORMAL";
            if (auth.currentUser) {
                const resG = await fetch(`https://arcads-api.onrender.com/api/student-games/${auth.currentUser.uid}`);
                const allGames = await resG.json();
                const currentGame = allGames.find(g => g.game_id === parseInt(gameId));
                if (currentGame && currentGame.game_type) {
                    diff = currentGame.game_type.split('_')[1] || "NORMAL";
                    gameState.current.timeLimit = currentGame.time_limit || 0;
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

  useEffect(() => {
    if (gameState.current.screen === 'playing' && !gameState.current.gameEnded && timeLeft !== null) {
        if (timeLeft <= 0) {
            handleTimeUp();
            return;
        }
        const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timerId);
    }
  }, [activeScreen, timeLeft]);

  const handleTimeUp = () => {
    bgMusicRef.current.pause();
    gameState.current.isAlertOpen = true;
    gameState.current.gameEnded = true;
    setShowTimeUp(true);
    saveScoreToDB(gameState.current.score, gameState.current.timeLimit * 60);
  };

  const saveScoreToDB = async (finalScore, timeTaken) => {
    if (!auth.currentUser) return;
    setSaveStatus("Saving score...");
    try {
        await fetch('https://arcads-api.onrender.com/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_fid: auth.currentUser.uid, game_id: gameId, score: finalScore, time_taken: timeTaken })
        });

        if (gameState.current.answerLog.length > 0) {
            await fetch('https://arcads-api.onrender.com/api/save-answers', {
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

    const handleKeyDown = (e) => { 
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault();
        if (keysRef.current.hasOwnProperty(e.key)) keysRef.current[e.key] = true; 
    };
    const handleKeyUp = (e) => { 
        if (keysRef.current.hasOwnProperty(e.key)) keysRef.current[e.key] = false; 
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const loop = () => {
      update();
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

  const update = () => {
    const state = gameState.current;
    const keys = keysRef.current; 
    
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
          keysRef.current = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
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
            bgMusicRef.current.pause();
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
            message: `Unlock all paths first! (${s.answeredCount}/${s.totalQs})`, 
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
        if (cell === 4) ctx.fillText("🚪", x + TILE/2, y + TILE/2);
      });
    });

    const px = offsetX + s.player.px;
    const py = offsetY + s.player.py;
    ctx.fillText("🚶", px + TILE/2, py + TILE/2);

    ctx.fillStyle = "#111"; 
    ctx.fillRect(0, 500, 800, 50);
    ctx.strokeStyle = "#0ac8f0"; 
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 500); ctx.lineTo(800, 500); ctx.stroke();
    
    ctx.fillStyle = "#0ac8f0"; 
    ctx.font = "16px monospace"; 
    ctx.textAlign = "left"; 
    ctx.fillText(`${difficulty} | SCORE: ${s.score}/${s.totalQs}`, 20, 530);
    
    ctx.textAlign = "right"; 
    if (timeLeft !== null) {
        const m = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        ctx.fillText(`TIME LEFT: ${m}:${sec < 10 ? '0' : ''}${sec}`, 780, 530);
    } else {
        const time = Math.floor((Date.now() - s.startTime) / 1000);
        ctx.fillText(`TIME: ${time}s`, 780, 530);
    }
  };

  const startGame = () => {
    bgMusicRef.current.play().catch((err) => console.log("Audio play prevented", err));
    gameState.current.screen = 'playing';
    gameState.current.score = 0;
    gameState.current.startTime = Date.now();
    if (gameState.current.timeLimit > 0) setTimeLeft(gameState.current.timeLimit * 60);
    setActiveScreen('playing');
  };

  const handleDpadPress = (key) => { keysRef.current[key] = true; };
  const handleDpadRelease = (key) => { keysRef.current[key] = false; };

  const overlayStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(12, 14, 23, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 };
  
  const dpadBtnStyle = {
      width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#14213d', 
      border: '2px solid #0ac8f0', color: 'white', fontSize: '24px', display: 'flex', 
      justifyContent: 'center', alignItems: 'center', cursor: 'pointer', outline: 'none', 
      WebkitTapHighlightColor: 'transparent', userSelect: 'none'
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>Loading Game Data...</div>;
  if (errorMsg) return <div style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>{errorMsg}<br/><button className="btn btn-secondary responsive-btn" onClick={()=>navigate('/student-menu')}>Back</button></div>;

  return (
    <div className="game-wrapper" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* 🟢 CSS INJECTION: Shrinks fonts and modals perfectly on small screens */}
        <style>{`
            .dpad-container { display: none; }
            
            /* Rules for Mobile Screens */
            @media (max-width: 850px) {
                .dpad-container { display: flex !important; }
                .game-wrapper { padding: 10px; }
                
                /* Dynamically shrink text so it never gets cropped */
                .responsive-title { font-size: clamp(1.5rem, 5vw, 3rem) !important; margin-bottom: 15px !important; }
                .responsive-subtitle { font-size: clamp(1.1rem, 3vw, 1.5rem) !important; margin-bottom: 10px !important; }
                .responsive-text { font-size: clamp(0.9rem, 2.5vw, 1.2rem) !important; }
                .responsive-btn { font-size: clamp(0.8rem, 2.5vw, 1rem) !important; padding: 10px 15px !important; }
                
                /* Fix Modal Boxes so they fit on the screen */
                .modal-box { 
                    padding: 15px !important; 
                    width: 95% !important; 
                    max-height: 90vh !important; /* Prevents long text from spilling off screen */
                    overflow-y: auto !important; /* Adds a scrollbar if the question is huge */
                }
                .choices-container { gap: 8px !important; }
            }
        `}</style>

        {/* THE GAME CANVAS */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '800/550', backgroundColor: '#0c0e17', borderRadius: '8px', overflow: 'hidden', border: '4px solid #00b4ff' }}>
            <canvas ref={canvasRef} width={800} height={550} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />

            {/* START SCREEN */}
            {activeScreen === 'menu' && (
                <div style={overlayStyle}>
                    <h1 className="responsive-title" style={{ color: '#0ac8f0', textAlign: 'center' }}>MAZE ESCAPE</h1>
                    <button onClick={startGame} className="btn btn-primary responsive-btn">START GAME</button>
                </div>
            )}

            {/* QUESTION MODAL */}
            {activeScreen === 'question' && (
                <div style={overlayStyle}>
                    <div className="modal-box" style={{ width: '90%', maxWidth: '500px', backgroundColor:'#222', padding:'20px', borderRadius:'10px', textAlign:'center' }}>
                        <h2 className="responsive-subtitle" style={{ color: 'white', marginBottom: '20px' }}>{gameState.current.activePopup?.q}</h2>
                        <div className="choices-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {gameState.current.activePopup?.choices.map((choice, idx) => (
                            <button key={idx} onClick={() => handleAnswer(idx)} className="btn btn-secondary responsive-btn" style={{ textAlign: 'left', padding:'12px' }}>
                            {String.fromCharCode(65 + idx)}. {choice}
                            </button>
                        ))}
                        </div>
                    </div>
                </div>
            )}

            {/* WIN SCREEN */}
            {activeScreen === 'win' && (
                <div style={overlayStyle}>
                    <div className="modal-box" style={{ width: '90%', maxWidth: '500px', backgroundColor:'#222', padding:'30px', borderRadius:'15px', textAlign:'center', border: '2px solid #14a014' }}>
                        <h1 className="responsive-title" style={{ color: '#14a014', margin: '0 0 10px 0' }}>CONGRATULATIONS!</h1>
                        <p className="responsive-text" style={{ color: 'white', margin: '15px 0' }}>
                            Score: <span style={{color: '#0ac8f0', fontWeight: 'bold'}}>{gameState.current.activePopup?.score} / {gameState.current.totalQs}</span><br/>
                            Time: <span style={{color: '#0ac8f0', fontWeight: 'bold'}}>{gameState.current.activePopup?.time}s</span>
                        </p>
                        <p className="responsive-text" style={{ color: '#aaa', marginBottom: '20px' }}>{saveStatus}</p>
                        <button onClick={() => navigate('/student-menu')} className="btn btn-primary responsive-btn">RETURN TO MENU</button>
                    </div>
                </div>
            )}

            {/* TIME UP SCREEN */}
            {showTimeUp && (
                <div style={{...overlayStyle, zIndex: 1000}}>
                    <div className="modal-box" style={{backgroundColor: '#222', border: `3px solid #ff4c4c`, padding: '30px', borderRadius: '15px', textAlign: 'center', width: '90%', maxWidth: '400px'}}>
                        <h1 className="responsive-title" style={{color: '#ff4c4c', margin: '0 0 10px 0'}}>TIME'S UP!</h1>
                        <p className="responsive-text" style={{color: '#fff', marginBottom: '20px'}}>Your time has expired. Your current progress has been saved.</p>
                        <div style={{backgroundColor: 'rgba(10, 200, 240, 0.1)', padding: '15px', borderRadius: '10px', marginBottom: '20px'}}>
                            <h3 className="responsive-subtitle" style={{color: '#0ac8f0', margin: 0}}>SCORE: {gameState.current.score} / {gameState.current.totalQs}</h3>
                        </div>
                        <button className="btn btn-primary responsive-btn" onClick={() => navigate('/student-menu')}>RETURN TO MENU</button>
                    </div>
                </div>
            )}

            {/* CUSTOM ALERT MODAL */}
            {alertData && (
                <div style={{...overlayStyle, zIndex: 1000}}>
                    <div className="modal-box" style={{backgroundColor: '#222', border: `2px solid ${alertData.color}`, padding: '20px', borderRadius: '10px', textAlign: 'center', width: '80%', maxWidth: '300px'}}>
                        <h2 className="responsive-subtitle" style={{color: alertData.color, marginBottom: '15px'}}>{alertData.title}</h2>
                        <p className="responsive-text" style={{color: '#fff', marginBottom: '20px'}}>{alertData.message}</p>
                        <button className="btn-primary responsive-btn" style={{padding: '10px 30px'}} onClick={() => {
                            setAlertData(null);
                            gameState.current.isAlertOpen = false;
                        }}>OK</button>
                    </div>
                </div>
            )}
        </div>

        {/* VIRTUAL D-PAD */}
        <div className="dpad-container" style={{ marginTop: '20px', flexDirection: 'column', alignItems: 'center', gap: '10px', touchAction: 'none' }}>
            <button 
                onMouseDown={() => handleDpadPress('ArrowUp')} onMouseUp={() => handleDpadRelease('ArrowUp')} onMouseLeave={() => handleDpadRelease('ArrowUp')}
                onTouchStart={(e) => { e.preventDefault(); handleDpadPress('ArrowUp'); }} onTouchEnd={(e) => { e.preventDefault(); handleDpadRelease('ArrowUp'); }}
                style={dpadBtnStyle}>⬆️</button>
            <div style={{ display: 'flex', gap: '40px' }}>
                <button 
                    onMouseDown={() => handleDpadPress('ArrowLeft')} onMouseUp={() => handleDpadRelease('ArrowLeft')} onMouseLeave={() => handleDpadRelease('ArrowLeft')}
                    onTouchStart={(e) => { e.preventDefault(); handleDpadPress('ArrowLeft'); }} onTouchEnd={(e) => { e.preventDefault(); handleDpadRelease('ArrowLeft'); }}
                    style={dpadBtnStyle}>⬅️</button>
                <button 
                    onMouseDown={() => handleDpadPress('ArrowRight')} onMouseUp={() => handleDpadRelease('ArrowRight')} onMouseLeave={() => handleDpadRelease('ArrowRight')}
                    onTouchStart={(e) => { e.preventDefault(); handleDpadPress('ArrowRight'); }} onTouchEnd={(e) => { e.preventDefault(); handleDpadRelease('ArrowRight'); }}
                    style={dpadBtnStyle}>➡️</button>
            </div>
            <button 
                onMouseDown={() => handleDpadPress('ArrowDown')} onMouseUp={() => handleDpadRelease('ArrowDown')} onMouseLeave={() => handleDpadRelease('ArrowDown')}
                onTouchStart={(e) => { e.preventDefault(); handleDpadPress('ArrowDown'); }} onTouchEnd={(e) => { e.preventDefault(); handleDpadRelease('ArrowDown'); }}
                style={dpadBtnStyle}>⬇️</button>
        </div>

    </div>
  );
};

export default Maze;