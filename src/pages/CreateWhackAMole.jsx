import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";

export default function CreateWhackAMole() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  
  // Form State
  const [gameTitle, setGameTitle] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [questions, setQuestions] = useState([
    { question_text: '', choice_a: '', choice_b: '', choice_c: '', choice_d: '', correct_option: 'A' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Teacher's Classes
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
      if (Array.isArray(data)) setClasses(data);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  // Handle Question Changes
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

  // Submit Game to Database (UPDATED TO USE NEW SINGLE ROUTE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gameTitle || !selectedClass) {
      alert("Please provide a title and select a class.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Send everything directly to our new backend route!
      const res = await fetch('http://localhost:8081/api/create-whack-a-mole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_fid: user.uid,
          class_id: selectedClass,
          game_title: gameTitle,
          questions: questions // Passing the whole array at once
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create game");
      
      alert("Whack-a-Mole Game Created Successfully!");
      navigate('/teacher-menu');

    } catch (error) {
      console.error(error);
      alert("Error creating game: " + error.message);
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

        <form onSubmit={handleSubmit}>
          {/* Game Details */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
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

          {/* Questions Section */}
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