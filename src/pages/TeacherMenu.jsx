// src/pages/TeacherMenu.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth"; 
import '../components/TeacherMenu.css'; 
import './SignUp.css'; 

const GAME_DISPLAY_NAMES = {
    'adventure': 'ADVENTURE BATTLE',
    'word_quest': 'WORD QUEST',
    'enchanted_forest': 'ENCHANTED FOREST',
    'whack_a_mole': 'WHACK-A-MOLE',
    'startype': 'STARTYPE',
    'tower_defense': 'WORD TOWER DEFENSE',
    'hamsterball': 'HAMSTERBALL'
};

const getDisplayName = (game) => {
    if (game.custom_title && game.custom_title.trim() !== "") {
        return game.custom_title.toUpperCase();
    }
    const dbType = game.game_type;
    return GAME_DISPLAY_NAMES[dbType] || String(dbType).replace(/_/g, ' ').toUpperCase();
};

function TeacherMenu() {
  const [user, setUser] = useState(null);
  
  const [activeTab, setActiveTab] = useState('classes'); 
  const [classes, setClasses] = useState([]);
  const [games, setGames] = useState([]); 

  const [selectedClass, setSelectedClass] = useState(null); 
  const [classStudents, setClassStudents] = useState([]);
  
  const [gradebookClass, setGradebookClass] = useState(null); 
  const [gradebookGame, setGradebookGame] = useState(null);   
  const [gradebookData, setGradebookData] = useState([]);    

  // 🟢 Item Analysis States
  const [itemAnalysisGame, setItemAnalysisGame] = useState(null);
  const [itemAnalysisData, setItemAnalysisData] = useState([]);
  const [itemSummaryData, setItemSummaryData] = useState({}); 
  const [showItemAnalysisModal, setShowItemAnalysisModal] = useState(false);
  const [itemSortMode, setItemSortMode] = useState('numerical'); 

  // 🟢 Class Performance States
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [classPerformanceData, setClassPerformanceData] = useState([]);
  const [performanceSortMode, setPerformanceSortMode] = useState('alphabetical');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [showRemoveStudentModal, setShowRemoveStudentModal] = useState(false);
  
  const [newClassName, setNewClassName] = useState('');
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [createClassError, setCreateClassError] = useState('');
  
  const [cloneFromClassId, setCloneFromClassId] = useState('');
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [createStatusMsg, setCreateStatusMsg] = useState('');

  const [editClassNameInput, setEditClassNameInput] = useState('');
  const [studentIdentifier, setStudentIdentifier] = useState(''); 
  const [studentToRemove, setStudentToRemove] = useState(null); 
  const [statusMsg, setStatusMsg] = useState('');

  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [selectedGameForSchedule, setSelectedGameForSchedule] = useState(null);
  
  const [editOpenDate, setEditOpenDate] = useState('');
  const [editOpenTime, setEditOpenTime] = useState('');
  const [editCloseDate, setEditCloseDate] = useState('');
  const [editCloseTime, setEditCloseTime] = useState('');
  const [editNoCloseDate, setEditNoCloseDate] = useState(false);
  const [editUnlimitedTime, setEditUnlimitedTime] = useState(false);
  const [editTimeLimit, setEditTimeLimit] = useState(15);

  const [showToggleActivityModal, setShowToggleActivityModal] = useState(false);
  const [selectedGameForToggle, setSelectedGameForToggle] = useState(null);

  const [showDeleteGameModal, setShowDeleteGameModal] = useState(false);
  const [selectedGameToDelete, setSelectedGameToDelete] = useState(null);

  const [showReuseModal, setShowReuseModal] = useState(false);
  const [selectedGameToReuse, setSelectedGameToReuse] = useState(null);
  const [reuseTargetClassId, setReuseTargetClassId] = useState('');
  const [isReusing, setIsReusing] = useState(false);
  const [reuseErrorMsg, setReuseErrorMsg] = useState('');

  const [showResetAttemptModal, setShowResetAttemptModal] = useState(false);
  const [studentToReset, setStudentToReset] = useState(null);

  const [clockTick, setClockTick] = useState(0);

  useEffect(() => {
      const timer = setInterval(() => {
          setClockTick(prev => prev + 1); 
      }, 60000); 
      return () => clearInterval(timer);
  }, []);

  const getActivityStatus = (game) => {
      if (!game.is_active) return { text: "● CLOSED", color: "#ff4c4c" }; 

      const now = new Date(); 
      const openDate = game.open_datetime ? new Date(game.open_datetime.replace(' ', 'T')) : null;
      const closeDate = game.close_datetime ? new Date(game.close_datetime.replace(' ', 'T')) : null;

      if (openDate && now < openDate) {
          return { text: "● SCHEDULED", color: "var(--arcade-orange)" }; 
      }
      if (closeDate && now > closeDate) {
          return { text: "● CLOSED", color: "#ff4c4c" };
      }
      
      return { text: "● OPEN", color: "#14a014" }; 
  };

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

  useEffect(() => {
      if (!user) return;
      const pollingInterval = setInterval(() => {
          if (!isCreatingClass && !isReusing) fetchClasses(user.uid); 
          fetchGames(user.uid);
          if (selectedClass && selectedClass.class_id) {
              fetchStudents(selectedClass.class_id);
          }
          if (gradebookGame) {
              fetchGradebook(gradebookGame);
          }
      }, 30000); 

      return () => clearInterval(pollingInterval);
  }, [user, selectedClass, gradebookGame, isCreatingClass, isReusing]); 

  const fetchClasses = async (userId) => {
    try {
      if (!userId) return;
      const res = await fetch(`https://arcads-api.onrender.com/api/get-classes/${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
          const sortedData = data.sort((a, b) => b.class_id - a.class_id);
          setClasses(sortedData);
      }
      else setClasses([]); 
    } catch (err) {
      console.error("Error fetching classes:", err);
      setClasses([]); 
    }
  };

  const fetchGames = async (userId) => {
    try {
        const res = await fetch(`https://arcads-api.onrender.com/api/get-games/${userId}`);
        const data = await res.json();
        if (Array.isArray(data)) setGames(data);
        else setGames([]);
    } catch (err) {
        console.error("Error fetching games:", err);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const res = await fetch(`https://arcads-api.onrender.com/api/class-members/${classId}`);
      const data = await res.json();
      
      if(Array.isArray(data)) {
          const sortedStudents = data.sort((a, b) => {
              const nameA = (a.student_surname || "").toLowerCase();
              const nameB = (b.student_surname || "").toLowerCase();
              return nameA.localeCompare(nameB);
          });
          setClassStudents(sortedStudents);
      } else {
          setClassStudents([]);
      }
    } catch (err) {
      console.error(err);
      setClassStudents([]);
    }
  };

  const openClass = (cls) => {
    setSelectedClass(cls);
    fetchStudents(cls.class_id);
  };

  const fetchGradebook = async (game) => {
      setGradebookGame(game);
      try {
          const res = await fetch(`https://arcads-api.onrender.com/api/gradebook/${game.game_id}`);
          const data = await res.json();
          if (Array.isArray(data)) setGradebookData(data);
          else setGradebookData([]);
      } catch (err) {
          console.error("Error fetching gradebook:", err);
          setGradebookData([]);
      }
  };

  const fetchItemAnalysis = async (gameId, sortMode) => {
      try {
          const res = await fetch(`https://arcads-api.onrender.com/api/item-analysis/${gameId}?sort=${sortMode}`);
          const data = await res.json();
          if (data && data.items) {
              setItemAnalysisData(data.items);
              setItemSummaryData(data.summary || {}); 
          }
      } catch (err) {
          console.error("Error fetching item analysis:", err);
      }
  };

  const openItemAnalysis = async (game) => {
      setItemAnalysisGame(game);
      setItemSortMode('numerical');
      await fetchItemAnalysis(game.game_id, 'numerical');
      setShowItemAnalysisModal(true);
  };

  const handleSortChange = (e) => {
      const newSort = e.target.value;
      setItemSortMode(newSort);
      fetchItemAnalysis(itemAnalysisGame.game_id, newSort);
  };

  const exportGradesToExcel = () => {
      window.open(`https://arcads-api.onrender.com/api/export-grades/${gradebookGame.game_id}`, '_blank');
  };

  const exportItemAnalysisToExcel = () => {
      const className = encodeURIComponent(gradebookClass?.class_name || 'Unknown');
      const activityName = encodeURIComponent(getDisplayName(itemAnalysisGame));
      window.open(`https://arcads-api.onrender.com/api/export-item-analysis/${itemAnalysisGame.game_id}?sort=${itemSortMode}&className=${className}&activityName=${activityName}`, '_blank');
  };

  // 🟢 NEW: Fetch Class Performance Data
  const openPerformanceModal = async (cls) => {
      try {
          const res = await fetch(`https://arcads-api.onrender.com/api/class-performance/${cls.class_id}`);
          const data = await res.json();
          if (Array.isArray(data)) {
              setClassPerformanceData(data);
              setPerformanceSortMode('alphabetical');
              setShowPerformanceModal(true);
          }
      } catch (err) {
          console.error("Error fetching class performance:", err);
      }
  };

  // 🟢 NEW: Sort Class Performance Data
  const handlePerformanceSort = (e) => {
      const mode = e.target.value;
      setPerformanceSortMode(mode);

      const sortedData = [...classPerformanceData];
      if (mode === 'alphabetical') {
          sortedData.sort((a, b) => (a.student_surname || "").localeCompare(b.student_surname || ""));
      } else if (mode === 'best') {
          sortedData.sort((a, b) => b.grade - a.grade); 
      } else if (mode === 'worst') {
          sortedData.sort((a, b) => a.grade - b.grade); 
      }
      setClassPerformanceData(sortedData);
  };

  // 🟢 NEW: Export Class Performance Data
  const exportPerformanceToExcel = () => {
      const className = encodeURIComponent(selectedClass?.class_name || 'Unknown');
      window.open(`https://arcads-api.onrender.com/api/export-class-performance/${selectedClass.class_id}?sort=${performanceSortMode}&className=${className}`, '_blank');
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!user || !user.uid) return;

    const trimmedName = newClassName.trim();

    const isDuplicate = classes.some(cls => cls.class_name.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
        setCreateClassError("A class with this exact name already exists!");
        return;
    }

    setCreateClassError(''); 
    setIsCreatingClass(true);
    setCreateStatusMsg('Initializing new class space...');

    try {
      const res = await fetch('https://arcads-api.onrender.com/api/create-class', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ teacher_fid: user.uid, class_name: trimmedName })
      });

      if(res.ok) {
        if (cloneFromClassId) {
            setCreateStatusMsg('Fetching previous roster...');
            
            const classesRes = await fetch(`https://arcads-api.onrender.com/api/get-classes/${user.uid}`);
            const updatedClasses = await classesRes.json();
            
            const newlyCreatedClass = updatedClasses.sort((a,b) => b.class_id - a.class_id).find(c => c.class_name === trimmedName);

            if (newlyCreatedClass) {
                const rosterRes = await fetch(`https://arcads-api.onrender.com/api/class-members/${cloneFromClassId}`);
                const oldRoster = await rosterRes.json();

                if (Array.isArray(oldRoster) && oldRoster.length > 0) {
                    setCreateStatusMsg(`Copying ${oldRoster.length} students...`);
                    
                    const addPromises = oldRoster.map(student => {
                        const identifier = student.student_username || student.student_email;
                        if (!identifier) return Promise.resolve();

                        return fetch('https://arcads-api.onrender.com/api/add-student-to-class', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                class_id: newlyCreatedClass.class_id,
                                student_email: identifier
                            })
                        });
                    });

                    await Promise.allSettled(addPromises);
                }
            }
        }

        setShowCreateModal(false);
        setNewClassName('');
        setCloneFromClassId('');
        setClassSearchQuery(''); 
        setCreateStatusMsg('');
        setIsCreatingClass(false);
        fetchClasses(user.uid); 
      }
    } catch (err) {
      console.error(err);
      setCreateClassError("A server error occurred. Please try again.");
      setIsCreatingClass(false);
      setCreateStatusMsg('');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setStatusMsg('Adding...');
    try {
      const res = await fetch('https://arcads-api.onrender.com/api/add-student-to-class', {
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
      await fetch('https://arcads-api.onrender.com/api/remove-student', {
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
          const isDuplicate = classes.some(cls => cls.class_name.toLowerCase() === newName.toLowerCase() && cls.class_id !== selectedClass.class_id);
          if (isDuplicate) {
              alert("Another class with this name already exists.");
              return;
          }

          try {
              const res = await fetch(`https://arcads-api.onrender.com/api/edit-class/${selectedClass.class_id}`, {
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
          const res = await fetch(`https://arcads-api.onrender.com/api/delete-class/${selectedClass.class_id}`, {
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

  const promptReuseActivity = (game) => {
      setSelectedGameToReuse(game);
      setReuseTargetClassId('');
      setReuseErrorMsg('');
      setShowReuseModal(true);
  };

  const confirmReuseActivity = async (e) => {
      e.preventDefault();
      if (!reuseTargetClassId) {
          setReuseErrorMsg('Please select a class to assign this activity to.');
          return;
      }
      
      setIsReusing(true);
      setReuseErrorMsg('');

      try {
          const res = await fetch('https://arcads-api.onrender.com/api/duplicate-game', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ 
                  original_game_id: selectedGameToReuse.game_id, 
                  new_class_id: reuseTargetClassId,
                  teacher_fid: user.uid
              })
          });
          
          if (res.ok) {
              setShowReuseModal(false);
              setSelectedGameToReuse(null);
              fetchGames(user.uid);
          } else {
              const data = await res.json();
              setReuseErrorMsg(data.error || 'Failed to duplicate activity.');
          }
      } catch (err) {
          console.error("Error duplicating activity:", err);
          setReuseErrorMsg('Server error. Could not connect to API.');
      } finally {
          setIsReusing(false);
      }
  };

  const promptResetAttempt = (studentRow) => {
      setStudentToReset(studentRow);
      setShowResetAttemptModal(true);
  };

  const confirmResetAttempt = async () => {
      try {
          const res = await fetch('https://arcads-api.onrender.com/api/reset-student-attempt', {
              method: 'DELETE',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ 
                  game_id: gradebookGame.game_id, 
                  student_fid: studentToReset.student_fid 
              })
          });
          
          if (res.ok) {
              setShowResetAttemptModal(false);
              setStudentToReset(null);
              fetchGradebook(gradebookGame);
          }
      } catch (err) {
          console.error("Error resetting student attempt:", err);
      }
  };

  const toggleStudentLock = async (row) => {
      const newLockStatus = row.is_locked ? 0 : 1; 
      try {
          const res = await fetch('https://arcads-api.onrender.com/api/toggle-student-lock', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                  game_id: gradebookGame.game_id,
                  student_fid: row.student_fid,
                  lock_status: newLockStatus
              })
          });
          if (res.ok) {
              fetchGradebook(gradebookGame); 
          }
      } catch (err) {
          console.error("Error toggling student lock:", err);
      }
  };

  const openEditSchedule = (game) => {
      setSelectedGameForSchedule(game);
      
      if (game.open_datetime) {
          const dateTimeStr = game.open_datetime.replace('T', ' '); 
          const [datePart, timePart] = dateTimeStr.split(' ');
          setEditOpenDate(datePart);
          setEditOpenTime(timePart.substring(0, 5));
      } else {
          setEditOpenDate(''); setEditOpenTime('');
      }
      
      if (game.close_datetime) {
          const dateTimeStr = game.close_datetime.replace('T', ' ');
          const [datePart, timePart] = dateTimeStr.split(' ');
          setEditCloseDate(datePart);
          setEditCloseTime(timePart.substring(0, 5));
          setEditNoCloseDate(false);
      } else {
          setEditCloseDate(''); setEditCloseTime(''); setEditNoCloseDate(true);
      }
      
      if (game.time_limit > 0) {
          setEditTimeLimit(game.time_limit); setEditUnlimitedTime(false);
      } else {
          setEditTimeLimit(15); setEditUnlimitedTime(true);
      }
      
      setShowEditScheduleModal(true);
  };

  const submitEditSchedule = async (e) => {
      e.preventDefault();
      let formattedOpenDate = null;
      if (editOpenDate && editOpenTime) formattedOpenDate = `${editOpenDate} ${editOpenTime}:00`;
      let formattedCloseDate = null;
      if (!editNoCloseDate && editCloseDate && editCloseTime) formattedCloseDate = `${editCloseDate} ${editCloseTime}:00`;
      const finalTimeLimit = editUnlimitedTime ? 0 : parseInt(editTimeLimit);

      try {
          const res = await fetch(`https://arcads-api.onrender.com/api/update-schedule/${selectedGameForSchedule.game_id}`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                  open_datetime: formattedOpenDate,
                  close_datetime: formattedCloseDate,
                  time_limit: finalTimeLimit
              })
          });
          if (res.ok) {
              setShowEditScheduleModal(false);
              fetchGames(user.uid);
          }
      } catch (err) {
          console.error(err);
      }
  };

  const promptToggleActivity = (game) => {
      setSelectedGameForToggle(game);
      setShowToggleActivityModal(true);
  };

  const confirmToggleActivity = async () => {
      const newStatus = selectedGameForToggle.is_active ? 0 : 1;
      try {
          const res = await fetch(`https://arcads-api.onrender.com/api/toggle-activity/${selectedGameForToggle.game_id}`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ is_active: newStatus })
          });
          if (res.ok) {
              setShowToggleActivityModal(false);
              fetchGames(user.uid); 
          }
      } catch (err) {
          console.error(err);
      }
  };

  const promptDeleteGame = (game) => {
      setSelectedGameToDelete(game);
      setShowDeleteGameModal(true);
  };

  const confirmDeleteGame = async () => {
      try {
          const res = await fetch(`https://arcads-api.onrender.com/api/delete-game/${selectedGameToDelete.game_id}`, {
              method: 'DELETE'
          });
          if (res.ok) {
              setShowDeleteGameModal(false);
              fetchGames(user.uid); 
              setGradebookGame(null); 
          }
      } catch (err) {
          console.error("Error deleting game:", err);
      }
  };

  const switchTab = (tabName) => {
      setActiveTab(tabName);
      setSelectedClass(null);
      setGradebookClass(null);
      setGradebookGame(null);
      setClassSearchQuery(''); 
  };

  const filteredClasses = classes.filter(cls => 
      cls.class_name.toLowerCase().includes(classSearchQuery.toLowerCase())
  );

  return (
    <div className="teacher-dashboard teacher-theme">
      <style>{`
        /* ==========================================================================
           🟣 TEACHER DASHBOARD - "DEEP PLUM ARCADE"
           ========================================================================== */
        .teacher-theme {
          --primary-blue: #2f143d !important; 
          --darker-blue: #170a1e !important;  
          --arcade-yellow: #ffd700 !important; 
          --arcade-orange: #fca311 !important; 
          --arcade-red: #ff4c4c !important;    
        }

        * { box-sizing: border-box; }
        @media (max-width: 850px) {
          .teacher-dashboard { flex-direction: column !important; }
          .sidebar { width: 100% !important; flex-direction: row !important; overflow-x: auto; padding: 10px !important; }
          .sidebar h3 { display: none; }
          .sidebar-btn { flex: 1; min-width: 120px; text-align: center !important; font-size: 0.7rem !important; padding: 10px !important; }
          
          .content-area { padding: 20px 10px !important; }
          .section-header { flex-direction: column; align-items: flex-start !important; gap: 15px; }
          .header-actions { display: flex; flex-direction: column; width: 100%; gap: 10px; }
          .header-actions button, .header-actions input, .header-actions select { width: 100%; }
          
          .table-responsive { width: 100%; overflow-x: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; }
          .students-table { min-width: 600px; } 

          .modal-box { width: 95% !important; padding: 20px !important; max-height: 90vh; overflow-y: auto; }
          .modal-actions-row { flex-direction: column !important; gap: 10px !important; }
          .modal-actions-row button { width: 100% !important; margin: 0 !important; }
        }
      `}</style>

      <div className="sidebar">
        <h3 style={{color: 'var(--arcade-yellow)', textAlign:'center'}}>MENU</h3>
        <button className={`sidebar-btn ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => switchTab('classes')}>My Classes</button>
        <button className={`sidebar-btn ${activeTab === 'library' ? 'active' : ''}`} onClick={() => switchTab('library')}>Game Library</button>
        <button className={`sidebar-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => switchTab('active')}>My Activities</button>
      </div>

      <div className="content-area">
        {activeTab === 'classes' && !selectedClass && (
          <>
            <div className="section-header">
              <h2>MY CLASSES</h2>
              <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                    type="text" 
                    placeholder="Search classes..." 
                    value={classSearchQuery}
                    onChange={(e) => setClassSearchQuery(e.target.value)}
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: 'var(--darker-blue)', color: '#fff' }}
                />
                <button className="btn btn-primary" onClick={() => { setShowCreateModal(true); setCreateClassError(''); setNewClassName(''); setCloneFromClassId(''); setCreateStatusMsg(''); }}>+ CREATE CLASS</button>
              </div>
            </div>

            <div className="classes-grid">
              {Array.isArray(filteredClasses) && filteredClasses.length === 0 ? <p style={{color: '#aaa'}}>No classes found.</p> : null}
              {Array.isArray(filteredClasses) && filteredClasses.map((cls) => (
                <div key={cls.class_id} className="class-card" onClick={() => openClass(cls)}>
                  <h3 style={{color: '#fff'}}>{cls.class_name}</h3>
                  <p style={{fontSize: '0.8rem', color: '#aaa'}}>Manage Students</p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'classes' && selectedClass && (
          <>
            <div className="section-header">
              <div>
                  <h2 style={{margin: 0}}>{selectedClass.class_name}</h2>
                  <p style={{color: 'var(--arcade-yellow)', margin: '5px 0 0 0', fontSize: '1.2rem', fontFamily: 'monospace'}}>
                      Class Code: <b>{selectedClass.class_code || 'Old Class (No Code)'}</b>
                  </p>
              </div>
              <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedClass(null)}>BACK</button>
                <button className="btn btn-primary" onClick={() => openPerformanceModal(selectedClass)}>📊 VIEW PERFORMANCE</button>
                <button className="btn btn-primary" onClick={() => setShowAddStudentModal(true)}>+ ADD STUDENT</button>
                <button className="btn btn-secondary" onClick={() => { setEditClassNameInput(selectedClass.class_name); setShowEditClassModal(true); }} style={{ backgroundColor: 'var(--darker-blue)', borderColor: '#444', color: '#fff' }}>EDIT CLASS</button>
                <button className="btn btn-danger" onClick={() => setShowDeleteClassModal(true)} style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}>DELETE CLASS</button>
              </div>
            </div>

            <div className="table-responsive" style={{marginTop: '20px'}}>
              <table className="students-table">
                <thead><tr><th>Name</th><th>Username</th><th>Remove</th></tr></thead>
                <tbody>
                  {!Array.isArray(classStudents) || classStudents.length === 0 ? (
                    <tr><td colSpan="3" style={{textAlign:'center'}}>No students in this class yet. Give them the class code!</td></tr>
                  ) : (
                    classStudents.map((st) => (
                      <tr key={st.cm_fid}>
                        <td>{st.student_name ? `${st.student_name} ${st.student_surname}` : <span style={{color:'red'}}>⚠ Missing Record</span>}</td>
                        <td>{st.student_username || <span style={{color:'red'}}>Broken ID</span>}</td>
                        <td><button className="remove-btn" onClick={(e) => { e.stopPropagation(); promptRemoveStudent(st.cm_fid); }}>REMOVE</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'library' && (
          <>
            <div className="section-header"><h2>GAME LIBRARY</h2></div>
            <p style={{marginBottom: '20px'}}>Select a template to create a new activity.</p>
            <div className="classes-grid">
               <div className="class-card" style={{border: '2px solid #0066cc'}}>
                 <h3 style={{color: '#0066cc', fontSize: '1rem'}}>MAZE ESCAPE</h3>
                 <p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>RPG Dungeon Crawler. Find clues and answer questions to unlock doors.</p>
                 <Link to="/teacher/create-maze"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem'}}>+ CREATE</button></Link>
               </div>
               
               <div className="class-card" style={{border: '2px solid var(--arcade-yellow)'}}>
                 <h3 style={{color: 'var(--arcade-yellow)', fontSize: '1rem'}}>ADVENTURE BATTLE</h3>
                 <p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Turn-based RPG combat. Defeat monsters by answering correctly.</p>
                 <Link to="/teacher/create-adventure"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: 'var(--arcade-yellow)', border: 'none'}}>+ CREATE</button></Link>
               </div>
               
               <div className="class-card" style={{border: '2px solid #ce93d8'}}>
                 <h3 style={{color: '#ce93d8', fontSize: '1rem'}}>WORD QUEST</h3>
                 <p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Snakes & Ladders. Roll dice, answer questions, race to finish!</p>
                 <Link to="/teacher/create-word-quest"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#ce93d8', color:'#1a0d2e', border: 'none'}}>+ CREATE</button></Link>
               </div>
               
               <div className="class-card" style={{border: '2px solid #4dff91'}}>
                 <h3 style={{color: '#4dff91', fontSize: '1rem'}}>ENCHANTED FOREST</h3>
                 <p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Restore lost words. Explore magical woods and defeat guardians!</p>
                 <Link to="/teacher/create-enchanted-forest"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#4dff91', color:'#040a06', border: 'none'}}>+ CREATE</button></Link>
               </div>
               
               <div className="class-card" style={{border: '2px solid #ff4757'}}>
                 <h3 style={{color: '#ff4757', fontSize: '1rem'}}>WHACK-A-MOLE</h3>
                 <p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Reflex & Recall! Hit moles to score points and answer questions.</p>
                 <Link to="/teacher/create-whack-a-mole"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#ff4757', color:'#fff', border: 'none'}}>+ CREATE</button></Link>
               </div>
               
               <div className="class-card" style={{border: '2px solid var(--arcade-yellow)'}}>
                 <h3 style={{color: 'var(--arcade-yellow)', fontSize: '1rem'}}>WORD TOWER DEFENSE</h3>
                 <p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Defend the castle! Match the correct words to fire at approaching enemies.</p>
                 <Link to="/teacher/create-tower-defense"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: 'var(--arcade-yellow)', color: '#000', border: 'none', fontWeight: 'bold'}}>+ CREATE</button></Link>
               </div>
               
               <div className="class-card" style={{border: '2px solid #ff007f'}}>
                 <h3 style={{color: '#ff007f', fontSize: '1rem'}}>HAMSTERBALL</h3>
                 <p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Roll your hamster through a 3D track, jump obstacles, and chain words!</p>
                 <Link to="/teacher/create-hamsterball"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#ff007f', color:'#fff', border: 'none', fontWeight: 'bold'}}>+ CREATE</button></Link>
               </div>

               <div className="class-card" style={{border: '2px solid #0066cc'}}>
                 <h3 style={{color: '#0066cc', fontSize: '1rem'}}>STARTYPE</h3>
                 <p style={{fontSize: '0.7rem', color: '#aaa', margin: '10px 0'}}>Galactic Typing Combat. Your keyboard is your weapon. Type words to destroy enemy ships!</p>
                 <Link to="/teacher/create-startype"><button className="btn btn-primary" style={{width: '100%', fontSize: '0.7rem', backgroundColor: '#0066cc', color:'#fff', border: 'none', fontWeight: 'bold'}}>+ CREATE</button></Link>
               </div>
            </div>
          </>
        )}

        {activeTab === 'active' && !gradebookClass && (
          <div className="classes-grid">
            {classes.map((cls) => (
              <div key={cls.class_id} className="class-card" style={{border: '1px solid #14a014'}} onClick={() => setGradebookClass(cls)}>
                <h3 style={{color: '#14a014'}}>{cls.class_name}</h3>
                <p>View Activities & Grades</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'active' && gradebookClass && !gradebookGame && (
          <>
            <div className="section-header">
                <h2>{gradebookClass.class_name} Activities</h2>
                <div className="header-actions">
                  <button className="btn btn-secondary" onClick={() => setGradebookClass(null)}>BACK</button>
                </div>
            </div>
            <div className="table-responsive">
              <table className="students-table">
                  <thead><tr><th>ACTIVITY NAME</th><th>DATE CREATED</th><th>ACTION</th></tr></thead>
                  <tbody>
                      {games.filter(g => g.class_id === gradebookClass.class_id).map((g) => (
                          <tr key={g.game_id}>
                              <td>
                                  <div style={{color: '#0066cc', fontWeight: 'bold'}}>{getDisplayName(g)}</div>
                                  <div style={{fontSize: '0.7rem', marginTop: '5px', color: getActivityStatus(g).color}}>
                                      {getActivityStatus(g).text}
                                  </div>
                              </td>
                              <td>{new Date(g.created_at).toLocaleDateString()}</td>
                              <td>
                                  <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                                      <button className="btn btn-primary" onClick={() => fetchGradebook(g)}>GRADES</button>
                                      <button className="btn btn-secondary" onClick={() => openItemAnalysis(g)}>ITEM ANALYSIS</button>
                                      
                                      <button className="btn btn-secondary" style={{backgroundColor: 'var(--darker-blue)', borderColor: '#00f5ff', color: '#00f5ff'}} onClick={() => promptReuseActivity(g)}>
                                          REUSE
                                      </button>

                                      <button className="btn btn-secondary" style={{backgroundColor: 'var(--darker-blue)', borderColor: '#0066cc', color: '#0066cc'}} onClick={() => openEditSchedule(g)}>
                                          SCHEDULE
                                      </button>
                                      <button className="btn" style={{backgroundColor: g.is_active ? '#ff4c4c' : '#14a014', color: '#fff', border: 'none'}} onClick={() => promptToggleActivity(g)}>
                                          {g.is_active ? "CLOSE" : "REOPEN"}
                                      </button>
                                      <button className="btn btn-danger" style={{backgroundColor: '#dc3545', color: '#fff', border: 'none'}} onClick={() => promptDeleteGame(g)}>
                                          DELETE
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'active' && gradebookClass && gradebookGame && (
          <>
            <div className="section-header">
                <div>
                  <h2 style={{margin: 0}}>{getDisplayName(gradebookGame)} Grades</h2>
                  <p style={{color: '#aaa'}}>Class: {gradebookClass.class_name}</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary" onClick={() => setGradebookGame(null)}>BACK</button>
                  <button className="btn btn-primary" onClick={exportGradesToExcel}>📥 EXPORT TO EXCEL</button>
                </div>
            </div>
            
            <div className="table-responsive">
              <table className="students-table">
                  <thead><tr><th>Student Name</th><th>Raw Score</th><th>Grade</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                      {gradebookData.map((row) => {
                          const hasPlayed = row.raw_score !== null;
                          const grade = hasPlayed ? Math.round((row.raw_score / (row.total_items || 1)) * 50 + 50) : 0;
                          
                          const lockBtnColor = row.is_locked ? '#14a014' : '#ff4c4c';
                          const lockBtnText = row.is_locked ? 'UNLOCK' : 'LOCK OUT';

                          return (
                              <tr key={row.student_fid}>
                                  <td>{row.student_surname}, {row.student_name}</td>
                                  <td>{hasPlayed ? `${row.raw_score} / ${row.total_items}` : '-'}</td>
                                  <td style={{color: hasPlayed && grade >= 75 ? '#14a014' : '#ff4c4c'}}>{hasPlayed ? `${grade}%` : '-'}</td>
                                  <td>
                                      {row.is_locked ? (
                                           <span style={{ backgroundColor: 'rgba(220, 53, 69, 0.4)', padding: '3px 8px', borderRadius: '4px', color: '#fff' }}>LOCKED</span>
                                      ) : (
                                          <span style={{ backgroundColor: hasPlayed && grade >= 75 ? 'rgba(20, 160, 20, 0.2)' : 'rgba(220, 53, 69, 0.2)', padding: '3px 8px', borderRadius: '4px' }}>
                                              {hasPlayed ? (grade >= 75 ? 'PASSED' : 'FAILED') : 'PENDING'}
                                          </span>
                                      )}
                                  </td>
                                  <td>
                                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                          {hasPlayed && (
                                              <button 
                                                  className="btn btn-secondary" 
                                                  style={{ fontSize: '0.7rem', padding: '5px 10px', borderColor: 'var(--arcade-orange)', color: 'var(--arcade-orange)' }}
                                                  onClick={() => promptResetAttempt(row)}
                                              >
                                                  RETAKE
                                              </button>
                                          )}
                                          <button 
                                              className="btn btn-secondary" 
                                              style={{ fontSize: '0.7rem', padding: '5px 10px', borderColor: lockBtnColor, color: lockBtnColor }}
                                              onClick={() => toggleStudentLock(row)}
                                          >
                                              {lockBtnText}
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* --- MODALS --- */}

      {showResetAttemptModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ border: '2px solid #fca311' }}>
            <h2 style={{color: '#fca311'}}>ALLOW RETAKE</h2>
            <p style={{fontSize:'0.9rem', color:'#fff', marginBottom:'20px', textAlign: 'center'}}>
                Are you sure you want to let <b>{studentToReset?.student_name} {studentToReset?.student_surname}</b> retake this activity? 
                <br/><br/>
                <span style={{color: '#ff4c4c'}}>Their current score of {studentToReset?.raw_score} will be permanently deleted.</span>
            </p>
            <div className="modal-actions-row">
                <button type="button" onClick={confirmResetAttempt} className="btn" style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none' }}>
                    YES, DELETE SCORE
                </button>
                <button type="button" onClick={() => setShowResetAttemptModal(false)} className="btn btn-secondary">CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {showReuseModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ border: '2px solid #00f5ff' }}>
            <h2 style={{color: '#00f5ff'}}>REUSE ACTIVITY</h2>
            <p style={{fontSize:'0.8rem', color:'#aaa', marginBottom:'15px'}}>
              Duplicate <b>{getDisplayName(selectedGameToReuse)}</b> and assign it to a class.
            </p>
            {reuseErrorMsg && <p style={{color: '#ff4c4c', fontSize: '0.8rem', marginBottom: '10px'}}>{reuseErrorMsg}</p>}
            
            <form onSubmit={confirmReuseActivity}>
                <div className="form-group" style={{ marginBottom: '20px', textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#fff', marginBottom: '8px' }}>
                        Assign to Class:
                    </label>
                    <select
                        className="game-select"
                        value={reuseTargetClassId}
                        onChange={(e) => {setReuseTargetClassId(e.target.value); setReuseErrorMsg('');}}
                        style={{ width: '100%', padding: '10px', backgroundColor: 'var(--darker-blue)', color: '#fff', border: '1px solid #444', boxSizing: 'border-box' }}
                        disabled={isReusing}
                        required
                    >
                        <option value="">-- Select a Class --</option>
                        {classes.map(cls => (
                            <option key={cls.class_id} value={cls.class_id}>
                                {cls.class_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="modal-actions-row">
                    <button type="submit" className="btn btn-primary" style={{backgroundColor: '#00f5ff', color: '#000'}} disabled={isReusing}>
                        {isReusing ? 'DUPLICATING...' : 'REUSE'}
                    </button>
                    <button type="button" onClick={() => { setShowReuseModal(false); setReuseTargetClassId(''); }} className="btn btn-secondary" disabled={isReusing}>
                        CANCEL
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 Item Analysis Modal with DepEd Style Header */}
      {showItemAnalysisModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{width: '850px', maxWidth: '95%'}}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{color: '#0066cc', margin: 0}}>ITEM ANALYSIS</h2>
                <button className="btn btn-primary" onClick={exportItemAnalysisToExcel} style={{ fontSize: '0.8rem', padding: '8px 15px' }}>
                    📥 DOWNLOAD REPORT
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', backgroundColor: 'var(--darker-blue)', padding: '15px', borderRadius: '8px', border: '1px solid #444', fontSize: '0.85rem', color: '#fff', textAlign: 'left' }}>
                <div>
                    <div style={{marginBottom: '5px'}}><strong style={{color: 'var(--arcade-yellow)'}}>CLASS NAME:</strong> {gradebookClass?.class_name}</div>
                    <div style={{marginBottom: '5px'}}><strong style={{color: 'var(--arcade-yellow)'}}>ACTIVITY NAME:</strong> {getDisplayName(itemAnalysisGame)}</div>
                    <div style={{marginBottom: '5px'}}><strong style={{color: 'var(--arcade-yellow)'}}>NUMBER OF ITEMS:</strong> {itemAnalysisData.length}</div>
                </div>
                <div>
                    <div style={{marginBottom: '5px'}}><strong style={{color: '#00f5ff'}}>STUDENTS PARTICIPATED:</strong> {itemSummaryData?.total_participants || 0}</div>
                    <div style={{marginBottom: '5px'}}><strong style={{color: '#00f5ff'}}>MEAN SCORE:</strong> {itemSummaryData?.mean_score ? parseFloat(itemSummaryData.mean_score).toFixed(2) : '0.00'}</div>
                    <div style={{display: 'flex', gap: '15px'}}>
                        <div><strong style={{color: '#14a014'}}>HIGHEST SCORE:</strong> {itemSummaryData?.highest_score || 0}</div>
                        <div><strong style={{color: '#ff4c4c'}}>LOWEST SCORE:</strong> {itemSummaryData?.lowest_score || 0}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Sort Data By:</label>
                <select 
                    className="game-select" 
                    value={itemSortMode} 
                    onChange={handleSortChange}
                    style={{ padding: '8px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '5px' }}
                >
                    <option value="numerical">Numerical Order</option>
                    <option value="least_correct">Least Correct (Most Difficult)</option>
                    <option value="best_correct">Best Correct (Easiest)</option>
                </select>
            </div>

            <div className="table-responsive" style={{maxHeight: '350px', overflowY: 'auto'}}>
                <table className="students-table">
                    <thead><tr><th style={{textAlign: 'left'}}>Question</th><th>Correct</th><th>Wrong</th><th>Accuracy</th></tr></thead>
                    <tbody>
                        {itemAnalysisData.map((item, index) => {
                            const total = parseInt(item.correct_count || 0) + parseInt(item.wrong_count || 0);
                            const acc = total > 0 ? Math.round((parseInt(item.correct_count) / total) * 100) : 0;
                            return (
                                <tr key={item.question_id}>
                                    <td style={{textAlign: 'left'}}>{index + 1}. {item.question_text}</td>
                                    <td style={{color: '#14a014', fontWeight: 'bold'}}>{item.correct_count || 0}</td>
                                    <td style={{color: '#ff4c4c', fontWeight: 'bold'}}>{item.wrong_count || 0}</td>
                                    <td>{total > 0 ? `${acc}%` : '-'}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <button type="button" onClick={() => setShowItemAnalysisModal(false)} className="btn btn-secondary" style={{marginTop: '20px', width: '100%'}}>CLOSE</button>
          </div>
        </div>
      )}

      {/* 🟢 NEW: Class Performance Modal with Export Button */}
      {showPerformanceModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{width: '900px', maxWidth: '95%'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{color: 'var(--arcade-yellow)', margin: 0}}>CLASS PERFORMANCE: {selectedClass?.class_name}</h2>
                
                {/* Export Performance Button */}
                <button className="btn btn-primary" onClick={exportPerformanceToExcel} style={{ fontSize: '0.8rem', padding: '8px 15px' }}>
                    📥 DOWNLOAD REPORT
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', textAlign: 'left' }}>
                <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Sort Students By:</label>
                <select 
                    className="game-select" 
                    value={performanceSortMode} 
                    onChange={handlePerformanceSort}
                    style={{ padding: '8px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '5px' }}
                >
                    <option value="alphabetical">Alphabetical (A-Z)</option>
                    <option value="best">Best Performance First</option>
                    <option value="worst">Worst Performance First</option>
                </select>
            </div>

            <div className="table-responsive" style={{maxHeight: '400px', overflowY: 'auto'}}>
                <table className="students-table">
                    <thead>
                        <tr>
                            <th style={{textAlign: 'left'}}>Student Name</th>
                            <th>Games Played</th>
                            <th>Total Score</th>
                            <th>Accuracy</th>
                            <th>Final Grade</th>
                            <th>DepEd Descriptor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classPerformanceData.map((student) => {
                            const isFailing = student.grade < 75;
                            const descriptorColor = isFailing ? '#ff4c4c' : (student.grade >= 90 ? '#14a014' : '#fff');

                            return (
                                <tr key={student.student_fid}>
                                    <td style={{textAlign: 'left', fontWeight: 'bold'}}>{student.student_surname}, {student.student_name}</td>
                                    <td>{student.games_played}</td>
                                    <td>{student.accumulated_score || 0} / {student.class_total_items}</td>
                                    <td>{student.accuracy > 0 ? `${student.accuracy.toFixed(1)}%` : '-'}</td>
                                    <td style={{color: isFailing ? '#ff4c4c' : 'var(--arcade-yellow)', fontWeight: 'bold'}}>
                                        {student.grade > 0 ? `${student.grade}%` : '-'}
                                    </td>
                                    <td>
                                        <span style={{ 
                                            backgroundColor: isFailing ? 'rgba(255, 76, 76, 0.2)' : 'rgba(255, 255, 255, 0.1)', 
                                            padding: '4px 8px', borderRadius: '4px', color: descriptorColor, fontSize: '0.8rem'
                                        }}>
                                            {student.descriptor}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <button type="button" onClick={() => setShowPerformanceModal(false)} className="btn btn-secondary" style={{marginTop: '20px', width: '100%'}}>CLOSE</button>
          </div>
        </div>
      )}

      {showAddStudentModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>ADD STUDENT</h2>
            <p style={{fontSize:'0.8rem', color:'#aaa', marginBottom:'15px'}}>Enter the student's <b>Username</b>.</p>
            {statusMsg && <p className="error-text" style={{color: '#ff4c4c'}}>{statusMsg}</p>}
            <form onSubmit={handleAddStudent}><div className="form-group"><input type="text" placeholder="Username" value={studentIdentifier} onChange={(e) => {setStudentIdentifier(e.target.value); setStatusMsg('');}} required /></div><div className="modal-actions-row"><button type="submit" className="btn btn-primary">ADD</button><button type="button" onClick={() => setShowAddStudentModal(false)} className="btn btn-secondary">CLOSE</button></div></form>
          </div>
        </div>
      )}

      {showEditClassModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>EDIT CLASS NAME</h2>
            <form onSubmit={submitEditClass}><div className="form-group"><input type="text" value={editClassNameInput} onChange={(e) => setEditClassNameInput(e.target.value)} required /></div><div className="modal-actions-row"><button type="submit" className="btn btn-primary">SAVE</button><button type="button" onClick={() => setShowEditClassModal(false)} className="btn btn-secondary">CANCEL</button></div></form>
          </div>
        </div>
      )}

      {showDeleteClassModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ border: '2px solid #dc3545' }}>
            <h2 style={{color: '#dc3545'}}>DELETE CLASS</h2>
            <p style={{fontSize:'0.9rem', color:'#fff', marginBottom:'20px', textAlign: 'center'}}>Delete <b>{selectedClass?.class_name}</b>? This action CANNOT be reversed.</p>
            <div className="modal-actions-row"><button type="button" onClick={confirmDeleteClass} className="btn" style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none' }}>CONFIRM DELETE</button><button type="button" onClick={() => setShowDeleteClassModal(false)} className="btn btn-secondary">CANCEL</button></div>
          </div>
        </div>
      )}

      {showRemoveStudentModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ border: '2px solid var(--arcade-yellow)' }}>
            <h2 style={{color: 'var(--arcade-yellow)'}}>REMOVE STUDENT</h2>
            <p style={{fontSize:'0.9rem', color:'#fff', marginBottom:'20px', textAlign: 'center'}}>Remove student from class?</p>
            <div className="modal-actions-row"><button type="button" onClick={confirmRemoveStudent} className="btn" style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none' }}>REMOVE</button><button type="button" onClick={() => setShowRemoveStudentModal(false)} className="btn btn-secondary">CANCEL</button></div>
          </div>
        </div>
      )}

      {showEditScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{maxWidth: '500px', border: '2px solid #0066cc'}}>
            <h2 style={{color: '#0066cc'}}>EDIT SCHEDULE</h2>
            <form onSubmit={submitEditSchedule}>
              <div style={{textAlign: 'left', backgroundColor: 'var(--darker-blue)', padding: '20px', borderRadius: '8px', border: '1px dashed #555', marginBottom: '20px'}}>
                  <div style={{marginBottom: '15px'}}>
                      <label style={{display: 'block', color: '#0066cc', marginBottom: '5px'}}>OPENING DATE & TIME:</label>
                      <div style={{display: 'flex', gap: '10px'}}>
                          <input type="date" className="game-input" value={editOpenDate} onChange={e => setEditOpenDate(e.target.value)} required />
                          <input type="time" className="game-input" value={editOpenTime} onChange={e => setEditOpenTime(e.target.value)} required />
                      </div>
                  </div>
                  <div style={{marginBottom: '15px'}}>
                      <label style={{display: 'block', color: '#ff4c4c', marginBottom: '5px'}}>CLOSING DATE & TIME:</label>
                      <label style={{fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px', color: '#fff'}}>
                          <input type="checkbox" checked={editNoCloseDate} onChange={(e) => setEditNoCloseDate(e.target.checked)} />
                          No Closing Date
                      </label>
                      {!editNoCloseDate && (
                          <div style={{display: 'flex', gap: '10px'}}>
                              <input type="date" className="game-input" value={editCloseDate} onChange={e => setEditCloseDate(e.target.value)} required={!editNoCloseDate} />
                              <input type="time" className="game-input" value={editCloseTime} onChange={e => setEditCloseTime(e.target.value)} required={!editNoCloseDate} />
                          </div>
                      )}
                  </div>
                  <div>
                      <label style={{display: 'block', color: 'var(--arcade-yellow)', marginBottom: '5px'}}>TIME LIMIT (DURATION):</label>
                      <label style={{fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px', color: '#fff'}}>
                          <input type="checkbox" checked={editUnlimitedTime} onChange={(e) => setEditUnlimitedTime(e.target.checked)} />
                          Unlimited Time
                      </label>
                      {!editUnlimitedTime && (
                          <select className="game-select" value={editTimeLimit} onChange={e => setTimeLimit(e.target.value)} style={{width: '100%', padding: '10px', background: '#222', color: '#fff', border: '1px solid #555'}}>
                              <option value="5">5 Minutes</option>
                              <option value="10">10 Minutes</option>
                              <option value="15">15 Minutes</option>
                              <option value="30">30 Minutes</option>
                              <option value="60">60 Minutes</option>
                          </select>
                      )}
                  </div>
              </div>
              <div className="modal-actions-row">
                  <button type="submit" className="btn btn-primary">SAVE</button>
                  <button type="button" onClick={() => setShowEditScheduleModal(false)} className="btn btn-secondary">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showToggleActivityModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ border: `2px solid ${selectedGameForToggle?.is_active ? '#ff4c4c' : '#14a014'}` }}>
            <h2 style={{color: selectedGameForToggle?.is_active ? '#ff4c4c' : '#14a014'}}>
                {selectedGameForToggle?.is_active ? "CLOSE ACTIVITY" : "REOPEN ACTIVITY"}
            </h2>
            <p style={{fontSize:'0.9rem', color:'#fff', marginBottom:'20px', textAlign: 'center'}}>
                Are you sure you want to {selectedGameForToggle?.is_active ? "manually close this activity? Students will immediately be locked out." : "reopen this activity for students?"}
            </p>
            <div className="modal-actions-row">
                <button type="button" onClick={confirmToggleActivity} className="btn" style={{ backgroundColor: selectedGameForToggle?.is_active ? '#ff4c4c' : '#14a014', color: '#fff', border: 'none' }}>
                    YES, {selectedGameForToggle?.is_active ? "CLOSE IT" : "REOPEN"}
                </button>
                <button type="button" onClick={() => setShowToggleActivityModal(false)} className="btn btn-secondary">CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteGameModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ border: '2px solid #dc3545' }}>
            <h2 style={{color: '#dc3545'}}>DELETE ACTIVITY</h2>
            <p style={{fontSize:'0.9rem', color:'#fff', marginBottom:'20px', textAlign: 'center'}}>
                Are you sure you want to delete <b>{getDisplayName(selectedGameToDelete)}</b>? All grades and data associated with it will be permanently lost.
            </p>
            <div className="modal-actions-row">
                <button type="button" onClick={confirmDeleteGame} className="btn" style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none' }}>
                    CONFIRM DELETE
                </button>
                <button type="button" onClick={() => setShowDeleteGameModal(false)} className="btn btn-secondary">CANCEL</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default TeacherMenu;