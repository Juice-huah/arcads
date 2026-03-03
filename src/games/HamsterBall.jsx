// ─── src/games/HamsterBall.jsx ─────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from '../firebase';

// 🟢 FIXED IMPORTS: Pointing to the hamsterball folder!
import {
  BALL_RADIUS, GRAVITY, JUMP_VEL, BASE_SPEED, SLOW_MO_SPEED, LANE_W, CAM_DIST, CAM_UP,
  WORLDS, SKINS, STREAK_BOOSTS,
  validateChainWord, getTargetLetter, playSound, generateMultipleChoice
} from "../hamsterball/gameData.js";
import { useGameEngine } from "../hamsterball/GameEngine.jsx";
import {
  GlobalStyles, MenuScreen, WorldScreen, SkinScreen, CountdownScreen,
  GameHUD, WordPromptOverlay, EndScreen,
  ScorePop, Confetti, Dpad, StreakAnnouncement, SkinUnlockBanner,
} from "../hamsterball/GameUI.jsx";

const LANE_TARGETS = [-LANE_W, 0, LANE_W];
const RING_TRIGGER_R = 3.0;
const CORRECT_RESUME_DELAY = 0.9;
const SLOWMO_MULT = 0.15;

export default function HamsterBall() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [scoreSaved, setScoreSaved] = useState(false);

  const canvasRef = useRef();
  const {
    T, trackR, hamR,
    buildLevel, buildHamster, animHamster,
    openGate, tickWorld, spawnParticles,
  } = useGameEngine(canvasRef);

  const phys = useRef({
    bx: 0, by: BALL_RADIUS, bz: 0,
    vy: 0, lane: 1, onGround: false,
    doubleJumped: false, 
  });

  const gs = useRef({
    active: false, over: false, level: 1,
    score: 0, lives: 3, hp: 100,
    combo: 0, maxCombo: 0,
    timerSec: 120,
    totalWords: 0, correctWords: 0, chainLen: 0,
    spawnProtect: 3, shakeAmt: 0, blinkTimer: 2.5, dizzy: 0,
    boost: 0, double: 0,
    lastCheckpointZ: 0, lastCheckpointX: 0,
    worldSpeed: 1, streak: 0, maxStreak: 0, skinId: 0,
    inRing: false, ringIdx: -1,
    slowMoTimer: 0, resumeTimer: 0,
    ringAnswered: false, currentPromptWord: null,
  });

  const chainR        = useRef([]);
  const usedR         = useRef(new Set());
  const pendingGatesR = useRef([]);
  const keysR         = useRef({});
  const lastTR        = useRef(performance.now());
  const cfgR          = useRef({
    minLength: 2, gameTime: 120, customWords: [], category: "all",
    startingWords: ["apple", "river", "sun", "tree", "egg"],
    showHints: true, wrongPenalty: 6,
  });

  const [screen,         setScreen]         = useState("menu");
  const [hud,            setHud]            = useState({ score:0, lives:3, hp:100, combo:0, timerSec:120, worldName:"", worldColor:"#4ade80", worldEmoji:"🌿", activePowerups:{}, streak:0, gameTime:120 });
  const [promptData,     setPromptData]     = useState(null);   
  const [wordFlash,      setWordFlash]      = useState(null);   
  const [countdown,      setCountdown]      = useState(3);
  const [countdownW,     setCountdownW]     = useState(null);
  const [endData,        setEndData]        = useState(null);
  const [endWon,         setEndWon]         = useState(false);
  const [scorePops,      setScorePops]      = useState([]);
  const [confetti,       setConfetti]       = useState(false);
  const [worldScores,    setWorldScores]    = useState({});
  const [selectedSkin,   setSelectedSkin]   = useState(0);
  const [bestStreak,     setBestStreak]     = useState(0);
  const [bestScore,      setBestScore]      = useState(0);
  const [teacherCfg,     setTeacherCfg]     = useState({
    minLength:2, gameTime:120, customWords:[], category:"all",
    startingWords:["apple","river","sun","tree","egg"],
    showHints:true, wrongPenalty:8,
  });
  const [streakBoost,    setStreakBoost]    = useState(null);
  const [streakBoostKey, setStreakBoostKey] = useState(0);
  const [skinUnlock,     setSkinUnlock]     = useState(null);
  const [skinUnlockKey,  setSkinUnlockKey]  = useState(0);
  const [unlockedSkins,  setUnlockedSkins]  = useState([0]);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!gameId) return;
      try {
        const res = await fetch(`http://localhost:8081/api/game-questions/${gameId}`);
        const data = await res.json();
        if (data && data.length > 0) {
          const configObj = JSON.parse(data[0].question_text);
          setTeacherCfg(configObj);
          cfgR.current = configObj;
        }
      } catch(e) { console.error("Error fetching config:", e); }
    };
    fetchConfig();
  }, [gameId]);

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

      if (g.active) {
        tickPhysics(dt);
        tickCamera();
        applyShake();
        tickPowerups(dt);
        tickTimer(dt);
        tickWorld(dt, g.inRing);

        const w = WORLDS[g.level - 1];
        setHud({
          score: g.score, lives: g.lives, hp: g.hp, combo: g.combo,
          timerSec: Math.max(0, g.timerSec),
          worldName: w.name, worldColor: w.color, worldEmoji: w.emoji,
          activePowerups: { boost: g.boost, double: g.double },
          streak: g.streak, gameTime: cfgR.current.gameTime,
        });
      } else if (["menu","worlds","skins"].includes(screen) && hamR.current.ballGroup) {
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
      p.by = BALL_RADIUS;
      p.bz = g.lastCheckpointZ || 0;
      p.vy = 0; p.onGround = true; p.doubleJumped = false;
      if (h.ballGroup) h.ballGroup.position.set(p.bx, p.by, p.bz);
      const cam = T.current.camera;
      if (cam) {
        cam.position.x += (p.bx * 0.22 - cam.position.x) * 0.18;
        cam.position.y += (p.by + CAM_UP - cam.position.y) * 0.18;
        cam.position.z += (p.bz + CAM_DIST - cam.position.z) * 0.18;
        cam.lookAt(p.bx * 0.22, p.by + 0.3, p.bz - 2);
      }
      return;
    }

    if (g.resumeTimer > 0) {
      g.resumeTimer -= dt;
      if (g.resumeTimer <= 0) {
        g.resumeTimer = 0;
        g.inRing = false;
        g.ringIdx = -1;
        g.ringAnswered = false;
        setPromptData(null);
      }
    }

    const baseSpd = g.boost > 0 ? BASE_SPEED * 1.8 : BASE_SPEED * g.worldSpeed;
    const spd = g.inRing ? SLOW_MO_SPEED : baseSpd;

    const latTarget = LANE_TARGETS[p.lane];
    const latDiff   = latTarget - p.bx;
    const lerpRate  = g.inRing ? 0.04 : 0.12;
    p.bx += latDiff * lerpRate;

    p.bz -= spd;
    p.vy += GRAVITY;
    p.by += p.vy;
    p.onGround = false;

    if (g.boost > 0 && Math.random() < 0.2 && p.onGround) {
        spawnParticles(p.bx, p.by - BALL_RADIUS + 0.2, p.bz + 0.5, 0xffffff, 1);
    }

    // CHECK SEED COLLISIONS
    tr.seeds.forEach(s => {
      if (!s.collected) {
        const dx = p.bx - s.x;
        const dy = p.by - s.y;
        const dz = p.bz - s.z;
        if (dx*dx + dy*dy + dz*dz < 2.0) { 
          s.collected = true;
          s.mesh.visible = false;
          g.score += 10;
          g.hp = Math.min(100, g.hp + 1);
          playSound("coin");
          spawnPop("+10", s.x, s.y + 1, s.z);
          spawnParticles(s.x, s.y, s.z, 0xffd700, 6);
        }
      }
    });

    // CHECK DASH PAD COLLISIONS
    tr.dashPads.forEach(dp => {
      if (Math.abs(p.bz - dp.z) < 1.5 && Math.abs(p.bx - dp.x) < 1.0 && p.onGround) {
         if (g.boost < 1.0) {
             g.boost = 1.5; 
             playSound("switch");
             spawnParticles(p.bx, p.by, p.bz, 0xf97316, 12);
         }
      }
    });

    for (const ramp of (tr.ramps || [])) {
      const inX = Math.abs(p.bx - ramp.x) < ramp.w / 2 + BALL_RADIUS * 0.7;
      const inZ = p.bz > ramp.zStart - BALL_RADIUS * 0.7 && p.bz < ramp.zEnd + BALL_RADIUS * 0.7;
      if (inX && inZ) {
        const t = (p.bz - ramp.zStart) / (ramp.zEnd - ramp.zStart);
        const rampY = ramp.yStart + (ramp.yEnd - ramp.yStart) * Math.max(0, Math.min(1, t));
        const bot = p.by - BALL_RADIUS;
        if (bot < rampY + 0.15 && bot > rampY - 1.5 && p.vy <= 0.04) {
          p.by = rampY + BALL_RADIUS;
          p.vy = 0;
          p.onGround = true;
          p.doubleJumped = false;
        }
        break;
      }
    }

    for (let pass = 0; pass < 2; pass++) {
      const bot = p.by - BALL_RADIUS;
      for (const pl of tr.platforms) {
        const mx = pl.mesh ? pl.mesh.position.x : pl.x;
        const mz = pl.mesh ? pl.mesh.position.z : pl.z;
        const my = pl.y;
        const inX = Math.abs(p.bx - mx) < pl.w / 2 + BALL_RADIUS * 0.7;
        const inZ = Math.abs(p.bz - mz) < pl.d / 2 + BALL_RADIUS * 0.7;
        const inY = bot < my + 0.14 && bot > my - 2.2 && p.vy <= 0.04;
        if (inX && inZ && inY) {
          p.by = my + BALL_RADIUS;
          p.vy = 0;
          p.onGround = true;
          p.doubleJumped = false;
          break;
        }
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
          const diffs = LANE_TARGETS.map((lt, i) => ({ i, d: Math.abs(lt - p.bx) }));
          p.lane = diffs.sort((a, b) => a.d - b.d)[0].i;
        }
      }
    }

    if (p.by < -8) {
      p.by = BALL_RADIUS;
      p.bz = g.lastCheckpointZ || 0;
      p.bx = 0; p.vy = 0; p.lane = 1; p.doubleJumped = false;
      g.hp = Math.max(25, g.hp - 6);
      g.shakeAmt = 10;
      spawnPop("⚠️ Stay on the path!", p.bx, BALL_RADIUS + 1.5, p.bz);
    }

    if (!g.inRing) {
      for (const qr of tr.questionRings) {
        if (qr.answered) continue;
        const dx = p.bx - qr.x;
        const dz = p.bz - qr.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < RING_TRIGGER_R) {
          enterRing(qr);
          break;
        }
      }
    } else {
      const activeRing = tr.questionRings[g.ringIdx];
      if (activeRing && !g.ringAnswered) {
        const dx = p.bx - activeRing.x;
        const dz = p.bz - activeRing.z;
        if (dz < -(RING_TRIGGER_R * 2.0)) {
          exitRingUnanswered(activeRing);
        }
      }
    }

    for (const gate of tr.gates) {
      if (!gate.open && Math.abs(p.bz - gate.z) < 1.9 && Math.abs(p.bx) < (gate.gateW || LANE_W * 3) / 2 + 0.5) {
        p.bz = gate.z + 1.9;
        p.vy = 0;
        if (pendingGatesR.current.includes(gate.idx)) {
          pendingGatesR.current = pendingGatesR.current.filter(i => i !== gate.idx);
          openGate(gate);
          playSound("gate_open");
        } else {
          g.shakeAmt = 5;
        }
        break;
      }
    }

    for (const cp of tr.checkpoints) {
      if (!cp.hit && Math.abs(p.bz - cp.z) < 2.6 && Math.abs(p.bx - cp.x) < cp.w / 2 + 0.5) {
        cp.hit = true;
        g.lastCheckpointZ = cp.z - 2;
        g.lastCheckpointX = 0;
        cp.ring.material.color.setHex(0x4ade80);
        cp.ring.material.emissive.setHex(0x4ade80);
        cp.ring.material.emissiveIntensity = 5;
        playSound("checkpoint");
        spawnPop("✓ CHECKPOINT +200", p.bx, p.by + 1.5, p.bz);
        g.score += 200;
        g.timerSec = Math.min(g.timerSec + 8, cfgR.current.gameTime);
      }
    }

    if (p.bz <= tr.finishZ + 1) { triggerWin(); return; }

    if (h.ballGroup) {
      h.ballGroup.position.set(p.bx, p.by, p.bz);
      animHamster(dt, spd, latDiff, g);
    }
    if (g.dizzy > 0) g.dizzy -= dt;
  }

  function enterRing(qr) {
    const g = gs.current;
    g.inRing = true;
    g.ringIdx = qr.idx;
    g.ringAnswered = false;
    qr.active = true;
    playSound("ring_enter");

    const lastChainWord = chainR.current.slice(-1)[0] || null;
    const promptWord = lastChainWord || qr.word;
    g.currentPromptWord = promptWord;

    g.lastCheckpointZ = qr.z + 2;
    g.lastCheckpointX = 0;

    const tLetter = getTargetLetter(promptWord);
    const mc = generateMultipleChoice(tLetter, usedR.current, cfgR.current);

    setPromptData({
      word: promptWord,
      targetLetter: tLetter,
      ringWord: qr.word,
      options: mc.options,
      correct: mc.correct
    });
  }

  function exitRingUnanswered(qr) {
    const g = gs.current;
    g.inRing = false;
    g.ringIdx = -1;
    g.ringAnswered = false;
    qr.active = false;
    g.hp = Math.max(g.hp - 4, 10);
    setPromptData(null);
    playSound("ring_exit");
  }

  function tickCamera() {
    const p = phys.current; const cam = T.current.camera; if (!cam) return;
    const g = gs.current;
    const camDistTarget = g.inRing ? CAM_DIST * 1.22 : CAM_DIST;
    const camUpTarget   = g.inRing ? CAM_UP  * 1.15  : CAM_UP;
    const lerpR = g.inRing ? 0.06 : 0.09;
    const tx = p.bx * 0.22;
    const ty = p.by + camUpTarget;
    const tz = p.bz + camDistTarget;
    cam.position.x += (tx - cam.position.x) * lerpR;
    cam.position.y += (ty - cam.position.y) * (lerpR * 0.8);
    cam.position.z += (tz - cam.position.z) * lerpR;
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

  function tickPowerups(dt) {
    const g = gs.current;
    ["boost","double"].forEach(k => { if (g[k] > 0) g[k] -= dt; });
  }

  function tickTimer(dt) {
    const g = gs.current;
    if (!g.active || g.spawnProtect > 0) return;
    const rate = g.inRing ? 0.3 : 1.0;
    g.timerSec -= dt * rate;
    if (g.timerSec <= 0) {
      g.timerSec = 0; g.active = false;
      setTimeout(() => finishGame(false), 600);
    }
  }

  function checkStreakBoost(newStreak) {
    const g = gs.current;
    const match = STREAK_BOOSTS.find(b => b.streak === newStreak);
    if (!match) return;
    if (match.type === "speed" || match.type === "boost") g.boost  = match.dur || 5;
    if (match.type === "double") g.double = match.dur || 8;
    playSound("streak");
    setStreakBoost(match);
    setStreakBoostKey(k => k + 1);
    spawnPop(`${match.emoji} ${match.label}!`, phys.current.bx, phys.current.by + 2.2, phys.current.bz);
  }

  function checkSkinUnlock(newStreak) {
    const prevUnlocked = unlockedSkins;
    let newUnlock = null;
    const fresh = [...prevUnlocked];
    for (const skin of SKINS) {
      if (skin.streakUnlock > 0 && newStreak >= skin.streakUnlock && !fresh.includes(skin.id)) {
        fresh.push(skin.id);
        newUnlock = skin;
      }
    }
    if (newUnlock) {
      setUnlockedSkins(fresh);
      playSound("skin_unlock");
      setSkinUnlock(newUnlock);
      setSkinUnlockKey(k => k + 1);
    }
  }

  const handleWordSubmit = useCallback((typed) => {
    const g = gs.current;
    if (!g.active || !g.inRing) return;

    const lastWord = g.currentPromptWord;
    const result = validateChainWord(typed, lastWord, usedR.current, cfgR.current);
    g.totalWords++;

    if (result.ok) {
      const word = typed.trim().toLowerCase();
      chainR.current.push(word);
      usedR.current.add(word);
      g.chainLen = chainR.current.length;
      g.correctWords++;
      g.combo++;
      g.streak++;
      if (g.combo   > g.maxCombo)   g.maxCombo   = g.combo;
      if (g.streak  > g.maxStreak)  g.maxStreak  = g.streak;

      const mult = g.double > 0 ? 2 : 1;
      const pts  = (60 + g.combo * 15) * mult;
      g.score   += pts;
      g.timerSec = Math.min(g.timerSec + 5, cfgR.current.gameTime);
      if (g.combo >= 3) g.hp = Math.min(100, g.hp + 5);

      g.currentPromptWord = word;
      g.ringAnswered = true;

      const qr = trackR.current.questionRings[g.ringIdx];
      if (qr) { qr.answered = true; qr.active = false; }

      const nextGate = trackR.current.gates.find(gt => !gt.open && !pendingGatesR.current.includes(gt.idx));
      if (nextGate) { pendingGatesR.current.push(nextGate.idx); openGate(nextGate); playSound("gate_open"); }

      const col = g.streak >= 10 ? 0xef4444 : g.streak >= 6 ? 0x38bdf8 : g.streak >= 3 ? 0xf97316 : 0x4ade80;
      spawnParticles(phys.current.bx, phys.current.by, phys.current.bz, col, 22 + Math.min(g.streak, 12));

      setWordFlash("correct");
      setTimeout(() => {
        setWordFlash(null);
        g.resumeTimer = CORRECT_RESUME_DELAY;
      }, 700);

      spawnPop(`+${pts} "${word}"`, phys.current.bx, phys.current.by + 1.9, phys.current.bz, true);
      playSound("correct");

      checkStreakBoost(g.streak);
      checkSkinUnlock(g.streak);
      setBestStreak(b => Math.max(b, g.streak));

    } else {
      g.combo  = 0;
      g.streak = 0;
      const penalty = Math.min(cfgR.current.wrongPenalty || 6, 8);
      g.hp    -= penalty;
      if (g.hp < 0) g.hp = 0;
      g.shakeAmt = 5;   
      g.dizzy    = 0.4; 
      g.timerSec = Math.max(25, g.timerSec - 2); 

      setWordFlash("wrong");
      setTimeout(() => setWordFlash(null), 900);
      spawnPop(`✗ ${result.reason}`, phys.current.bx, phys.current.by + 1.5, phys.current.bz);
      playSound("wrong");

      if (g.hp <= 0) {
        g.hp = 35;
        if (!g._hpDepletions) g._hpDepletions = 0;
        g._hpDepletions++;
        if (g._hpDepletions >= 3) {
          g._hpDepletions = 0;
          g.lives--;
          if (g.lives <= 0) {
            g.lives  = 0;
            g.active = false;
            setTimeout(() => finishGame(false), 700);
            return;
          }
        }
        g.inRing = false;
        g.ringIdx = -1;
        setPromptData(null);
        const p = phys.current;
        p.bx = g.lastCheckpointX || 0;
        p.by = BALL_RADIUS;
        p.bz = g.lastCheckpointZ || 0;
        p.vy = 0; p.lane = 1; p.onGround = true; p.doubleJumped = false;
        g.hp = 50; g.spawnProtect = 1.8;
        spawnPop("⚠️ You got this — keep rolling!", p.bx, p.by + 1.8, p.bz);
        playSound("checkpoint");
      }
    }
  }, [openGate, spawnParticles, unlockedSkins]);

  function triggerWin() {
    const g = gs.current; if (g.over) return;
    g.over = true; g.active = false;
    const bonus = Math.floor(g.timerSec) * 8 + g.chainLen * 35 + g.maxCombo * 22;
    g.score += bonus;
    setWorldScores(prev => ({
      ...prev,
      [g.level]: {
        score:  Math.max(prev[g.level]?.score  || 0, g.score),
        streak: Math.max(prev[g.level]?.streak || 0, g.maxStreak),
      },
    }));
    setBestScore(b => Math.max(b, g.score));
    setConfetti(true);
    playSound("win");
    setTimeout(() => { setConfetti(false); finishGame(true); }, 1600);
  }

  function finishGame(won) {
    const g = gs.current;
    const acc = g.totalWords > 0 ? Math.round(g.correctWords / g.totalWords * 100) : 100;
    setEndData({ score: g.score, maxStreak: g.maxStreak, maxCombo: g.maxCombo, chainLen: g.chainLen, accuracy: acc, level: g.level });
    setEndWon(won);
    setScreen("gameover");
    setPromptData(null);

    if (won && !scoreSaved && auth.currentUser && gameId) {
        fetch('http://localhost:8081/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_fid: auth.currentUser.uid,
                game_id: gameId,
                score: g.score,
                time_taken: Math.max(0, cfgR.current.gameTime - Math.floor(g.timerSec))
            })
        })
        .then(() => setScoreSaved(true))
        .catch(e => console.error("Error saving score:", e));
    }
  }

  function spawnPop(text, wx, wy, wz, isWord = false) {
    const cam = T.current.camera; if (!cam) return;
    const v = new THREE.Vector3(wx, wy, wz); v.project(cam);
    const sx = (v.x * 0.5 + 0.5) * innerWidth;
    const sy = (-v.y * 0.5 + 0.5) * innerHeight;
    const id = Math.random();
    setScorePops(prev => [...prev, { id, text, sx, sy, isWord }]);
  }

  function startLevel(lvlId) {
    const g = gs.current; const p = phys.current;
    const w = WORLDS[lvlId - 1];
    cfgR.current = { ...teacherCfg };

    setScoreSaved(false);

    Object.assign(g, {
      active: false, over: false, level: lvlId,
      score: 0, lives: 3, hp: 100,
      combo: 0, maxCombo: 0,
      timerSec: cfgR.current.gameTime,
      totalWords: 0, correctWords: 0, chainLen: 0,
      spawnProtect: 3.2, shakeAmt: 0, blinkTimer: 2.5, dizzy: 0,
      boost: 0, double: 0,
      lastCheckpointZ: 0, lastCheckpointX: 0,
      worldSpeed: w.speed,
      streak: 0, maxStreak: 0, skinId: selectedSkin,
      inRing: false, ringIdx: -1,
      slowMoTimer: 0, resumeTimer: 0,
      ringAnswered: false,
      currentPromptWord: null,
    });
    Object.assign(p, { bx: 0, by: BALL_RADIUS, bz: 0, vy: 0, lane: 1, onGround: true, doubleJumped: false });

    chainR.current   = [];
    usedR.current    = new Set();
    pendingGatesR.current = [];

    setPromptData(null); setWordFlash(null);
    setScorePops([]); setConfetti(false);
    setStreakBoost(null); setSkinUnlock(null);

    buildLevel(lvlId, selectedSkin, cfgR.current);
    buildHamster(selectedSkin);
    if (hamR.current.ballGroup) hamR.current.ballGroup.position.set(0, BALL_RADIUS, 0);

    const cam = T.current.camera;
    if (cam) { cam.position.set(0, BALL_RADIUS + CAM_UP, CAM_DIST); cam.lookAt(0, BALL_RADIUS + 0.3, -2); }

    setCountdownW(w); setCountdown(3); setScreen("countdown");
    let c = 3;
    const tick = () => {
      if (c > 0) { setCountdown(c); c--; setTimeout(tick, 950); }
      else { setCountdown(0); setTimeout(() => { setScreen("game"); g.active = true; startBGM(lvlId); }, 820); }
    };
    tick();
  }

  const bgmTimers = useRef([]);
  function startBGM(wid) {
    bgmTimers.current.forEach(clearTimeout);
    bgmTimers.current = [];
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (!ctx) return;
      const scales = [
        [261, 294, 330, 392, 440],
        [277, 311, 370, 415, 466],
        [220, 247, 261, 294, 330],
        [261, 294, 349, 392, 440],
        [277, 311, 370, 415, 523],
      ];
      const sc = scales[(wid - 1) % scales.length];
      const master = ctx.createGain(); master.gain.value = 0.018; master.connect(ctx.destination);
      for (let i = 0; i < 30; i++) {
        const t = setTimeout(() => {
          try {
            const o = ctx.createOscillator(); const g2 = ctx.createGain();
            o.type = "sine";
            o.frequency.value = sc[Math.floor(Math.random() * sc.length)] * (Math.random() < 0.22 ? 2 : 1);
            g2.gain.setValueAtTime(0, ctx.currentTime);
            g2.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.1);
            g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            o.connect(g2); g2.connect(master);
            o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.65);
          } catch {}
        }, i * 400);
        bgmTimers.current.push(t);
      }
    } catch {}
  }

  const handleJump = useCallback(() => {
    const p = phys.current; const g = gs.current;
    if (!g.active || g.spawnProtect > 0 || g.inRing) return;
    if (p.onGround) {
        p.vy = JUMP_VEL; p.onGround = false; p.doubleJumped = false; playSound("jump");
    } else if (!p.doubleJumped) {
        p.vy = JUMP_VEL * 0.85; p.doubleJumped = true; playSound("jump");
        spawnParticles(p.bx, p.by - BALL_RADIUS, p.bz, 0xffffff, 8);
        spawnPop("DOUBLE JUMP!", p.bx, p.by + 2, p.bz, true);
    }
  }, [spawnParticles]);

  const isGame = screen === "game";
  const world  = WORLDS[(gs.current.level || 1) - 1];

  return (
    <div style={{ position:"fixed", inset:0, background:"#050c14", overflow:"hidden", userSelect:"none", fontFamily:"'Nunito',sans-serif", zIndex: 100 }}>
      <GlobalStyles />
      <canvas ref={canvasRef} style={{ position:"fixed", top:0, left:0, display:"block" }} />

      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:800 }}>
        {scorePops.map(pop => (
          <ScorePop key={pop.id} {...pop}
            onDone={() => setScorePops(prev => prev.filter(s => s.id !== pop.id))} />
        ))}
      </div>

      {streakBoost && (
        <StreakAnnouncement key={streakBoostKey} boost={streakBoost} onDone={() => setStreakBoost(null)} />
      )}

      {skinUnlock && (
        <SkinUnlockBanner key={skinUnlockKey} skin={skinUnlock} onDone={() => setSkinUnlock(null)} />
      )}

      {confetti && <Confetti />}

      {screen === "menu" && (
        <MenuScreen
          onPlay={() => setScreen("worlds")}
          onSkins={() => { setScreen("skins"); buildHamster(selectedSkin); }}
          onExit={() => navigate('/student-menu')}
          bestStreak={bestStreak}
          bestScore={bestScore}
          unlockedSkins={unlockedSkins.length}
        />
      )}
      {screen === "worlds" && (
        <WorldScreen scores={worldScores} onSelect={lvl => startLevel(lvl)} onBack={() => setScreen("menu")} />
      )}
      {screen === "skins" && (
        <SkinScreen
          bestStreak={bestStreak}
          selectedSkin={selectedSkin}
          onSelect={id => { setSelectedSkin(id); buildHamster(id); }}
          onBack={() => setScreen("menu")}
        />
      )}
      
      {screen === "countdown" && (
        <CountdownScreen count={countdown} world={countdownW} />
      )}
      {screen === "gameover" && endData && (
        <EndScreen
          won={endWon} data={endData}
          onRetry={() => startLevel(endData.level)}
          onNext={endWon && endData.level < 5 ? () => startLevel(endData.level + 1) : null}
          onMenu={() => navigate('/student-menu')}
        />
      )}

      {isGame && <GameHUD hud={hud} />}

      {isGame && (
        <WordPromptOverlay
          promptData={promptData}
          onSubmit={handleWordSubmit}
          flash={wordFlash}
          worldColor={world?.color}
        />
      )}

      {isGame && (
        <Dpad
          onLeft={() => {
            if (gs.current.spawnProtect > 0 || gs.current.inRing) return;
            phys.current.lane = Math.max(0, phys.current.lane - 1);
            playSound("switch");
          }}
          onRight={() => {
            if (gs.current.spawnProtect > 0 || gs.current.inRing) return;
            phys.current.lane = Math.min(2, phys.current.lane + 1);
            playSound("switch");
          }}
          onJump={handleJump}
        />
      )}
    </div>
  );
}