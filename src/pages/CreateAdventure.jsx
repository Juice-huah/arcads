// src/pages/CreateAdventure.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import '../components/TeacherMenu.css'; 

function CreateAdventure() {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [step, setStep] = useState(1); // 1=Intro, 2=Config, 3=Schedule, 4=Assign
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);

  // 🟢 NEW: Game Title State
  const [gameTitle, setGameTitle] = useState('Adventure Battle');

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
                const res = await fetch(`https://arcads-api.onrender.com/api/get-classes/${auth.currentUser.uid}`);
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
  const handleSubmitClick = () => {
      if (!selectedClass) return setAlertData({ title: "ATTENTION", message: "Please select a class.", color: "#ff9900" });
      setConfirmData({
          title: "CONFIRM CREATION",
          message: "Create and assign this Adventure Battle to the selected class?"
      });
  };

  const executeCreateGame = async () => {
    setConfirmData(null);
    setLoading(true);

    const payload = questions.map(q => {
        if (q.type === 'identification') {
            return { ...q, choiceA: q.correctAnswer }; 
        }
        return q;
    });

    let formattedOpenDate = (openDate && openTime) ? `${openDate} ${openTime}:00` : null;
    let formattedCloseDate = (!noCloseDate && closeDate && closeTime) ? `${closeDate} ${closeTime}:00` : null;
    const finalTimeLimit = unlimitedTime ? 0 : parseInt(timeLimit);

    try {
      const res = await fetch('https://arcads-api.onrender.com/api/create-adventure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_fid: auth.currentUser.uid,
          class_id: selectedClass,
          custom_title: gameTitle, // 🟢 NEW: Sends the custom title
          questions: payload,
          open_datetime: formattedOpenDate,
          close_datetime: formattedCloseDate,
          time_limit: finalTimeLimit
        })
      });

      if (res.ok) {
        setTimeout(() => {
            setLoading(false);
            setAlertData({ title: "SUCCESS", message: "⚔️ Adventure Battle Created Successfully!", color: "#14a014", navigate: true });
        }, 1000);
      } else {
        setAlertData({ title: "ERROR", message: "Error saving game.", color: "#ff4c4c" });
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setAlertData({ title: "ERROR", message: "Server Error", color: "#ff4c4c" });
      setLoading(false);
    }
  };

  // --- RENDER STEPS ---

  // STEP 1: INTRO 
  const renderStep1_Intro = () => (
    <div className="game-card" style={cardStyle}>
      <h2 style={{color: '#ff9900', fontFamily: '"Press Start 2P", cursive', marginBottom:'20px'}}>CREATE NEW ADVENTURE BATTLE</h2>
      
      {/* 🟢 NEW: Enhanced Instructions in Step 1 */}
      <div style={{textAlign: 'left', backgroundColor: '#0c0e17', padding: '20px', borderRadius: '8px', border: '1px dashed #555', marginBottom:'30px'}}>
        <h3 style={{ color: '#ff9900', margin: '0 0 10px 0', fontSize: '1.1rem', fontFamily: '"Press Start 2P", cursive' }}>ℹ️ HOW IT WORKS:</h3>
        <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '15px' }}>
          <strong>Adventure Battle</strong> is a turn-based RPG. Students choose a hero and battle monsters. Answering correctly attacks the monster, while answering wrong allows the monster to strike back!
        </p>
        <p style={{color: '#ff9900', fontFamily: '"Press Start 2P"', fontSize: '0.8rem'}}>CREATION CHECKLIST:</p>
        <ul style={{marginTop: '10px', paddingLeft: '20px', color:'white', lineHeight:'1.6'}}>
          <li>Add questions in Step 2. Supports Multiple Choice, True/False, and Identification.</li>
          <li>Set opening, closing, and time limits in Step 3.</li>
          <li>Assign the game to your active classes in Step 4.</li>
        </ul>
      </div>

      {/* 🟢 NEW: Game Title Input added here */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px', border: '1px solid #4a5568', marginBottom: '30px', textAlign: 'left' }}>
        <label style={{ display: 'block', color: '#ff9900', fontWeight: 'bold', marginBottom: '10px' }}>Activity / Game Title</label>
        <input 
            type="text" 
            value={gameTitle} 
            onChange={(e) => setGameTitle(e.target.value)} 
            style={{ width: '100%', padding: '12px', background: '#1a202c', border: '1px solid #4a5568', color: 'white', borderRadius: '5px', boxSizing: 'border-box' }} 
            required 
        />
      </div>

      <div style={{display:'flex', justifyContent: 'center', gap: '20px'}}>
        <button className="btn-secondary" onClick={() => navigate('/teacher-menu')} style={btnSecStyle}>CANCEL</button>
        <button className="btn-primary" onClick={() => setStep(2)} style={btnPriStyle}>START CREATION</button>
      </div>
    </div>
  );

  // STEP 2: CONFIGURATION (Questions)
  const renderStep2_Config = () => (
    <div style={{maxWidth: '800px', margin: '0 auto'}}>
        <h2 style={{color: '#e6c800', textAlign:'center', marginBottom:'20px'}}>ADD BATTLE QUESTIONS</h2>
        
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
            <button onClick={() => setStep(3)} className="btn" style={{...btnPriStyle, flex: 1}}>NEXT: SCHEDULE</button>
        </div>
    </div>
  );

  // STEP 3: SCHEDULE
  const renderStep3_Schedule = () => (
    <div className="game-card" style={cardStyle}>
        <h2 style={{color: '#ce93d8', marginBottom:'20px'}}>SCHEDULE ACTIVITY</h2>
        <div style={{textAlign: 'left', backgroundColor: '#0c0e17', padding: '20px', borderRadius: '8px', border: '1px dashed #555', marginBottom: '20px'}}>
            <label style={{display: 'block', color: '#0ac8f0', marginBottom: '5px'}}>OPENING:</label>
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

  // STEP 4: ASSIGN CLASS
  const renderStep4_Assign = () => (
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
        <button className="btn-secondary" onClick={() => setStep(3)} style={btnSecStyle}>BACK</button>
        <button 
          className="btn-primary" 
          onClick={handleSubmitClick}
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
        {step === 3 && renderStep3_Schedule()}
        {step === 4 && renderStep4_Assign()}
      </div>

      {/* --- MODALS --- */}
      {confirmData && (
          <div className="modal-overlay" style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(12, 14, 23, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
              <div className="modal-box" style={{backgroundColor: '#222', border: '2px solid #ff9900', padding: '30px', borderRadius: '10px', textAlign: 'center', maxWidth: '400px'}}>
                  <h2 style={{color: '#ff9900', marginBottom: '20px'}}>{confirmData.title}</h2>
                  <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '30px'}}>{confirmData.message}</p>
                  <div style={{display: 'flex', justifyContent: 'center', gap: '15px'}}>
                      <button className="btn-primary" onClick={executeCreateGame} style={btnPriStyle}>CONFIRM</button>
                      <button className="btn-secondary" onClick={() => setConfirmData(null)} style={btnSecStyle}>CANCEL</button>
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
                  }} style={btnPriStyle}>OK</button>
              </div>
          </div>
      )}
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