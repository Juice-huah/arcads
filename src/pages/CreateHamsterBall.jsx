import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import '../components/TeacherMenu.css'; 

function CreateHamsterBall() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  
  // Game Configuration States
  const [selectedClass, setSelectedClass] = useState('');
  const [category, setCategory] = useState('all');
  const [minLength, setMinLength] = useState(2);
  const [gameTime, setGameTime] = useState(120);
  const [wrongPenalty, setWrongPenalty] = useState(8);
  const [showHints, setShowHints] = useState(true);
  const [startingWords, setStartingWords] = useState("apple\nriver\nsun\ntree\negg");
  const [customWords, setCustomWords] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accent color for HamsterBall
  const themeColor = "#ff007f"; 

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

  const parseWords = (txt) => txt.split(/[\n,]+/).map(w => w.trim().toLowerCase()).filter(w => w.length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) return alert("Please select a class to assign this game to!");
    
    setIsSubmitting(true);
    
    const startWordsList = parseWords(startingWords);
    const customWordsList = parseWords(customWords);

    // Package the configuration exactly how HamsterBall expects it
    const gameConfig = {
      category,
      minLength: Number(minLength),
      gameTime: Number(gameTime),
      wrongPenalty: Number(wrongPenalty),
      showHints,
      startingWords: startWordsList.length > 0 ? startWordsList : ["apple", "river", "sun"],
      customWords: customWordsList
    };

    try {
      // Sends the creation request to your backend
      const res = await fetch('http://localhost:8081/api/create-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_fid: user.uid,
          class_id: selectedClass,
          game_type: 'HamsterBall',
          // Storing the config as a JSON string in your database's game_data or questions column
          game_data: JSON.stringify(gameConfig) 
        })
      });

      if (res.ok) {
        alert("HamsterBall Game created and assigned successfully!");
        navigate('/teacher-menu');
      } else {
        alert("Failed to create game. Please check your server.");
      }
    } catch (err) {
      console.error("Error saving game:", err);
      alert("Server Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="teacher-dashboard" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      
      <div style={{ maxWidth: '800px', width: '100%', background: '#0a0f1a', borderRadius: '16px', border: `2px solid ${themeColor}`, padding: '30px', boxShadow: `0 0 30px ${themeColor}44` }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ color: themeColor, fontSize: '2rem', margin: 0, fontFamily: "'Fredoka One', sans-serif", letterSpacing: '2px' }}>
              🐹 CREATE HAMSTERBALL
            </h1>
            <p style={{ color: '#aaa', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Assign a 3D Word Chain race to your class.</p>
          </div>
          <button onClick={() => navigate('/teacher-menu')} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
            ✕ CANCEL
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* CLASS SELECTION */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
            <label style={{ display: 'block', color: themeColor, fontWeight: 'bold', marginBottom: '10px' }}>Assign to Class *</label>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)} 
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#111827', color: '#fff', border: '1px solid #374151', fontSize: '1rem' }}
            >
              <option value="" disabled>Select a class...</option>
              {classes.map(cls => (
                <option key={cls.class_id} value={cls.class_id}>{cls.class_name}</option>
              ))}
            </select>
          </div>

          {/* GAME RULES GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
              <label style={{ display: 'block', color: '#fff', marginBottom: '10px', fontSize: '0.9rem' }}>Word Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
                <option value="all">All Words (Mixed)</option>
                <option value="animals">Animals</option>
                <option value="nature">Nature</option>
                <option value="objects">Objects</option>
                <option value="actions">Actions</option>
                <option value="places">Places</option>
              </select>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
              <label style={{ display: 'block', color: '#fff', marginBottom: '10px', fontSize: '0.9rem' }}>Minimum Word Length</label>
              <select value={minLength} onChange={(e) => setMinLength(e.target.value)} style={selectStyle}>
                <option value="2">2+ Letters (Beginner)</option>
                <option value="3">3+ Letters (Normal)</option>
                <option value="4">4+ Letters (Challenging)</option>
                <option value="5">5+ Letters (Hard)</option>
              </select>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
              <label style={{ display: 'block', color: '#fff', marginBottom: '10px', fontSize: '0.9rem' }}>Game Time Limit</label>
              <select value={gameTime} onChange={(e) => setGameTime(e.target.value)} style={selectStyle}>
                <option value="60">60 Seconds</option>
                <option value="90">90 Seconds</option>
                <option value="120">120 Seconds (Standard)</option>
                <option value="180">180 Seconds</option>
              </select>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
              <label style={{ display: 'block', color: '#fff', marginBottom: '10px', fontSize: '0.9rem' }}>Wrong Answer Penalty</label>
              <select value={wrongPenalty} onChange={(e) => setWrongPenalty(e.target.value)} style={selectStyle}>
                <option value="5">-5 HP (Gentle)</option>
                <option value="8">-8 HP (Normal)</option>
                <option value="12">-12 HP (Challenging)</option>
              </select>
            </div>

          </div>

          {/* TOGGLE OPTIONS */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <input 
              type="checkbox" 
              id="showHints" 
              checked={showHints} 
              onChange={(e) => setShowHints(e.target.checked)} 
              style={{ width: '20px', height: '20px', accentColor: themeColor }}
            />
            <label htmlFor="showHints" style={{ color: '#fff', fontSize: '1rem', cursor: 'pointer' }}>
              Enable Auto-Hints (Shows a helpful word if the student takes too long)
            </label>
          </div>

          {/* WORD LISTS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
              <label style={{ display: 'block', color: themeColor, fontWeight: 'bold', marginBottom: '10px' }}>Starting Words</label>
              <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '10px' }}>The seed words that appear on the glowing ring signs. Separate with new lines.</p>
              <textarea 
                value={startingWords} 
                onChange={(e) => setStartingWords(e.target.value)} 
                rows="5"
                style={textareaStyle}
              />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
              <label style={{ display: 'block', color: themeColor, fontWeight: 'bold', marginBottom: '10px' }}>Custom Word Bank (Optional)</label>
              <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '10px' }}>Restrict valid answers to ONLY these words. Leave blank to use the massive built-in dictionary.</p>
              <textarea 
                value={customWords} 
                onChange={(e) => setCustomWords(e.target.value)} 
                placeholder="cat&#10;dog&#10;rabbit"
                rows="5"
                style={textareaStyle}
              />
            </div>
          </div>

          {/* SUBMIT */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{
              background: themeColor,
              color: '#fff',
              border: 'none',
              padding: '16px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              borderRadius: '12px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              opacity: isSubmitting ? 0.7 : 1,
              boxShadow: `0 6px 20px ${themeColor}66`
            }}
          >
            {isSubmitting ? 'SAVING...' : '💾 ASSIGN GAME'}
          </button>

        </form>
      </div>
    </div>
  );
}

// Reusable inline styles for the form inputs
const selectStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  background: '#1f2937',
  color: '#fff',
  border: '1px solid #4b5563',
  fontSize: '0.95rem'
};

const textareaStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  background: '#1f2937',
  color: '#fff',
  border: '1px solid #4b5563',
  fontSize: '0.95rem',
  resize: 'vertical'
};

export default CreateHamsterBall;