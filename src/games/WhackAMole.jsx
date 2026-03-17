// src/games/WhackAMole.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import './WhackAMole.css';

// 🟢 AUDIO IMPORTS
import menuBGM from '../whack a mole sounds/main_menu.mp3';
import gameBGM from '../whack a mole sounds/ingame.mp3';
import whackSFX from '../whack a mole sounds/whack.mp3';
import boomSFX from '../whack a mole sounds/boom.mp3';
import victorySFX from '../whack a mole sounds/victory.mp3';
import clickSFX from '../whack a mole sounds/click.mp3';   

export default function WhackAMole() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    
    // --- State Management ---
    const [user, setUser] = useState(null);
    const [gameState, setGameState] = useState('menu'); 
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0); 
    const [timeLeft, setTimeLeft] = useState(120); 
    const [comboCount, setComboCount] = useState(0);
    const [lives, setLives] = useState(5); 
    const [countdown, setCountdown] = useState(3);
    const [allQuestions, setAllQuestions] = useState([]);
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [isScoreSaved, setIsScoreSaved] = useState(false);
    
    // 🟢 NEW SCHEDULING STATES
    const timeLimitR = useRef(0);
    const [showTimeUp, setShowTimeUp] = useState(false);

    const [soundEnabled, setSoundEnabled] = useState(true); 
    const [language, setLanguage] = useState('English');
    const [difficulty, setDifficulty] = useState('Medium'); 
    const [quizTimer, setQuizTimer] = useState(10);
    
    const [moles, setMoles] = useState(Array(9).fill({ state: 'down' })); 
    const [malletPos, setMalletPos] = useState({ x: 0, y: 0 });
    const [isMalletHit, setIsMalletHit] = useState(false);
    const [shake, setShake] = useState('');
    const [explosions, setExplosions] = useState([]);
    const [popups, setPopups] = useState([]); 

    // --- Control Refs ---
    const isPlayingRef = useRef(false);
    const isAnsweringRef = useRef(false); 
    const timerRef = useRef(null);
    const peepTimeoutRef = useRef(null);
    const audioCtxRef = useRef(null);
    const playAreaRef = useRef(null);
    const comboCountRef = useRef(0);
    const livesRef = useRef(5);
    const missedRoundsRef = useRef(0);
    
    const answerLog = useRef([]);
    const isSavingRef = useRef(false); 

    // --- Audio Refs ---
    const bgmMenuRef = useRef(null);
    const bgmGameRef = useRef(null);
    const whackSfxRef = useRef(null);
    const boomSfxRef = useRef(null);
    const victorySfxRef = useRef(null);
    const clickSfxRef = useRef(null);

    const TARGET_SCORE = allQuestions.length > 0 ? allQuestions.length : 10;
    const COMBO_TARGET = 5;

    const praiseWords = ["AWESOME!", "AMAZING!", "GREAT!", "SUPERB!", "PERFECT!", "NICE!"];

    const t = {
        English: {
            title: "CYBER WHACK", subtitle: "DEFUSAL PROTOCOL", startMenuBtn: "START", howToPlay: "GUIDE",
            selectDiff: "SELECT DIFFICULTY", easy: "EASY", medium: "MEDIUM", hard: "HARD",
            settings: "SETTINGS", exitSystem: "EXIT TO ARCADE", howToTitle: "MISSION BRIEFING",
            guideNormal: "Hit to build COMBO. If you miss, combo resets to 0!",
            guideBomb: "HAZARD! Do not hit! Explodes and costs 1 Life.",
            guideQuestion: "Spawns at 5 COMBO. Answer correctly to score 1 Point!",
            quizTitle: "CHALLENGE QUESTION", quizSub: "Answer correctly to score 1 point!",
            scoreLabel: "Score", gameOver: "GAME OVER!", victory: "MISSION COMPLETE!",
            finalScore: "Final Score", highScore: "High Score", pause: "MISSION PAUSED", resume: "RESUME"
        },
        Tagalog: {
            title: "CYBER PUKPUK", subtitle: "PROTOKOL SA PAG-DEFUSE", startMenuBtn: "SIMULAN", howToPlay: "GABAY",
            selectDiff: "ANTAS NG HIRAP", easy: "MADALI", medium: "KATAMTAMAN", hard: "MAHIRAP",
            settings: "MGA SETTING", exitSystem: "UMALIS", howToTitle: "BRIEFING NG MISYON",
            guideNormal: "Paluin para sa COMBO. Pag sumala, balik sa 0!",
            guideBomb: "PANGANIB! Huwag paluin! Mababawasan ka ng 1 buhay.",
            guideQuestion: "Lalabas sa 5 COMBO. Itama ang sagot para sa 1 Puntos!",
            quizTitle: "HAMON NA TANONG", quizSub: "Itama ang sagot para sa 1 puntos!",
            scoreLabel: "Puntos", gameOver: "TAPOS NA ANG LARO!", victory: "MISYON KUMPLETO!",
            finalScore: "Puntos", highScore: "Pinakamataas na Puntos", pause: "NAKA-PAUSE", resume: "IPAGPATULOY"
        }
    };
    const text = t[language] || t.English;

    useEffect(() => {
        bgmMenuRef.current = new Audio(menuBGM);
        bgmMenuRef.current.loop = true;
        bgmMenuRef.current.volume = 0.4;

        bgmGameRef.current = new Audio(gameBGM);
        bgmGameRef.current.loop = true;
        bgmGameRef.current.volume = 0.3;

        whackSfxRef.current = new Audio(whackSFX);
        boomSfxRef.current = new Audio(boomSFX);
        victorySfxRef.current = new Audio(victorySFX);
        
        clickSfxRef.current = new Audio(clickSFX);
        clickSfxRef.current.volume = 0.6;

        return () => {
            if (bgmMenuRef.current) bgmMenuRef.current.pause();
            if (bgmGameRef.current) bgmGameRef.current.pause();
        };
    }, []);

    useEffect(() => {
        const unlockAudio = () => {
            if (soundEnabled) {
                if (['menu', 'difficulty', 'instructions', 'settings'].includes(gameState)) {
                    bgmMenuRef.current?.play().catch(()=>{});
                } else if (['playing', 'countdown', 'paused', 'quiz'].includes(gameState)) {
                    bgmGameRef.current?.play().catch(()=>{});
                }
            }
            window.removeEventListener('click', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        return () => window.removeEventListener('click', unlockAudio);
    }, [gameState, soundEnabled]);

    useEffect(() => {
        const isMuted = !soundEnabled;
        if (bgmMenuRef.current) bgmMenuRef.current.muted = isMuted;
        if (bgmGameRef.current) bgmGameRef.current.muted = isMuted;
        if (whackSfxRef.current) whackSfxRef.current.muted = isMuted;
        if (boomSfxRef.current) boomSfxRef.current.muted = isMuted;
        if (victorySfxRef.current) victorySfxRef.current.muted = isMuted;
        if (clickSfxRef.current) clickSfxRef.current.muted = isMuted;
        
        if (!isMuted) {
            if (['menu', 'difficulty', 'instructions', 'settings'].includes(gameState)) {
                bgmMenuRef.current?.play().catch(()=>{});
            } else if (['playing', 'countdown', 'paused', 'quiz'].includes(gameState)) {
                bgmGameRef.current?.play().catch(()=>{});
            }
        } else {
            bgmMenuRef.current?.pause();
            bgmGameRef.current?.pause();
        }
    }, [soundEnabled, gameState]);

    useEffect(() => {
        if (!bgmMenuRef.current || !bgmGameRef.current) return;
        const playSafe = (audio) => {
            if (soundEnabled) audio.play().catch(() => {});
        };

        if (['menu', 'difficulty', 'instructions', 'settings'].includes(gameState)) {
            bgmGameRef.current.pause();
            bgmGameRef.current.currentTime = 0;
            playSafe(bgmMenuRef.current);
        } else if (['playing', 'countdown', 'paused', 'quiz'].includes(gameState)) {
            bgmMenuRef.current.pause();
            playSafe(bgmGameRef.current);
        } else if (gameState === 'gameover') {
            bgmGameRef.current.pause();
            bgmMenuRef.current.pause();
        }
    }, [gameState, soundEnabled]);

    const playUI = () => {
        if (!soundEnabled || !clickSfxRef.current) return;
        clickSfxRef.current.currentTime = 0;
        clickSfxRef.current.play().catch(()=>{});
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => { if (currentUser) setUser(currentUser); });
        
        const savedHS = localStorage.getItem(`wam_highscore_${gameId}`);
        if (savedHS) setHighScore(parseInt(savedHS, 10));

        const fetchQuestions = async () => {
            try {
                // 🟢 NEW: Fetch time limit
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
                setAllQuestions(data);
                setAvailableQuestions(data);
            } catch (err) { console.error(err); }
        };
        if (gameId) fetchQuestions();
        return () => { unsubscribe(); stopGame(); };
    }, [gameId]);

    const initAudio = () => {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    };

    const playTone = (freq, type, duration, volume) => {
        if (!soundEnabled || !audioCtxRef.current) return;
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
        gain.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtxRef.current.currentTime + duration);
        osc.connect(gain); gain.connect(audioCtxRef.current.destination);
        osc.start(); osc.stop(audioCtxRef.current.currentTime + duration);
    };

    const startCountdown = (selectedDiff) => {
        setDifficulty(selectedDiff);
        initAudio(); 
        setScore(0); 
        
        // 🟢 Initialize Timer based on Database Limit
        setTimeLeft(timeLimitR.current > 0 ? timeLimitR.current * 60 : 999999); 
        setShowTimeUp(false);

        setLives(5); livesRef.current = 5;
        setComboCount(0); comboCountRef.current = 0; missedRoundsRef.current = 0; 
        
        setIsScoreSaved(false);
        isSavingRef.current = false; 
        answerLog.current = []; 
        setAvailableQuestions([...allQuestions]);
        
        setGameState('countdown');
        isPlayingRef.current = false; isAnsweringRef.current = false;
        setCountdown(3); setPopups([]); setExplosions([]);
        
        let count = 3;
        const cdInterval = setInterval(() => {
            count--;
            if (count > 0) { setCountdown(count); playTone(300 + (count * 100), 'sine', 0.2, 0.05); }
            else if (count === 0) { setCountdown("GO!"); playTone(600, 'sine', 0.4, 0.1); }
            else { clearInterval(cdInterval); isPlayingRef.current = true; setGameState('playing'); startTimer(); peep(); }
        }, 1000);
    };

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    };

    const stopGame = () => {
        isPlayingRef.current = false;
        if (timerRef.current) clearInterval(timerRef.current);
        if (peepTimeoutRef.current) clearTimeout(peepTimeoutRef.current);
    };

    const pauseGame = (e) => { e.stopPropagation(); playUI(); if (gameState !== 'playing') return; stopGame(); setGameState('paused'); };
    const resumeGame = () => { playUI(); isPlayingRef.current = true; setGameState('playing'); startTimer(); peep(); };

    const triggerSave = async (finalScore) => {
        if (isSavingRef.current) return; 
        isSavingRef.current = true;

        if (!auth.currentUser || !gameId) return;
        
        try {
            if (finalScore > highScore) {
                setHighScore(finalScore);
                localStorage.setItem(`wam_highscore_${gameId}`, finalScore);
            }

            await fetch('http://localhost:8081/api/save-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_fid: auth.currentUser.uid,
                    game_id: gameId,
                    score: finalScore,
                    time_taken: 0 // Ignored for time-limit games
                })
            });

            if (answerLog.current.length > 0) {
                await fetch('http://localhost:8081/api/save-answers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answers: answerLog.current })
                });
            }

            setIsScoreSaved(true);
        } catch (err) {
            console.error("Error saving score:", err);
        }
    };

    const handleGameOver = (finalScore) => {
        stopGame(); 
        
        // 🟢 Set Time Up Flag
        if (timeLeft <= 0 && timeLimitR.current > 0) {
            setShowTimeUp(true);
        }

        setGameState('gameover');
        
        if (finalScore < TARGET_SCORE && livesRef.current > 0 && timeLeft > 0) {
            playTone(150, 'square', 0.5, 0.1); 
        } else if (livesRef.current <= 0) {
            playTone(100, 'sawtooth', 1, 0.2); 
        } else { 
            if (soundEnabled && victorySfxRef.current) {
                victorySfxRef.current.currentTime = 0;
                victorySfxRef.current.play().catch(()=>{});
            } else {
                playTone(523.25, 'sine', 0.3, 0.05); 
                setTimeout(() => playTone(783.99, 'sine', 0.5, 0.05), 300);
            }
        }

        triggerSave(finalScore); 
    };

    useEffect(() => { 
        if (gameState === 'playing' && timeLeft <= 0) handleGameOver(score); 
    }, [timeLeft, gameState, score]);

    const spawnExplosion = (x, y) => {
        const id = Date.now();
        setExplosions(prev => [...prev, { id, x, y }]);
        setTimeout(() => setExplosions(prev => prev.filter(e => e.id !== id)), 800);
    };

    const spawnPopup = (x, y, text, type) => {
        const id = Date.now();
        setPopups(prev => [...prev, { id, x, y, text, type }]);
        setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1000);
    };

    const peep = (forceQuestion = false) => {
        if (!isPlayingRef.current) return;
        setMoles(prev => prev.map(() => ({ state: 'down' }))); 
        
        let min, max;
        if (difficulty === 'Easy') { min = 1500; max = 2000; }
        else if (difficulty === 'Medium') { min = 800; max = 1300; }
        else { min = 400; max = 800; } 
        
        let numToSpawn = forceQuestion ? 1 : (Math.floor(Math.random() * 3) + 1); 
        const chosenHoles = [];
        while(chosenHoles.length < numToSpawn) {
            let r = Math.floor(Math.random() * 9);
            if(!chosenHoles.includes(r)) chosenHoles.push(r);
        }

        const spawnQuestion = (forceQuestion || comboCountRef.current >= COMBO_TARGET) && availableQuestions.length > 0;
        const questionIndex = spawnQuestion ? Math.floor(Math.random() * chosenHoles.length) : -1;
        const faces = ['normal', 'tease', 'smug', 'derp'];

        setMoles(prev => { 
            const nm = [...prev]; 
            chosenHoles.forEach((holeId, idx) => {
                if (idx === questionIndex) {
                    nm[holeId] = { state: 'question' };
                } else {
                    const isBomb = forceQuestion ? false : Math.random() < 0.35; 
                    const randomFace = faces[Math.floor(Math.random() * faces.length)];
                    nm[holeId] = { state: isBomb ? 'bomb' : 'up', face: randomFace };
                }
            });
            return nm; 
        });

        if (peepTimeoutRef.current) clearTimeout(peepTimeoutRef.current);
        peepTimeoutRef.current = setTimeout(() => {
            if (!isPlayingRef.current) return;
            
            setMoles(prev => {
                let hitNormalCount = 0;
                let missedImportant = false;
                let missedQuestion = false;

                chosenHoles.forEach(h => {
                    if (prev[h].state === 'hit') hitNormalCount++;
                    if (prev[h].state === 'up') missedImportant = true; 
                    if (prev[h].state === 'question') missedQuestion = true; 
                });

                if (comboCountRef.current >= COMBO_TARGET) {
                    if (missedQuestion) missedRoundsRef.current += 1;
                } else {
                    if (missedImportant) missedRoundsRef.current += 1;
                    else if (hitNormalCount > 0) missedRoundsRef.current = 0;
                }

                if (missedRoundsRef.current >= 2) {
                    setComboCount(0); comboCountRef.current = 0; missedRoundsRef.current = 0;
                }

                return prev.map((m, i) => chosenHoles.includes(i) ? { state: 'down' } : m);
            });
            
            if (isPlayingRef.current) peepTimeoutRef.current = setTimeout(() => peep(false), 100);
        }, forceQuestion ? 2000 : (Math.random() * (max - min) + min)); 
    };

    const whack = (index, e) => {
        if (gameState !== 'playing') return;
        const mole = moles[index];
        if (mole.state === 'down' || mole.state === 'hit') return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const parentRect = playAreaRef.current.getBoundingClientRect();
        const x = rect.left - parentRect.left + rect.width / 2;
        const y = rect.top - parentRect.top;

        if (mole.state === 'bomb') {
            if (soundEnabled && boomSfxRef.current) {
                boomSfxRef.current.currentTime = 0;
                boomSfxRef.current.play().catch(()=>{});
            } else {
                playTone(60, 'square', 0.8, 0.15); 
            }
            
            triggerShake('wam-heavy-shake');
            spawnExplosion(x, y);
            setMoles(prev => { const nm = [...prev]; nm[index] = { state: 'down' }; return nm; });
            
            setComboCount(0); comboCountRef.current = 0; missedRoundsRef.current = 0;

            const newLives = livesRef.current - 1;
            setLives(newLives); livesRef.current = newLives;

            spawnPopup(x, y, "-1 LIFE!", 'bad');

            if (newLives <= 0) setTimeout(() => handleGameOver(score), 500);

        } else if (mole.state === 'question') {
            if (soundEnabled && whackSfxRef.current) {
                whackSfxRef.current.currentTime = 0;
                whackSfxRef.current.play().catch(()=>{});
            } else {
                playTone(600, 'sine', 0.1, 0.1); 
            }

            setMoles(prev => { const nm = [...prev]; nm[index] = { state: 'down' }; return nm; });
            triggerQuiz();

        } else {
            if (soundEnabled && whackSfxRef.current) {
                whackSfxRef.current.currentTime = 0;
                whackSfxRef.current.play().catch(()=>{});
            }

            const newCombo = comboCountRef.current + 1;
            setComboCount(newCombo); comboCountRef.current = newCombo; missedRoundsRef.current = 0; 
            playTone(400 + (newCombo * 25), 'sine', 0.1, 0.05); 
            setMoles(prev => { const nm = [...prev]; nm[index] = { state: 'hit', face: mole.face }; return nm; });

            if (newCombo === COMBO_TARGET && availableQuestions.length > 0) {
                spawnPopup(300, 150, "QUESTION INBOUND!", 'special');
                if (peepTimeoutRef.current) clearTimeout(peepTimeoutRef.current);
                
                setTimeout(() => {
                    if (!isPlayingRef.current || comboCountRef.current < COMBO_TARGET) return;
                    peep(true); 
                }, 300); 

            } else if (newCombo > COMBO_TARGET) {
                const randomPraise = praiseWords[Math.floor(Math.random() * praiseWords.length)];
                const popupText = `${newCombo} COMBO! ${randomPraise}`;
                spawnPopup(x, y, popupText, 'combo');
            } else {
                const randomPraise = praiseWords[Math.floor(Math.random() * praiseWords.length)];
                const popupText = newCombo > 1 ? `${newCombo} COMBO! ${randomPraise}` : `1 HIT!`;
                spawnPopup(x, y, popupText, 'combo');
            }
        }
    };

    const triggerQuiz = () => {
        stopGame(); isAnsweringRef.current = false; setQuizTimer(10); setGameState('quiz');
        if (availableQuestions.length > 0) setCurrentQuiz(availableQuestions[Math.floor(Math.random() * availableQuestions.length)]);
    };

    useEffect(() => {
        let qTimer;
        if (gameState === 'quiz') {
            qTimer = setInterval(() => {
                setQuizTimer(prev => {
                    if (prev <= 1) { clearInterval(qTimer); handleQuizTimeout(); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (qTimer) clearInterval(qTimer); }
    }, [gameState]);

    const handleQuizTimeout = () => {
        if (isAnsweringRef.current) return; isAnsweringRef.current = true;
        
        if (currentQuiz && user) {
            answerLog.current.push({
                student_fid: user.uid,
                game_id: parseInt(gameId),
                question_id: currentQuiz.id || currentQuiz.question_id,
                is_correct: 0
            });
        }

        setComboCount(0); comboCountRef.current = 0; missedRoundsRef.current = 0;
        playTone(100, 'sine', 0.3, 0.1); triggerShake('wam-shake');
        
        setAvailableQuestions(prev => prev.filter(q => q.question_text !== currentQuiz.question_text));

        setTimeout(() => { 
            setCurrentQuiz(null); 
            if (availableQuestions.length <= 1) handleGameOver(score);
            else { isPlayingRef.current = true; setGameState('playing'); startTimer(); peep(); }
        }, 600);
    };

    const handleAnswer = (choiceIndex, e) => {
        if (isAnsweringRef.current) return; isAnsweringRef.current = true; 
        const btn = e.currentTarget;
        const isCorrect = choiceIndex === Number(currentQuiz.correct_answer);

        if (currentQuiz && user) {
            answerLog.current.push({
                student_fid: user.uid,
                game_id: parseInt(gameId),
                question_id: currentQuiz.id || currentQuiz.question_id,
                is_correct: isCorrect ? 1 : 0
            });
        }

        if (isCorrect) {
            btn.style.backgroundColor = '#4dff91'; btn.style.color = '#000'; playTone(600, 'sine', 0.2, 0.1);
            
            const newScore = score + 1; 
            setScore(newScore);
            
            setComboCount(0); comboCountRef.current = 0; missedRoundsRef.current = 0;
            
            spawnPopup(300, 150, "+1 SCORE!", 'good');
            setAvailableQuestions(prev => prev.filter(q => q.question_text !== currentQuiz.question_text));

            setTimeout(() => {
                btn.style.backgroundColor = ''; btn.style.color = ''; setCurrentQuiz(null);
                if (newScore >= TARGET_SCORE || availableQuestions.length <= 1) handleGameOver(newScore);
                else { isPlayingRef.current = true; setGameState('playing'); startTimer(); peep(); }
            }, 500); 
        } else {
            btn.style.backgroundColor = '#ff4757'; playTone(100, 'sine', 0.3, 0.1); triggerShake('wam-shake');
            setComboCount(0); comboCountRef.current = 0; missedRoundsRef.current = 0; 
            
            setAvailableQuestions(prev => prev.filter(q => q.question_text !== currentQuiz.question_text));

            setTimeout(() => {
                btn.style.backgroundColor = ''; setCurrentQuiz(null);
                if (availableQuestions.length <= 1) handleGameOver(score);
                else { isPlayingRef.current = true; setGameState('playing'); startTimer(); peep(); }
            }, 600);
        }
    };

    const triggerShake = (shakeClass) => { setShake(shakeClass); setTimeout(() => setShake(''), 500); };
    const handleMouseMove = (e) => { if (!playAreaRef.current) return; const rect = playAreaRef.current.getBoundingClientRect(); setMalletPos({ x: e.clientX - rect.left, y: e.clientY - rect.top }); };

    const formatTime = (s) => { const m = Math.floor(s / 60); const secs = s % 60; return `${m}:${secs < 10 ? '0' : ''}${secs}`; };
    const renderLives = () => { return "❤️".repeat(lives) + "🖤".repeat(5 - lives); };

    return (
        <div className="wam-wrapper">
            <div className="wam-bg-effects"><div className="wam-nebula wam-nebula-1"></div><div className="wam-nebula wam-nebula-2"></div><div className="wam-grid-line"></div></div>

            {gameState === 'menu' && (
                <div className="wam-overlay">
                    <div className="wam-menu-dashboard">
                        <div className="wam-logo-container">
                            <i className="fas fa-radiation wam-pulse-icon"></i>
                            <h1 className="wam-main-title">{text.title}</h1>
                            <p className="wam-subtitle">{text.subtitle}</p>
                            <p style={{ color: '#ffd700', fontSize: '1.2rem', marginTop: '10px', fontFamily: "'Orbitron', sans-serif" }}>
                                {text.highScore}: {highScore}
                            </p>
                        </div>
                        <div className="wam-menu-buttons">
                            <button className="wam-menu-btn start" onClick={() => { playUI(); setGameState('difficulty'); }}>
                                <i className="fas fa-play"></i> <span>{text.startMenuBtn}</span>
                            </button>
                            <button className="wam-menu-btn how-to" onClick={() => { playUI(); setGameState('instructions'); }}>
                                <i className="fas fa-book"></i> <span>{text.howToPlay}</span>
                            </button>
                            <button className="wam-menu-btn settings" onClick={() => { playUI(); setGameState('settings'); }}>
                                <i className="fas fa-cog"></i> <span>{text.settings}</span>
                            </button>
                            <button className="wam-menu-btn exit" onClick={() => { playUI(); navigate('/student-menu'); }}>
                                <i className="fas fa-sign-out-alt"></i> <span>{text.exitSystem}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'instructions' && (
                <div className="wam-overlay">
                    <div className="wam-instructions-card">
                        <h2 className="wam-instructions-title"><i className="fas fa-info-circle"></i> {text.howToTitle}</h2>
                        
                        <div className="wam-guide-grid">
                            <div className="wam-guide-item">
                                <div className="wam-guide-icon normal-icon">😎</div>
                                <p>{text.guideNormal}</p>
                            </div>
                            <div className="wam-guide-item">
                                <div className="wam-guide-icon bomb-icon">💣</div>
                                <p>{text.guideBomb}</p>
                            </div>
                            <div className="wam-guide-item">
                                <div className="wam-guide-icon question-icon">❓</div>
                                <p>{text.guideQuestion}</p>
                            </div>
                        </div>

                        <button className="wam-btn" onClick={() => { playUI(); setGameState('menu'); }} style={{marginTop: '30px', width: '100%', borderColor: '#666', color: '#ccc'}}>
                            <i className="fas fa-arrow-left"></i> {text.exitSystem}
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'difficulty' && (
                <div className="wam-overlay">
                    <div className="wam-instructions-card">
                        <h2 style={{ color: '#ffd700', marginBottom: '30px', fontFamily: "'Orbitron', sans-serif" }}>{text.selectDiff}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                            <button className="wam-btn" style={{ width: '85%', borderColor: '#4dff91', color: '#4dff91' }} onClick={() => { playUI(); startCountdown('Easy'); }}>{text.easy}</button>
                            <button className="wam-btn" style={{ width: '85%', borderColor: '#ffd700', color: '#ffd700' }} onClick={() => { playUI(); startCountdown('Medium'); }}>{text.medium}</button>
                            <button className="wam-btn" style={{ width: '85%', borderColor: '#ff4757', color: '#ff4757' }} onClick={() => { playUI(); startCountdown('Hard'); }}>{text.hard}</button>
                            <button className="wam-btn" style={{ width: '85%', borderColor: '#666', color: '#aaa', marginTop: '15px' }} onClick={() => { playUI(); setGameState('menu'); }}><i className="fas fa-arrow-left"></i> {text.exitSystem}</button>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'settings' && (
                <div className="wam-overlay" style={{ zIndex: 4000 }}>
                    <div className="wam-instructions-card">
                        <h2 style={{ color: '#00fff2', marginBottom: '30px', fontFamily: "'Orbitron', sans-serif" }}>{text.settings}</h2>
                        <button className="wam-btn wam-btn-settings" onClick={() => { playUI(); initAudio(); setSoundEnabled(!soundEnabled); }}>
                            <span><i className={`fas ${soundEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i> SOUND</span>
                            <span style={{ color: soundEnabled ? '#4dff91' : '#ff4757' }}>{soundEnabled ? 'ON' : 'OFF'}</span>
                        </button>
                        <button className="wam-btn wam-btn-settings" onClick={() => { playUI(); setLanguage(l => l === 'English' ? 'Tagalog' : 'English'); }}>
                            <span><i className="fas fa-globe"></i> LANGUAGE</span><span style={{ color: '#ffd700' }}>{language}</span>
                        </button>
                        <button className="wam-btn" onClick={() => { playUI(); setGameState('menu'); }} style={{ width: '100%', marginTop: '20px', borderColor: '#666', color: '#aaa' }}><i className="fas fa-arrow-left"></i> {text.exitSystem}</button>
                    </div>
                </div>
            )}

            {(gameState === 'playing' || gameState === 'countdown' || gameState === 'quiz' || gameState === 'paused') && (
                <div className={`wam-cabinet ${shake}`} id="cabinet">
                    
                    <button 
                        className="wam-pause-ingame-btn" 
                        onClick={gameState === 'playing' ? pauseGame : resumeGame}
                        disabled={gameState !== 'playing' && gameState !== 'paused'}
                        title={gameState === 'playing' ? "Pause Game" : "Resume Game"}
                    >
                        <i className={`fas ${gameState === 'playing' ? 'fa-pause' : 'fa-play'}`} style={{ marginLeft: gameState === 'paused' ? '3px' : '0' }}></i>
                    </button>

                    <div className={`wam-combo-meter-container ${comboCount >= COMBO_TARGET ? 'charged on-fire' : ''}`}>
                        <div className="wam-combo-fill" style={{ height: `${Math.min((comboCount / COMBO_TARGET) * 100, 100)}%` }}></div>
                    </div>

                    <div className="wam-scoreboard">
                        <div className="wam-score-item"><span className="wam-label">{text.scoreLabel}</span><span className="wam-value">{score} / {TARGET_SCORE}</span></div>
                        <div className="wam-score-item">
                            <span className="wam-label">Time</span>
                            <span className="wam-value" style={{ color: timeLeft <= 10 ? '#ff4757' : '#00fff2' }}>
                                {/* 🟢 Dynamic Time Display */}
                                {timeLimitR.current > 0 ? formatTime(timeLeft) : '∞'}
                            </span>
                        </div>
                        <div className="wam-score-item"><span className="wam-label">Lives</span><span className="wam-value" style={{fontSize: '1.2rem', letterSpacing: '2px'}}>{renderLives()}</span></div>
                    </div>

                    <div className="wam-play-area" ref={playAreaRef} onMouseMove={handleMouseMove} onMouseDown={() => { if(gameState==='playing') setIsMalletHit(true); }} onMouseUp={() => setIsMalletHit(false)}>
                        {(gameState === 'playing' || gameState === 'countdown') && <div className={`wam-mallet ${isMalletHit ? 'hit' : ''}`} style={{ left: malletPos.x, top: malletPos.y, display: 'block' }}>🔨</div>}
                        <div className="wam-stadium">
                            {[0, 1, 2].map(rowIndex => (
                                <div className="wam-row" key={rowIndex}>
                                    {[0, 1, 2].map(colIndex => {
                                        const i = rowIndex * 3 + colIndex; const mole = moles[i];
                                        return (
                                            <div className="wam-hole" key={i}>
                                                <div className={`wam-mole ${mole.state !== 'down' ? mole.state : ''} face-${mole.face || 'normal'}`} onMouseDown={(e) => whack(i, e)}>
                                                    {mole.state !== 'question' && (
                                                        <>
                                                            <div style={{ display: 'flex', gap: '10px' }}><div className="wam-eye"></div><div className="wam-eye"></div></div>
                                                            <div className="wam-mouth"></div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                        
                        {explosions.map(exp => (
                            <div key={exp.id} className="wam-bomb-explosion" style={{ left: exp.x, top: exp.y }}>
                                <span className="boom-text">BOOM!</span>
                            </div>
                        ))}
                        
                        {popups.map(pop => <div key={pop.id} className={pop.type === 'special' ? 'wam-combo-text-popup' : 'wam-points-popup'} style={pop.type === 'special' ? {} : { left: pop.x, top: pop.y }}>{pop.text}</div>)}
                        {gameState === 'countdown' && <div className="wam-countdown wam-count-pulse" key={countdown}>{countdown}</div>}
                        {gameState === 'paused' && (
                            <div className="wam-overlay" style={{ position: 'absolute', borderRadius: '15px' }}>
                                <div className="wam-instructions-card" style={{ padding: '30px', width: '80%' }}>
                                    <h2 style={{ color: '#ffd700', marginBottom: '20px' }}>{text.pause}</h2>
                                    <button className="wam-btn" style={{ width: '100%', marginBottom: '15px' }} onClick={resumeGame}><i className="fas fa-play"></i> {text.resume}</button>
                                    <button className="wam-btn" style={{ width: '100%', borderColor: '#ff4757', color: '#ff4757' }} onClick={() => { playUI(); navigate('/student-menu'); }}><i className="fas fa-sign-out-alt"></i> {text.exitSystem}</button>
                                </div>
                            </div>
                        )}
                        {gameState === 'quiz' && currentQuiz && (
                            <div className="wam-overlay" style={{ position: 'absolute', borderRadius: '15px' }}>
                                <div className="wam-overlay-content quiz">
                                    <div className="wam-quiz-header">{text.quizTitle}</div>
                                    <div className="wam-quiz-timer-container"><div className="wam-quiz-timer-fill" style={{ width: `${(quizTimer/10)*100}%` }}></div></div>
                                    <p style={{ fontSize: '1.4rem', margin: '15px 0', color: '#00fff2' }}>{currentQuiz.question_text}</p>
                                    <div className="wam-quiz-options">
                                        {[currentQuiz.choice_a, currentQuiz.choice_b, currentQuiz.choice_c, currentQuiz.choice_d].map((opt, idx) => (
                                            <button key={idx} className="wam-btn" style={{ justifyContent: 'center' }} onClick={(e) => { playUI(); handleAnswer(idx, e); }}>{opt}</button>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '15px', fontSize: '0.8rem', opacity: 0.7 }}>{text.quizSub}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {gameState === 'gameover' && (
                <div className="wam-overlay">
                    <div className="wam-instructions-card">
                        
                        {/* 🟢 DYNAMIC TITLE RENDERING */}
                        {showTimeUp ? (
                            <>
                                <i className="fas fa-clock" style={{ fontSize: '4rem', color: '#ff4757' }}></i>
                                <h1 style={{ color: '#ff4757', marginTop: '15px', fontFamily: "'Orbitron', sans-serif" }}>TIME'S UP!</h1>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-trophy" style={{ fontSize: '4rem', color: score >= TARGET_SCORE ? 'gold' : '#ff4757' }}></i>
                                <h1 style={{ color: score >= TARGET_SCORE ? '#00fff2' : '#ffea00', marginTop: '15px' }}>
                                    {score >= TARGET_SCORE ? text.victory : (lives <= 0 ? "OUT OF LIVES!" : text.gameOver)}
                                </h1>
                            </>
                        )}
                        
                        <p style={{ margin: '15px 0', fontSize: '1.2rem' }}>{text.finalScore}</p>
                        <h2 style={{ fontSize: '3.5rem', color: '#fff', margin: '0 0 20px 0' }}>{score} / {TARGET_SCORE}</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                            <div style={{
                                background: 'rgba(0,0,0,0.5)', 
                                padding: '15px 20px', 
                                borderRadius: '8px', 
                                border: isScoreSaved ? '2px solid #48bb78' : '2px dashed #aaa',
                                width: '100%',
                                textAlign: 'center'
                            }}>
                                <p style={{color: isScoreSaved ? '#48bb78' : '#fbd38d', fontSize: '1rem', margin: 0, fontWeight: 'bold'}}>
                                    {isScoreSaved ? '✅ PROGRESS SAVED' : '⏳ Saving results...'}
                                </p>
                            </div>
                            
                            <button className="wam-btn" style={{ width: '100%', borderColor: '#ff4757', color: '#ff4757', marginTop: '10px' }} onClick={() => { playUI(); navigate('/student-menu'); }}>
                                <i className="fas fa-sign-out-alt"></i> {text.exitSystem}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}