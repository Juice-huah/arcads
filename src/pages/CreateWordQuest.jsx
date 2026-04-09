// src/pages/CreateWordQuest.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import './GamesCSS.css'; 

const CreateWordQuest = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  // 🟢 NEW: Game Title State
  const [gameTitle, setGameTitle] = useState('Word Quest');

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

  // Default Questions State
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correct: "" }
  ]);

  // --- 1. Fetch Classes ---
  useEffect(() => {
    const fetchClasses = async () => {
      if (!auth.currentUser) return;
      try {
        const res = await fetch(`https://arcads-api.onrender.com/api/get-teacher-classes/${auth.currentUser.uid}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableClasses(data);
        }
      } catch (error) { console.error(error); }
    };
    fetchClasses();
  }, []);

  // --- 2. Handlers ---
  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correct: "" }]);
  };

  const removeQuestion = (idx) => {
    if(questions.length > 1) {
        setQuestions(questions.filter((_, i) => i !== idx));
    }
  };

  const updateQuestion = (idx, field, value, optIdx = null) => {
    const newQs = [...questions];
    if (field === 'q') newQs[idx].question = value;
    if (field === 'opt') newQs[idx].options[optIdx] = value;
    if (field === 'correct') newQs[idx].correct = value;
    setQuestions(newQs);
  };

  const handleSubmitClick = () => {
    if (!selectedClass) return setAlertData({ title: "ATTENTION", message: "Select a class!", color: "#ff9900" });
    
    for (let i=0; i<questions.length; i++) {
        if (!questions[i].correct || questions[i].correct === "") {
            return setAlertData({ title: "ATTENTION", message: `Question ${i+1} needs a correct answer selected.`, color: "#ff9900" });
        }
    }

    setConfirmData({
        title: "CONFIRM CREATION",
        message: "Create and assign this Word Quest to the selected class?"
    });
  };

  const executeCreateGame = async () => {
    setConfirmData(null);
    setLoading(true);

    let formattedOpenDate = (openDate && openTime) ? `${openDate} ${openTime}:00` : null;
    let formattedCloseDate = (!noCloseDate && closeDate && closeTime) ? `${closeDate} ${closeTime}:00` : null;
    const finalTimeLimit = unlimitedTime ? 0 : parseInt(timeLimit);

    try {
        const res = await fetch('https://arcads-api.onrender.com/api/create-word-quest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teacher_fid: auth.currentUser.uid,
                class_id: selectedClass,
                custom_title: gameTitle, // 🟢 FIXED: Add custom_title to payload
                questions: questions,
                open_datetime: formattedOpenDate,
                close_datetime: formattedCloseDate,
                time_limit: finalTimeLimit
            })
        });

        if (res.ok) {
            setTimeout(() => {
                setLoading(false);
                setAlertData({ title: "SUCCESS", message: "Word Quest Created Successfully!", color: "#14a014", navigate: true });
            }, 1000);
        } else {
            setAlertData({ title: "ERROR", message: "Error creating game", color: "#ff4c4c" });
            setLoading(false);
        }
    } catch (e) {
        console.error(e);
        setAlertData({ title: "ERROR", message: "Server Error", color: "#ff4c4c" });
        setLoading(false);
    }
  };

  // --- 3. Render Views ---

  const renderIntro = () => (
    <div className="game-card">
      <h2 style={{color: '#ce93d8', marginBottom: '20px'}}>CREATE WORD QUEST</h2>
      
      {/* 🟢 NEW: Enhanced Instructions with Pixel Font */}
      <div style={{textAlign:'left', background:'#0c0e17', padding:'20px', borderRadius:'8px', border: '1px dashed #ce93d8', marginBottom:'20px'}}>
        <h3 style={{ color: '#ce93d8', margin: '0 0 15px 0', fontSize: '1rem', fontFamily: '"Press Start 2P", cursive' }}>ℹ️ HOW IT WORKS:</h3>
        <p style={{ color: '#ccc', fontSize: '0.75rem', lineHeight: '1.8', marginBottom: '15px', fontFamily: '"Press Start 2P", cursive' }}>
            Word Quest is a classic Snakes & Ladders style board game. Students play against an AI opponent, rolling dice and answering questions to climb to the finish line.
        </p>
        <p style={{color:'#ce93d8', fontSize:'0.8rem', fontWeight: 'bold', fontFamily: '"Press Start 2P", cursive', marginTop: '20px'}}>CREATION CHECKLIST:</p>
        <ul style={{fontSize:'0.75rem', color:'white', marginTop:'15px', lineHeight: '1.8', fontFamily: '"Press Start 2P", cursive'}}>
            <li style={{marginBottom: '10px'}}>Add multiple-choice questions (we recommend at least 10 for a good game length).</li>
            <li style={{marginBottom: '10px'}}>Set your opening, closing, and time limits in the Schedule step.</li>
            <li>Assign the board game to your active classes!</li>
        </ul>
      </div>

      {/* 🟢 NEW: Title Input Box */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px', border: '1px solid #4a5568', marginBottom: '30px', textAlign: 'left' }}>
        <label style={{ display: 'block', color: '#ce93d8', fontWeight: 'bold', marginBottom: '10px', fontFamily: '"Press Start 2P", cursive', fontSize: '0.8rem' }}>Activity Title</label>
        <input 
            type="text" 
            value={gameTitle} 
            onChange={(e) => setGameTitle(e.target.value)} 
            style={{ width: '100%', padding: '12px', background: '#1a202c', border: '1px solid #4a5568', color: 'white', borderRadius: '5px', boxSizing: 'border-box' }} 
            required 
        />
      </div>

      <div className="btn-group">
        <button className="btn-secondary" onClick={() => navigate('/teacher-menu')}>CANCEL</button>
        <button className="btn-primary" onClick={() => setStep(2)} style={{background:'#ce93d8', color:'#1a0d2e', boxShadow:'0 6px 0 #8e24aa'}}>START CONFIG</button>
      </div>
    </div>
  );

  const renderQuestions = () => (
    <div className="game-card" style={{maxWidth:'900px'}}>
      <h2 style={{color: '#ce93d8'}}>CONFIGURE QUESTIONS</h2>
      <div className="scroll-container">
        {questions.map((q, idx) => (
          <div key={idx} className="question-block" style={{borderColor:'#ce93d8'}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
                <div className="question-header" style={{color:'#ce93d8'}}>QUESTION {idx + 1}</div>
                <button onClick={() => removeQuestion(idx)} style={{background:'red', border:'none', color:'white', fontSize:'0.6rem', cursor:'pointer', padding:'5px'}}>REMOVE</button>
            </div>
            
            <input 
              className="game-input" 
              placeholder="Question Text"
              value={q.question}
              onChange={(e) => updateQuestion(idx, 'q', e.target.value)}
            />
            
            <div className="grid-2">
              {q.options.map((opt, oIdx) => (
                <input 
                  key={oIdx}
                  className="game-input"
                  placeholder={`Option ${oIdx + 1}`}
                  value={opt}
                  onChange={(e) => updateQuestion(idx, 'opt', e.target.value, oIdx)}
                />
              ))}
            </div>

            <label style={{fontSize:'0.7rem', color:'#ce93d8'}}>CORRECT ANSWER:</label>
            <select 
              className="game-select"
              value={q.correct}
              onChange={(e) => updateQuestion(idx, 'correct', e.target.value)}
            >
                <option value="">Select Correct Answer</option>
                {q.options.map((opt, oIdx) => (
                    opt && <option key={oIdx} value={opt}>{opt}</option>
                ))}
            </select>
          </div>
        ))}
      </div>
      <div className="btn-group">
        <button className="btn-secondary" onClick={addQuestion}>+ ADD QUESTION</button>
        <button className="btn-primary" onClick={() => setStep(3)} style={{background:'#ce93d8', color:'#1a0d2e', boxShadow:'0 6px 0 #8e24aa'}}>NEXT: SCHEDULE</button>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="game-card">
        <h2 style={{color: '#ce93d8'}}>SCHEDULE ACTIVITY</h2>
        <div style={{textAlign: 'left', backgroundColor: '#0c0e17', padding: '20px', borderRadius: '8px', border: '1px dashed #555', marginBottom: '20px'}}>
            <label style={{display: 'block', color: '#ce93d8', marginBottom: '5px'}}>OPENING:</label>
            <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                <input type="date" className="game-input" value={openDate} onChange={e => setOpenDate(e.target.value)} />
                <input type="time" className="game-input" value={openTime} onChange={e => setOpenTime(e.target.value)} />
            </div>
            <label style={{display: 'block', color: '#ff4c4c', marginBottom: '5px'}}>CLOSING:</label>
            <label style={{fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', color: '#fff'}}>
                <input type="checkbox" checked={noCloseDate} onChange={e => setNoCloseDate(e.target.checked)} /> No Closing Date
            </label>
            {!noCloseDate && (
                <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                    <input type="date" className="game-input" value={closeDate} onChange={e => setCloseDate(e.target.value)} />
                    <input type="time" className="game-input" value={closeTime} onChange={e => setCloseTime(e.target.value)} />
                </div>
            )}
            <label style={{display: 'block', color: '#ff9900', marginBottom: '5px', marginTop: '10px'}}>TIME LIMIT:</label>
            <label style={{fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', color: '#fff'}}>
                <input type="checkbox" checked={unlimitedTime} onChange={e => setUnlimitedTime(e.target.checked)} /> Unlimited
            </label>
            {!unlimitedTime && (
                <select className="game-select" value={timeLimit} onChange={e => setTimeLimit(e.target.value)}>
                    {[5, 10, 15, 30, 60].map(m => <option key={m} value={m}>{m} Minutes</option>)}
                </select>
            )}
        </div>
        <div className="btn-group">
            <button className="btn-secondary" onClick={() => setStep(2)}>BACK</button>
            <button className="btn-primary" onClick={() => setStep(4)} style={{background:'#ce93d8', color:'#1a0d2e', boxShadow:'0 6px 0 #8e24aa'}}>NEXT: ASSIGN</button>
        </div>
    </div>
  );

  const renderAssign = () => (
    <div className="game-card">
      <h2 style={{color: '#ce93d8'}}>ASSIGN TO CLASS</h2>
      <div className="class-select-group">
        {availableClasses.length === 0 ? <p>No classes found.</p> : availableClasses.map(cls => (
            <div 
                key={cls.id} 
                className={`class-option ${selectedClass === cls.id ? 'selected' : ''}`}
                onClick={() => setSelectedClass(cls.id)}
                style={selectedClass === cls.id ? {borderColor:'#ce93d8', background:'rgba(206, 147, 216, 0.2)'} : {}}
            >
                <div style={{width:'20px', height:'20px', borderRadius:'50%', border:'2px solid #555', background: selectedClass === cls.id ? '#ce93d8' : 'transparent'}}></div>
                <span>{cls.name}</span>
            </div>
        ))}
      </div>
      <div className="btn-group">
        <button className="btn-secondary" onClick={() => setStep(3)}>BACK</button>
        <button className="btn-primary" onClick={handleSubmitClick} disabled={loading} style={{background:'#ce93d8', color:'#1a0d2e', boxShadow:'0 6px 0 #8e24aa'}}>
            {loading ? "CREATING..." : "CREATE GAME"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="create-game-container">
      {step === 1 && renderIntro()}
      {step === 2 && renderQuestions()}
      {step === 3 && renderSchedule()}
      {step === 4 && renderAssign()}

      {/* --- MODALS --- */}
      {confirmData && (
          <div className="modal-overlay" style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(12, 14, 23, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
              <div className="modal-box" style={{backgroundColor: '#222', border: '2px solid #ce93d8', padding: '30px', borderRadius: '10px', textAlign: 'center', maxWidth: '400px'}}>
                  <h2 style={{color: '#ce93d8', marginBottom: '20px'}}>{confirmData.title}</h2>
                  <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '30px'}}>{confirmData.message}</p>
                  <div className="btn-group" style={{justifyContent: 'center', gap: '15px'}}>
                      <button className="btn-primary" onClick={executeCreateGame} style={{background:'#ce93d8', color:'#1a0d2e'}}>CONFIRM</button>
                      <button className="btn-secondary" onClick={() => setConfirmData(null)}>CANCEL</button>
                  </div>
              </div>
          </div>
      )}

      {alertData && (
          <div className="modal-overlay" style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(12, 14, 23, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
              <div className="modal-box" style={{backgroundColor: '#222', border: `2px solid ${alertData.color}`, padding: '30px', borderRadius: '10px', textAlign: 'center', maxWidth: '400px'}}>
                  <h2 style={{color: alertData.color, marginBottom: '20px'}}>{alertData.title}</h2>
                  <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '30px'}}>{alertData.message}</p>
                  <button className="btn-primary" onClick={() => {
                      setAlertData(null);
                      if (alertData.navigate) navigate('/teacher-menu');
                  }} style={{background: alertData.color, color: '#000'}}>OK</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default CreateWordQuest;