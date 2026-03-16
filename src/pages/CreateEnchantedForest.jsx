// src/pages/CreateEnchantedForest.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { LOCATIONS } from '../data/locations_enhanced.js'; 
import '../components/TeacherMenu.css';

// Helper function to auto-jumble a word
const shuffleWord = (word) => {
  if (!word) return '';
  const arr = word.toUpperCase().split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const scrambled = arr.join('');
  return scrambled === word.toUpperCase() && word.length > 1 ? shuffleWord(word) : scrambled;
};

function CreateEnchantedForest() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);

  // Form State
  const [gameTitle, setGameTitle] = useState('Enchanted Forest - Vocabulary');
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // Tab State for Locations
  const [activeLocTab, setActiveLocTab] = useState(0);

  // Initialize location data strictly as empty lists so they are OPTIONAL
  const [locationData, setLocationData] = useState(() => {
    return LOCATIONS.map(loc => ({
      id: loc.id,
      name: loc.name,
      bossName: loc.boss.name,
      words: [],      // Starts empty!
      bossWords: []   // Starts empty!
    }));
  });

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
      const res = await fetch(`http://localhost:8081/api/get-classes/${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].class_id);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const handleWordChange = (locIdx, isBoss, wordIdx, field, value) => {
    const newData = [...locationData];
    const targetArray = isBoss ? newData[locIdx].bossWords : newData[locIdx].words;
    targetArray[wordIdx][field] = value.toUpperCase(); 
    setLocationData(newData);
  };

  const handleAutoScramble = (locIdx, isBoss, wordIdx) => {
    const newData = [...locationData];
    const targetArray = isBoss ? newData[locIdx].bossWords : newData[locIdx].words;
    const currentAnswer = targetArray[wordIdx].answer;
    if (currentAnswer) {
      targetArray[wordIdx].scrambled = shuffleWord(currentAnswer);
      setLocationData(newData);
    }
  };

  const handleAddWord = (locIdx, isBoss) => {
    const newData = [...locationData];
    const targetArray = isBoss ? newData[locIdx].bossWords : newData[locIdx].words;
    targetArray.push({ answer: '', scrambled: '', hint: '' });
    setLocationData(newData);
  };

  const handleRemoveWord = (locIdx, isBoss, wordIdx) => {
    const newData = [...locationData];
    const targetArray = isBoss ? newData[locIdx].bossWords : newData[locIdx].words;
    targetArray.splice(wordIdx, 1);
    setLocationData(newData);
  };

  // Adjusts the exact number of blank question slots based on the teacher's input
  const handleWordCountChange = (locIdx, isBoss, newCount) => {
    if (newCount < 0 || newCount > 50) return; 
    const newData = [...locationData];
    const targetArray = isBoss ? newData[locIdx].bossWords : newData[locIdx].words;
    
    if (newCount > targetArray.length) {
      const toAdd = newCount - targetArray.length;
      for (let i = 0; i < toAdd; i++) {
        targetArray.push({ answer: '', scrambled: '', hint: '' });
      }
    } else if (newCount < targetArray.length) {
      targetArray.splice(newCount);
    }
    setLocationData(newData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClassId) return alert("Please select a class!");

    // 🟢 SMART FILTER: Removes empty questions and fully empty locations!
    const activeLocations = locationData
      .map(loc => ({
        ...loc,
        // Strip out any accidental blank rows the teacher forgot to fill
        words: loc.words.filter(w => w.answer.trim() !== ''),
        bossWords: loc.bossWords.filter(w => w.answer.trim() !== '')
      }))
      // ONLY KEEP locations that actually have at least 1 question
      .filter(loc => loc.words.length > 0 || loc.bossWords.length > 0);

    if (activeLocations.length === 0) {
      return alert("You must add at least one question to a location before saving!");
    }

    const selectedClass = classes.find(c => c.class_id.toString() === selectedClassId.toString());

    const gamePayload = {
      teacher_fid: user.uid,
      class_id: selectedClassId,
      class_name: selectedClass ? selectedClass.class_name : 'Unknown Class',
      game_type: 'ENCHANTED_FOREST',
      game_title: gameTitle,
      // Only the populated locations will be sent to the database!
      game_data: JSON.stringify({ locations: activeLocations }) 
    };

    try {
      const res = await fetch('http://localhost:8081/api/create-enchanted-forest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gamePayload)
      });
      if (res.ok) {
        alert("Enchanted Forest game created and assigned successfully!");
        navigate('/teacher-menu');
      } else {
        alert("Failed to create game.");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error.");
    }
  };

  return (
    <div className="teacher-dashboard" style={{ flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      {/* --- HEADER --- */}
      <div className="section-header" style={{ padding: '20px 40px', borderBottom: '1px solid rgba(77,255,145,0.2)', background: '#0a0f16' }}>
        <h2 style={{ color: '#4dff91', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.4rem' }}>
          🌳 CREATE ENCHANTED FOREST
        </h2>
        <button className="btn btn-secondary" onClick={() => navigate('/teacher-menu')} style={{ padding: '8px 20px' }}>
          BACK TO MENU
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#0d1117' }}>
        
        {/* --- SIDEBAR TABS --- */}
        <div className="sidebar" style={{ width: '300px', overflowY: 'auto', borderRight: '1px solid rgba(77,255,145,0.2)', background: '#0a0f16', padding: '20px 10px' }}>
          <h3 style={{ color: '#aaa', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '15px', paddingLeft: '10px' }}>GAME LOCATIONS</h3>
          {locationData.map((loc, idx) => {
            const totalQuestions = loc.words.length + loc.bossWords.length;
            const isActive = totalQuestions > 0;

            return (
              <button
                key={loc.id}
                style={{ 
                  width: '100%', textAlign: 'left', padding: '15px', marginBottom: '8px',
                  background: activeLocTab === idx ? 'rgba(77,255,145,0.1)' : 'transparent',
                  border: 'none',
                  borderLeft: activeLocTab === idx ? '4px solid #4dff91' : '4px solid transparent',
                  borderRadius: '0 8px 8px 0',
                  cursor: 'pointer', transition: 'all 0.2s',
                  opacity: isActive || activeLocTab === idx ? 1 : 0.6 // Dim unused locations
                }}
                onClick={() => setActiveLocTab(idx)}
              >
                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: activeLocTab === idx ? '#4dff91' : '#fff' }}>
                  {loc.name}
                </div>
                {/* 🟢 NEW: Active Question Counter */}
                <div style={{ fontSize: '0.75rem', color: isActive ? '#4dff91' : '#777', marginTop: '6px', fontWeight: isActive ? 'bold' : 'normal' }}>
                  {totalQuestions > 0 ? `✅ ${totalQuestions} Question${totalQuestions !== 1 ? 's' : ''}` : 'Optional (0 Questions)'}
                </div>
              </button>
            );
          })}
        </div>

        {/* --- MAIN CONTENT FORM --- */}
        <div className="content-area" style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
          <form onSubmit={handleSubmit} style={{ maxWidth: '1000px', margin: '0 auto' }}>
            
            {/* GENERAL SETTINGS CARD */}
            <div style={{ background: '#161b22', padding: '25px', borderRadius: '12px', marginBottom: '40px', border: '1px solid #30363d', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              <h3 style={{ color: '#fff', margin: '0 0 20px 0', fontSize: '1.2rem', borderBottom: '1px solid #30363d', paddingBottom: '10px' }}>General Settings</h3>
              
              <div style={{ display: 'flex', gap: '30px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#8b949e', fontWeight: 'bold' }}>Game Title</label>
                  <input 
                    type="text" 
                    value={gameTitle} 
                    onChange={(e) => setGameTitle(e.target.value)} 
                    required 
                    style={{ padding: '12px', borderRadius: '6px', background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', fontSize: '1rem' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#8b949e', fontWeight: 'bold' }}>Assign to Class</label>
                  <select 
                    value={selectedClassId} 
                    onChange={(e) => setSelectedClassId(e.target.value)} 
                    required 
                    style={{ padding: '12px', borderRadius: '6px', background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', fontSize: '1rem' }}
                  >
                    {classes.map(c => (
                      <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* LOCATION CONFIGURATION */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', borderBottom: '2px solid rgba(77,255,145,0.3)', paddingBottom: '10px' }}>
              <h2 style={{ color: '#4dff91', fontSize: '1.6rem', margin: 0 }}>
                📍 {locationData[activeLocTab].name}
              </h2>
              <span style={{ color: '#8b949e', fontSize: '0.9rem', fontStyle: 'italic' }}>
                *Leave empty to skip this location in the game.
              </span>
            </div>
            
            {/* Regular Words */}
            <WordSection 
              title="🗣️ Regular Encounters" 
              words={locationData[activeLocTab].words} 
              onAdd={() => handleAddWord(activeLocTab, false)}
              onRemove={(wIdx) => handleRemoveWord(activeLocTab, false, wIdx)}
              onChange={(wIdx, field, val) => handleWordChange(activeLocTab, false, wIdx, field, val)}
              onScramble={(wIdx) => handleAutoScramble(activeLocTab, false, wIdx)}
              onCountChange={(newCount) => handleWordCountChange(activeLocTab, false, newCount)}
            />

            <div style={{ height: '40px' }} />

            {/* Boss Words */}
            <WordSection 
              title={`⚔️ Boss Encounter: ${locationData[activeLocTab].bossName}`} 
              accent="#ff6b6b"
              words={locationData[activeLocTab].bossWords} 
              onAdd={() => handleAddWord(activeLocTab, true)}
              onRemove={(wIdx) => handleRemoveWord(activeLocTab, true, wIdx)}
              onChange={(wIdx, field, val) => handleWordChange(activeLocTab, true, wIdx, field, val)}
              onScramble={(wIdx) => handleAutoScramble(activeLocTab, true, wIdx)}
              onCountChange={(newCount) => handleWordCountChange(activeLocTab, true, newCount)}
            />

            {/* SUBMIT BUTTON */}
            <div style={{ marginTop: '50px', padding: '20px 0', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                style={{ 
                  background: 'linear-gradient(135deg, #4dff91, #21a952)', color: '#000', 
                  border: 'none', padding: '15px 40px', fontSize: '1.1rem', fontWeight: 'bold', 
                  borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(77,255,145,0.3)' 
                }}
              >
                🚀 SAVE & ASSIGN GAME
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

// --- CLEAN CARD-BASED WORD ROWS ---
function WordSection({ title, accent = '#4dff91', words, onAdd, onRemove, onChange, onScramble, onCountChange }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ color: accent, margin: 0, fontSize: '1.2rem' }}>{title}</h3>
        
        {/* Controls for defining number of questions easily */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: '#8b949e', fontSize: '0.85rem', fontWeight: 'bold' }}>Number of Questions:</label>
            <input 
              type="number" 
              min="0" 
              max="50"
              value={words.length}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) onCountChange(val);
              }}
              style={{ width: '60px', padding: '6px', borderRadius: '4px', background: '#0d1117', border: '1px solid #30363d', color: '#fff', textAlign: 'center' }}
            />
          </div>
          
          <button 
            type="button" 
            onClick={onAdd} 
            style={{ background: 'transparent', border: `1px solid ${accent}`, color: accent, padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + Add Word
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {words.map((word, idx) => (
          <div key={idx} style={{ background: '#161b22', border: `1px solid ${accent}40`, padding: '20px', borderRadius: '10px', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
            
            <div style={{ color: '#8b949e', fontWeight: 'bold', fontSize: '1.1rem', width: '30px' }}>
              #{idx + 1}
            </div>

            {/* Answer Field */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: '#8b949e', fontWeight: 'bold' }}>Answer (Target Word)</label>
              <input 
                type="text" 
                placeholder="e.g. SYSTEM" 
                value={word.answer} 
                onChange={e => onChange(idx, 'answer', e.target.value)} 
                required 
                style={{ padding: '12px', borderRadius: '6px', background: '#0d1117', border: '1px solid #30363d', color: '#fff' }}
              />
            </div>

            {/* Scrambled Field with Inline Button */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <label style={{ fontSize: '0.8rem', color: '#8b949e', fontWeight: 'bold' }}>Scrambled</label>
                <button 
                  type="button" 
                  onClick={() => onScramble(idx)} 
                  style={{ background: 'rgba(77,255,145,0.15)', color: '#4dff91', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Auto-Scramble
                </button>
              </div>
              <input 
                type="text" 
                placeholder="e.g. MSTYSE" 
                value={word.scrambled} 
                onChange={e => onChange(idx, 'scrambled', e.target.value)} 
                required 
                style={{ padding: '12px', borderRadius: '6px', background: '#0d1117', border: '1px solid #30363d', color: '#fff' }}
              />
            </div>

            {/* Hint Field */}
            <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: '#8b949e', fontWeight: 'bold' }}>Player Hint</label>
              <input 
                type="text" 
                placeholder="A connected group of computers..." 
                value={word.hint} 
                onChange={e => onChange(idx, 'hint', e.target.value)} 
                required 
                style={{ padding: '12px', borderRadius: '6px', background: '#0d1117', border: '1px solid #30363d', color: '#fff' }}
              />
            </div>

            {/* Delete Button */}
            <div style={{ paddingTop: '24px' }}>
              <button 
                type="button" 
                onClick={() => onRemove(idx)} 
                style={{ background: '#da3633', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '6px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Remove Word"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
        
        {words.length === 0 && (
          <div style={{ padding: '30px', textAlign: 'center', background: '#161b22', border: '1px dashed #30363d', borderRadius: '10px', color: '#8b949e' }}>
            No words added yet. Adjust the "Number of Questions" input above to begin.
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateEnchantedForest;