// src/pages/CreateStarType.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import '../components/TeacherMenu.css'; 

function CreateStarType() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); 
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [alertData, setAlertData] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  const [openDate, setOpenDate] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [noCloseDate, setNoCloseDate] = useState(true);
  const [closeDate, setCloseDate] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [unlimitedTime, setUnlimitedTime] = useState(true);
  const [timeLimit, setTimeLimit] = useState(15); 

  const [title, setTitle] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [wordsList, setWordsList] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
        if (auth.currentUser) {
            try {
                const res = await fetch(`https://arcads-api.onrender.com/api/get-classes/${auth.currentUser.uid}`);
                const data = await res.json();
                if (Array.isArray(data)) setClasses(data);
            } catch (err) { console.error(err); }
        }
    };
    fetchClasses();
  }, []);

  const handleAddWord = () => {
      const inputStr = wordInput.trim().toUpperCase();
      if (!inputStr) return;

      const newWords = inputStr.split(/[\s,]+/).filter(w => w.trim() !== '');

      let addedCount = 0;
      let duplicateCount = 0;
      const updatedList = [...wordsList];

      newWords.forEach((word, index) => {
          if (updatedList.some(w => w.word === word)) {
              duplicateCount++;
          } else {
              updatedList.push({
                  id: Date.now() + index, 
                  word: word,
                  difficulty: difficulty
              });
              addedCount++;
          }
      });

      setWordsList(updatedList);
      setWordInput('');
      
      if (duplicateCount > 0 && addedCount === 0) {
          setAlertData({ title: "ATTENTION", message: "All those words are already in your fleet!", color: "#ff9900" });
      }
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault(); 
          handleAddWord();
      }
  };

  const removeWord = (id) => {
      setWordsList(wordsList.filter(w => w.id !== id));
  };

  const handleNextToSchedule = () => {
      if (!title.trim()) return setAlertData({ title: "ATTENTION", message: "Please enter a Mission Title.", color: "#ff9900" });
      if (wordsList.length === 0 && wordInput.trim().length > 0) return setAlertData({ title: "ATTENTION", message: "You typed words into the box but forgot to add them! Please click '+ ADD WORDS' first.", color: "#ff9900" });
      if (wordsList.length === 0) return setAlertData({ title: "ATTENTION", message: "Please add at least one word to your Mission Fleet.", color: "#ff9900" });
      setStep(3);
  };

  const toggleClassSelection = (classId) => {
      if (selectedClasses.includes(classId)) {
          setSelectedClasses(selectedClasses.filter(id => id !== classId));
      } else {
          setSelectedClasses([...selectedClasses, classId]);
      }
  };

  const handleSubmitClick = () => {
      if (selectedClasses.length === 0) return setAlertData({ title: "ATTENTION", message: "Please select at least one class.", color: "#ff9900" });
      setConfirmData({
          title: "CONFIRM ASSIGNMENT",
          message: `Assign this StarType Mission to ${selectedClasses.length} class(es)?`
      });
  };

  const executeCreateGame = async () => {
    setConfirmData(null);
    setLoading(true);

    let formattedOpenDate = (openDate && openTime) ? `${openDate} ${openTime}:00` : null;
    let formattedCloseDate = (!noCloseDate && closeDate && closeTime) ? `${closeDate} ${closeTime}:00` : null;
    const finalTimeLimit = unlimitedTime ? 0 : parseInt(timeLimit);

    try {
        const wordsPayload = wordsList.map(w => ({
            word: w.word,
            difficulty: w.difficulty
        }));

        for (const classId of selectedClasses) {
            await fetch('https://arcads-api.onrender.com/api/create-startype', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacher_fid: auth.currentUser.uid,
                    class_id: classId, 
                    custom_title: title.trim(),
                    words: wordsPayload,
                    open_datetime: formattedOpenDate,
                    close_datetime: formattedCloseDate,
                    time_limit: finalTimeLimit
                })
            });
        }

        setTimeout(() => {
            setLoading(false);
            setAlertData({ title: "SUCCESS", message: "🚀 StarType Mission Assigned Successfully!", color: "#14a014", navigate: true });
        }, 1000);

    } catch (err) {
        console.error(err);
        setAlertData({ title: "ERROR", message: "Server Error. Failed to save the games.", color: "#ff4c4c" });
        setLoading(false);
    }
  };

  const renderStep1_Intro = () => (
    <div className="game-card" style={cardStyle}>
      <h2 style={{color: '#00f5ff', fontFamily: '"Orbitron", sans-serif', marginBottom:'20px'}}>CREATE NEW STARTYPE MISSION</h2>
      
      <div style={{textAlign: 'left', backgroundColor: '#020d24', padding: '20px', borderRadius: '8px', border: '1px dashed #00f5ff', marginBottom:'30px'}}>
        <h3 style={{ color: '#00f5ff', margin: '0 0 15px 0', fontSize: '1rem', fontFamily: '"Press Start 2P", cursive' }}>ℹ️ HOW IT WORKS:</h3>
        <p style={{ color: '#ccc', fontSize: '0.75rem', lineHeight: '1.8', marginBottom: '15px', fontFamily: '"Press Start 2P", cursive' }}>
            StarType is a galactic typing combat game. Enemy ships fly towards the player, and they must quickly type the attached vocabulary words to destroy them before losing health.
        </p>
        <p style={{color: '#00f5ff', fontFamily: '"Press Start 2P", cursive', fontSize: '0.8rem', marginTop: '20px'}}>CREATION CHECKLIST:</p>
        <ul style={{marginTop: '15px', paddingLeft: '20px', color:'white', lineHeight:'1.8', fontFamily: '"Press Start 2P", cursive', fontSize: '0.75rem'}}>
            <li style={{marginBottom: '10px'}}><b>Bulk Add:</b> Copy/paste entire lists of words at once in Step 2. Spaces will separate them.</li>
            <li style={{marginBottom: '10px'}}>Assign difficulties to control which wave they appear in (Easy early on, Expert later).</li>
            <li>Set your schedule and assign to your classes!</li>
        </ul>
      </div>

      <div style={{display:'flex', justifyContent: 'center', gap: '20px'}}>
        <button className="btn-secondary" onClick={() => navigate('/teacher-menu')} style={btnSecStyle}>CANCEL</button>
        <button className="btn-primary" onClick={() => setStep(2)} style={btnPriStyle}>START CONFIGURATION</button>
      </div>
    </div>
  );

  const renderStep2_Config = () => (
    <div style={{maxWidth: '1000px', margin: '0 auto'}}>
        <h2 style={{color: '#00f5ff', textAlign:'center', marginBottom:'20px', fontFamily: '"Orbitron", sans-serif'}}>CREATE MISSION FLEET</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={innerCardStyle}>
                    <h3 style={cardTitleStyle}>1. Mission Title</h3>
                    <input 
                        style={inputStyle} 
                        placeholder="Game Title (e.g., Computer Hardware Terms)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div style={innerCardStyle}>
                    <h3 style={cardTitleStyle}>2. Add Enemy Words (Bulk Add)</h3>
                    <p style={{color: '#8b949e', fontSize: '0.85rem', marginBottom: '15px'}}>
                        Type or paste a list of words separated by spaces or commas.
                    </p>
                    
                    <div style={{display: 'flex', gap: '10px', flexDirection: 'column'}}>
                        <textarea 
                            style={{...inputStyle, textTransform: 'uppercase', height: '100px', resize: 'none'}} 
                            placeholder="e.g. CPU, MOTHERBOARD, MOUSE, KEYBOARD..."
                            value={wordInput}
                            onChange={(e) => setWordInput(e.target.value)}
                            onKeyDown={handleKeyDown} 
                        />
                        <div style={{display: 'flex', gap: '10px'}}>
                            <select style={dropdownStyle} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                <option value="Easy">🟢 Easy (Waves 1-2)</option>
                                <option value="Medium">🟡 Medium (Waves 3-4)</option>
                                <option value="Hard">🟠 Hard (Waves 5-6)</option>
                                <option value="Expert">🔴 Expert (Waves 7+)</option>
                            </select>
                            <button type="button" onClick={handleAddWord} style={addBtnStyle}>+ ADD WORDS</button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={innerCardStyle}>
                <h3 style={cardTitleStyle}>3. Mission Fleet ({wordsList.length} Words)</h3>
                {wordsList.length === 0 ? (
                    <div style={emptyStateStyle}>🛸 No words added yet. Paste a list to build your fleet!</div>
                ) : (
                    <div style={{maxHeight: '350px', overflowY: 'auto', paddingRight: '10px'}}>
                        {['Easy', 'Medium', 'Hard', 'Expert'].map(level => {
                            const wordsInTier = wordsList.filter(w => w.difficulty === level);
                            if (wordsInTier.length === 0) return null;
                            const tierColors = { Easy: '#4ade80', Medium: '#fbbf24', Hard: '#f97316', Expert: '#ef4444' };

                            return (
                                <div key={level} style={{marginBottom: '15px'}}>
                                    <h4 style={{color: tierColors[level], borderBottom: `1px solid ${tierColors[level]}40`, paddingBottom: '5px', marginBottom: '10px'}}>
                                        {level} Tier ({wordsInTier.length})
                                    </h4>
                                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                                        {wordsInTier.map(w => (
                                            <div key={w.id} style={wordChipStyle}>
                                                {w.word}
                                                <span style={deleteIconStyle} onClick={() => removeWord(w.id)}>✕</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
            <button onClick={() => setStep(1)} className="btn" style={{...btnSecStyle, flex: 1}}>BACK</button>
            <button onClick={handleNextToSchedule} className="btn" style={{...btnPriStyle, flex: 1}}>NEXT: SCHEDULE</button>
        </div>
    </div>
  );

  const renderStep3_Schedule = () => (
    <div className="game-card" style={cardStyle}>
        <h2 style={{color: '#00f5ff', marginBottom:'20px', fontFamily: '"Orbitron", sans-serif'}}>SCHEDULE MISSION</h2>
        <div style={{textAlign: 'left', backgroundColor: '#020d24', padding: '20px', borderRadius: '8px', border: '1px dashed #00f5ff', marginBottom: '20px'}}>
            <label style={{display: 'block', color: '#00f5ff', marginBottom: '5px'}}>OPENING:</label>
            <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                <input type="date" value={openDate} onChange={e => setOpenDate(e.target.value)} style={dropdownStyle} />
                <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} style={dropdownStyle} />
            </div>
            <label style={{display: 'block', color: '#ff4c4c', marginBottom: '5px'}}>CLOSING:</label>
            <label style={{fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', color: '#fff'}}>
                <input type="checkbox" checked={noCloseDate} onChange={e => setNoCloseDate(e.target.checked)} /> No Closing Date
            </label>
            {!noCloseDate && (
                <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                    <input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} style={dropdownStyle} />
                    <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} style={dropdownStyle} />
                </div>
            )}
            <label style={{display: 'block', color: '#ff9900', marginBottom: '5px', marginTop: '10px'}}>TIME LIMIT:</label>
            <label style={{fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', color: '#fff'}}>
                <input type="checkbox" checked={unlimitedTime} onChange={e => setUnlimitedTime(e.target.checked)} /> Unlimited
            </label>
            {!unlimitedTime && (
                <select value={timeLimit} onChange={e => setTimeLimit(e.target.value)} style={{...dropdownStyle, width:'100%'}}>
                    {[5, 10, 15, 30, 60].map(m => <option key={m} value={m}>{m} Minutes</option>)}
                </select>
            )}
        </div>
        <div style={{display:'flex', gap:'20px', justifyContent:'center'}}>
            <button className="btn-secondary" onClick={() => setStep(2)} style={btnSecStyle}>BACK</button>
            <button className="btn-primary" onClick={() => setStep(4)} style={btnPriStyle}>NEXT: ASSIGN</button>
        </div>
    </div>
  );

  const renderStep4_Assign = () => (
    <div className="game-card" style={cardStyle}>
      <h2 style={{color: '#00f5ff', marginBottom:'20px', fontFamily: '"Orbitron", sans-serif'}}>ASSIGN TO CLASSES</h2>
      <p style={{color:'#ccc', marginBottom:'20px'}}>Select all the classes that should receive this typing activity.</p>
      
      <div style={{display:'flex', flexDirection:'column', gap:'10px', maxHeight:'300px', overflowY:'auto', marginBottom:'30px', textAlign: 'left'}}>
        {classes.length === 0 ? (
           <p style={{color: '#ff4444'}}>No classes found. Create one first.</p>
        ) : (
           classes.map((cls) => {
             const isSelected = selectedClasses.includes(cls.class_id);
             return (
               <div 
                 key={cls.class_id} 
                 onClick={() => toggleClassSelection(cls.class_id)}
                 style={{
                   padding:'15px', 
                   border: isSelected ? '2px solid #00f5ff' : '1px solid #555',
                   background: isSelected ? 'rgba(0, 245, 255, 0.1)' : '#020d24',
                   borderRadius:'8px',
                   cursor:'pointer',
                   display:'flex', alignItems:'center', gap:'15px'
                 }}
               >
                 <div style={{
                     width: '22px', height: '22px', borderRadius: '4px', 
                     border: isSelected ? 'none' : '2px solid #fff', 
                     background: isSelected ? '#00f5ff' : 'transparent',
                     display: 'flex', alignItems: 'center', justifyContent: 'center'
                 }}>
                     {isSelected && <span style={{color: '#000', fontSize: '16px', fontWeight: 'bold'}}>✓</span>}
                 </div>
                 <span style={{color:'white', fontWeight:'bold', fontFamily: "'Share Tech Mono', monospace"}}>{cls.class_name}</span> 
               </div>
             );
           })
        )}
      </div>

      <div style={{display:'flex', gap:'20px', justifyContent:'center'}}>
        <button className="btn-secondary" onClick={() => setStep(3)} style={btnSecStyle}>BACK</button>
        <button 
          className="btn-primary" 
          onClick={handleSubmitClick}
          disabled={selectedClasses.length === 0 || loading}
          style={{...btnPriStyle, opacity: selectedClasses.length === 0 ? 0.5 : 1}}
        >
          {loading ? "CREATING..." : `ASSIGN TO ${selectedClasses.length} CLASS${selectedClasses.length !== 1 ? 'ES' : ''}`}
        </button>
      </div>
    </div>
  );

  return (
    <div className="teacher-dashboard" style={{ display: 'block', padding: '40px', overflowY: 'auto', minHeight: '100vh', backgroundColor: '#00050f' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        {step === 1 && renderStep1_Intro()}
        {step === 2 && renderStep2_Config()}
        {step === 3 && renderStep3_Schedule()}
        {step === 4 && renderStep4_Assign()}
      </div>

      {confirmData && (
          <div className="modal-overlay" style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(12, 14, 23, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
              <div className="modal-box" style={{backgroundColor: '#010a1f', border: '2px solid #00f5ff', padding: '30px', borderRadius: '10px', textAlign: 'center', maxWidth: '400px', fontFamily: "'Orbitron', sans-serif"}}>
                  <h2 style={{color: '#00f5ff', marginBottom: '20px'}}>{confirmData.title}</h2>
                  <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '30px', fontFamily: "'Share Tech Mono', monospace"}}>{confirmData.message}</p>
                  <div style={{display: 'flex', justifyContent: 'center', gap: '15px'}}>
                      <button className="btn-primary" onClick={executeCreateGame} style={btnPriStyle}>CONFIRM</button>
                      <button className="btn-secondary" onClick={() => setConfirmData(null)} style={btnSecStyle}>CANCEL</button>
                  </div>
              </div>
          </div>
      )}

      {alertData && (
          <div className="modal-overlay" style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(12, 14, 23, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
              <div className="modal-box" style={{backgroundColor: '#010a1f', border: `2px solid ${alertData.color}`, padding: '30px', borderRadius: '10px', textAlign: 'center', maxWidth: '400px', fontFamily: "'Orbitron', sans-serif"}}>
                  <h2 style={{color: alertData.color, marginBottom: '20px'}}>{alertData.title}</h2>
                  <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '30px', fontFamily: "'Share Tech Mono', monospace"}}>{alertData.message}</p>
                  <button className="btn-primary" onClick={() => {
                      setAlertData(null);
                      if (alertData.navigate) navigate('/teacher-menu');
                  }} style={btnPriStyle}>OK</button>
              </div>
          </div>
      )}
    </div>
  );
}

const cardStyle = {
    background: '#010a1f', 
    padding: '40px', 
    borderRadius: '12px', 
    border: '2px solid #00f5ff', 
    boxShadow: '0 0 20px rgba(0,245,255,0.2)',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: "'Share Tech Mono', monospace"
};

const innerCardStyle = {
    backgroundColor: '#020d24',
    border: '1px solid rgba(0,245,255,0.2)',
    borderRadius: '8px',
    padding: '25px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    fontFamily: "'Share Tech Mono', monospace"
};

const cardTitleStyle = {
    fontSize: '1.2rem', color: '#fff', marginBottom: '15px', fontFamily: "'Orbitron', sans-serif"
};

const inputStyle = {
    width: '100%', padding: '12px', background: 'rgba(0,245,255,0.04)', 
    border: '1px solid rgba(0,245,255,0.3)', color: 'white', borderRadius: '5px',
    fontFamily: "'Share Tech Mono', monospace", outline: 'none'
};

const dropdownStyle = {
    padding: '12px', background: 'rgba(0,245,255,0.04)', color: 'white', 
    border: '1px solid rgba(0,245,255,0.3)', flex: 1, borderRadius: '5px',
    fontFamily: "'Share Tech Mono', monospace", outline: 'none'
};

const addBtnStyle = {
    padding: '0 20px', backgroundColor: '#00f5ff', color: '#000',
    border: 'none', borderRadius: '4px', cursor: 'pointer',
    fontFamily: "'Orbitron', sans-serif", fontWeight: 'bold'
};

const emptyStateStyle = {
    textAlign: 'center', padding: '40px 20px', color: '#3a6080',
    fontStyle: 'italic', border: '1px dashed rgba(0,245,255,0.2)', borderRadius: '8px'
};

const wordChipStyle = {
    backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', 
    gap: '10px', fontSize: '0.9rem', color: '#fff'
};

const deleteIconStyle = {
    color: '#ff2244', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
};

const btnPriStyle = {
    padding: '15px 30px', background: '#00f5ff', color: '#000', border: 'none', 
    borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontFamily: '"Orbitron", sans-serif'
};

const btnSecStyle = {
    padding: '15px 30px', background: 'transparent', color: '#00f5ff', 
    border: '2px solid #00f5ff', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontFamily: '"Orbitron", sans-serif'
};

export default CreateStarType;