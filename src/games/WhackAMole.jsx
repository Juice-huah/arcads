// src/games/WhackAMole.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import './WhackAMole.css';

export default function WhackAMole() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    
    // --- State Management ---
    const [user, setUser] = useState(null);
    const [gameState, setGameState] = useState('menu'); 
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(120); 
    const [comboCount, setComboCount] = useState(0);
    const [lives, setLives] = useState(5); 
    const [countdown, setCountdown] = useState(3);
    const [allQuestions, setAllQuestions] = useState([]);
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [isScoreSaved, setIsScoreSaved] = useState(false);
    
    const [soundEnabled, setSoundEnabled] = useState(false);
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

    const TARGET_SCORE = 10;
    const COMBO_TARGET = 5;

    const praiseWords = ["AWESOME!", "AMAZING!", "GREAT!", "SUPERB!", "PERFECT!", "NICE!"];

    const t = {
        English: {
            title: "CYBER WHACK",
            subtitle: "DEFUSAL PROTOCOL",
            startMenuBtn: "START",
            howToPlay: "GUIDE",
            selectDiff: "SELECT DIFFICULTY",
            easy: "EASY", medium: "MEDIUM", hard: "HARD",
            settings: "SETTINGS", exitSystem: "EXIT",
            
            howToTitle: "MISSION BRIEFING",
            guideNormal: "Hit to build COMBO. If you miss, combo resets to 0!",
            guideBomb: "HAZARD! Do not hit! Explodes and costs 1 Life.",
            guideQuestion: "Spawns at 5 COMBO. Answer correctly to score 1 Point!",
            
            quizTitle: "CHALLENGE QUESTION",
            quizSub: "Answer correctly to score 1 point!",
            scoreLabel: "Score", gameOver: "GAME OVER!", victory: "MISSION COMPLETE!",
            finalScore: "Final Score", saveScore: "SAVE PROGRESS",
            scoreSaved: "PROGRESS SAVED!", playAgain: "RETRY", backToMenu: "MENU",
            pause: "MISSION PAUSED", resume: "RESUME"
        },
        Tagalog: {
            title: "CYBER PUKPUK",
            subtitle: "PROTOKOL SA PAG-DEFUSE",
            startMenuBtn: "SIMULAN",
            howToPlay: "GABAY",
            selectDiff: "ANTAS NG HIRAP",
            easy: "MADALI", medium: "KATAMTAMAN", hard: "MAHIRAP",
            settings: "MGA SETTING", exitSystem: "UMALIS",
            
            howToTitle: "BRIEFING NG MISYON",
            guideNormal: "Paluin para sa COMBO. Pag sumala, balik sa 0!",
            guideBomb: "PANGANIB! Huwag paluin! Mababawasan ka ng 1 buhay.",
            guideQuestion: "Lalabas sa 5 COMBO. Itama ang sagot para sa 1 Puntos!",

            quizTitle: "HAMON NA TANONG",
            quizSub: "Itama ang sagot para sa 1 puntos!",
            scoreLabel: "Puntos", gameOver: "TAPOS NA ANG LARO!", victory: "MISYON KUMPLETO!",
            finalScore: "Puntos", saveScore: "I-SAVE ANG PROGRES",
            scoreSaved: "NA-SAVE NA!", playAgain: "ULITIN", backToMenu: "MENU",
            pause: "NAKA-PAUSE", resume: "IPAGPATULOY"
        }
    };
    const text = t[language] || t.English;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => { if (currentUser) setUser(currentUser); });
        const fetchQuestions = async () => {
            try {
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
        setTimeLeft(120); 
        setLives(5); livesRef.current = 5;
        setComboCount(0); comboCountRef.current = 0; missedRoundsRef.current = 0; 
        setIsScoreSaved(false);
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

    const pauseGame = (e) => { e.stopPropagation(); if (gameState !== 'playing') return; stopGame(); setGameState('paused'); };
    const resumeGame = () => { isPlayingRef.current = true; setGameState('playing'); startTimer(); peep(); };

    useEffect(() => { if (gameState === 'playing' && timeLeft <= 0) handleGameOver(); }, [timeLeft, gameState]);

    const handleGameOver = () => {
        stopGame(); setGameState('gameover');
        if (score < TARGET_SCORE && livesRef.current > 0) playTone(150, 'square', 0.5, 0.1); 
        else if (livesRef.current <= 0) playTone(100, 'sawtooth', 1, 0.2); 
        else { playTone(523.25, 'sine', 0.3, 0.05); setTimeout(() => playTone(783.99, 'sine', 0.5, 0.05), 300); }
    };

    const saveScoreToDB = async () => {
        if (!user || !gameId || isScoreSaved) return;
        try {
            await fetch('http://localhost:8081/api/save-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_fid: user.uid, game_id: gameId, score: score, time_taken: 120 - timeLeft })
            });
            setIsScoreSaved(true); playTone(600, 'sine', 0.2, 0.1); 
        } catch (err) { alert("Error saving score!"); }
    };

    const peep = () => {
        if (!isPlayingRef.current) return;
        setMoles(prev => prev.map(() => ({ state: 'down' }))); 
        
        let min, max;
        if (difficulty === 'Easy') { min = 1500; max = 2000; }
        else if (difficulty === 'Medium') { min = 800; max = 1300; }
        else { min = 400; max = 800; } 
        
        let numToSpawn = Math.floor(Math.random() * 3) + 1; 
        const chosenHoles = [];
        while(chosenHoles.length < numToSpawn) {
            let r = Math.floor(Math.random() * 9);
            if(!chosenHoles.includes(r)) chosenHoles.push(r);
        }

        const spawnQuestion = comboCountRef.current >= COMBO_TARGET;
        const questionIndex = spawnQuestion ? Math.floor(Math.random() * chosenHoles.length) : -1;
        const faces = ['normal', 'tease', 'smug', 'derp'];

        setMoles(prev => { 
            const nm = [...prev]; 
            chosenHoles.forEach((holeId, idx) => {
                if (idx === questionIndex) {
                    nm[holeId] = { state: 'question' };
                } else {
                    const isBomb = Math.random() < 0.35;
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

                chosenHoles.forEach(h => {
                    if (prev[h].state === 'hit') hitNormalCount++;
                    if (prev[h].state === 'up' || prev[h].state === 'question') missedImportant = true; 
                });

                if (missedImportant) missedRoundsRef.current += 1;
                else if (hitNormalCount > 0) missedRoundsRef.current = 0;

                if (missedRoundsRef.current >= 2) {
                    setComboCount(0); comboCountRef.current = 0; missedRoundsRef.current = 0;
                }

                return prev.map((m, i) => chosenHoles.includes(i) ? { state: 'down' } : m);
            });
            
            if (isPlayingRef.current) peepTimeoutRef.current = setTimeout(peep, 100);
        }, (Math.random() * (max - min) + min));
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
            playTone(60, 'square', 0.8, 0.15); triggerShake('wam-heavy-shake');
            setExplosions(prev => [...prev, { id: Date.now(), x, y }]);
            setMoles(prev => { const nm = [...prev]; nm[index] = { state: 'down' }; return nm; });
            
            setComboCount(0); comboCountRef.current = 0; missedRoundsRef.current = 0;

            const newLives = livesRef.current - 1;
            setLives(newLives); livesRef.current = newLives;

            setPopups(prev => [...prev, { id: Date.now(), x, y, text: "-1 LIFE!", type: 'bad' }]);

            if (newLives <= 0) setTimeout(() => handleGameOver(), 500);

        } else if (mole.state === 'question') {
            playTone(600, 'sine', 0.1, 0.1); 
            setMoles(prev => { const nm = [...prev]; nm[index] = { state: 'down' }; return nm; });
            triggerQuiz();

        } else {
            const newCombo = comboCountRef.current + 1;
            setComboCount(newCombo); comboCountRef.current = newCombo; missedRoundsRef.current = 0; 
            playTone(400 + (newCombo * 25), 'sine', 0.1, 0.05);
            setMoles(prev => { const nm = [...prev]; nm[index] = { state: 'hit', face: mole.face }; return nm; });

            if (newCombo >= COMBO_TARGET) {
                setPopups(prev => [...prev, { id: Date.now(), x: 300, y: 150, text: "QUESTION INBOUND!", type: 'special' }]);
            } else {
                const randomPraise = praiseWords[Math.floor(Math.random() * praiseWords.length)];
                const popupText = newCombo > 1 ? `${newCombo} COMBO! ${randomPraise}` : `1 HIT!`;
                setPopups(prev => [...prev, { id: Date.now(), x, y, text: popupText, type: 'combo' }]);
            }
        }
    };

    const triggerQuiz = () => {
        stopGame(); isAnsweringRef.current = false; setQuizTimer(10); setGameState('quiz');
        if (availableQuestions.length > 0) setCurrentQuiz(availableQuestions[Math.floor(Math.random() * availableQuestions.length)]);
        else setCurrentQuiz(allQuestions[Math.floor(Math.random() * allQuestions.length)]);
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
        setComboCount(0); comboCountRef.current = 0; missedRoundsRef.current = 0;
        playTone(100, 'sine', 0.3, 0.1); triggerShake('wam-shake');
        setTimeout(() => { setCurrentQuiz(null); isPlayingRef.current = true; setGameState('playing'); startTimer(); peep(); }, 600);
    };

    const handleAnswer = (choiceIndex, e) => {
        if (isAnsweringRef.current) return; isAnsweringRef.current = true;
        const btn = e.currentTarget;
        const isCorrect = choiceIndex === Number(currentQuiz.correct_answer);

        if (isCorrect) {
            btn.style.backgroundColor = '#4dff91'; btn.style.color = '#000'; playTone(600, 'sine', 0.2, 0.1);
            const newScore = score + 1; setScore(newScore);
            
            setComboCount(0); comboCountRef.current = 0; missedRoundsRef.current = 0;
            
            setPopups(prev => [...prev, { id: Date.now(), x: 300, y: 150, text: "+1 SCORE!", type: 'good' }]);
            setAvailableQuestions(prev => prev.filter(q => q.question_text !== currentQuiz.question_text));

            setTimeout(() => {
                btn.style.backgroundColor = ''; btn.style.color = ''; setCurrentQuiz(null);
                if (newScore >= TARGET_SCORE) handleGameOver();
                else { isPlayingRef.current = true; setGameState('playing'); startTimer(); peep(); }
            }, 500); 
        } else {
            btn.style.backgroundColor = '#ff4757'; playTone(100, 'sine', 0.3, 0.1); triggerShake('wam-shake');
            setComboCount(0); comboCountRef.current = 0; missedRoundsRef.current = 0; 
            setTimeout(() => {
                btn.style.backgroundColor = ''; setCurrentQuiz(null);
                isPlayingRef.current = true; setGameState('playing'); startTimer(); peep(); 
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
                        </div>
                        <div className="wam-menu-buttons">
                            <button className="wam-menu-btn start" onClick={() => setGameState('difficulty')}>
                                <i className="fas fa-play"></i> <span>{text.startMenuBtn}</span>
                            </button>
                            <button className="wam-menu-btn how-to" onClick={() => setGameState('instructions')}>
                                <i className="fas fa-book"></i> <span>{text.howToPlay}</span>
                            </button>
                            <button className="wam-menu-btn settings" onClick={() => setGameState('settings')}>
                                <i className="fas fa-cog"></i> <span>{text.settings}</span>
                            </button>
                            <button className="wam-menu-btn exit" onClick={() => navigate('/student-menu')}>
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

                        <button className="wam-btn" onClick={() => setGameState('menu')} style={{marginTop: '30px', width: '100%', borderColor: '#666', color: '#ccc'}}>
                            <i className="fas fa-arrow-left"></i> {text.backToMenu}
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'difficulty' && (
                <div className="wam-overlay">
                    <div className="wam-instructions-card">
                        <h2 style={{ color: '#ffd700', marginBottom: '30px', fontFamily: "'Orbitron', sans-serif" }}>{text.selectDiff}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                            <button className="wam-btn" style={{ width: '85%', borderColor: '#4dff91', color: '#4dff91' }} onClick={() => startCountdown('Easy')}>{text.easy}</button>
                            <button className="wam-btn" style={{ width: '85%', borderColor: '#ffd700', color: '#ffd700' }} onClick={() => startCountdown('Medium')}>{text.medium}</button>
                            <button className="wam-btn" style={{ width: '85%', borderColor: '#ff4757', color: '#ff4757' }} onClick={() => startCountdown('Hard')}>{text.hard}</button>
                            <button className="wam-btn" style={{ width: '85%', borderColor: '#666', color: '#aaa', marginTop: '15px' }} onClick={() => setGameState('menu')}><i className="fas fa-arrow-left"></i> {text.backToMenu}</button>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'settings' && (
                <div className="wam-overlay" style={{ zIndex: 4000 }}>
                    <div className="wam-instructions-card">
                        <h2 style={{ color: '#00fff2', marginBottom: '30px', fontFamily: "'Orbitron', sans-serif" }}>{text.settings}</h2>
                        <button className="wam-btn wam-btn-settings" onClick={() => { initAudio(); setSoundEnabled(!soundEnabled); }}>
                            <span><i className={`fas ${soundEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i> {text.sound}</span>
                            <span style={{ color: soundEnabled ? '#4dff91' : '#ff4757' }}>{soundEnabled ? 'ON' : 'OFF'}</span>
                        </button>
                        <button className="wam-btn wam-btn-settings" onClick={() => setLanguage(l => l === 'English' ? 'Tagalog' : 'English')}>
                            <span><i className="fas fa-globe"></i> {text.lang}</span><span style={{ color: '#ffd700' }}>{language}</span>
                        </button>
                        <button className="wam-btn" onClick={() => setGameState('menu')} style={{ width: '100%', marginTop: '20px', borderColor: '#666', color: '#aaa' }}><i className="fas fa-arrow-left"></i> {text.backToMenu}</button>
                    </div>
                </div>
            )}

            {(gameState === 'playing' || gameState === 'countdown' || gameState === 'quiz' || gameState === 'paused') && (
                <div className={`wam-cabinet ${shake}`} id="cabinet">
                    
                    {/* 🟢 NEW: PAUSE BUTTON IN TOP RIGHT OF GAME BOX */}
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
                        <div className="wam-score-item"><span className="wam-label">Time</span><span className="wam-value" style={{ color: timeLeft <= 10 ? '#ff4757' : '#00fff2' }}>{formatTime(timeLeft)}</span></div>
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
                                    <button className="wam-btn" style={{ width: '100%', borderColor: '#ff4757', color: '#ff4757' }} onClick={() => setGameState('menu')}><i className="fas fa-sign-out-alt"></i> {text.backToMenu}</button>
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
                                            <button key={idx} className="wam-btn" style={{ justifyContent: 'center' }} onClick={(e) => handleAnswer(idx, e)}>{opt}</button>
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
                        <i className="fas fa-trophy" style={{ fontSize: '4rem', color: score >= TARGET_SCORE ? 'gold' : '#ff4757' }}></i>
                        <h1 style={{ color: score >= TARGET_SCORE ? '#00fff2' : '#ffea00', marginTop: '15px' }}>
                            {score >= TARGET_SCORE ? text.victory : (lives <= 0 ? "OUT OF LIVES!" : text.gameOver)}
                        </h1>
                        <p style={{ margin: '15px 0', fontSize: '1.2rem' }}>{text.finalScore}</p>
                        <h2 style={{ fontSize: '3.5rem', color: '#fff', margin: '0 0 20px 0' }}>{score} / {TARGET_SCORE}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                            <button className="wam-btn" onClick={saveScoreToDB} disabled={isScoreSaved} style={{ width: '100%', borderColor: isScoreSaved ? '#4dff91' : '#00fff2', color: isScoreSaved ? '#4dff91' : '#fff' }}>
                                <i className={`fas ${isScoreSaved ? 'fa-check' : 'fa-save'}`}></i> {isScoreSaved ? text.scoreSaved : text.saveScore}
                            </button>
                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <button className="wam-btn" style={{ flex: 1 }} onClick={() => startCountdown(difficulty)}>{text.playAgain}</button>
                                <button className="wam-btn" style={{ flex: 1, borderColor: '#666', color: '#aaa' }} onClick={() => setGameState('menu')}>{text.backToMenu}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}