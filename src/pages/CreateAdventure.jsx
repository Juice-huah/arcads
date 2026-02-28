import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import '../components/TeacherMenu.css'; 

function CreateAdventure() {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [step, setStep] = useState(1); // 1=Intro, 2=Config, 3=Assign
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);

  // Question State
  const [questions, setQuestions] = useState([
    { 
      type: 'multiple_choice', 
      question: '', 
      choiceA: '', choiceB: '', choiceC: '', choiceD: '', 
      correctAnswer: '0' 
    }
  ]);

  // --- 1. FETCH CLASSES ON LOAD ---
  useEffect(() => {
    const fetchClasses = async () => {
        if (auth.currentUser) {
            try {
                const res = await fetch(`http://localhost:8081/api/get-classes/${auth.currentUser.uid}`);
                const data = await res.json();
                if (Array.isArray(data)) setClasses(data);
            } catch (err) { console.error(err); }
        }
    };
    fetchClasses();
  }, []);

  // --- HANDLERS ---

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    
    if (field === 'type') {
        newQuestions[index].correctAnswer = '0'; 
        newQuestions[index].choiceA = '';
        if (value === 'identification') {
            newQuestions[index].correctAnswer = ''; 
        }
    }
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions, 
      { type: 'multiple_choice', question: '', choiceA: '', choiceB: '', choiceC: '', choiceD: '', correctAnswer: '0' }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = async () => {
    if (!selectedClass) return alert("Please select a class.");
    
    setLoading(true);

    const payload = questions.map(q => {
        if (q.type === 'identification') {
            return { ...q, choiceA: q.correctAnswer }; 
        }
        return q;
    });

    try {
      const res = await fetch('http://localhost:8081/api/create-adventure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_fid: auth.currentUser.uid,
          class_id: selectedClass,
          questions: payload
        })
      });

      if (res.ok) {
        setTimeout(() => {
            setLoading(false);
            alert("⚔️ Adventure Battle Created Successfully!");
            navigate('/teacher-menu');
        }, 1000);
      } else {
        alert("Error saving game.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
      setLoading(false);
    }
  };

  // --- RENDER STEPS ---

  // STEP 1: INTRO (Logic Copied from Maze)
  const renderStep1_Intro = () => (
    <div className="game-card" style={cardStyle}>
      <h2 style={{color: '#ff9900', fontFamily: '"Press Start 2P", cursive', marginBottom:'20px'}}>CREATE NEW ADVENTURE BATTLE</h2>
      <p style={{marginBottom: '20px', color:'#ccc'}}>This template allows you to create a Adventure battle quiz game.</p>
      
      <div style={{textAlign: 'left', backgroundColor: '#0c0e17', padding: '20px', borderRadius: '8px', border: '1px dashed #555', marginBottom:'30px'}}>
        <p style={{color: '#ff9900', fontFamily: '"Press Start 2P"', fontSize: '0.8rem'}}>REQUIREMENTS:</p>
        <ul style={{marginTop: '10px', paddingLeft: '20px', color:'white', lineHeight:'1.6'}}>
          <li>Minimum 10-20 Question</li>
          <li>Maximum of 30-50 Question</li>
          <li>Supports Multiple Choice, TRUE OR FALSE, IDENTIFICATION</li>
          <li>1000= 10 questions
            2000= 20 questions
            3000=30 questions
            4000= 40 questions
            5000= 50 questions</li>
          <li>100 = 1 Correct Answer per Question</li>
        </ul>
      </div>

      <div style={{display:'flex', justifyContent: 'center', gap: '20px'}}>
        <button className="btn-secondary" onClick={() => navigate('/teacher-menu')} style={btnSecStyle}>CANCEL</button>
        <button className="btn-primary" onClick={() => setStep(2)} style={btnPriStyle}>START CONFIGURATION</button>
      </div>
    </div>
  );

  // STEP 2: CONFIGURATION (Questions)
  const renderStep2_Config = () => (
    <div style={{maxWidth: '800px', margin: '0 auto'}}>
        <h2 style={{color: '#e6c800', textAlign:'center', marginBottom:'20px'}}>CONFIGURE BATTLE QUESTIONS</h2>
        
        {questions.map((q, index) => (
          <div key={index} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #4a5568', padding: '20px', marginBottom: '20px', borderRadius: '10px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#63b3ed', margin: 0 }}>Question {index + 1}</h3>
                
                <select 
                    value={q.type} 
                    onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                    style={{ padding: '5px', borderRadius: '5px', border: '1px solid #0ac8f0', background: '#1a202c', color: 'white' }}
                >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="identification">Identification</option>
                </select>

                <button onClick={() => removeQuestion(index)} style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}>
                    Remove
                </button>
            </div>
            
            <input 
              type="text" 
              placeholder="Type your question here..." 
              value={q.question}
              onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
              style={{ width: '96%', padding: '12px', marginBottom: '15px', background: '#1a202c', border: '1px solid #4a5568', color: 'white', borderRadius: '5px' }}
            />

            {/* CONDITIONAL INPUTS */}
            {q.type === 'multiple_choice' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <input type="text" placeholder="Option A" value={q.choiceA} onChange={(e) => handleQuestionChange(index, 'choiceA', e.target.value)} style={inputStyle} />
                        <input type="text" placeholder="Option B" value={q.choiceB} onChange={(e) => handleQuestionChange(index, 'choiceB', e.target.value)} style={inputStyle} />
                        <input type="text" placeholder="Option C" value={q.choiceC} onChange={(e) => handleQuestionChange(index, 'choiceC', e.target.value)} style={inputStyle} />
                        <input type="text" placeholder="Option D" value={q.choiceD} onChange={(e) => handleQuestionChange(index, 'choiceD', e.target.value)} style={inputStyle} />
                    </div>
                    <div style={answerKeyContainer}>
                        <label style={{color: '#f6ad55', fontWeight: 'bold'}}>Correct Answer:</label>
                        <select value={q.correctAnswer} onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)} style={dropdownStyle}>
                            <option value="0">Option A</option>
                            <option value="1">Option B</option>
                            <option value="2">Option C</option>
                            <option value="3">Option D</option>
                        </select>
                    </div>
                </>
            )}

            {q.type === 'true_false' && (
                <div style={answerKeyContainer}>
                    <label style={{color: '#f6ad55', fontWeight: 'bold'}}>Correct Answer:</label>
                    <select value={q.correctAnswer} onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)} style={dropdownStyle}>
                        <option value="0">TRUE</option>
                        <option value="1">FALSE</option>
                    </select>
                </div>
            )}

            {q.type === 'identification' && (
                <div style={answerKeyContainer}>
                    <label style={{color: '#f6ad55', fontWeight: 'bold'}}>Correct Answer (Text):</label>
                    <input type="text" placeholder="Type the exact answer..." value={q.correctAnswer} onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)} style={{ ...dropdownStyle, width: '100%', padding: '8px' }} />
                </div>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
            <button onClick={() => setStep(1)} className="btn" style={{...btnSecStyle, flex: 1}}>BACK</button>
            <button onClick={addQuestion} className="btn" style={{...btnPriStyle, background:'#38a169', flex: 1}}>+ ADD QUESTION</button>
            <button onClick={() => setStep(3)} className="btn" style={{...btnPriStyle, flex: 1}}>NEXT: ASSIGN</button>
        </div>
    </div>
  );

  // STEP 3: ASSIGN CLASS
  const renderStep3_Assign = () => (
    <div className="game-card" style={cardStyle}>
      <h2 style={{color: '#14a014', marginBottom:'20px'}}>ASSIGN TO CLASS</h2>
      <p style={{color:'#ccc', marginBottom:'20px'}}>Select which class will receive this activity.</p>
      
      <div style={{display:'flex', flexDirection:'column', gap:'10px', maxHeight:'300px', overflowY:'auto', marginBottom:'30px'}}>
        {classes.length === 0 ? (
           <p style={{color: '#ff4444'}}>No classes found. Create one first.</p>
        ) : (
           classes.map((cls) => (
             <div 
               key={cls.class_id} 
               onClick={() => setSelectedClass(cls.class_id)}
               style={{
                 padding:'15px', 
                 border: selectedClass === cls.class_id ? '2px solid #14a014' : '1px solid #555',
                 background: selectedClass === cls.class_id ? 'rgba(20, 160, 20, 0.2)' : '#0c0e17',
                 borderRadius:'8px',
                 cursor:'pointer',
                 display:'flex', alignItems:'center', gap:'15px'
               }}
             >
               <div style={{width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #fff', background: selectedClass === cls.class_id ? '#14a014' : 'transparent'}}></div>
               <span style={{color:'white', fontWeight:'bold'}}>{cls.class_name}</span> 
             </div>
           ))
        )}
      </div>

      <div style={{display:'flex', gap:'20px', justifyContent:'center'}}>
        <button className="btn-secondary" onClick={() => setStep(2)} style={btnSecStyle}>BACK</button>
        <button 
          className="btn-primary" 
          onClick={handleSubmit}
          disabled={!selectedClass || loading}
          style={{...btnPriStyle, opacity: !selectedClass ? 0.5 : 1}}
        >
          {loading ? "CREATING..." : "CONFIRM & CREATE GAME"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="teacher-dashboard" style={{ display: 'block', padding: '40px', overflowY: 'auto', minHeight: '100vh', backgroundColor: '#1a202c' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        {step === 1 && renderStep1_Intro()}
        {step === 2 && renderStep2_Config()}
        {step === 3 && renderStep3_Assign()}
      </div>
    </div>
  );
}

// --- STYLES ---
const cardStyle = {
    background: '#020b1c', 
    padding: '40px', 
    borderRadius: '12px', 
    border: '2px solid #4a5568', 
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    maxWidth: '800px',
    margin: '0 auto'
};

const inputStyle = {
    padding: '10px', background: '#1a202c', border: '1px solid #4a5568', color: 'white', borderRadius: '5px'
};

const answerKeyContainer = {
    display: 'flex', alignItems: 'center', gap: '10px', background: '#2d3748', padding: '15px', borderRadius: '5px'
};

const dropdownStyle = {
    padding: '8px', background: '#1a202c', color: 'white', border: '1px solid #4a5568', flex: 1, borderRadius: '5px'
};

const btnPriStyle = {
    padding: '15px 30px', background: '#ff9900', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer'
};

const btnSecStyle = {
    padding: '15px 30px', background: 'transparent', color: '#ccc', border: '2px solid #555', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer'
};

export default CreateAdventure;