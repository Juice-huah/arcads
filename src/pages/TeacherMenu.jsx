// src/pages/TeacherMenu.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth"; 
import '../components/TeacherMenu.css'; 
import './SignUp.css'; 

function TeacherMenu() {
  const [user, setUser] = useState(null);
  
  // Tabs: 'classes', 'library', 'active'
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
      
      {/* --- SIDEBAR --- */}
      <div className="sidebar">
        <h3 style={{color: '#ff9900', textAlign:'center'}}>MENU</h3>
        
        <button 
          className={`sidebar-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => {setActiveTab('classes'); setSelectedClass(null);}}
        >
          My Classes
        </button>

        {/* TAB 2: Game Library (Create New) */}
        <button 
          className={`sidebar-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => {setActiveTab('library'); setSelectedClass(null);}}
        >
          Game Library
        </button>

        {/* TAB 3: My Activities (View Created) */}
        <button 
          className={`sidebar-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => {setActiveTab('active'); setSelectedClass(null);}}
        >
          My Activities
        </button>
      </div>

      <div className="content-area">
        
        {/* --- VIEW 1: MY CLASSES --- */}
        {activeTab === 'classes' && !selectedClass && (
          <>
            <div className="section-header">
              <h2>MY CLASSES</h2>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                + CREATE CLASS
              </button>
            </div>

            <div className="classes-grid">
              {Array.isArray(classes) && classes.length === 0 ? (
                 <p>No classes yet. Create one!</p>
              ) : null}
              
              {Array.isArray(classes) && classes.map((cls) => (
                <div key={cls.class_id} className="class-card" onClick={() => openClass(cls)}>
                  <h3 style={{color: '#fff'}}>{cls.class_name}</h3>
                  <p style={{fontSize: '0.8rem', color: '#aaa'}}>Manage Students</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* --- VIEW 2: GAME LIBRARY (Templates Only) --- */}
        {activeTab === 'library' && (
          <>
            <div className="section-header">
               <h2>GAME LIBRARY</h2>
            </div>
            <p style={{marginBottom: '20px'}}>Select a template to create a new activity.</p>
            
            <div className="classes-grid">
               {/* Maze Game Card */}
               <div className="class-card" style={{border: '2px solid #0ac8f0'}}>
                  <h3 style={{color: '#0ac8f0', fontSize: '1rem'}}>MAZE ESCAPE</h3>
                  <p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>
                    RPG Dungeon Crawler. Students find clues and answer questions to unlock doors.
                  </p>
                  <Link to="/teacher/create-maze">
                    <button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem'}}>
                      + CREATE
                    </button>
                  </Link>
               </div>

               <div className="class-card" style={{opacity: 0.6, border: '1px dashed #555'}}>
                  <h3 style={{color: '#888', fontSize: '1rem'}}>COMING SOON</h3>
                  <p style={{fontSize: '0.7rem', color: '#aaa'}}>Quiz Battle...</p>
               </div>
            </div>
          </>
        )}

        {/* --- VIEW 3: MY ACTIVITIES (Active Games Only) --- */}
        {activeTab === 'active' && (
          <>
            <div className="section-header">
               <h2>MY ACTIVITIES</h2>
            </div>
            <p style={{marginBottom: '20px'}}>Games currently assigned to your classes.</p>

            {games.length === 0 ? (
                <p style={{fontStyle: 'italic', color: '#777'}}>No active games found. Go to Game Library to create one.</p>
            ) : (
                <table className="students-table">
                    <thead>
                        <tr>
                            <th>GAME TYPE</th>
                            <th>ASSIGNED TO</th>
                            <th>DATE CREATED</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {games.map((g) => (
                            <tr key={g.game_id}>
                                <td style={{color: '#0ac8f0'}}>{g.game_type}</td>
                                <td>{g.class_name}</td>
                                <td>{new Date(g.created_at).toLocaleDateString()}</td>
                                <td style={{color: '#14a014'}}>ACTIVE</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
          </>
        )}

        {/* --- VIEW 4: SINGLE CLASS DETAILS --- */}
        {selectedClass && (
          <>
            <div className="section-header">
              <h2>{selectedClass.class_name}</h2>
              <div>
                <button className="btn btn-secondary" onClick={() => setSelectedClass(null)} style={{marginRight: '10px'}}>
                  BACK
                </button>
                <button className="btn btn-primary" onClick={() => setShowAddStudentModal(true)}>
                  + ADD STUDENT
                </button>
              </div>
            </div>

            <table className="students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {!Array.isArray(classStudents) || classStudents.length === 0 ? (
                  <tr><td colSpan="3" style={{textAlign:'center'}}>No students in this class yet.</td></tr>
                ) : (
                  classStudents.map((st) => (
                    <tr key={st.student_fid}>
                      <td>{st.student_name} {st.student_surname}</td>
                      <td>{st.student_username}</td>
                      <td>
                        <button 
                          className="remove-btn"
                          onClick={(e) => { e.stopPropagation(); handleRemoveStudent(st.student_fid); }}
                        >
                          REMOVE
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* --- POPUPS --- */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>NEW CLASS</h2>
            <form onSubmit={handleCreateClass}>
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="Class Name" 
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                />
              </div>
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
            <p style={{fontSize:'0.7rem', color:'#fff', marginBottom:'15px'}}>
              Enter the student's <b>Username</b> to add them.
            </p>
            {statusMsg && <p className="error-text">{statusMsg}</p>}
            
            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <input type="text" placeholder="Student Username" value={studentIdentifier} onChange={(e) => {setStudentIdentifier(e.target.value); setStatusMsg('');}} required />
              </div>
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