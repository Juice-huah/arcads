// src/pages/CreateHamsterBall.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import '../components/TeacherMenu.css'; 

function CreateHamsterBall() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  
  // 🟢 NEW: Array to hold multiple selected classes
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [gameTitle, setGameTitle] = useState('HamsterBall Word Chain');
  
  const [questions, setQuestions] = useState([
      { prompt: 'APPLE', choice_a: '', choice_b: '', choice_c: '', choice_d: '', correct: '0' }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const themeColor = "#ff007f"; 

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

  // 🟢 NEW: Handle checking/unchecking classes
  const handleClassToggle = (classId) => {
      setSelectedClasses(prev => 
          prev.includes(classId) 
              ? prev.filter(id => id !== classId) 
              : [...prev, classId]
      );
  };

  const handleQuestionCountChange = (e) => {
      const newCount = parseInt(e.target.value, 10);
      if (isNaN(newCount) || newCount < 1 || newCount > 30) return;

      if (newCount > questions.length) {
          const extra = Array.from({ length: newCount - questions.length }, () => ({
              prompt: '', choice_a: '', choice_b: '', choice_c: '', choice_d: '', correct: '0'
          }));
          setQuestions([...questions, ...extra]);
      } else {
          setQuestions(questions.slice(0, newCount));
      }
  };

  const handleQuestionChange = (index, field, value) => {
      const updated = [...questions];
      updated[index][field] = value;
      setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedClasses.length === 0) return alert("Please select at least one class to assign this game to!");
    
    const isInvalid = questions.some(q => 
        !q.prompt.trim() || !q.choice_a.trim() || !q.choice_b.trim() || !q.choice_c.trim() || !q.choice_d.trim()
    );

    if (isInvalid) {
        return alert("Validation Failed: Please fill in all prompts and multiple-choice options before saving.");
    }

    setIsSubmitting(true);
    
    try {
      // 🟢 NEW: Loop through EVERY selected class and deploy the game
      for (const classId of selectedClasses) {
          // 1. Create the Game Room for this specific class
          const gameRes = await fetch('http://localhost:8081/api/create-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teacher_fid: user.uid,
              class_id: classId,
              game_type: 'HamsterBall',
              game_title: gameTitle
            })
          });

          const gameData = await gameRes.json();
          if (!gameRes.ok) throw new Error(gameData.error);
          const newGameId = gameData.game_id;

          // 2. Upload all questions for this specific game
          for (let q of questions) {
              await fetch('http://localhost:8081/api/add-question', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      game_id: newGameId,
                      question_text: q.prompt,
                      choice_a: q.choice_a,
                      choice_b: q.choice_b,
                      choice_c: q.choice_c,
                      choice_d: q.choice_d,
                      correct_answer: q.correct
                  })
              });
          }
      }

      alert(`HamsterBall Game successfully assigned to ${selectedClasses.length} class(es)!`);
      navigate('/teacher-menu');
    } catch (err) {
      console.error("Error saving game:", err);
      alert("Server Error while saving game.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="teacher-dashboard" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      
      <div style={{ maxWidth: '900px', width: '100%', background: '#0a0f1a', borderRadius: '16px', border: `2px solid ${themeColor}`, padding: '30px', boxShadow: `0 0 30px ${themeColor}44` }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ color: themeColor, fontSize: '2rem', margin: 0, fontFamily: "'Fredoka One', sans-serif", letterSpacing: '2px' }}>
              🐹 CREATE HAMSTERBALL
            </h1>
            <p style={{ color: '#aaa', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Build a 3D Word Chain Race</p>
          </div>
          <button onClick={() => navigate('/teacher-menu')} style={{ background: 'transparent', border: '1px solid #ff4757', color: '#ff4757', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            ✕ CANCEL
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* GENERAL SETTINGS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                <label style={{ display: 'block', color: themeColor, fontWeight: 'bold', marginBottom: '10px' }}>Game Title</label>
                <input 
                  type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)} required
                  style={inputStyle}
                />
              </div>

              {/* 🟢 NEW: Checkbox List for Multiple Class Selection */}
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                <label style={{ display: 'block', color: themeColor, fontWeight: 'bold', marginBottom: '10px' }}>Assign to Classes *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '120px', overflowY: 'auto', paddingRight: '10px' }}>
                    {classes.length === 0 && <p style={{color: '#aaa', fontSize: '0.9rem'}}>No classes found.</p>}
                    {classes.map(cls => (
                        <label key={cls.class_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={selectedClasses.includes(cls.class_id)}
                                onChange={() => handleClassToggle(cls.class_id)}
                                style={{ width: '18px', height: '18px', accentColor: themeColor, cursor: 'pointer' }}
                            />
                            {cls.class_name}
                        </label>
                    ))}
                </div>
              </div>
          </div>

          {/* QUESTION BUILDER HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '15px 20px', borderRadius: '12px', marginTop: '10px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', margin: 0 }}>⛓️ Word Chain Questions</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Number of Questions:</label>
                  <input 
                      type="number" min="1" max="30" value={questions.length} onChange={handleQuestionCountChange}
                      style={{ width: '60px', padding: '8px', borderRadius: '6px', background: '#111827', color: '#fff', border: '1px solid #374151', textAlign: 'center' }}
                  />
              </div>
          </div>

          {/* QUESTIONS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
              {questions.map((q, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${themeColor}55`, padding: '20px', borderRadius: '12px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '-10px', left: '-10px', background: themeColor, width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                          {idx + 1}
                      </div>
                      
                      <div style={{ marginBottom: '15px' }}>
                          <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Previous Word (Prompt)</label>
                          <input type="text" placeholder="e.g. APPLE" value={q.prompt} onChange={(e) => handleQuestionChange(idx, 'prompt', e.target.value)} style={inputStyle} required />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                              <label style={{ color: q.correct === '0' ? '#4ade80' : '#aaa', fontSize: '0.8rem' }}>
                                  <input type="radio" name={`correct_${idx}`} checked={q.correct === '0'} onChange={() => handleQuestionChange(idx, 'correct', '0')} style={{marginRight: '5px'}}/> Choice A (Starts with E)
                              </label>
                              <input type="text" placeholder="EGG" value={q.choice_a} onChange={(e) => handleQuestionChange(idx, 'choice_a', e.target.value)} style={{...inputStyle, borderColor: q.correct === '0' ? '#4ade80' : '#374151'}} required />
                          </div>
                          <div>
                              <label style={{ color: q.correct === '1' ? '#4ade80' : '#aaa', fontSize: '0.8rem' }}>
                                  <input type="radio" name={`correct_${idx}`} checked={q.correct === '1'} onChange={() => handleQuestionChange(idx, 'correct', '1')} style={{marginRight: '5px'}}/> Choice B
                              </label>
                              <input type="text" placeholder="DOG" value={q.choice_b} onChange={(e) => handleQuestionChange(idx, 'choice_b', e.target.value)} style={{...inputStyle, borderColor: q.correct === '1' ? '#4ade80' : '#374151'}} required />
                          </div>
                          <div>
                              <label style={{ color: q.correct === '2' ? '#4ade80' : '#aaa', fontSize: '0.8rem' }}>
                                  <input type="radio" name={`correct_${idx}`} checked={q.correct === '2'} onChange={() => handleQuestionChange(idx, 'correct', '2')} style={{marginRight: '5px'}}/> Choice C
                              </label>
                              <input type="text" placeholder="CAT" value={q.choice_c} onChange={(e) => handleQuestionChange(idx, 'choice_c', e.target.value)} style={{...inputStyle, borderColor: q.correct === '2' ? '#4ade80' : '#374151'}} required />
                          </div>
                          <div>
                              <label style={{ color: q.correct === '3' ? '#4ade80' : '#aaa', fontSize: '0.8rem' }}>
                                  <input type="radio" name={`correct_${idx}`} checked={q.correct === '3'} onChange={() => handleQuestionChange(idx, 'correct', '3')} style={{marginRight: '5px'}}/> Choice D
                              </label>
                              <input type="text" placeholder="BIRD" value={q.choice_d} onChange={(e) => handleQuestionChange(idx, 'choice_d', e.target.value)} style={{...inputStyle, borderColor: q.correct === '3' ? '#4ade80' : '#374151'}} required />
                          </div>
                      </div>
                  </div>
              ))}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || selectedClasses.length === 0}
            style={{
              background: `linear-gradient(135deg, ${themeColor}, #ff0055)`,
              color: '#fff', border: 'none', padding: '16px', fontSize: '1.2rem',
              fontWeight: 'bold', borderRadius: '12px', cursor: (isSubmitting || selectedClasses.length === 0) ? 'not-allowed' : 'pointer',
              marginTop: '10px', opacity: (isSubmitting || selectedClasses.length === 0) ? 0.7 : 1, boxShadow: `0 6px 20px ${themeColor}66`
            }}
          >
            {isSubmitting ? 'SAVING GAME...' : `💾 ASSIGN GAME TO ${selectedClasses.length} CLASS(ES)`}
          </button>

        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px', borderRadius: '8px', background: '#111827',
  color: '#fff', border: '1px solid #374151', fontSize: '0.95rem', marginTop: '5px'
};

export default CreateHamsterBall;