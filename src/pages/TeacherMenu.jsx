// src/pages/TeacherMenu.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth"; 
import '../components/TeacherMenu.css'; 
import './SignUp.css'; 

function TeacherMenu() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('classes'); 
  const [classes, setClasses] = useState([]);
  const [games, setGames] = useState([]); 
  const [selectedClass, setSelectedClass] = useState(null); 
  const [classStudents, setClassStudents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [studentIdentifier, setStudentIdentifier] = useState(''); 
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchClasses(currentUser.uid);
        fetchGames(currentUser.uid);
      } else {
        setUser(null);
        setClasses([]);
        setGames([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchClasses = async (userId) => {
    try {
      if (!userId) return;
      const res = await fetch(`http://localhost:8081/api/get-classes/${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) setClasses(data);
      else setClasses([]); 
    } catch (err) {
      console.error("Error fetching classes:", err);
      setClasses([]); 
    }
  };

  const fetchGames = async (userId) => {
    try {
        const res = await fetch(`http://localhost:8081/api/get-games/${userId}`);
        const data = await res.json();
        if (Array.isArray(data)) setGames(data);
        else setGames([]);
    } catch (err) {
        console.error("Error fetching games:", err);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm("Are you sure you want to delete this game activity? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`http://localhost:8081/api/delete-game/${gameId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert("Game deleted successfully");
        fetchGames(user.uid); // Refresh the list
      } else {
        alert("Failed to delete game");
      }
    } catch (err) {
      console.error("Error deleting game:", err);
      alert("Server Error");
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const res = await fetch(`http://localhost:8081/api/class-members/${classId}`);
      const data = await res.json();
      if(Array.isArray(data)) setClassStudents(data);
      else setClassStudents([]);
    } catch (err) {
      console.error(err);
      setClassStudents([]);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!user || !user.uid) {
        alert("You must be logged in to create a class.");
        return;
    }
    try {
      const res = await fetch('http://localhost:8081/api/create-class', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ teacher_fid: user.uid, class_name: newClassName })
      });
      if(res.ok) {
        setShowCreateModal(false);
        setNewClassName('');
        fetchClasses(user.uid); 
      } else {
        alert("Failed to create class.");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    }
  };

  const openClass = (cls) => {
    setSelectedClass(cls);
    fetchStudents(cls.class_id);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setStatusMsg('Adding...');
    try {
      const res = await fetch('http://localhost:8081/api/add-student-to-class', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          class_id: selectedClass.class_id, 
          student_email: studentIdentifier 
        })
      });
      const data = await res.json();
      if(res.ok) {
        setStatusMsg('Success!');
        setStudentIdentifier('');
        setShowAddStudentModal(false);
        fetchStudents(selectedClass.class_id); 
      } else {
        setStatusMsg(data.error || "Failed to add student");
      }
    } catch (err) {
      setStatusMsg("Server Error");
    }
  };

  const handleRemoveStudent = async (studentFid) => {
    if(!window.confirm("Remove this student?")) return;
    try {
      await fetch('http://localhost:8081/api/remove-student', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ class_id: selectedClass.class_id, student_fid: studentFid })
      });
      fetchStudents(selectedClass.class_id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="teacher-dashboard">
      <div className="sidebar">
        <h3 style={{color: '#ff9900', textAlign:'center'}}>MENU</h3>
        <button className={`sidebar-btn ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => {setActiveTab('classes'); setSelectedClass(null);}}>My Classes</button>
        <button className={`sidebar-btn ${activeTab === 'library' ? 'active' : ''}`} onClick={() => {setActiveTab('library'); setSelectedClass(null);}}>Game Library</button>
        <button className={`sidebar-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => {setActiveTab('active'); setSelectedClass(null);}}>My Activities</button>
      </div>

      <div className="content-area">
        {activeTab === 'classes' && !selectedClass && (
          <>
            <div className="section-header">
              <h2>MY CLASSES</h2>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ CREATE CLASS</button>
            </div>
            <div className="classes-grid">
              {Array.isArray(classes) && classes.length === 0 ? <p>No classes yet. Create one!</p> : null}
              {Array.isArray(classes) && classes.map((cls) => (
                <div key={cls.class_id} className="class-card" onClick={() => openClass(cls)} style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                  <h3 style={{ color: '#fff', textAlign: 'center', margin: '0 0 10px 0', width: '100%', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: '1.4' }}>{cls.class_name}</h3>
                  <p style={{fontSize: '0.8rem', color: '#aaa'}}>Manage Students</p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'library' && (
          <>
            <div className="section-header"><h2>GAME LIBRARY</h2></div>
            <div className="classes-grid">
               <div className="class-card" style={{border: '2px solid #0ac8f0'}}><h3 style={{color: '#0ac8f0', fontSize: '1rem'}}>MAZE ESCAPE</h3><p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>RPG Dungeon Crawler. Students find clues and answer questions.</p><Link to="/teacher/create-maze"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem'}}>+ CREATE</button></Link></div>
               <div className="class-card" style={{border: '2px solid #ff9900'}}><h3 style={{color: '#ff9900', fontSize: '1rem'}}>ADVENTURE BATTLE</h3><p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Turn-based RPG combat. Defeat monsters by answering correctly.</p><Link to="/teacher/create-adventure"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#ff9900', border: 'none'}}>+ CREATE</button></Link></div>
               <div className="class-card" style={{border: '2px solid #ce93d8'}}><h3 style={{color: '#ce93d8', fontSize: '1rem'}}>WORD QUEST</h3><p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Snakes & Ladders. Roll dice, answer questions, race to finish!</p><Link to="/teacher/create-word-quest"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#ce93d8', color:'#1a0d2e', border: 'none'}}>+ CREATE</button></Link></div>
               <div className="class-card" style={{border: '2px solid #4dff91'}}><h3 style={{color: '#4dff91', fontSize: '1rem'}}>ENCHANTED FOREST</h3><p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Restore lost words. Explore magical woods and defeat guardians!</p><Link to="/teacher/create-enchanted-forest"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#4dff91', color:'#040a06', border: 'none'}}>+ CREATE</button></Link></div>
               <div className="class-card" style={{border: '2px solid #ff4757'}}><h3 style={{color: '#ff4757', fontSize: '1rem'}}>WHACK-A-MOLE</h3><p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Reflex & Recall! Hit moles to score points and answer questions.</p><Link to="/teacher/create-whack-a-mole"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#ff4757', color:'#fff', border: 'none'}}>+ CREATE</button></Link></div>
            </div>
          </>
        )}

        {activeTab === 'active' && (
          <>
            <div className="section-header"><h2>MY ACTIVITIES</h2></div>
            {games.length === 0 ? (
                <p style={{fontStyle: 'italic', color: '#777'}}>No active games found.</p>
            ) : (
                <table className="students-table">
                    <thead>
                        <tr>
                            <th>GAME TYPE</th>
                            <th>ASSIGNED TO</th>
                            <th>DATE</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {games.map((g) => (
                            <tr key={g.game_id}>
                                <td style={{color: '#0ac8f0'}}>{g.game_type}</td>
                                <td>{g.class_name}</td>
                                <td>{new Date(g.created_at).toLocaleDateString()}</td>
                                <td>
                                  <button 
                                    className="remove-btn" 
                                    style={{padding: '5px 10px', fontSize: '0.7rem'}}
                                    onClick={() => handleDeleteGame(g.game_id)}
                                  >
                                    REMOVE
                                  </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
          </>
        )}

        {selectedClass && (
          <>
            <div className="section-header">
              <h2>{selectedClass.class_name}</h2>
              <div>
                <button className="btn btn-secondary" onClick={() => setSelectedClass(null)} style={{marginRight: '10px'}}>BACK</button>
                <button className="btn btn-primary" onClick={() => setShowAddStudentModal(true)}>+ ADD STUDENT</button>
              </div>
            </div>
            <table className="students-table">
              <thead><tr><th>Name</th><th>Username</th><th>Remove</th></tr></thead>
              <tbody>
                {!Array.isArray(classStudents) || classStudents.length === 0 ? (
                  <tr><td colSpan="3" style={{textAlign:'center'}}>No students in this class yet.</td></tr>
                ) : (
                  classStudents.map((st) => (
                    <tr key={st.student_fid}>
                      <td>{st.student_name} {st.student_surname}</td>
                      <td>{st.student_username}</td>
                      <td><button className="remove-btn" onClick={(e) => { e.stopPropagation(); handleRemoveStudent(st.student_fid); }}>REMOVE</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>NEW CLASS</h2>
            <form onSubmit={handleCreateClass}>
              <div className="form-group"><input type="text" placeholder="Class Name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} required /></div>
              <div className="modal-actions-row">
                <button type="submit" className="btn btn-primary">CREATE</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddStudentModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>ADD STUDENT</h2>
            <p style={{fontSize:'0.7rem', color:'#fff', marginBottom:'15px'}}>Enter the student's <b>Username</b> to add them.</p>
            {statusMsg && <p className="error-text">{statusMsg}</p>}
            <form onSubmit={handleAddStudent}>
              <div className="form-group"><input type="text" placeholder="Student Username" value={studentIdentifier} onChange={(e) => {setStudentIdentifier(e.target.value); setStatusMsg('');}} required /></div>
              <div className="modal-actions-row">
                <button type="submit" className="btn btn-primary">ADD</button>
                <button type="button" onClick={() => setShowAddStudentModal(false)} className="btn btn-secondary">CLOSE</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherMenu;