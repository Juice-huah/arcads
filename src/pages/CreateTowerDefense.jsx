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
    
    // Wave Builder State - 🟢 Defaults to 6 pairs now for Easy!
    const [waveLevel, setWaveLevel] = useState('Easy');
    const [pairs, setPairs] = useState(
        Array.from({ length: 6 }, () => ({ prompt: '', answer: '' }))
    );
    
    const [savedSets, setSavedSets] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // 🟢 Exact Pair Requirements matching our new game configuration!
    const getPairsForWave = (level) => {
        switch (level) {
            case 'Easy': return 6;
            case 'Medium': return 6;
            case 'Hard': return 8;
            case 'Boss': return 10;
            default: return 6;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchClasses(currentUser.uid);
            } else {
                navigate('/teacher-login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const fetchClasses = async (userId) => {
        try {
            const res = await fetch(`http://localhost:8081/api/get-classes/${userId}`);
            const data = await res.json();
            if (Array.isArray(data)) setClasses(data);
        } catch (err) {
            console.error("Error fetching classes:", err);
        }
    };

    // Automatically adjust the number of rows based on dropdown selection
    const handleWaveLevelChange = (e) => {
        const newLevel = e.target.value;
        setWaveLevel(newLevel);
        const requiredPairs = getPairsForWave(newLevel);
        
        if (pairs.length < requiredPairs) {
            // Add new empty rows if expanding
            const diff = requiredPairs - pairs.length;
            const extraPairs = Array.from({ length: diff }, () => ({ prompt: '', answer: '' }));
            setPairs([...pairs, ...extraPairs]);
        } else if (pairs.length > requiredPairs) {
            // Shrink the rows if selecting a lower difficulty
            setPairs(pairs.slice(0, requiredPairs));
        }
    };

    const handlePairChange = (index, field, value) => {
        const newPairs = [...pairs];
        newPairs[index] = { ...newPairs[index], [field]: value };
        setPairs(newPairs);
    };

    const handleSaveWaveSet = (e) => {
        e.preventDefault();
        
        // Validate all fields are filled
        const isValid = pairs.every(p => p.prompt.trim() !== '' && p.answer.trim() !== '');
        if (!isValid) {
            alert("Please fill out all Prompts and Answers before saving the wave.");
            return;
        }

        const newSet = {
            id: Date.now(),
            difficulty: waveLevel,
            pairs: [...pairs]
        };

        setSavedSets([...savedSets, newSet]);
        
        // Reset form to Easy defaults (6 pairs)
        setPairs(Array.from({ length: 6 }, () => ({ prompt: '', answer: '' })));
        setWaveLevel('Easy');
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

    const handleDeployGame = async () => {
        if (!selectedClass) return alert("Please select a class to assign this game to.");
        if (savedSets.length === 0) return alert("Please create and save at least one Wave Set.");
        
        setIsSaving(true);
        try {
            const gameRes = await fetch('http://localhost:8081/api/create-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacher_fid: user.uid,
                    class_id: selectedClass,
                    game_type: 'Tower Defense'
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

                    await fetch('http://localhost:8081/api/add-question', {
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

            alert("Word Tower Defense Game Created Successfully!");
            navigate('/teacher-menu');

        } catch (err) {
            console.error(err);
            alert("Error saving game. Please try again.");
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

            <div className="td-requirement-banner">
                <i className="fas fa-info-circle info-icon"></i>
                <div className="req-text">
                    <strong>WAVE CONFIGURATION REQUIREMENT:</strong><br/>
                    Create groups of questions organized by <strong>Wave Difficulty</strong>. The number of pairs is strictly set:
                    <ul>
                        <li><strong>Easy Wave:</strong> 6 pairs</li> {/* 🟢 UPDATED UI TEXT */}
                        <li><strong>Medium Wave:</strong> 6 pairs</li>
                        <li><strong>Hard Wave:</strong> 8 pairs</li>
                        <li><strong>Boss Wave:</strong> 10 pairs</li>
                    </ul>
                    The game will automatically mix the answers within that wave to create the wrong choices for the student.
                </div>
            </div>

            <div className="create-td-layout">
                {/* LEFT COLUMN: Wave Builder */}
                <div className="td-builder-panel">
                    <div className="panel-header">
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
                            onClick={handleDeployGame} 
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
                                                <span className="pair-count">{set.pairs.length} Pairs</span>
                                                <button onClick={() => removeSavedSet(set.id)} className="btn-remove-set" title="Delete Wave">✕ Delete Wave</button>
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
        </div>
    );
}