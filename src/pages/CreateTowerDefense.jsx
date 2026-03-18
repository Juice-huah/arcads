// src/pages/CreateTowerDefense.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import './CreateTowerDefense.css';

export default function CreateTowerDefense() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    
    const [waveLevel, setWaveLevel] = useState('Easy');
    const [pairs, setPairs] = useState(
        Array.from({ length: 6 }, () => ({ prompt: '', answer: '' }))
    );
    
    const [savedSets, setSavedSets] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Custom Modal States
    const [alertData, setAlertData] = useState(null);
    const [confirmData, setConfirmData] = useState(null);

    // Scheduling Data
    const [openDate, setOpenDate] = useState('');
    const [openTime, setOpenTime] = useState('');
    const [noCloseDate, setNoCloseDate] = useState(true);
    const [closeDate, setCloseDate] = useState('');
    const [closeTime, setCloseTime] = useState('');
    const [unlimitedTime, setUnlimitedTime] = useState(true);
    const [timeLimit, setTimeLimit] = useState(15);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchClasses(currentUser.uid);
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const fetchClasses = async (userId) => {
        try {
            const res = await fetch(`https://arcads-api.onrender.com/api/get-classes/${userId}`);
            const data = await res.json();
            if (Array.isArray(data)) setClasses(data);
        } catch (err) {
            console.error("Error fetching classes:", err);
        }
    };

    const handlePairCountChange = (e) => {
        const newCount = parseInt(e.target.value, 10);
        if (isNaN(newCount) || newCount < 3 || newCount > 15) return; 

        if (newCount > pairs.length) {
            const diff = newCount - pairs.length;
            const extraPairs = Array.from({ length: diff }, () => ({ prompt: '', answer: '' }));
            setPairs([...pairs, ...extraPairs]);
        } else if (newCount < pairs.length) {
            setPairs(pairs.slice(0, newCount));
        }
    };

    const handleWaveLevelChange = (e) => {
        setWaveLevel(e.target.value);
    };

    const handlePairChange = (index, field, value) => {
        const newPairs = [...pairs];
        newPairs[index] = { ...newPairs[index], [field]: value };
        setPairs(newPairs);
    };

    const handleSaveWaveSet = (e) => {
        e.preventDefault();
        
        const isValid = pairs.every(p => p.prompt.trim() !== '' && p.answer.trim() !== '');
        if (!isValid) {
            return setAlertData({ title: "ATTENTION", message: "Please fill out all Prompts and Answers before saving the wave.", color: "#ffd700" });
        }

        if (savedSets.some(s => s.difficulty === waveLevel)) {
            return setAlertData({ title: "ATTENTION", message: `You already have a ${waveLevel} wave! Please choose a different difficulty or delete the old one.`, color: "#ffd700" });
        }

        const newSet = {
            id: Date.now(),
            difficulty: waveLevel,
            pairs: [...pairs]
        };

        setSavedSets([...savedSets, newSet]);
        setPairs(Array.from({ length: 6 }, () => ({ prompt: '', answer: '' })));
        setWaveLevel('Medium');
    };

    const removeSavedSet = (setId) => {
        setSavedSets(savedSets.filter(s => s.id !== setId));
    };

    const shuffleArray = (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const handleDeployClick = () => {
        if (!selectedClass) return setAlertData({ title: "ATTENTION", message: "Please select a class to assign this game to.", color: "#ffd700" });
        if (savedSets.length === 0) return setAlertData({ title: "ATTENTION", message: "Please create and save at least one Wave Set.", color: "#ffd700" });
        
        setConfirmData({
            title: "CONFIRM DEPLOYMENT",
            message: "Are you sure you want to deploy this Word Tower Defense game?"
        });
    };

    const executeDeployGame = async () => {
        setConfirmData(null);
        setIsSaving(true);

        let formattedOpenDate = (openDate && openTime) ? `${openDate} ${openTime}:00` : null;
        let formattedCloseDate = (!noCloseDate && closeDate && closeTime) ? `${closeDate} ${closeTime}:00` : null;
        const finalTimeLimit = unlimitedTime ? 0 : parseInt(timeLimit);

        try {
            const gameRes = await fetch('https://arcads-api.onrender.com/api/create-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacher_fid: user.uid,
                    class_id: selectedClass,
                    game_type: 'Tower Defense',
                    open_datetime: formattedOpenDate,
                    close_datetime: formattedCloseDate,
                    time_limit: finalTimeLimit
                })
            });
            const gameData = await gameRes.json();
            
            if (!gameRes.ok) throw new Error(gameData.error || "Failed to create game");
            const newGameId = gameData.game_id;

            for (let set of savedSets) {
                for (let i = 0; i < set.pairs.length; i++) {
                    const q = set.pairs[i];
                    
                    const otherAnswers = set.pairs.filter((_, idx) => idx !== i).map(x => x.answer);
                    const uniqueDecoys = [...new Set(otherAnswers)];
                    const shuffledDecoys = shuffleArray(uniqueDecoys).slice(0, 3);
                    
                    while (shuffledDecoys.length < 3) {
                        shuffledDecoys.push("---");
                    }

                    const finalChoices = shuffleArray([q.answer, ...shuffledDecoys]);
                    const correctIndex = finalChoices.indexOf(q.answer);

                    await fetch('https://arcads-api.onrender.com/api/add-question', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            game_id: newGameId,
                            question_text: `[${set.difficulty}] ${q.prompt}`, 
                            choice_a: finalChoices[0],
                            choice_b: finalChoices[1],
                            choice_c: finalChoices[2],
                            choice_d: finalChoices[3],
                            correct_answer: correctIndex.toString()
                        })
                    });
                }
            }

            setAlertData({ title: "SUCCESS", message: "Word Tower Defense Game Created Successfully!", color: "#14a014", navigate: true });

        } catch (err) {
            console.error(err);
            setAlertData({ title: "ERROR", message: "Error saving game. Please try again.", color: "#ff4c4c" });
        } finally {
            setIsSaving(false);
        }
    };

    const isFormComplete = pairs.every(p => p.prompt.trim() !== '' && p.answer.trim() !== '');

    return (
        <div className="create-td-container">
            <header className="create-td-header">
                <div>
                    <h1>🏰 Create Tower Defense</h1>
                    <p>Build matching waves for your students to survive.</p>
                </div>
                <button className="btn-back" onClick={() => navigate('/teacher-menu')}>
                    ← Back to Dashboard
                </button>
            </header>

            {/* 🟢 NEW: Retro Pixel Instruction Block */}
            <div style={{ textAlign: 'left', backgroundColor: 'rgba(255, 215, 0, 0.05)', padding: '20px', borderRadius: '12px', border: '1px dashed #ffd700', marginBottom: '20px', maxWidth: '100%' }}>
                <h3 style={{ color: '#ffd700', margin: '0 0 15px 0', fontSize: '1rem', fontFamily: '"Press Start 2P", cursive' }}>ℹ️ HOW IT WORKS:</h3>
                <p style={{ color: '#ccc', fontSize: '0.75rem', lineHeight: '1.8', marginBottom: '15px', fontFamily: '"Press Start 2P", cursive' }}>
                    Tower Defense is a matching game. Incoming enemies carry a prompt, and the student must shoot them down using the correct answer from their tower.
                </p>
                <p style={{color: '#ffd700', fontFamily: '"Press Start 2P", cursive', fontSize: '0.8rem', marginTop: '20px'}}>CREATION CHECKLIST:</p>
                <ul style={{marginTop: '15px', paddingLeft: '20px', color:'white', lineHeight:'1.8', fontFamily: '"Press Start 2P", cursive', fontSize: '0.75rem'}}>
                    <li style={{marginBottom: '10px'}}>Build your waves on the left. Set difficulty and pair Prompts with Answers.</li>
                    <li style={{marginBottom: '10px'}}>You must save at least one Wave Set to publish.</li>
                    <li>Configure your schedule and select the assigned classes on the right.</li>
                </ul>
            </div>

            <div className="create-td-layout">
                {/* LEFT COLUMN: Wave Builder */}
                <div className="td-builder-panel">
                    <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h2>⚔️ Wave Builder</h2>
                        <select 
                            className="wave-select" 
                            value={waveLevel} 
                            onChange={handleWaveLevelChange}
                        >
                            <option value="Easy">Easy (Early Waves)</option>
                            <option value="Medium">Medium (Mid Waves)</option>
                            <option value="Hard">Hard (Late Waves)</option>
                            <option value="Boss">Boss (Special)</option>
                        </select>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                            <label style={{ fontSize: '0.9rem', color: '#8b949e', fontWeight: 'bold' }}>Questions:</label>
                            <input 
                                type="number" 
                                min="3" 
                                max="15"
                                value={pairs.length}
                                onChange={handlePairCountChange}
                                style={{ width: '60px', padding: '8px', borderRadius: '6px', background: '#0d1117', border: '1px solid #30363d', color: '#fff', textAlign: 'center' }}
                            />
                        </div>
                    </div>
                    
                    <form onSubmit={handleSaveWaveSet} className="td-form">
                        <div className="grid-labels">
                            <label>Prompt (Enemy Text)</label>
                            <label>Correct Match (Tower Answer)</label>
                        </div>

                        <div className="pairs-container">
                            {pairs.map((pair, idx) => (
                                <div key={idx} className="pair-row">
                                    <div className="row-num">{idx + 1}</div>
                                    <input 
                                        type="text" 
                                        value={pair.prompt} 
                                        onChange={(e) => handlePairChange(idx, 'prompt', e.target.value)} 
                                        placeholder="e.g. Benevolent" 
                                        required
                                    />
                                    <span className="link-icon">→</span>
                                    <input 
                                        type="text" 
                                        value={pair.answer} 
                                        onChange={(e) => handlePairChange(idx, 'answer', e.target.value)} 
                                        placeholder="e.g. Kind" 
                                        required
                                    />
                                </div>
                            ))}
                        </div>

                        <button 
                            type="submit" 
                            className="btn-save-wave"
                            disabled={!isFormComplete}
                        >
                            {isFormComplete 
                                ? `💾 Save ${waveLevel} Wave Set` 
                                : "Fill all fields to save wave"}
                        </button>
                    </form>
                </div>

                {/* RIGHT COLUMN: Settings & Preview */}
                <div className="td-sidebar">
                    
                    {/* SCHEDULE SETTINGS */}
                    <div className="td-publish-card" style={{ marginBottom: '20px' }}>
                        <h2>📅 Schedule Settings</h2>
                        
                        <div className="form-group" style={{ marginBottom: '10px' }}>
                            <label>Opening Date & Time:</label>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input type="date" value={openDate} onChange={e => setOpenDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', background: '#161b22', border: '1px solid #30363d', color: '#c9d1d9', width: '50%' }} />
                                <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} style={{ padding: '8px', borderRadius: '4px', background: '#161b22', border: '1px solid #30363d', color: '#c9d1d9', width: '50%' }} />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                Closing Date & Time:
                                <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
                                    <input type="checkbox" checked={noCloseDate} onChange={e => setNoCloseDate(e.target.checked)} style={{marginRight: '3px'}}/> No Close Date
                                </span>
                            </label>
                            {!noCloseDate && (
                                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                    <input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} required={!noCloseDate} style={{ padding: '8px', borderRadius: '4px', background: '#161b22', border: '1px solid #30363d', color: '#c9d1d9', width: '50%' }} />
                                    <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} required={!noCloseDate} style={{ padding: '8px', borderRadius: '4px', background: '#161b22', border: '1px solid #30363d', color: '#c9d1d9', width: '50%' }} />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                Time Limit:
                                <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
                                    <input type="checkbox" checked={unlimitedTime} onChange={e => setUnlimitedTime(e.target.checked)} style={{marginRight: '3px'}}/> Unlimited
                                </span>
                            </label>
                            {!unlimitedTime && (
                                <select value={timeLimit} onChange={e => setTimeLimit(e.target.value)} style={{ padding: '8px', borderRadius: '4px', background: '#161b22', border: '1px solid #30363d', color: '#c9d1d9', width: '100%', marginTop: '5px' }}>
                                    <option value="5">5 Minutes</option>
                                    <option value="10">10 Minutes</option>
                                    <option value="15">15 Minutes</option>
                                    <option value="30">30 Minutes</option>
                                    <option value="60">60 Minutes</option>
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="td-publish-card">
                        <h2>🚀 Deploy Game</h2>
                        <div className="form-group">
                            <label>Assign to Class:</label>
                            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                                <option value="">-- Select a Class --</option>
                                {classes.map(cls => (
                                    <option key={cls.class_id} value={cls.class_id}>{cls.class_name}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            className="btn-publish" 
                            onClick={handleDeployClick} 
                            disabled={isSaving || savedSets.length === 0 || !selectedClass}
                        >
                            {isSaving ? "Publishing..." : "💾 PUBLISH GAME"}
                        </button>
                    </div>

                    <div className="td-q-list">
                        <div className="q-list-title-row">
                            <h2>📋 Configured Waves</h2>
                            <span className="count-badge ready">
                                {savedSets.length} Sets
                            </span>
                        </div>
                        
                        {savedSets.length === 0 ? (
                            <p className="empty-text">No waves configured yet. Build and save a wave on the left!</p>
                        ) : (
                            <div className="q-scroll-list">
                                {savedSets.map((set, idx) => (
                                    <div key={set.id} className="wave-set-card">
                                        <div className="wave-set-header">
                                            <span className={`diff-badge ${set.difficulty.toLowerCase()}`}>
                                                {set.difficulty} Wave
                                            </span>
                                            <div className="header-actions">
                                                <span className="pair-count">{set.pairs.length} Enemies</span>
                                                <button onClick={() => removeSavedSet(set.id)} className="btn-remove-set" title="Delete Wave">✕ Delete</button>
                                            </div>
                                        </div>
                                        <div className="wave-set-preview">
                                            {set.pairs.slice(0, 3).map((p, i) => (
                                                <div key={i} className="preview-line">
                                                    <span className="p-txt">{p.prompt}</span> → <span className="a-txt">{p.answer}</span>
                                                </div>
                                            ))}
                                            {set.pairs.length > 3 && (
                                                <div className="preview-line more">...and {set.pairs.length - 3} more</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}
            {confirmData && (
                <div style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(10, 15, 22, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
                    <div style={{backgroundColor: '#161b22', border: '2px solid #ffd700', padding: '30px', borderRadius: '10px', textAlign: 'center', maxWidth: '400px'}}>
                        <h2 style={{color: '#ffd700', margin: '0 0 20px 0'}}>{confirmData.title}</h2>
                        <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '30px'}}>{confirmData.message}</p>
                        <div style={{display: 'flex', justifyContent: 'center', gap: '15px'}}>
                            <button onClick={executeDeployGame} style={{background: '#ffd700', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer'}}>CONFIRM</button>
                            <button onClick={() => setConfirmData(null)} style={{background: 'transparent', color: '#fff', border: '1px solid #fff', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer'}}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}

            {alertData && (
                <div style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(10, 15, 22, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
                    <div style={{backgroundColor: '#161b22', border: `2px solid ${alertData.color}`, padding: '30px', borderRadius: '10px', textAlign: 'center', maxWidth: '400px'}}>
                        <h2 style={{color: alertData.color, margin: '0 0 20px 0'}}>{alertData.title}</h2>
                        <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '30px'}}>{alertData.message}</p>
                        <button onClick={() => {
                            setAlertData(null);
                            if (alertData.navigate) navigate('/teacher-menu');
                        }} style={{background: alertData.color, color: '#000', border: 'none', padding: '10px 30px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer'}}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
}