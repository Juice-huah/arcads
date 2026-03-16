// src/pages/CreateMazeGame.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; 
import './GamesCSS.css';

const CreateMazeGame = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('EASY');
  
  // Custom Modal States
  const [alertData, setAlertData] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  
  // Game Data - Defaults to 5 questions for Easy
  const [questions, setQuestions] = useState(Array(5).fill(null).map(() => ({ q: "", choices: ["", "", "", ""], correct: 0 })));

  // REAL DATA STATE
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  // --- FETCH CLASSES FROM MYSQL ---
  useEffect(() => {
    const fetchClasses = async () => {
      if (!auth.currentUser) return;
      try {
        const teacherId = auth.currentUser.uid;
        const response = await fetch(`http://localhost:8081/api/get-teacher-classes/${teacherId}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableClasses(data); 
        } else {
          console.error("Failed to fetch classes");
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };
    fetchClasses();
  }, [auth.currentUser]);

  // --- HANDLERS ---
  const handleDifficultySelect = (lvl) => {
    setDifficulty(lvl);
    const count = lvl === 'EASY' ? 5 : 10;
    setQuestions(Array(count).fill(null).map(() => ({ q: "", choices: ["", "", "", ""], correct: 0 })));
  };

  const handleQuestionChange = (index, field, value, choiceIdx = null) => {
    const updated = [...questions];
    if (field === 'q') updated[index].q = value;
    if (field === 'correct') updated[index].correct = parseInt(value);
    if (field === 'choice') updated[index].choices[choiceIdx] = value;
    setQuestions(updated);
  };

  const handleCreateGame = () => {
    if (!selectedClass) {
        setAlertData({ title: "ATTENTION", message: "Please select a class first.", isSuccess: false });
        return;
    }

    // Trigger custom confirmation modal instead of system window.confirm
    setConfirmData({
        title: "CONFIRM CREATION",
        message: `Are you sure you want to create this ${difficulty} Maze Game?`
    });
  };

  const executeCreateGame = async () => {
    setConfirmData(null); // Close confirm modal
    setLoading(true);

    const teacherId = auth.currentUser ? auth.currentUser.uid : "UNKNOWN_TEACHER"; 

    const gameData = {
      teacher_fid: teacherId, 
      class_id: selectedClass,
      game_type: `MAZE_${difficulty}`, 
      questions: questions
    };

    try {
        const res = await fetch('http://localhost:8081/api/create-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameData)
        });

        if (res.ok) {
            setTimeout(() => {
                setLoading(false);
                setAlertData({ title: "SUCCESS", message: "Game Created Successfully!", isSuccess: true });
            }, 1000);
        } else {
            setAlertData({ title: "ERROR", message: "Failed to save game. Check server console.", isSuccess: false });
            setLoading(false);
        }
    } catch (err) {
        console.error("Error:", err);
        setAlertData({ title: "ERROR", message: "Server error occurred.", isSuccess: false });
        setLoading(false);
    }
  };

  // --- RENDER STEPS ---
  const renderStep1_Intro = () => (
    <div className="game-card">
      <h2>CREATE NEW MAZE ACTIVITY</h2>
      <p style={{marginBottom: '20px'}}>This template allows you to create a dungeon crawler maze game.</p>
      
      <div style={{textAlign: 'left', backgroundColor: '#0c0e17', padding: '20px', borderRadius: '8px', border: '1px dashed #555'}}>
        <p style={{color: '#ff9900', fontFamily: '"Press Start 2P"', fontSize: '0.8rem'}}>REQUIREMENTS:</p>
        <ul style={{marginTop: '10px', paddingLeft: '20px'}}>
          <li>Easy: 5 Multiple Choice Questions</li>
          <li>Normal & Hard: 10 Multiple Choice Questions</li>
          <li>4 Options per Question</li>
        </ul>
      </div>

      <div className="btn-group" style={{justifyContent: 'center', gap: '20px'}}>
        <button className="btn-secondary" onClick={() => navigate('/teacher-menu')}>CANCEL</button>
        <button className="btn-primary" onClick={() => setStep(2)}>START CONFIGURATION</button>
      </div>
    </div>
  );

  const renderStep2_Difficulty = () => (
    <div className="game-card">
      <h2 style={{color: '#0ac8f0'}}>SELECT DIFFICULTY</h2>
      <p>This determines the map size and the number of questions.</p>
      <div style={{display: 'flex', gap: '15px', justifyContent: 'center', margin: '30px 0'}}>
        {['EASY', 'NORMAL', 'HARD'].map((lvl) => (
          <div 
            key={lvl}
            onClick={() => handleDifficultySelect(lvl)}
            style={{
              padding: '20px', border: difficulty === lvl ? '3px solid #0ac8f0' : '2px solid #444', 
              borderRadius: '8px', cursor: 'pointer', background: difficulty === lvl ? 'rgba(10, 200, 240, 0.1)' : '#1a202c',
              flex: 1
            }}
          >
            <h3 style={{color: lvl === 'EASY' ? '#48bb78' : lvl === 'HARD' ? '#f56565' : '#ecc94b', margin: '0 0 10px 0'}}>{lvl}</h3>
            <p style={{fontSize: '0.8rem', color: '#aaa', margin: 0}}>{lvl === 'EASY' ? '5 Questions' : '10 Questions'}</p>
          </div>
        ))}
      </div>
      <div className="btn-group">
        <button className="btn-secondary" onClick={() => setStep(1)}>BACK</button>
        <button className="btn-primary" onClick={() => setStep(3)}>NEXT: QUESTIONS</button>
      </div>
    </div>
  );

  const renderStep3_Questions = () => (
    <div className="game-card" style={{maxWidth: '900px'}}>
      <h2 style={{color: '#e6c800'}}>CONFIGURE QUESTIONS ({difficulty})</h2>
      <p>Enter {questions.length} questions to be placed at the dungeon locks.</p>
      
      <div className="scroll-container" style={{maxHeight: '50vh', overflowY: 'auto', paddingRight: '10px'}}>
        {questions.map((q, idx) => (
          <div key={idx} className="question-block" style={{marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '20px'}}>
            <div className="question-header">QUESTION {idx + 1}</div>
            
            <input 
              className="game-input"
              placeholder="Enter your question text here..." 
              value={q.q}
              onChange={(e) => handleQuestionChange(idx, 'q', e.target.value)}
            />

            <div className="grid-2">
              {q.choices.map((choice, cIdx) => (
                <div key={cIdx}>
                  <input 
                    className="game-input"
                    placeholder={`Option ${String.fromCharCode(65 + cIdx)}`}
                    value={choice}
                    onChange={(e) => handleQuestionChange(idx, 'choice', e.target.value, cIdx)}
                  />
                </div>
              ))}
            </div>

            <div style={{marginTop: '15px'}}>
              <label style={{color: 'var(--arcade-yellow)', marginRight: '10px', fontSize: '0.7rem'}}>CORRECT ANSWER:</label>
              <select 
                className="game-select"
                value={q.correct} 
                onChange={(e) => handleQuestionChange(idx, 'correct', e.target.value)}
              >
                {q.choices.map((_, cIdx) => (
                  <option key={cIdx} value={cIdx}>Option {String.fromCharCode(65 + cIdx)}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="btn-group">
        <button className="btn-secondary" onClick={() => setStep(2)}>BACK</button>
        <button className="btn-primary" onClick={() => setStep(4)}>NEXT: ASSIGN CLASS</button>
      </div>
    </div>
  );

  const renderStep4_Assign = () => (
    <div className="game-card">
      <h2 style={{color: '#14a014'}}>ASSIGN TO CLASS</h2>
      <p>Select which class will receive this activity.</p>
      
      <div className="class-select-group">
        {availableClasses.length === 0 ? (
           <p style={{color: '#ff4444', marginTop: '20px'}}>No classes found. Please create a class first.</p>
        ) : (
            availableClasses.map((cls) => (
              <div 
                key={cls.id} 
                className={`class-option ${selectedClass === cls.id ? 'selected' : ''}`}
                onClick={() => setSelectedClass(cls.id)}
              >
                <div style={{width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #555', background: selectedClass === cls.id ? '#14a014' : 'transparent'}}></div>
                <span>{cls.name || cls.class_name}</span> 
              </div>
            ))
        )}
      </div>

      <div className="btn-group">
        <button className="btn-secondary" onClick={() => setStep(3)}>BACK</button>
        <button 
          className="btn-primary" 
          onClick={handleCreateGame}
          disabled={!selectedClass || loading}
        >
          {loading ? "CREATING..." : "CONFIRM & CREATE GAME"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="create-game-container">
      {step === 1 && renderStep1_Intro()}
      {step === 2 && renderStep2_Difficulty()}
      {step === 3 && renderStep3_Questions()}
      {step === 4 && renderStep4_Assign()}

      {/* --- CUSTOM CONFIRM MODAL --- */}
      {confirmData && (
          <div className="modal-overlay" style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(12, 14, 23, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
              <div className="modal-box" style={{backgroundColor: '#222', border: '2px solid #ff9900', padding: '30px', borderRadius: '10px', textAlign: 'center', maxWidth: '400px'}}>
                  <h2 style={{color: '#ff9900', marginBottom: '20px'}}>{confirmData.title}</h2>
                  <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '30px'}}>{confirmData.message}</p>
                  <div className="btn-group" style={{justifyContent: 'center', gap: '15px'}}>
                      <button className="btn-secondary" onClick={() => setConfirmData(null)}>CANCEL</button>
                      <button className="btn-primary" onClick={executeCreateGame}>CONFIRM</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- CUSTOM ALERT MODAL --- */}
      {alertData && (
          <div className="modal-overlay" style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(12, 14, 23, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
              <div className="modal-box" style={{backgroundColor: '#222', border: `2px solid ${alertData.isSuccess ? '#14a014' : '#ff4c4c'}`, padding: '30px', borderRadius: '10px', textAlign: 'center', maxWidth: '400px'}}>
                  <h2 style={{color: alertData.isSuccess ? '#14a014' : '#ff4c4c', marginBottom: '20px'}}>{alertData.title}</h2>
                  <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '30px'}}>{alertData.message}</p>
                  <button className="btn-primary" onClick={() => {
                      setAlertData(null);
                      if (alertData.isSuccess) navigate('/teacher-menu');
                  }}>OK</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default CreateMazeGame;