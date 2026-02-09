// src/pages/CreateMazeGame.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; 
import './GamesCSS.css';

const CreateMazeGame = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [step, setStep] = useState(1); // 1=Intro, 2=Questions, 3=Assign Class
  const [loading, setLoading] = useState(false);
  
  // Game Data
  const [questions, setQuestions] = useState([
    { q: "", choices: ["", "", "", ""], correct: 0 },
    { q: "", choices: ["", "", "", ""], correct: 0 },
    { q: "", choices: ["", "", "", ""], correct: 0 },
    { q: "", choices: ["", "", "", ""], correct: 0 },
    { q: "", choices: ["", "", "", ""], correct: 0 },
  ]);

  // REAL DATA STATE: Now starts empty
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  // --- FETCH CLASSES FROM MYSQL ---
  useEffect(() => {
    const fetchClasses = async () => {
      // Wait for auth to be ready
      if (!auth.currentUser) return;

      try {
        const teacherId = auth.currentUser.uid;
        // Call the backend API
        const response = await fetch(`http://localhost:8081/api/get-teacher-classes/${teacherId}`);
        
        if (response.ok) {
          const data = await response.json();
          setAvailableClasses(data); // Store the real classes from DB
        } else {
          console.error("Failed to fetch classes");
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    // Trigger fetch when auth.currentUser changes (e.g., page load)
    fetchClasses();
  }, [auth.currentUser]);


  // --- HANDLERS ---
  const handleQuestionChange = (index, field, value, choiceIdx = null) => {
    const updated = [...questions];
    if (field === 'q') updated[index].q = value;
    if (field === 'correct') updated[index].correct = parseInt(value);
    if (field === 'choice') updated[index].choices[choiceIdx] = value;
    setQuestions(updated);
  };

  const handleCreateGame = async () => {
    if (!selectedClass) {
        alert("Please select a class first.");
        return;
    }

    const confirm = window.confirm("Are you sure you want to create this game?");
    if (!confirm) return;

    setLoading(true);

    const teacherId = auth.currentUser ? auth.currentUser.uid : "UNKNOWN_TEACHER"; 

    const gameData = {
      teacher_fid: teacherId, 
      class_id: selectedClass,
      game_type: "MAZE",
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
                alert("Game Created Successfully!");
                navigate('/teacher-menu');
            }, 1000);
        } else {
            alert("Failed to save game. Check server console.");
            setLoading(false);
        }
    } catch (err) {
        console.error("Error:", err);
        alert("Server error occurred.");
        setLoading(false);
    }
  };

  // --- RENDER STEPS ---
  
  // STEP 1: Intro Card (UPDATED WITH BACK BUTTON)
  const renderStep1_Intro = () => (
    <div className="game-card">
      <h2>CREATE NEW MAZE ACTIVITY</h2>
      <p style={{marginBottom: '20px'}}>This template allows you to create a dungeon crawler maze game.</p>
      
      <div style={{textAlign: 'left', backgroundColor: '#0c0e17', padding: '20px', borderRadius: '8px', border: '1px dashed #555'}}>
        <p style={{color: '#ff9900', fontFamily: '"Press Start 2P"', fontSize: '0.8rem'}}>REQUIREMENTS:</p>
        <ul style={{marginTop: '10px', paddingLeft: '20px'}}>
          <li>5 Multiple Choice Questions</li>
          <li>4 Options per Question</li>
          <li>1 Correct Answer per Question</li>
        </ul>
      </div>

      <div className="btn-group" style={{justifyContent: 'center', gap: '20px'}}>
        {/* NEW BACK BUTTON */}
        <button className="btn-secondary" onClick={() => navigate('/teacher-menu')}>CANCEL</button>
        <button className="btn-primary" onClick={() => setStep(2)}>START CONFIGURATION</button>
      </div>
    </div>
  );

  // STEP 2: Questions Form
  const renderStep2_Questions = () => (
    <div className="game-card" style={{maxWidth: '900px'}}>
      <h2 style={{color: '#e6c800'}}>CONFIGURE QUESTIONS</h2>
      <p>Enter 5 questions to be placed at the dungeon doors.</p>
      
      <div className="scroll-container">
        {questions.map((q, idx) => (
          <div key={idx} className="question-block">
            <div className="question-header">QUESTION {idx + 1}</div>
            
            {/* Question Text */}
            <input 
              className="game-input"
              placeholder="Enter your question text here..." 
              value={q.q}
              onChange={(e) => handleQuestionChange(idx, 'q', e.target.value)}
            />

            {/* Choices Grid */}
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

            {/* Correct Answer */}
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
        <button className="btn-secondary" onClick={() => setStep(1)}>BACK</button>
        <button className="btn-primary" onClick={() => setStep(3)}>NEXT: ASSIGN CLASS</button>
      </div>
    </div>
  );

  // STEP 3: Class Assignment
  const renderStep3_Assign = () => (
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
                {/* Ensure your DB column name matches here (e.g., cls.name or cls.class_name) */}
                <span>{cls.name || cls.class_name}</span> 
              </div>
            ))
        )}
      </div>

      <div className="btn-group">
        <button className="btn-secondary" onClick={() => setStep(2)}>BACK</button>
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
      {step === 2 && renderStep2_Questions()}
      {step === 3 && renderStep3_Assign()}
    </div>
  );
};

export default CreateMazeGame;