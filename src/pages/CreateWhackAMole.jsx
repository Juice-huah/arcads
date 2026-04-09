// src/pages/CreateWhackAMole.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";

export default function CreateWhackAMole() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  
  const [gameTitle, setGameTitle] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [questions, setQuestions] = useState([
    { question_text: '', choice_a: '', choice_b: '', choice_c: '', choice_d: '', correct_option: 'A' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alertData, setAlertData] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

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

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', choice_a: '', choice_b: '', choice_c: '', choice_d: '', correct_option: 'A' }]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      const updated = questions.filter((_, i) => i !== index);
      setQuestions(updated);
    }
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    if (!gameTitle || !selectedClass) {
      return setAlertData({ title: "ATTENTION", message: "Please provide a title and select a class.", color: "#ff9900" });
    }

    setConfirmData({
        title: "CONFIRM CREATION",
        message: "Are you sure you want to deploy this Whack-a-Mole Game?"
    });
  };

  const executeCreateGame = async () => {
    setConfirmData(null);
    setIsSubmitting(true);

    let formattedOpenDate = (openDate && openTime) ? `${openDate} ${openTime}:00` : null;
    let formattedCloseDate = (!noCloseDate && closeDate && closeTime) ? `${closeDate} ${closeTime}:00` : null;
    const finalTimeLimit = unlimitedTime ? 0 : parseInt(timeLimit);

    try {
      const res = await fetch('https://arcads-api.onrender.com/api/create-whack-a-mole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_fid: user.uid,
          class_id: selectedClass,
          custom_title: gameTitle, // 🟢 FIXED: Send custom_title instead of game_title
          questions: questions,
          open_datetime: formattedOpenDate,
          close_datetime: formattedCloseDate,
          time_limit: finalTimeLimit
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create game");
      
      setAlertData({ title: "SUCCESS", message: "Whack-a-Mole Game Created Successfully!", color: "#14a014", navigate: true });

    } catch (error) {
      console.error(error);
      setAlertData({ title: "ERROR", message: "Error creating game: " + error.message, color: "#ff4c4c" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050510', color: '#fff', padding: '40px 20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#16213e', padding: '30px', borderRadius: '15px', border: '2px solid #ff4757', boxShadow: '0 0 30px rgba(255, 71, 87, 0.2)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#ff4757', margin: 0, fontFamily: "'Orbitron', sans-serif" }}>🔨 Create Whack-a-Mole</h1>
          <button onClick={() => navigate('/teacher-menu')} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>

        {/* INSTRUCTIONS */}
        <div style={{ background: 'rgba(255, 71, 87, 0.05)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255, 71, 87, 0.4)' }}>
          <h3 style={{ color: '#ff4757', margin: '0 0 15px 0', fontSize: '1rem', fontFamily: '"Press Start 2P", cursive' }}>ℹ️ HOW IT WORKS:</h3>
          <p style={{ color: '#c9d1d9', fontSize: '0.75rem', lineHeight: '1.8', margin: 0, fontFamily: '"Press Start 2P", cursive' }}>
            Cyber Whack is a fast-paced reflex game. Students whack normal targets for points, avoid bombs, and occasionally trigger pop-up multiple-choice questions to keep their combo going!<br/><br/>
            What to do: Enter a Game Title, select a class, set your schedule, and add your multiple-choice questions below.
          </p>
        </div>

        <form onSubmit={handleSubmitClick}>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ff4757', fontWeight: 'bold' }}>Game Title</label>
              <input 
                type="text" 
                value={gameTitle} 
                onChange={e => setGameTitle(e.target.value)} 
                required 
                placeholder="e.g., Math Reflex Test"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#0a0a25', color: '#fff', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ff4757', fontWeight: 'bold' }}>Assign to Class</label>
              <select 
                value={selectedClass} 
                onChange={e => setSelectedClass(e.target.value)} 
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#0a0a25', color: '#fff', outline: 'none' }}
              >
                <option value="" disabled>Select a class...</option>
                {classes.map(c => (
                  <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                ))}
              </select>
            </div>
          </div>

          <h3 style={{ color: '#fff', borderBottom: '1px solid #ff4757', paddingBottom: '10px', marginBottom: '15px' }}>📅 Schedule Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px', background: '#0a0a25', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#ff4757', fontWeight: 'bold' }}>Opening Date & Time</label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                      <input type="date" value={openDate} onChange={e => setOpenDate(e.target.value)} style={{...inputStyle, width: '50%'}} />
                      <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} style={{...inputStyle, width: '50%'}} />
                  </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#ff4757', fontWeight: 'bold' }}>Closing Date & Time</label>
                  <label style={{fontSize: '0.75rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <input type="checkbox" checked={noCloseDate} onChange={e => setNoCloseDate(e.target.checked)} /> No Closing Date
                  </label>
                  {!noCloseDate && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                          <input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} required={!noCloseDate} style={{...inputStyle, width: '50%'}} />
                          <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} required={!noCloseDate} style={{...inputStyle, width: '50%'}} />
                      </div>
                  )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#ff4757', fontWeight: 'bold' }}>Time Limit (Duration)</label>
                  <label style={{fontSize: '0.75rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <input type="checkbox" checked={unlimitedTime} onChange={e => setUnlimitedTime(e.target.checked)} /> Unlimited
                  </label>
                  {!unlimitedTime && (
                      <select value={timeLimit} onChange={e => setTimeLimit(e.target.value)} style={inputStyle}>
                          <option value="5">5 Minutes</option>
                          <option value="10">10 Minutes</option>
                          <option value="15">15 Minutes</option>
                          <option value="30">30 Minutes</option>
                          <option value="60">60 Minutes</option>
                      </select>
                  )}
              </div>
          </div>

          <h3 style={{ color: '#fff', borderBottom: '1px solid #ff4757', paddingBottom: '10px', marginBottom: '20px' }}>System Reboot Questions (Multiple Choice)</h3>
          
          {questions.map((q, index) => (
            <div key={index} style={{ background: '#0a0a25', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #333', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <strong style={{ color: '#00fff2' }}>Question {index + 1}</strong>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(index)} style={{ background: '#ff4757', color: '#fff', border: 'none', borderRadius: '5px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Remove
                  </button>
                )}
              </div>

              <input 
                type="text" 
                placeholder="Enter question text here..." 
                value={q.question_text} 
                onChange={e => handleQuestionChange(index, 'question_text', e.target.value)} 
                required
                style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #555', background: '#16213e', color: '#fff' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <input type="text" placeholder="Option A" value={q.choice_a} onChange={e => handleQuestionChange(index, 'choice_a', e.target.value)} required style={inputStyle} />
                <input type="text" placeholder="Option B" value={q.choice_b} onChange={e => handleQuestionChange(index, 'choice_b', e.target.value)} required style={inputStyle} />
                <input type="text" placeholder="Option C" value={q.choice_c} onChange={e => handleQuestionChange(index, 'choice_c', e.target.value)} required style={inputStyle} />
                <input type="text" placeholder="Option D" value={q.choice_d} onChange={e => handleQuestionChange(index, 'choice_d', e.target.value)} required style={inputStyle} />
              </div>

              <div>
                <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Correct Answer:</label>
                <select 
                  value={q.correct_option} 
                  onChange={e => handleQuestionChange(index, 'correct_option', e.target.value)}
                  style={{ padding: '8px', borderRadius: '5px', background: '#0f3460', color: '#fff', border: '1px solid #00fff2', outline: 'none' }}
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
            </div>
          ))}

          <button type="button" onClick={addQuestion} style={{ background: '#0f3460', color: '#00fff2', border: '1px dashed #00fff2', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', width: '100%', marginBottom: '30px', fontWeight: 'bold' }}>
            + Add Another Question
          </button>

          <button type="submit" disabled={isSubmitting} style={{ background: '#ff4757', color: '#fff', border: 'none', padding: '15px 20px', borderRadius: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', width: '100%', fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase', boxShadow: '0 5px 15px rgba(255, 71, 87, 0.4)' }}>
            {isSubmitting ? 'Saving...' : 'Save & Create Game'}
          </button>
        </form>
      </div>

      {confirmData && (
          <div style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 5, 16, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
              <div style={{backgroundColor: '#16213e', border: '2px solid #00fff2', padding: '30px', borderRadius: '10px', textAlign: 'center', maxWidth: '400px'}}>
                  <h2 style={{color: '#00fff2', marginBottom: '20px', fontFamily: "'Orbitron', sans-serif"}}>{confirmData.title}</h2>
                  <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '30px'}}>{confirmData.message}</p>
                  <div style={{display: 'flex', justifyContent: 'center', gap: '15px'}}>
                      <button onClick={executeCreateGame} style={{background: '#ff4757', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer'}}>CONFIRM</button>
                      <button onClick={() => setConfirmData(null)} style={{background: 'transparent', color: '#fff', border: '1px solid #fff', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer'}}>CANCEL</button>
                  </div>
              </div>
          </div>
      )}

      {alertData && (
          <div style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 5, 16, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
              <div style={{backgroundColor: '#16213e', border: `2px solid ${alertData.color}`, padding: '30px', borderRadius: '10px', textAlign: 'center', maxWidth: '400px'}}>
                  <h2 style={{color: alertData.color, marginBottom: '20px', fontFamily: "'Orbitron', sans-serif"}}>{alertData.title}</h2>
                  <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '30px'}}>{alertData.message}</p>
                  <button onClick={() => {
                      setAlertData(null);
                      if (alertData.navigate) navigate('/teacher-menu');
                  }} style={{background: alertData.color, color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer'}}>OK</button>
              </div>
          </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #444',
  background: '#16213e',
  color: '#fff',
  outline: 'none'
};