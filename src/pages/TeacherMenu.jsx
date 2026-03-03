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
<<<<<<< HEAD
  const [selectedClass, setSelectedClass] = useState(null); 
  const [classStudents, setClassStudents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
=======

  // Class Management States
  const [selectedClass, setSelectedClass] = useState(null); 
  const [classStudents, setClassStudents] = useState([]);
  
  // Gradebook States
  const [gradebookClass, setGradebookClass] = useState(null); 
  const [gradebookGame, setGradebookGame] = useState(null);   
  const [gradebookData, setGradebookData] = useState([]);     

  // Item Analysis States (NEW)
  const [itemAnalysisGame, setItemAnalysisGame] = useState(null);
  const [itemAnalysisData, setItemAnalysisData] = useState([]);
  const [showItemAnalysisModal, setShowItemAnalysisModal] = useState(false);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [showRemoveStudentModal, setShowRemoveStudentModal] = useState(false);
  
  // Input & Tracking States
>>>>>>> 334ee928cce81dee62f60116213851330137b8a1
  const [newClassName, setNewClassName] = useState('');
  const [editClassNameInput, setEditClassNameInput] = useState('');
  const [studentIdentifier, setStudentIdentifier] = useState(''); 
  const [studentToRemove, setStudentToRemove] = useState(null); 
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

  const openClass = (cls) => {
    setSelectedClass(cls);
    fetchStudents(cls.class_id);
  };

  // --- GRADEBOOK & ITEM ANALYSIS FUNCTIONS ---
  const fetchGradebook = async (game) => {
      setGradebookGame(game);
      try {
          const res = await fetch(`http://localhost:8081/api/gradebook/${game.game_id}`);
          const data = await res.json();
          if (Array.isArray(data)) setGradebookData(data);
          else setGradebookData([]);
      } catch (err) {
          console.error("Error fetching gradebook:", err);
          setGradebookData([]);
      }
  };

  const openItemAnalysis = async (game) => {
      setItemAnalysisGame(game);
      try {
          const res = await fetch(`http://localhost:8081/api/item-analysis/${game.game_id}`);
          const data = await res.json();
          if (Array.isArray(data)) {
              setItemAnalysisData(data);
              setShowItemAnalysisModal(true);
          }
      } catch (err) {
          console.error("Error fetching item analysis:", err);
      }
  };

  const exportToCSV = () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Last Name,First Name,Raw Score,Total Items,Base-50 Grade,Time Taken (s)\n";

      gradebookData.forEach(row => {
          const raw = row.raw_score !== null ? row.raw_score : 0;
          const total = row.total_items || 1;
          const transmuted = row.raw_score !== null ? Math.round((raw / total) * 50 + 50) : 0;
          const time = row.time_taken !== null ? row.time_taken : "N/A";
          
          csvContent += `"${row.student_surname}","${row.student_name}","${raw}","${total}","${transmuted}","${time}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${gradebookGame.game_type}_Grades.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- CLASS MANAGEMENT ACTIONS ---
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!user || !user.uid) return;
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setStatusMsg('Adding...');
    try {
      const res = await fetch('http://localhost:8081/api/add-student-to-class', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ class_id: selectedClass.class_id, student_email: studentIdentifier })
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

  const promptRemoveStudent = (studentFid) => {
      setStudentToRemove(studentFid);
      setShowRemoveStudentModal(true);
  };

  const confirmRemoveStudent = async () => {
    try {
      await fetch('http://localhost:8081/api/remove-student', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ class_id: selectedClass.class_id, student_fid: studentToRemove })
      });
      fetchStudents(selectedClass.class_id);
      setShowRemoveStudentModal(false);
      setStudentToRemove(null);
    } catch (err) {
      console.error(err);
    }
  };

  const submitEditClass = async (e) => {
      e.preventDefault();
      const newName = editClassNameInput.trim();
      if (newName && newName !== selectedClass.class_name) {
          try {
              const res = await fetch(`http://localhost:8081/api/edit-class/${selectedClass.class_id}`, {
                  method: 'PUT',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ class_name: newName })
              });
              if (res.ok) {
                  setSelectedClass({ ...selectedClass, class_name: newName });
                  fetchClasses(user.uid);
                  setShowEditClassModal(false);
              }
          } catch (err) {
              console.error("Error updating class:", err);
          }
      } else {
          setShowEditClassModal(false);
      }
  };

  const confirmDeleteClass = async () => {
      try {
          const res = await fetch(`http://localhost:8081/api/delete-class/${selectedClass.class_id}`, {
              method: 'DELETE'
          });
          if (res.ok) {
              setSelectedClass(null); 
              setShowDeleteClassModal(false);
              fetchClasses(user.uid); 
              fetchGames(user.uid);   
          }
      } catch (err) {
          console.error("Error deleting class:", err);
      }
  };

  const switchTab = (tabName) => {
      setActiveTab(tabName);
      setSelectedClass(null);
      setGradebookClass(null);
      setGradebookGame(null);
  };

  return (
    <div className="teacher-dashboard">
      <div className="sidebar">
        <h3 style={{color: '#ff9900', textAlign:'center'}}>MENU</h3>
<<<<<<< HEAD
        <button className={`sidebar-btn ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => {setActiveTab('classes'); setSelectedClass(null);}}>My Classes</button>
        <button className={`sidebar-btn ${activeTab === 'library' ? 'active' : ''}`} onClick={() => {setActiveTab('library'); setSelectedClass(null);}}>Game Library</button>
        <button className={`sidebar-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => {setActiveTab('active'); setSelectedClass(null);}}>My Activities</button>
      </div>

      <div className="content-area">
=======
        
        <button className={`sidebar-btn ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => switchTab('classes')}>
          My Classes
        </button>

        <button className={`sidebar-btn ${activeTab === 'library' ? 'active' : ''}`} onClick={() => switchTab('library')}>
          Game Library
        </button>

        <button className={`sidebar-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => switchTab('active')}>
          My Activities
        </button>
      </div>

      <div className="content-area">
        
        {/* ========================================================== */}
        {/* VIEW 1: MY CLASSES                                         */}
        {/* ========================================================== */}
>>>>>>> 334ee928cce81dee62f60116213851330137b8a1
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

<<<<<<< HEAD
        {activeTab === 'library' && (
          <>
            <div className="section-header"><h2>GAME LIBRARY</h2></div>
            <div className="classes-grid">
               <div className="class-card" style={{border: '2px solid #0ac8f0'}}><h3 style={{color: '#0ac8f0', fontSize: '1rem'}}>MAZE ESCAPE</h3><p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>RPG Dungeon Crawler. Students find clues and answer questions.</p><Link to="/teacher/create-maze"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem'}}>+ CREATE</button></Link></div>
               <div className="class-card" style={{border: '2px solid #ff9900'}}><h3 style={{color: '#ff9900', fontSize: '1rem'}}>ADVENTURE BATTLE</h3><p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Turn-based RPG combat. Defeat monsters by answering correctly.</p><Link to="/teacher/create-adventure"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#ff9900', border: 'none'}}>+ CREATE</button></Link></div>
               <div className="class-card" style={{border: '2px solid #ce93d8'}}><h3 style={{color: '#ce93d8', fontSize: '1rem'}}>WORD QUEST</h3><p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Snakes & Ladders. Roll dice, answer questions, race to finish!</p><Link to="/teacher/create-word-quest"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#ce93d8', color:'#1a0d2e', border: 'none'}}>+ CREATE</button></Link></div>
               <div className="class-card" style={{border: '2px solid #4dff91'}}><h3 style={{color: '#4dff91', fontSize: '1rem'}}>ENCHANTED FOREST</h3><p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Restore lost words. Explore magical woods and defeat guardians!</p><Link to="/teacher/create-enchanted-forest"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#4dff91', color:'#040a06', border: 'none'}}>+ CREATE</button></Link></div>
               <div className="class-card" style={{border: '2px solid #ff4757'}}><h3 style={{color: '#ff4757', fontSize: '1rem'}}>WHACK-A-MOLE</h3><p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Reflex & Recall! Hit moles to score points and answer questions.</p><Link to="/teacher/create-whack-a-mole"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#ff4757', color:'#fff', border: 'none'}}>+ CREATE</button></Link></div>
               
               {/* WORD TOWER DEFENSE */}
               <div className="class-card" style={{border: '2px solid #ffd700'}}>
                 <h3 style={{color: '#ffd700', fontSize: '1rem'}}>WORD TOWER DEFENSE</h3>
                 <p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Defend the castle! Match the correct words to fire at approaching enemies.</p>
                 <Link to="/teacher/create-tower-defense">
                   <button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#ffd700', color: '#000', border: 'none', fontWeight: 'bold'}}>+ CREATE</button>
                 </Link>
               </div>

               {/* 🐹 NEW: HAMSTERBALL GAME CARD 🐹 */}
               <div className="class-card" style={{border: '2px solid #ff007f'}}>
                 <h3 style={{color: '#ff007f', fontSize: '1rem'}}>HAMSTERBALL</h3>
                 <p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Roll your hamster through a 3D track, jump obstacles, and chain words!</p>
                 <Link to="/teacher/create-hamsterball">
                   <button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#ff007f', color:'#fff', border: 'none', fontWeight: 'bold'}}>+ CREATE</button>
                 </Link>
=======
        {/* --- VIEW 1B: SINGLE CLASS DETAILS --- */}
        {activeTab === 'classes' && selectedClass && (
          <>
            <div className="section-header" style={{alignItems: 'flex-start'}}>
              <div>
                  <h2 style={{margin: 0}}>{selectedClass.class_name}</h2>
                  <p style={{color: '#ffd700', margin: '5px 0 0 0', fontSize: '1.2rem', fontFamily: 'monospace'}}>
                      Class Code: <b>{selectedClass.class_code || 'Old Class (No Code)'}</b>
                  </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedClass(null)}>BACK</button>
                <button className="btn btn-primary" onClick={() => setShowAddStudentModal(true)}>+ ADD STUDENT</button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { setEditClassNameInput(selectedClass.class_name); setShowEditClassModal(true); }}
                  style={{ backgroundColor: '#2b2b2b', borderColor: '#444', color: '#fff' }}
                >EDIT CLASS</button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => setShowDeleteClassModal(true)}
                  style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}
                >DELETE CLASS</button>
              </div>
            </div>

            <table className="students-table" style={{marginTop: '20px'}}>
              <thead>
                <tr><th>Name</th><th>Username</th><th>Remove</th></tr>
              </thead>
              <tbody>
                {!Array.isArray(classStudents) || classStudents.length === 0 ? (
                  <tr><td colSpan="3" style={{textAlign:'center'}}>No students in this class yet. Give them the class code!</td></tr>
                ) : (
                  classStudents.map((st) => (
                    <tr key={st.cm_fid}>
                      <td>{st.student_name ? `${st.student_name} ${st.student_surname}` : <span style={{color:'red'}}>⚠ Missing DB Record</span>}</td>
                      <td>{st.student_username || <span style={{color:'red'}}>Broken ID</span>}</td>
                      <td><button className="remove-btn" onClick={(e) => { e.stopPropagation(); promptRemoveStudent(st.cm_fid); }}>REMOVE</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}

        {/* ========================================================== */}
        {/* VIEW 2: GAME LIBRARY                                       */}
        {/* ========================================================== */}
        {activeTab === 'library' && (
          <>
            <div className="section-header"><h2>GAME LIBRARY</h2></div>
            <p style={{marginBottom: '20px'}}>Select a template to create a new activity.</p>
            <div className="classes-grid">
               <div className="class-card" style={{border: '2px solid #0ac8f0'}}>
                  <h3 style={{color: '#0ac8f0', fontSize: '1rem'}}>MAZE ESCAPE</h3>
                  <p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>
                    RPG Dungeon Crawler. Students find clues and answer questions to unlock doors.
                  </p>
                  <Link to="/teacher/create-maze"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem'}}>+ CREATE</button></Link>
               </div>
               <div className="class-card" style={{opacity: 0.6, border: '1px dashed #555'}}>
                  <h3 style={{color: '#888', fontSize: '1rem'}}>COMING SOON</h3>
                  <p style={{fontSize: '0.7rem', color: '#aaa'}}>Quiz Battle...</p>
>>>>>>> 334ee928cce81dee62f60116213851330137b8a1
               </div>

            </div>
          </>
        )}

<<<<<<< HEAD
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
=======
        {/* ========================================================== */}
        {/* VIEW 3: MY ACTIVITIES / GRADEBOOK                          */}
        {/* ========================================================== */}
        
        {/* STEP 3A: Select Class */}
        {activeTab === 'active' && !gradebookClass && (
          <>
            <div className="section-header"><h2>CLASS ACTIVITIES & GRADES</h2></div>
            <p style={{marginBottom: '20px'}}>Select a class to view its active games and student grades.</p>
            <div className="classes-grid">
              {Array.isArray(classes) && classes.map((cls) => (
                <div key={cls.class_id} className="class-card" style={{border: '1px solid #14a014'}} onClick={() => setGradebookClass(cls)}>
                  <h3 style={{color: '#14a014'}}>{cls.class_name}</h3>
                  <p style={{fontSize: '0.8rem', color: '#aaa'}}>View Gradebook</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* STEP 3B: Select Activity */}
        {activeTab === 'active' && gradebookClass && !gradebookGame && (
          <>
            <div className="section-header">
                <h2>{gradebookClass.class_name} Activities</h2>
                <button className="btn btn-secondary" onClick={() => setGradebookClass(null)}>BACK TO CLASSES</button>
            </div>
            
            <table className="students-table">
                <thead>
                    <tr><th>GAME TYPE</th><th>DATE CREATED</th><th>ACTION</th></tr>
                </thead>
                <tbody>
                    {games.filter(g => g.class_id === gradebookClass.class_id).length === 0 ? (
                        <tr><td colSpan="3" style={{textAlign:'center'}}>No games assigned to this class yet.</td></tr>
                    ) : (
                        games.filter(g => g.class_id === gradebookClass.class_id).map((g) => (
                            <tr key={g.game_id}>
                                <td style={{color: '#0ac8f0', fontWeight: 'bold'}}>{g.game_type}</td>
                                <td>{new Date(g.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div style={{display: 'flex', gap: '5px'}}>
                                        <button className="btn btn-primary" style={{padding: '5px 10px', fontSize: '0.8rem'}} onClick={() => fetchGradebook(g)}>
                                            VIEW GRADES
                                        </button>
                                        <button className="btn btn-secondary" style={{padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#333'}} onClick={() => openItemAnalysis(g)}>
                                            VIEW ACTIVITY STATS
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
>>>>>>> 334ee928cce81dee62f60116213851330137b8a1
            </table>
          </>
        )}

        {/* STEP 3C: THE GRADEBOOK TABLE */}
        {activeTab === 'active' && gradebookClass && gradebookGame && (
          <>
            <div className="section-header" style={{alignItems: 'flex-start'}}>
                <div>
                    <h2 style={{margin: 0}}>{gradebookGame.game_type} Grades</h2>
                    <p style={{color: '#aaa', margin: '5px 0 0 0', fontSize: '0.9rem'}}>Class: {gradebookClass.class_name}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={() => setGradebookGame(null)}>BACK</button>
                    <button className="btn btn-primary" onClick={exportToCSV} style={{backgroundColor: '#14a014', borderColor: '#14a014'}}>📥 EXPORT TO CSV</button>
                </div>
            </div>

            <table className="students-table" style={{marginTop: '20px'}}>
                <thead>
                    <tr><th>Student Name</th><th>Raw Score</th><th>Transmuted Grade</th><th>Time</th><th>Status</th></tr>
                </thead>
                <tbody>
                    {gradebookData.length === 0 ? (
                        <tr><td colSpan="5" style={{textAlign:'center'}}>No students in this class.</td></tr>
                    ) : (
                        gradebookData.map((row) => {
                            const hasPlayed = row.raw_score !== null;
                            const raw = hasPlayed ? row.raw_score : 0;
                            const total = row.total_items || 1;
                            const grade = hasPlayed ? Math.round((raw / total) * 50 + 50) : 0;
                            const isPassing = grade >= 75;

                            return (
                                <tr key={row.student_fid}>
                                    <td>{row.student_surname}, {row.student_name}</td>
                                    {hasPlayed ? (
                                        <>
                                            <td style={{fontWeight: 'bold'}}>{raw} / {total}</td>
                                            <td style={{color: isPassing ? '#14a014' : '#ff4c4c', fontWeight: 'bold'}}>{grade}%</td>
                                            <td>{row.time_taken}s</td>
                                            <td>
                                                <span style={{
                                                    backgroundColor: isPassing ? 'rgba(20, 160, 20, 0.2)' : 'rgba(220, 53, 69, 0.2)',
                                                    color: isPassing ? '#14a014' : '#ff4c4c',
                                                    padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                                                }}>
                                                    {isPassing ? 'PASSED' : 'FAILED'}
                                                </span>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td style={{color: '#666'}}>- / {total}</td>
                                            <td style={{color: '#666'}}>-</td>
                                            <td style={{color: '#666'}}>-</td>
                                            <td><span style={{backgroundColor: '#333', color: '#888', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>NOT ATTEMPTED</span></td>
                                        </>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
          </>
        )}

      </div>

<<<<<<< HEAD
=======
      {/* ========================================= */}
      {/* CUSTOM MODALS                             */}
      {/* ========================================= */}

      {/* Item Analysis Modal (NEW) */}
      {showItemAnalysisModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{width: '700px', maxWidth: '90%'}}>
            <h2 style={{color: '#0ac8f0'}}>ACTIVITY STATS</h2>
            <p style={{fontSize:'0.8rem', color:'#aaa', marginBottom:'15px'}}>
              View how many students got each question right or wrong for <b>{itemAnalysisGame?.game_type}</b>.
            </p>
            
            <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                <table className="students-table" style={{width: '100%', fontSize: '0.9rem'}}>
                    <thead>
                        <tr>
                            <th style={{textAlign: 'left'}}>Question</th>
                            <th>Correct</th>
                            <th>Wrong</th>
                            <th>Accuracy</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemAnalysisData.length === 0 ? (
                            <tr><td colSpan="4" style={{textAlign:'center'}}>No data available yet.</td></tr>
                        ) : (
                            itemAnalysisData.map((item, index) => {
                                const totalAnswers = parseInt(item.correct_count || 0) + parseInt(item.wrong_count || 0);
                                const accuracy = totalAnswers > 0 ? Math.round((parseInt(item.correct_count) / totalAnswers) * 100) : 0;
                                
                                return (
                                    <tr key={item.question_id}>
                                        <td style={{textAlign: 'left'}}>{index + 1}. {item.question_text}</td>
                                        <td style={{color: '#14a014', fontWeight: 'bold'}}>{item.correct_count || 0}</td>
                                        <td style={{color: '#ff4c4c', fontWeight: 'bold'}}>{item.wrong_count || 0}</td>
                                        <td>{totalAnswers > 0 ? `${accuracy}%` : '-'}</td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="modal-actions-row" style={{marginTop: '20px', justifyContent: 'center'}}>
                <button type="button" onClick={() => setShowItemAnalysisModal(false)} className="btn btn-secondary">CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
>>>>>>> 334ee928cce81dee62f60116213851330137b8a1
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>NEW CLASS</h2>
            <form onSubmit={handleCreateClass}>
<<<<<<< HEAD
              <div className="form-group"><input type="text" placeholder="Class Name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} required /></div>
=======
              <div className="form-group">
                <input type="text" placeholder="Class Name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} required />
              </div>
>>>>>>> 334ee928cce81dee62f60116213851330137b8a1
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
<<<<<<< HEAD
            <h2>ADD STUDENT</h2>
            <p style={{fontSize:'0.7rem', color:'#fff', marginBottom:'15px'}}>Enter the student's <b>Username</b> to add them.</p>
            {statusMsg && <p className="error-text">{statusMsg}</p>}
=======
            <h2>ADD STUDENT MANUALLY</h2>
            <p style={{fontSize:'0.8rem', color:'#aaa', marginBottom:'15px'}}>Enter the student's <b>Username</b>.</p>
            {statusMsg && <p className="error-text" style={{color: '#ff4c4c'}}>{statusMsg}</p>}
>>>>>>> 334ee928cce81dee62f60116213851330137b8a1
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
<<<<<<< HEAD
=======

      {showEditClassModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>EDIT CLASS NAME</h2>
            <p style={{fontSize:'0.8rem', color:'#aaa', marginBottom:'15px'}}>Enter the new name for this class.</p>
            <form onSubmit={submitEditClass}>
              <div className="form-group">
                <input type="text" value={editClassNameInput} onChange={(e) => setEditClassNameInput(e.target.value)} required />
              </div>
              <div className="modal-actions-row">
                <button type="submit" className="btn btn-primary">SAVE</button>
                <button type="button" onClick={() => setShowEditClassModal(false)} className="btn btn-secondary">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteClassModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ border: '2px solid #dc3545' }}>
            <h2 style={{color: '#dc3545'}}>DELETE CLASS</h2>
            <div style={{fontSize:'0.9rem', color:'#fff', marginBottom:'20px', textAlign: 'center'}}>
              Are you sure you want to delete <b>{selectedClass?.class_name}</b>?<br/><br/>
              <span style={{color: '#ff4c4c', fontWeight: 'bold'}}>
                This action CANNOT be reversed and will delete ALL students, games, and scores associated with it.
              </span>
            </div>
            <div className="modal-actions-row">
              <button type="button" onClick={confirmDeleteClass} className="btn" style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none' }}>CONFIRM DELETE</button>
              <button type="button" onClick={() => setShowDeleteClassModal(false)} className="btn btn-secondary">CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {showRemoveStudentModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ border: '2px solid #ff9900' }}>
            <h2 style={{color: '#ff9900'}}>REMOVE STUDENT</h2>
            <p style={{fontSize:'0.9rem', color:'#fff', marginBottom:'20px', textAlign: 'center'}}>
              Are you sure you want to remove this student from the class?
            </p>
            <div className="modal-actions-row">
              <button type="button" onClick={confirmRemoveStudent} className="btn" style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none' }}>REMOVE</button>
              <button type="button" onClick={() => setShowRemoveStudentModal(false)} className="btn btn-secondary">CANCEL</button>
            </div>
          </div>
        </div>
      )}

>>>>>>> 334ee928cce81dee62f60116213851330137b8a1
    </div>
  );
}

export default TeacherMenu;