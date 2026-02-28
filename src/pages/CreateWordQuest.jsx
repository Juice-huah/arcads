import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import './GamesCSS.css'; // We reuse your existing styles

const CreateWordQuest = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  // Default Questions State
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correct: "" }
  ]);

  // --- 1. Fetch Classes ---
  useEffect(() => {
    const fetchClasses = async () => {
      if (!auth.currentUser) return;
      try {
        const res = await fetch(`http://localhost:8081/api/get-teacher-classes/${auth.currentUser.uid}`);
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

  const handleSubmit = async () => {
    if (!selectedClass) return alert("Select a class!");
    
    // Validation: Ensure all questions have a correct answer selected
    for (let i=0; i<questions.length; i++) {
        if (!questions[i].correct || questions[i].correct === "") {
            return alert(`Question ${i+1} needs a correct answer selected.`);
        }
    }

    setLoading(true);
    try {
        const res = await fetch('http://localhost:8081/api/create-word-quest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teacher_fid: auth.currentUser.uid,
                class_id: selectedClass,
                questions: questions
            })
        });

        if (res.ok) {
            setTimeout(() => {
                alert("Word Quest Created Successfully!");
                navigate('/teacher-menu');
            }, 1000);
        } else {
            alert("Error creating game");
            setLoading(false);
        }
    } catch (e) {
        console.error(e);
        setLoading(false);
    }
  };

  // --- 3. Render Views ---

  const renderIntro = () => (
    <div className="game-card">
      <h2 style={{color: '#ce93d8'}}>CREATE WORD QUEST</h2>
      <p>A multiplayer board game where students roll dice and answer questions.</p>
      <div style={{textAlign:'left', background:'#0c0e17', padding:'20px', borderRadius:'8px', marginBottom:'20px'}}>
        <p style={{color:'#ce93d8', fontSize:'0.8rem'}}>GAMEPLAY:</p>
        <ul style={{fontSize:'0.8rem', color:'#aaa', marginTop:'10px'}}>
          <li>Classic Snakes & Ladders mechanics</li>
          <li>Power-ups, Traps, and AI Opponent</li>
          <li>Questions appear after every move</li>
        </ul>
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
        <button className="btn-primary" onClick={() => setStep(3)} style={{background:'#ce93d8', color:'#1a0d2e', boxShadow:'0 6px 0 #8e24aa'}}>NEXT: ASSIGN</button>
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
        <button className="btn-secondary" onClick={() => setStep(2)}>BACK</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{background:'#ce93d8', color:'#1a0d2e', boxShadow:'0 6px 0 #8e24aa'}}>
            {loading ? "CREATING..." : "CREATE GAME"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="create-game-container">
      {step === 1 && renderIntro()}
      {step === 2 && renderQuestions()}
      {step === 3 && renderAssign()}
    </div>
  );
};

export default CreateWordQuest;