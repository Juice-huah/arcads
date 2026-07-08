// src/pages/StudentMenu.jsx
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
    if (game && game.custom_title && game.custom_title.trim() !== "") {
        return game.custom_title.toUpperCase();
    }
    const dbType = game?.game_type || game; 
    return GAME_DISPLAY_NAMES[dbType] || String(dbType).replace(/_/g, ' ').toUpperCase();
};

const StudentMenu = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [groupedGames, setGroupedGames] = useState({}); 
  
  const [activeTab, setActiveTab] = useState('classes'); 
  const [selectedClass, setSelectedClass] = useState(null); 
  
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveClassModal, setShowLeaveClassModal] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [joinMsg, setJoinMsg] = useState('');

  const [leaderboardView, setLeaderboardView] = useState('list'); 
  const [leaderboardGame, setLeaderboardGame] = useState(null); 
  const [leaderboardData, setLeaderboardData] = useState([]); 

  const [clockTick, setClockTick] = useState(0);

  useEffect(() => {
      const timer = setInterval(() => {
          setClockTick(prev => prev + 1); 
      }, 60000); 
      return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let pollingInterval;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        fetchAvailableGames(currentUser.uid);

        pollingInterval = setInterval(() => {
            fetchAvailableGames(currentUser.uid);
        }, 30000); 

      } else {
        setUser(null);
        setLoading(false);
        if (pollingInterval) clearInterval(pollingInterval); 
      }
    });

    return () => {
        unsubscribe();
        if (pollingInterval) clearInterval(pollingInterval); 
    };
  }, []);

  const fetchAvailableGames = async (studentId) => {
    try {
      const res = await fetch(`https://arcads-api.onrender.com/api/student-games/${studentId}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const groups = {};
        data.forEach(row => {
            const className = row.class_name || "Unknown/Deleted Class";
            if (!groups[className]) groups[className] = [];
            groups[className].push(row);
        });
        setGroupedGames(groups);
      } else {
        setGroupedGames({});
      }
    } catch (err) {
      console.error("Error loading games", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e) => {
      e.preventDefault();
      setJoinMsg('Joining...');
      try {
          const res = await fetch('https://arcads-api.onrender.com/api/join-class', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ 
                  student_fid: user.uid, 
                  class_code: classCodeInput.toUpperCase() 
              })
          });
          const data = await res.json();
          if(res.ok) {
              setJoinMsg('Success!');
              setClassCodeInput('');
              setTimeout(() => {
                  setShowJoinModal(false);
                  setJoinMsg('');
                  fetchAvailableGames(user.uid); 
              }, 1000);
          } else {
              setJoinMsg(data.error || "Failed to join");
          }
      } catch (err) {
          setJoinMsg("Server Error");
      }
  };

  const confirmLeaveClass = async () => {
      if (!selectedClass || !groupedGames[selectedClass] || groupedGames[selectedClass].length === 0) return;
      const classId = groupedGames[selectedClass][0].class_id;

      try {
          const res = await fetch('https://arcads-api.onrender.com/api/remove-student', {
              method: 'DELETE',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ class_id: classId, student_fid: user.uid })
          });
          if(res.ok) {
              setShowLeaveClassModal(false);
              setSelectedClass(null);
              fetchAvailableGames(user.uid); 
          }
      } catch (err) {
          console.error("Error leaving class:", err);
      }
  };

  const fetchLeaderboard = async (game) => {
      setLeaderboardGame(game);
      setLeaderboardData([]); 
      setLeaderboardView('ranking'); 
      try {
          const res = await fetch(`https://arcads-api.onrender.com/api/leaderboard/${game.game_id}`);
          const data = await res.json();
          if(Array.isArray(data)) setLeaderboardData(data);
      } catch (err) {
          console.error("Error fetching ranking", err);
      }
  };

  const getGameRoute = (gameType, gameId) => {
      const type = String(gameType).toLowerCase();
      if (type === 'adventure') return `/student/play-adventure/${gameId}`;
      if (type === 'word_quest') return `/student/play-word-quest/${gameId}`;
      if (type === 'enchanted_forest') return `/student/play-enchanted-forest/${gameId}`;
      if (type === 'whack_a_mole') return `/student/play-whack-a-mole/${gameId}`;
      if (type === 'tower_defense') return `/student/play-tower-defense/${gameId}`;
      if (type === 'hamsterball') return `/student/play-hamsterball/${gameId}`;
      if (type === 'startype') return `/student/play-startype/${gameId}`; 
      return `/student/play/${gameId}`;
  };

  const switchTab = (tab) => {
      setActiveTab(tab);
      setSelectedClass(null);
      setLeaderboardView('list');
  };

  const getGameStatus = (game) => {
      const now = new Date(); 
      const openTime = game.open_datetime ? new Date(game.open_datetime) : null;
      const closeTime = game.close_datetime ? new Date(game.close_datetime) : null;

      if (game.is_active === 0) return { label: "CLOSED BY TEACHER", disabled: true, color: "#ff4c4c" };
      if (openTime && now < openTime) {
          const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
          return { label: `OPENS: ${openTime.toLocaleString([], options)}`, disabled: true, color: "#ffd700" };
      }
      if (closeTime && now > closeTime) return { label: "ACTIVITY EXPIRED", disabled: true, color: "#ff4c4c" };
      
      return { label: "START GAME", disabled: false, color: "#0ac8f0" };
  };

  const podiumStyle = { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '20px', marginBottom: '40px', marginTop: '20px' };

  const rankCardStyle = (rank) => {
      let color = '#fff'; let height = '120px'; let border = '2px solid #555';
      if(rank === 0) { color = '#ffd700'; height = '160px'; border = '4px solid #ffd700'; } 
      if(rank === 1) { color = '#c0c0c0'; height = '140px'; border = '4px solid #c0c0c0'; } 
      if(rank === 2) { color = '#cd7f32'; height = '130px'; border = '4px solid #cd7f32'; } 
      return {
          width: '150px', height: height, backgroundColor: '#222', border: border, borderRadius: '10px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', boxShadow: `0 0 15px ${rank === 0 ? 'rgba(255, 215, 0, 0.3)' : 'transparent'}`, position: 'relative'
      };
  };
  return (
    <div className="teacher-dashboard">
      
      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 850px) {
          .teacher-dashboard { flex-direction: column !important; }
          .sidebar { width: 100% !important; flex-direction: row !important; overflow-x: auto; padding: 10px !important; }
          .sidebar h3 { display: none; }
          .sidebar-btn { flex: 1; min-width: 110px; text-align: center !important; font-size: 0.7rem !important; padding: 10px !important; }
          
          .content-area { padding: 20px 10px !important; }
          .section-header { flex-direction: column; align-items: flex-start !important; gap: 15px; }
          .header-actions { display: flex; flex-direction: column; width: 100%; gap: 10px; }
          .header-actions button { width: 100%; }
          
          /* Table Scrolling */
          .table-responsive { width: 100%; overflow-x: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; }
          .students-table { min-width: 500px; }

          /* Leaderboard Podium Stacking */
          .podium-container { flex-direction: column; align-items: center !important; gap: 15px !important; margin-top: 10px !important; }
          .podium-card { width: 100% !important; height: auto !important; padding: 20px !important; flex-direction: row !important; justify-content: space-between !important; }

          .modal-box { width: 95% !important; padding: 20px !important; }
          .modal-actions-row { flex-direction: column !important; gap: 10px !important; }
          .modal-actions-row button { width: 100% !important; margin: 0 !important; }
        }
      `}</style>

      <div className="sidebar">
        <h3 style={{color: '#0ac8f0', textAlign:'center'}}>STUDENT</h3>
        <button className={`sidebar-btn ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => switchTab('classes')}>My Classes</button>
        <button className={`sidebar-btn ${activeTab === 'grades' ? 'active' : ''}`} onClick={() => switchTab('grades')}>My Grades</button>
        <button className={`sidebar-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => switchTab('leaderboard')}>Leaderboard</button>
      </div>

      <div className="content-area">
        {loading ? <p>Loading...</p> : (
            <>
                {activeTab === 'classes' && !selectedClass && (
                    <>
                        <div className="section-header">
                            <h2>MY CLASSES</h2>
                            <div className="header-actions">
                                <button className="btn btn-primary" onClick={() => setShowJoinModal(true)}>+ JOIN CLASS</button>
                            </div>
                        </div>
                        <div className="classes-grid">
                            {Object.keys(groupedGames).length === 0 ? (
                                <p style={{color:'#aaa'}}>No classes found. Click "+ Join Class" to get started!</p>
                            ) : (
                                Object.keys(groupedGames).map((className) => {
                                    const activeCount = groupedGames[className].filter(g => g.game_id).length;
                                    return (
                                        <div key={className} className="class-card" onClick={() => setSelectedClass(className)} style={{ overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                                            <h3 style={{ color: '#fff', textAlign: 'center', margin: '0 0 10px 0', width: '100%', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: '1.4' }}>{className}</h3>
                                            <p style={{fontSize: '0.8rem', color: '#0ac8f0'}}>{activeCount} Active Games</p>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'classes' && selectedClass && (
                    <>
                        <div className="section-header">
                            <h2>{selectedClass}</h2>
                            <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn btn-secondary" onClick={() => setSelectedClass(null)}>BACK</button>
                                <button className="btn" style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none' }} onClick={() => setShowLeaveClassModal(true)}>LEAVE CLASS</button>
                            </div>
                        </div>
                        <div className="classes-grid">
                            {groupedGames[selectedClass].map((game) => {
                                if (!game.game_id) return <p key="nogame" style={{color: '#aaa', width: '100%', gridColumn: '1 / -1'}}>No activities assigned to this class yet.</p>;

                                const status = getGameStatus(game);
                                return (
                                    <div key={game.game_id} className="class-card" style={{borderColor: status.color}}>
                                        <h3 style={{color: status.color}}>{getDisplayName(game)}</h3>
                                        <p style={{fontSize: '0.8rem', color: '#fff'}}>Assigned by Prof. {game.teacher_surname || "Unknown"}</p>
                                        
                                        {game.raw_score !== null ? (
                                            <div style={{marginTop: '15px', padding: '10px', backgroundColor: 'rgba(20, 160, 20, 0.2)', borderRadius: '5px', textAlign: 'center'}}>
                                                <span style={{color: '#14a014', fontWeight: 'bold'}}>COMPLETED</span>
                                            </div>
                                        ) : (
                                            <Link to={status.disabled ? "#" : getGameRoute(game.game_type, game.game_id)} style={{pointerEvents: status.disabled ? 'none' : 'auto'}}>
                                                <button className="btn" disabled={status.disabled} style={{
                                                    width: '100%', 
                                                    marginTop: '15px', 
                                                    backgroundColor: status.disabled ? '#333' : status.color,
                                                    color: status.disabled ? '#777' : '#000',
                                                    border: 'none',
                                                    cursor: status.disabled ? 'not-allowed' : 'pointer'
                                                }}>
                                                    {status.label}
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {activeTab === 'grades' && !selectedClass && (
                    <>
                        <div className="section-header"><h2>MY GRADES</h2></div>
                        <p style={{color: '#aaa', marginBottom: '20px'}}>Select a class to view your report card.</p>
                        <div className="classes-grid">
                            {Object.keys(groupedGames).map((className) => (
                                <div key={className} className="class-card" style={{border: '1px solid #14a014'}} onClick={() => setSelectedClass(className)}>
                                    <h3 style={{color: '#14a014'}}>{className}</h3>
                                    <p style={{color: '#aaa'}}>View Grades</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'grades' && selectedClass && (
                    <>
                        <div className="section-header">
                            <h2>{selectedClass} Report Card</h2>
                            <div className="header-actions">
                                <button className="btn btn-secondary" onClick={() => setSelectedClass(null)}>BACK</button>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="students-table" style={{marginTop: '20px'}}>
                                <thead>
                                    <tr><th>Activity</th><th>Raw Score</th><th>Grade</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {groupedGames[selectedClass].filter(g => g.raw_score !== null).length === 0 ? (
                                        <tr><td colSpan="4" style={{textAlign:'center'}}>You haven't completed any activities in this class yet.</td></tr>
                                    ) : (
                                        groupedGames[selectedClass].filter(g => g.raw_score !== null).map((game) => {
                                            const grade = Math.round((game.raw_score / (game.total_items || 1)) * 50 + 50);
                                            return (
                                                <tr key={game.game_id}>
                                                    <td style={{color: '#0ac8f0', fontWeight: 'bold'}}>{getDisplayName(game)}</td>
                                                    <td>{game.raw_score} / {game.total_items}</td>
                                                    <td style={{color: grade >= 75 ? '#14a014' : '#ff4c4c', fontWeight: 'bold'}}>{grade}%</td>
                                                    <td>
                                                        <span style={{ backgroundColor: grade >= 75 ? 'rgba(20, 160, 20, 0.2)' : 'rgba(220, 53, 69, 0.2)', color: grade >= 75 ? '#14a014' : '#ff4c4c', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                            {grade >= 75 ? 'PASSED' : 'FAILED'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'leaderboard' && leaderboardView === 'list' && (
                    <>
                        <div className="section-header"><h2>HALL OF FAME</h2></div>
                        <p style={{color: '#aaa', marginBottom: '20px'}}>Select a class to view rankings.</p>
                        <div className="classes-grid">
                            {Object.keys(groupedGames).map((className) => (
                                <div key={className} className="class-card" style={{border: '1px solid #ffd700'}} onClick={() => { setSelectedClass(className); setLeaderboardView('games'); }}>
                                    <h3 style={{color: '#ffd700'}}>{className}</h3>
                                    <p style={{color: '#aaa'}}>View Rankings</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'leaderboard' && leaderboardView === 'games' && selectedClass && (
                    <>
                        <div className="section-header">
                            <h2>{selectedClass} Rankings</h2>
                            <div className="header-actions">
                                <button className="btn btn-secondary" onClick={() => setLeaderboardView('list')}>BACK</button>
                            </div>
                        </div>
                        <div className="classes-grid">
                            {groupedGames[selectedClass].filter(g => g.game_id).map((game) => (
                                <div key={game.game_id} className="class-card" onClick={() => fetchLeaderboard(game)}>
                                    <h3 style={{color: '#0ac8f0'}}>{getDisplayName(game)}</h3>
                                    <p style={{fontSize: '0.8rem'}}>View Leaderboard</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'leaderboard' && leaderboardView === 'ranking' && leaderboardGame && (
                    <>
                        <div className="section-header">
                            <h2>{getDisplayName(leaderboardGame)} <span style={{fontSize:'0.6em', color:'#aaa'}}>LEADERBOARD</span></h2>
                            <div className="header-actions">
                                <button className="btn btn-secondary" onClick={() => setLeaderboardView('games')}>BACK</button>
                            </div>
                        </div>
                        <div className="podium-container" style={podiumStyle}>
                            {leaderboardData[1] && <div className="podium-card" style={rankCardStyle(1)}>🥇 <h4 style={{color:'#c0c0c0', margin: '10px 0'}}>{leaderboardData[1].student_name}</h4><p style={{margin:0}}>{leaderboardData[1].score}</p></div>}
                            {leaderboardData[0] && <div className="podium-card" style={rankCardStyle(0)}>👑 <h3 style={{color:'#ffd700', margin: '10px 0'}}>{leaderboardData[0].student_name}</h3><p style={{margin:0, fontWeight:'bold', fontSize:'1.2rem'}}>{leaderboardData[0].score}</p></div>}
                            {leaderboardData[2] && <div className="podium-card" style={rankCardStyle(2)}>🥉 <h4 style={{color:'#cd7f32', margin: '10px 0'}}>{leaderboardData[2].student_name}</h4><p style={{margin:0}}>{leaderboardData[2].score}</p></div>}
                        </div>
                    </>
                )}
            </>
        )}
      </div>

      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>JOIN A CLASS</h2>
            <p style={{fontSize:'0.8rem', color:'#aaa', marginBottom:'15px'}}>Ask your teacher for the 6-character Class Code.</p>
            {joinMsg && <p className={joinMsg === 'Success!' ? "success-text" : "error-text"}>{joinMsg}</p>}
            <form onSubmit={handleJoinClass}>
              <div className="form-group">
                <input type="text" placeholder="Enter Class Code" value={classCodeInput} onChange={(e) => {setClassCodeInput(e.target.value); setJoinMsg('');}} maxLength={6} style={{textTransform: 'uppercase', textAlign: 'center', letterSpacing: '3px', fontSize: '1.2rem'}} required />
              </div>
              <div className="modal-actions-row">
                <button type="submit" className="btn btn-primary">JOIN</button>
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn btn-secondary">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLeaveClassModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ border: '2px solid #dc3545' }}>
            <h2 style={{color: '#dc3545'}}>LEAVE CLASS</h2>
            <p style={{fontSize:'0.9rem', color:'#fff', marginBottom:'20px', textAlign: 'center'}}>
                Are you sure you want to leave <b>{selectedClass}</b>? You will lose access to its activities.
            </p>
            <div className="modal-actions-row">
                <button type="button" onClick={confirmLeaveClass} className="btn" style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none' }}>YES, LEAVE</button>
                <button type="button" onClick={() => setShowLeaveClassModal(false)} className="btn btn-secondary">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMenu;