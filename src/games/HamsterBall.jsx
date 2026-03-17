// src/games/HamsterBall.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from '../firebase';

import {
  BALL_RADIUS, GRAVITY, JUMP_VEL, BASE_SPEED, LANE_W, CAM_DIST, CAM_UP,
  WORLDS, playSound
} from "../hamsterball/gameData.js";
import { useGameEngine } from "../hamsterball/GameEngine.jsx";
import {
  GlobalStyles, MenuScreen, CountdownScreen,
  GameHUD, EndScreen, ScorePop, Confetti
} from "../hamsterball/GameUI.jsx";

// 🟢 SOUND IMPORTS (Ensure you have these files in this exact folder!)
import menuBGM from "../hamsterball/sounds/main_menu.mp3";
import gameBGM from "../hamsterball/sounds/ingame.mp3";
import victorySFX from "../hamsterball/sounds/victory.mp3";
import yeySFX from "../hamsterball/sounds/yey.mp3";

const LANE_TARGETS = [-LANE_W, 0, LANE_W];
const RING_TRIGGER_R = 3.0;

export default function HamsterBall() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  
  const [scoreSaved, setScoreSaved] = useState(false);
  const [loading, setLoading] = useState(true); 
  const [showConfetti, setShowConfetti] = useState(false); 
  
  const isSavingRef = useRef(false);
  const answerLog = useRef([]);

  // 🟢 SCHEDULING STATES
  const timeLimitR = useRef(0);
  const [showTimeUp, setShowTimeUp] = useState(false);

  // 🟢 AUDIO REFERENCES
  const bgmMenuR = useRef(null);
  const bgmGameR = useRef(null);
  const victoryAudioR = useRef(null);
  const yeyAudioR = useRef(null);

  const canvasRef = useRef();
  const {
    T, trackR, hamR,
    buildLevel, buildHamster, animHamster,
    openGate, tickWorld, spawnParticles, fireConfetti
  } = useGameEngine(canvasRef);

  const phys = useRef({
    bx: 0, by: BALL_RADIUS, bz: 0,
    vy: 0, lane: 1, onGround: false,
    doubleJumped: false, 
  });

  const gs = useRef({
    active: false, over: false, level: 1, finished: false, 
    score: 0, lives: 3, coins: 0, combo: 0,
    timerSec: 120, // Will be overridden on startLevel
    spawnProtect: 3, shakeAmt: 0, dizzy: 0,
    boost: 0, 
    lastCheckpointZ: 0, lastCheckpointX: 0,
    worldSpeed: 1, skinId: 0,
    inRing: false, ringIdx: -1,
  });

  const keysR         = useRef({});
  const lastTR        = useRef(performance.now());
  const pendingGatesR = useRef([]);
  const isAnsweringRef = useRef(false);
  const answeredQsR    = useRef(new Set()); 
  
  const [questions, setQuestions] = useState([]);
  const questionIndexR = useRef(0);

  const [screen,         setScreen]         = useState("menu");
  const [hud,            setHud]            = useState({ score:0, lives:3, coins:0, combo:0, timerSec:120, worldName:"", worldColor:"#4ade80", worldEmoji:"🌿" });
  const [promptData,     setPromptData]     = useState(null);   
  const [wordFlash,      setWordFlash]      = useState(null);   
  const [countdown,      setCountdown]      = useState(3);
  const [endData,        setEndData]        = useState(null);
  const [scorePops,      setScorePops]      = useState([]);

  useEffect(() => {
    bgmMenuR.current = new Audio(menuBGM);
    bgmMenuR.current.loop = true;
    bgmMenuR.current.volume = 0.5;

    bgmGameR.current = new Audio(gameBGM);
    bgmGameR.current.loop = true;
    bgmGameR.current.volume = 0.4;
    bgmGameR.current.preservesPitch = false; 

    victoryAudioR.current = new Audio(victorySFX);
    victoryAudioR.current.volume = 0.8;

    yeyAudioR.current = new Audio(yeySFX);
    yeyAudioR.current.volume = 1.0;

    return () => {
        if (bgmMenuR.current) { bgmMenuR.current.pause(); bgmMenuR.current = null; }
        if (bgmGameR.current) { bgmGameR.current.pause(); bgmGameR.current = null; }
        if (victoryAudioR.current) { victoryAudioR.current.pause(); victoryAudioR.current = null; }
        if (yeyAudioR.current) { yeyAudioR.current.pause(); yeyAudioR.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!bgmMenuR.current || !bgmGameR.current) return;
    const playSafe = (audio) => {
        const p = audio.play();
        if (p !== undefined) p.catch(e => console.warn("Autoplay blocked."));
    };

    if (screen === "menu" || screen === "worlds" || screen === "skins") {
        bgmGameR.current.pause();
        bgmGameR.current.currentTime = 0;
        playSafe(bgmMenuR.current);
    } 
    else if (screen === "countdown" || screen === "game") {
        bgmMenuR.current.pause();
        bgmMenuR.current.currentTime = 0;
        if (!gs.current.finished) playSafe(bgmGameR.current);
    } 
    else if (screen === "gameover") {
        bgmGameR.current.pause();
        bgmMenuR.current.pause();
    }
  }, [screen]);

  // FETCH CONFIG & SCHEDULE
  useEffect(() => {
    const fetchConfig = async () => {
      if (!gameId) { setLoading(false); return; }
      try {
        const res = await fetch(`http://localhost:8081/api/game-questions/${gameId}`);
        const data = await res.json();
        
        // 🟢 Fetch Schedule
        if (auth.currentUser) {
            const resG = await fetch(`http://localhost:8081/api/student-games/${auth.currentUser.uid}`);
            const allGames = await resG.json();
            const currentGame = allGames.find(g => g.game_id === parseInt(gameId));
            if (currentGame && currentGame.time_limit > 0) {
                timeLimitR.current = currentGame.time_limit;
            }
        }

        if (data && data.length > 0) {
            const mappedQs = data.map(q => ({
                id: q.id || q.question_id,
                prompt: q.question_text,
                choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
                correctAnswer: q[`choice_${['a','b','c','d'][parseInt(q.correct_answer)]}`] || q.choice_a
            }));
            setQuestions(mappedQs);
        }
      } catch(e) { 
          console.error("Error fetching config:", e); 
      } finally {
          setLoading(false);
      }
    };
    fetchConfig();
  }, [gameId]);

  const triggerSave = async (finalScore) => {
      if (isSavingRef.current || !auth.currentUser || !gameId) return;
      isSavingRef.current = true;

      try {
          await fetch('http://localhost:8081/api/save-score', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  student_fid: auth.currentUser.uid,
                  game_id: gameId,
                  score: finalScore,
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
      } catch (err) {
          console.error("Save error:", err);
      }
  };

  useEffect(() => {
    const dn = (e) => {
      keysR.current[e.code] = true;
      const g = gs.current; const p = phys.current;
      if (!g.active || g.spawnProtect > 0) return;

      if (!g.inRing) {
        if (e.code === "ArrowLeft"  || e.code === "KeyA") { p.lane = Math.max(0, p.lane - 1); playSound("switch"); }
        if (e.code === "ArrowRight" || e.code === "KeyD") { p.lane = Math.min(2, p.lane + 1); playSound("switch"); }
      }
      
      if ((e.code === "Space" || e.code === "ArrowUp") && !g.inRing) {
        if (p.onGround) {
            p.vy = JUMP_VEL; 
            p.onGround = false; 
            p.doubleJumped = false;
            playSound("jump");
        } else if (!p.doubleJumped) {
            p.vy = JUMP_VEL * 0.85; 
            p.doubleJumped = true;
            playSound("jump");
            spawnParticles(p.bx, p.by - BALL_RADIUS, p.bz, 0xffffff, 8); 
            spawnPop("DOUBLE JUMP!", p.bx, p.by + 2, p.bz, true);
        }
        e.preventDefault();
      }
      if (["Space","ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.code)) e.preventDefault();
    };
    const up = (e) => { keysR.current[e.code] = false; };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup",   up);
    return () => { window.removeEventListener("keydown",dn); window.removeEventListener("keyup",up); };
  }, [spawnParticles]);

  useEffect(() => {
    let id;
    const loop = (now) => {
      id = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTR.current) / 1000, 0.05);
      lastTR.current = now;
      const g = gs.current;

      if (bgmGameR.current && screen === "game" && !g.finished) {
          const targetRate = g.inRing ? 0.5 : 1.0;  
          const targetVol  = g.inRing ? 0.15 : 0.4; 
          bgmGameR.current.playbackRate += (targetRate - bgmGameR.current.playbackRate) * 0.1;
          bgmGameR.current.volume += (targetVol - bgmGameR.current.volume) * 0.1;
      }

      if (g.active) {
        tickPhysics(dt);
        tickCamera();
        applyShake();
        tickTimer(dt);
        tickWorld(dt, g.inRing);

        const w = WORLDS[g.level - 1];
        setHud({
          score: g.score, lives: g.lives, coins: g.coins, combo: g.combo,
          timerSec: Math.max(0, g.timerSec),
          worldName: w.name, worldColor: w.color, worldEmoji: w.emoji
        });
      } else if (["menu","worlds"].includes(screen) && hamR.current.ballGroup) {
        hamR.current.ballGroup.rotation.y += 0.007;
        hamR.current.ballGroup.position.y = Math.sin(now * 0.0012) * 0.25;
      }

      if (T.current.renderer && T.current.scene && T.current.camera)
        T.current.renderer.render(T.current.scene, T.current.camera);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [screen]);

  function tickPhysics(dt) {
    const g = gs.current; const p = phys.current;
    const tr = trackR.current; const h = hamR.current;
    if (!g.active) return;

    if (g.spawnProtect > 0) {
      g.spawnProtect -= dt;
      p.bx = g.lastCheckpointX || 0;
      p.by = BALL_RADIUS + 0.5; 
      p.bz = g.lastCheckpointZ || 0;
      p.vy = 0; p.onGround = true; p.doubleJumped = false;
      if (h.ballGroup) h.ballGroup.position.set(p.bx, p.by, p.bz);
      
      const cam = T.current.camera;
      if (cam && g.spawnProtect > 1.3) {
        cam.position.set(p.bx * 0.22, p.by + CAM_UP, p.bz + CAM_DIST);
        cam.lookAt(p.bx * 0.22, p.by + 0.28, p.bz - 2.5);
      }
      return;
    }

    if (g.boost > 0) g.boost -= dt;
    const spd = g.inRing ? 0 : (g.boost > 0 ? BASE_SPEED * 1.8 * g.worldSpeed : BASE_SPEED * g.worldSpeed);

    const latTarget = LANE_TARGETS[p.lane];
    const latDiff   = latTarget - p.bx;
    const lerpRate  = g.inRing ? 0 : 0.12;
    p.bx += latDiff * lerpRate;

    p.bz -= spd;
    
    if (!g.inRing) {
        p.vy += GRAVITY;
        p.by += p.vy;
    }
    
    p.onGround = false;

    for (const c of (tr.crates || [])) {
        if (Math.abs(p.bz - c.z) < c.size/2 + BALL_RADIUS * 0.8 &&
            Math.abs(p.bx - c.x) < c.size/2 + BALL_RADIUS * 0.8 &&
            p.by - BALL_RADIUS < c.y + c.size/2) {
            
            g.lives -= 1;
            if (g.lives <= 0) {
                g.active = false;
                setTimeout(() => finishGame(false), 700);
                return;
            }
            
            p.by = BALL_RADIUS + 0.5; 
            p.bz = g.lastCheckpointZ || 0;
            p.bx = g.lastCheckpointX || 0; 
            p.vy = 0; p.lane = 1; p.onGround = true; p.doubleJumped = false;
            
            g.shakeAmt = 15;
            g.spawnProtect = 1.5; 
            spawnPop("💥 CRASHED! -1 LIFE", p.bx, p.by + 1.5, p.bz);
            playSound("wrong"); 
            break;
        }
    }

    for (const ramp of (tr.ramps || [])) {
      const inX = Math.abs(p.bx - ramp.x) < ramp.w / 2 + BALL_RADIUS * 0.7;
      const inZ = p.bz > ramp.zStart - BALL_RADIUS * 0.7 && p.bz < ramp.zEnd + BALL_RADIUS * 0.7;
      if (inX && inZ) {
        const t = (p.bz - ramp.zStart) / (ramp.zEnd - ramp.zStart);
        const rampY = ramp.yStart + (ramp.yEnd - ramp.yStart) * Math.max(0, Math.min(1, t));
        const bot = p.by - BALL_RADIUS;
        if (bot < rampY + 0.15 && bot > rampY - 1.5 && p.vy <= 0.04) {
          p.by = rampY + BALL_RADIUS;
          p.vy = 0; p.onGround = true; p.doubleJumped = false;
        }
        break;
      }
    }

    for (const pl of tr.platforms) {
        const mx = pl.mesh ? pl.mesh.position.x : pl.x;
        const mz = pl.mesh ? pl.mesh.position.z : pl.z;
        const my = pl.y;
        const inX = Math.abs(p.bx - mx) < pl.w / 2 + BALL_RADIUS * 0.7;
        const inZ = Math.abs(p.bz - mz) < pl.d / 2 + BALL_RADIUS * 0.7;
        const bot = p.by - BALL_RADIUS;
        if (inX && inZ && bot < my + 0.14 && bot > my - 2.2 && p.vy <= 0.04) {
          p.by = my + BALL_RADIUS;
          p.vy = 0; p.onGround = true; p.doubleJumped = false; break;
        }
    }

    for (const wall of (tr.safetyWalls || [])) {
       const inZ = Math.abs(p.bz - wall.z) < wall.d / 2 + BALL_RADIUS;
       const inY = Math.abs(p.by - wall.y) < wall.h / 2 + BALL_RADIUS;
       if (inZ && inY) {
         const dx = wall.x - p.bx;
         if (Math.abs(dx) < wall.w / 2 + BALL_RADIUS + 0.35) {
           const sign = p.bx < wall.x ? -1 : 1;
           p.bx = wall.x + sign * (wall.w / 2 + BALL_RADIUS + 0.12);
         }
       }
    }

    for (const cp of (tr.checkpoints || [])) {
      if (!cp.hit && Math.abs(p.bz - cp.z) < 2.6 && Math.abs(p.bx - cp.x) < cp.w / 2 + 0.5) {
        cp.hit = true;
        g.lastCheckpointZ = cp.z;
        g.lastCheckpointX = cp.x;
        cp.ring.material.color.setHex(0x4ade80);
        cp.ring.material.emissive.setHex(0x4ade80);
        cp.ring.material.emissiveIntensity = 5;
        playSound("checkpoint");
      }
    }

    if (p.by < -6 && !g.finished) {
      g.lives -= 1;
      
      if (g.lives <= 0) {
          g.active = false;
          setTimeout(() => finishGame(false), 700);
          return;
      }
      
      p.by = BALL_RADIUS + 0.5; 
      p.bz = g.lastCheckpointZ || 0;
      p.bx = g.lastCheckpointX || 0; 
      p.vy = 0; p.lane = 1; p.onGround = true; p.doubleJumped = false;
      
      g.shakeAmt = 10;
      g.spawnProtect = 1.5; 
      spawnPop("⚠️ -1 LIFE", p.bx, p.by + 1.5, p.bz);
      playSound("wrong"); 
    }

    for (const s of (tr.seeds || [])) {
      if (!s.collected) {
        const dx = p.bx - s.x, dy = p.by - s.y, dz = p.bz - s.z;
        if (dx*dx + dy*dy + dz*dz < 2.0) { 
          s.collected = true; s.mesh.visible = false;
          g.coins = (g.coins || 0) + 1;
          playSound("coin");
          
          if (g.coins >= 10) {
              g.lives = Math.min(5, g.lives + 1); 
              g.coins = 0;
              spawnPop("1-UP! +1 LIFE", s.x, s.y + 1.5, s.z, true);
          } else {
              spawnPop("+1 COIN", s.x, s.y + 1, s.z);
          }
          
          spawnParticles(s.x, s.y, s.z, 0xffd700, 6);
        }
      }
    }

    for (const dp of (tr.dashPads || [])) {
       if (Math.abs(p.bz - dp.z) < 1.5 && Math.abs(p.bx - dp.x) < 1.0 && p.onGround) {
          if ((g.boost || 0) <= 0) {
              g.boost = 1.5; 
              playSound("switch");
              spawnParticles(p.bx, p.by, p.bz, 0xf97316, 12);
          }
       }
    }

    if (!g.inRing) {
      for (const qr of tr.questionRings) {
        if (qr.answered) continue;
        const dist = Math.sqrt(Math.pow(p.bx - qr.x, 2) + Math.pow(p.bz - qr.z, 2));
        if (dist < RING_TRIGGER_R) { enterRing(qr); break; }
      }
    }

    for (const gate of tr.gates) {
      if (!gate.open && Math.abs(p.bz - gate.z) < 1.9 && Math.abs(p.bx) < (gate.gateW || LANE_W * 3) / 2 + 0.5) {
        p.bz = gate.z + 1.9; p.vy = 0; 
        if (pendingGatesR.current.includes(gate.idx)) {
          pendingGatesR.current = pendingGatesR.current.filter(i => i !== gate.idx);
          openGate(gate); playSound("gate_open");
        } else { g.shakeAmt = 5; }
        break;
      }
    }

    if (p.bz <= tr.finishZ + 1 && !g.finished) { 
        g.finished = true; 
        
        if (bgmGameR.current) bgmGameR.current.pause(); 

        if (victoryAudioR.current) victoryAudioR.current.play().catch(()=>{});
        if (yeyAudioR.current) yeyAudioR.current.play().catch(()=>{});
        
        setShowConfetti(true); 
        fireConfetti(p.bx, p.by + 2, p.bz);
        spawnPop("🏆 FINISH!", p.bx, p.by + 2, p.bz, true);

        setTimeout(() => {
            setShowConfetti(false);
            finishGame(true);
        }, 3000);
    }

    if (h.ballGroup) {
      h.ballGroup.position.set(p.bx, p.by, p.bz);
      animHamster(dt, spd, latDiff, g);
    }
  }

  function enterRing(qr) {
    const g = gs.current;
    
    if (questionIndexR.current >= questions.length) {
        const nextGate = trackR.current.gates.find(gt => !gt.open);
        if (nextGate) { openGate(nextGate); playSound("gate_open"); }
        return;
    }

    const currentQ = questions[questionIndexR.current];
    
    g.inRing = true; 
    g.ringIdx = qr.idx;
    qr.active = true;
    playSound("ring_enter");

    setPromptData({
      id: currentQ.id,
      word: currentQ.prompt,
      options: currentQ.choices,
      correct: currentQ.correctAnswer
    });
  }

  function tickCamera() {
    const p = phys.current; const cam = T.current.camera; if (!cam) return;
    const g = gs.current;
    const camDistTarget = g.inRing ? CAM_DIST * 0.8 : CAM_DIST;
    const camUpTarget   = g.inRing ? CAM_UP  * 0.8  : CAM_UP;
    const lerpR = g.inRing ? 0.06 : 0.09;
    cam.position.x += (p.bx * 0.22 - cam.position.x) * lerpR;
    cam.position.y += (p.by + camUpTarget - cam.position.y) * (lerpR * 0.8);
    cam.position.z += (p.bz + camDistTarget - cam.position.z) * lerpR;
    cam.lookAt(p.bx * 0.22, p.by + 0.28, p.bz - 2.5);
  }

  function applyShake() {
    const g = gs.current; const cam = T.current.camera;
    if (!cam || g.shakeAmt <= 0) return;
    cam.position.x += (Math.random() - 0.5) * g.shakeAmt * 0.011;
    cam.position.y += (Math.random() - 0.5) * g.shakeAmt * 0.011;
    g.shakeAmt *= 0.75;
    if (g.shakeAmt < 0.06) g.shakeAmt = 0;
  }

  function tickTimer(dt) {
    const g = gs.current;
    if (!g.active || g.spawnProtect > 0) return;
    const rate = g.inRing || g.finished ? 0 : 1.0; 
    
    // 🟢 NEW: Check actual time limit
    if (timeLimitR.current > 0) {
        g.timerSec -= dt * rate;
        if (g.timerSec <= 0) {
            g.timerSec = 0; g.active = false;
            setShowTimeUp(true); // Trigger TIME'S UP modal
            finishGame(false);
        }
    }
  }

  const handleWordSubmit = useCallback((selectedWord) => {
    const g = gs.current;
    
    if (!g.active || !g.inRing || isAnsweringRef.current) return;
    isAnsweringRef.current = true; 

    const isCorrect = selectedWord === promptData.correct;

    if (auth.currentUser && gameId && promptData.id && !answeredQsR.current.has(promptData.id)) {
        answerLog.current.push({
            student_fid: auth.currentUser.uid,
            game_id: parseInt(gameId),
            question_id: promptData.id,
            is_correct: isCorrect ? 1 : 0
        });
        answeredQsR.current.add(promptData.id);
    }

    if (isCorrect) {
      g.score += 1; 
      g.combo++;
      spawnParticles(phys.current.bx, phys.current.by, phys.current.bz, 0x4ade80, 22);
      spawnPop(`+1 POINT!`, phys.current.bx, phys.current.by + 1.9, phys.current.bz, true);
      playSound("correct");
    } else {
      g.combo = 0;
      g.lives -= 1;
      g.shakeAmt = 5;   

      setWordFlash("wrong");
      spawnPop(`✗ WRONG -1 LIFE`, phys.current.bx, phys.current.by + 1.5, phys.current.bz);
      playSound("wrong");

      if (g.lives <= 0) {
        g.active = false;
        setTimeout(() => finishGame(false), 700);
        return;
      }
    }

    const qr = trackR.current.questionRings[g.ringIdx];
    if (qr) { qr.answered = true; qr.active = false; }

    const nextGate = trackR.current.gates.find(gt => !gt.open && !pendingGatesR.current.includes(gt.idx));
    if (nextGate) { pendingGatesR.current.push(nextGate.idx); openGate(nextGate); playSound("gate_open"); }
    
    questionIndexR.current += 1; 

    setTimeout(() => {
        setWordFlash(null);
        setPromptData(null);
        g.inRing = false; 
        g.ringIdx = -1;
        isAnsweringRef.current = false; 
    }, isCorrect ? 0 : 500); 

  }, [openGate, spawnParticles, promptData, questions.length]);

  function finishGame(won) {
    const g = gs.current;
    g.active = false;
    setEndData({ score: g.score, maxCombo: g.maxCombo, level: g.level });
    setScreen("gameover");
    setPromptData(null);
    triggerSave(g.score);
  }

  function spawnPop(text, wx, wy, wz, isWord = false) {
    const cam = T.current.camera; if (!cam) return;
    const v = new THREE.Vector3(wx, wy, wz); v.project(cam);
    const sx = (v.x * 0.5 + 0.5) * innerWidth;
    const sy = (-v.y * 0.5 + 0.5) * innerHeight;
    const id = Math.random();
    setScorePops(prev => [...prev, { id, text, sx, sy, isWord }]);
    setTimeout(() => setScorePops(p => p.filter(s => s.id !== id)), 1200);
  }

  function startLevel(lvlId) {
    if (questions.length === 0) {
        alert("Teacher hasn't added questions yet!");
        navigate('/student-menu');
        return;
    }

    const g = gs.current; const p = phys.current;
    const w = WORLDS[lvlId - 1];

    setScoreSaved(false);
    setShowConfetti(false);
    setShowTimeUp(false);
    isSavingRef.current = false;
    isAnsweringRef.current = false; 
    answerLog.current = [];
    answeredQsR.current.clear();
    questionIndexR.current = 0;

    Object.assign(g, {
      active: false, over: false, level: lvlId, finished: false,
      score: 0, lives: 3, coins: 0, combo: 0,
      timerSec: timeLimitR.current > 0 ? timeLimitR.current * 60 : 999999, // 🟢 Initialize proper time
      spawnProtect: 3.2, shakeAmt: 0,
      lastCheckpointZ: 0, lastCheckpointX: 0,
      worldSpeed: w.speed, skinId: 0,
      inRing: false, ringIdx: -1, resumeTimer: 0
    });
    Object.assign(p, { bx: 0, by: BALL_RADIUS, bz: 0, vy: 0, lane: 1, onGround: true, doubleJumped: false });

    pendingGatesR.current = [];
    setPromptData(null); setWordFlash(null);
    setScorePops([]); 

    buildLevel(lvlId, 0, { category: "all" }, questions.length);
    buildHamster(0);
    if (hamR.current.ballGroup) hamR.current.ballGroup.position.set(0, BALL_RADIUS, 0);

    const cam = T.current.camera;
    if (cam) { cam.position.set(0, BALL_RADIUS + CAM_UP, CAM_DIST); cam.lookAt(0, BALL_RADIUS + 0.3, -2); }

    setCountdown(3); setScreen("countdown");
    let c = 3;
    const tick = () => {
      if (c > 0) { setCountdown(c); c--; setTimeout(tick, 950); }
      else { setCountdown(0); setTimeout(() => { setScreen("game"); g.active = true; }, 820); }
    };
    tick();
  }

  const isGame = screen === "game";
  const world  = WORLDS[(gs.current.level || 1) - 1];

  return (
    <div style={{ position:"fixed", inset:0, background:"#050c14", overflow:"hidden", userSelect:"none", fontFamily:"'Nunito',sans-serif", zIndex: 100 }}>
      <GlobalStyles />
      <canvas ref={canvasRef} style={{ position:"fixed", top:0, left:0, display:"block" }} />

      {showConfetti && <Confetti />}

      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:800 }}>
        {scorePops.map(pop => (
          <ScorePop key={pop.id} {...pop} onDone={() => setScorePops(p => p.filter(s => s.id !== pop.id))} />
        ))}
      </div>

      {screen === "menu" && (
        <MenuScreen 
           onPlay={() => startLevel(1)} 
           onExit={() => navigate('/student-menu')} 
           loading={loading}
           disabled={questions.length === 0}
        />
      )}
      
      {screen === "countdown" && (
        <CountdownScreen count={countdown} world={world} />
      )}

      {screen === "gameover" && endData && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10, 15, 30, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
             
             {/* 🟢 DYNAMIC TIMEUP OR FINISH TITLE */}
             {showTimeUp ? (
                 <h1 style={{ color: '#ff4c4c', fontSize: '3.5rem', fontFamily: "'Fredoka One', sans-serif", textShadow: '0 0 20px rgba(255, 76, 76, 0.5)', marginBottom: '10px' }}>
                    TIME'S UP!
                 </h1>
             ) : (
                 <h1 style={{ color: '#4dff91', fontSize: '3.5rem', fontFamily: "'Fredoka One', sans-serif", textShadow: '0 0 20px rgba(77,255,145,0.5)', marginBottom: '10px' }}>
                    RACE FINISHED!
                 </h1>
             )}
             
             <div style={{ background: 'rgba(0,0,0,0.6)', padding: '20px 40px', borderRadius: '12px', border: '1px solid #30363d', textAlign: 'center', marginBottom: '30px' }}>
                 <h2 style={{ color: '#8b949e', fontSize: '1.2rem', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Final Score</h2>
                 <div style={{ color: '#ffd700', fontSize: '4rem', fontWeight: 'bold' }}>{endData.score} <span style={{fontSize: '2rem', color: '#666'}}>/ {questions.length}</span></div>
             </div>

             <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px 30px', borderRadius: '8px', marginBottom: '40px', border: scoreSaved ? '2px solid #48bb78' : '2px dashed #aaa' }}>
                 <p style={{color: scoreSaved ? '#48bb78' : '#fbd38d', fontSize: '1.1rem', margin: 0, fontWeight: 'bold'}}>
                     {scoreSaved ? '✅ SCORE SAVED TO GRADEBOOK' : '⏳ Saving results...'}
                 </p>
             </div>

             <button 
                onClick={() => navigate('/student-menu')} 
                style={{ 
                    background: 'transparent', color: '#e53e3e', border: '2px solid #e53e3e', 
                    padding: '15px 40px', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' 
                }}
                onMouseOver={(e) => { e.target.style.background = '#e53e3e'; e.target.style.color = '#fff'; }}
                onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#e53e3e'; }}
             >
               EXIT TO ARCADE
             </button>
        </div>
      )}

      {isGame && !gs.current.finished && (
          <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, display: 'flex', gap: '20px' }}>
              
              {/* 🟢 NEW CUSTOM RENDERED TIMER TO AVOID INFINITY OR NAN LOGIC ERRORS */}
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '12px', border: '2px solid #0ac8f0' }}>
                  <div style={{ color: '#0ac8f0', fontSize: '0.8rem', fontWeight: 'bold' }}>TIME</div>
                  <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold' }}>
                      {timeLimitR.current > 0 ? `${Math.floor(hud.timerSec / 60)}:${(Math.floor(hud.timerSec) % 60).toString().padStart(2, '0')}` : '∞'}
                  </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '12px', border: '2px solid #555' }}>
                  <div style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold' }}>LIVES</div>
                  <div style={{ fontSize: '1.5rem' }}>{"❤️".repeat(hud.lives)}{"🖤".repeat(Math.max(0, 3 - hud.lives))}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '12px', border: '2px solid #ffd700' }}>
                  <div style={{ color: '#ffd700', fontSize: '0.8rem', fontWeight: 'bold' }}>COINS</div>
                  <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold' }}>💰 {hud.coins} <span style={{fontSize: '1rem', color: '#aaa'}}>/ 10</span></div>
              </div>
          </div>
      )}

      {isGame && promptData && (
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.85)', padding: '30px', borderRadius: '16px', border: `2px solid ${world?.color}`, zIndex: 500, textAlign: 'center', width: '80%', maxWidth: '600px' }}>
            <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '20px' }}>{promptData.word}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {promptData.options.map((opt, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleWordSubmit(opt)} 
                        disabled={isAnsweringRef.current || wordFlash === 'wrong'}
                        style={{ 
                            padding: '15px', fontSize: '1.2rem', borderRadius: '8px', 
                            background: wordFlash === 'wrong' ? 'rgba(255,0,0,0.2)' : 'rgba(255,255,255,0.1)', 
                            color: '#fff', border: '1px solid #555', cursor: 'pointer' 
                        }}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}