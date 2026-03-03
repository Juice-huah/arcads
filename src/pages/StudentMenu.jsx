// src/pages/StudentMenu.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import '../components/TeacherMenu.css'; 
import './SignUp.css'; 

const StudentMenu = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [groupedGames, setGroupedGames] = useState({}); 
  
  // UI State
  const [activeTab, setActiveTab] = useState('classes'); // 'classes', 'grades', 'leaderboard'
  const [selectedClass, setSelectedClass] = useState(null); 
  
  // Join Class State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [joinMsg, setJoinMsg] = useState('');

  // Leaderboard State
  const [leaderboardView, setLeaderboardView] = useState('list'); 
  const [leaderboardGame, setLeaderboardGame] = useState(null); 
  const [leaderboardData, setLeaderboardData] = useState([]); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchAvailableGames(currentUser.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAvailableGames = async (studentId) => {
    try {
      const res = await fetch(`http://localhost:8081/api/student-games/${studentId}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const groups = {};
        data.forEach(row => {
            const className = row.class_name || "Unknown/Deleted Class";
            if (!groups[className]) groups[className] = [];
            
            if (row.game_id) {
                groups[className].push(row);
            }
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
          const res = await fetch('http://localhost:8081/api/join-class', {
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

  const fetchLeaderboard = async (game) => {
      setLeaderboardGame(game);
      setLeaderboardData([]); 
      setLeaderboardView('ranking'); 

      try {
          const res = await fetch(`http://localhost:8081/api/leaderboard/${game.game_id}`);
          const data = await res.json();
          if(Array.isArray(data)) setLeaderboardData(data);
      } catch (err) {
          console.error("Error fetching ranking", err);
      }
  };

  const switchTab = (tab) => {
      setActiveTab(tab);
      setSelectedClass(null);
      setLeaderboardView('list');
  };

  // --- STYLES FOR TOP 3 ---
  const podiumStyle = {
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      gap: '20px', marginBottom: '40px', marginTop: '20px'
  };

  const rankCardStyle = (rank) => {
      let color = '#fff'; let height = '120px'; let border = '2px solid #555';
      if(rank === 0) { color = '#ffd700'; height = '160px'; border = '4px solid #ffd700'; } 
      if(rank === 1) { color = '#c0c0c0'; height = '140px'; border = '4px solid #c0c0c0'; } 
      if(rank === 2) { color = '#cd7f32'; height = '130px'; border = '4px solid #cd7f32'; } 

      return {
          width: '150px', height: height, backgroundColor: '#222', border: border,
          borderRadius: '10px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          boxShadow: `0 0 15px ${rank === 0 ? 'rgba(255, 215, 0, 0.3)' : 'transparent'}`,
          position: 'relative'
      };
  };

  return (
    <div className="teacher-dashboard">
      
      {/* --- SIDEBAR --- */}
      <div className="sidebar">
        <h3 style={{color: '#0ac8f0', textAlign:'center'}}>STUDENT</h3>
        
        <button className={`sidebar-btn ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => switchTab('classes')}>
          My Classes
        </button>

        <button className={`sidebar-btn ${activeTab === 'grades' ? 'active' : ''}`} onClick={() => switchTab('grades')}>
          My Grades
        </button>

        <button className={`sidebar-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => switchTab('leaderboard')}>
          Leaderboard
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="content-area">

        {loading ? <p>Loading...</p> : (
            <>
                {/* ========================================================== */}
                {/* TAB 1: MY CLASSES (Play Games)                             */}
                {/* ========================================================== */}
                {activeTab === 'classes' && !selectedClass && (
                    <>
                        <div className="section-header">
                            <h2>MY CLASSES</h2>
                            <button className="btn btn-primary" onClick={() => setShowJoinModal(true)}>
                                + JOIN CLASS
                            </button>
                        </div>
                        <div className="classes-grid">
                            {Object.keys(groupedGames).length === 0 ? (
                                <p style={{color:'#aaa'}}>No classes found. Click "+ Join Class" to get started!</p>
                            ) : (
                                Object.keys(groupedGames).map((className) => (
                                    <div key={className} className="class-card" onClick={() => setSelectedClass(className)}>
                                        <h3 style={{color: '#fff'}}>{className}</h3>
                                        <p style={{fontSize: '0.8rem', color: '#0ac8f0'}}>{groupedGames[className].length} Active Games</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'classes' && selectedClass && (
                    <>
                        <div className="section-header">
                            <h2>{selectedClass}</h2>
                            <button className="btn btn-secondary" onClick={() => setSelectedClass(null)}>BACK</button>
                        </div>
                        
                        {groupedGames[selectedClass].length === 0 ? (
                            <p style={{color: '#aaa', fontStyle: 'italic', marginTop: '20px'}}>
                                Your teacher hasn't assigned any games to this class yet.
                            </p>
                        ) : (
                            <div className="classes-grid">
                                {groupedGames[selectedClass].map((game) => (
                                    <div key={game.game_id} className="class-card" style={{borderColor: '#0ac8f0'}}>
                                        <h3 style={{color: '#0ac8f0'}}>{game.game_type}</h3>
                                        <p style={{fontSize: '0.8rem', color: '#fff'}}>Assigned by Prof. {game.teacher_surname || "Unknown"}</p>
                                        
                                        {/* FIX: If score is NOT null, show Completed Badge instead of Start Game */}
                                        {game.raw_score !== null ? (
                                            <div style={{marginTop: '15px', padding: '10px', backgroundColor: 'rgba(20, 160, 20, 0.2)', borderRadius: '5px', textAlign: 'center'}}>
                                                <span style={{color: '#14a014', fontWeight: 'bold'}}>COMPLETED</span>
                                            </div>
                                        ) : (
                                            <Link to={`/student/play/${game.game_id}`}>
                                                <button className="btn btn-primary" style={{width: '100%', marginTop: '15px'}}>START GAME</button>
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ========================================================== */}
                {/* TAB 2: MY GRADES (Report Card)                             */}
                {/* ========================================================== */}
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
                            <button className="btn btn-secondary" onClick={() => setSelectedClass(null)}>BACK</button>
                        </div>
                        
                        <table className="students-table" style={{marginTop: '20px'}}>
                            <thead>
                                <tr>
                                    <th>Activity</th>
                                    <th>Raw Score</th>
                                    <th>Grade</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Filter out games they haven't played yet */}
                                {groupedGames[selectedClass].filter(g => g.raw_score !== null).length === 0 ? (
                                    <tr><td colSpan="4" style={{textAlign:'center'}}>You haven't completed any activities in this class yet.</td></tr>
                                ) : (
                                    groupedGames[selectedClass].filter(g => g.raw_score !== null).map((game) => {
                                        const raw = game.raw_score;
                                        const total = game.total_items || 1;
                                        // Base-50 Computation
                                        const grade = Math.round((raw / total) * 50 + 50);
                                        const isPassing = grade >= 75;

                                        return (
                                            <tr key={game.game_id}>
                                                <td style={{color: '#0ac8f0', fontWeight: 'bold'}}>{game.game_type}</td>
                                                <td style={{fontWeight: 'bold'}}>{raw} / {total}</td>
                                                <td style={{color: isPassing ? '#14a014' : '#ff4c4c', fontWeight: 'bold'}}>{grade}%</td>
                                                <td>
                                                    <span style={{
                                                        backgroundColor: isPassing ? 'rgba(20, 160, 20, 0.2)' : 'rgba(220, 53, 69, 0.2)',
                                                        color: isPassing ? '#14a014' : '#ff4c4c',
                                                        padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                                                    }}>
                                                        {isPassing ? 'PASSED' : 'FAILED'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </>
                )}

                {/* ========================================================== */}
                {/* TAB 3: LEADERBOARD                                         */}
                {/* ========================================================== */}
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
                            <button className="btn btn-secondary" onClick={() => setLeaderboardView('list')}>BACK</button>
                        </div>
                        <p style={{color: '#aaa', marginBottom: '20px'}}>Select an activity.</p>
                        
                        {groupedGames[selectedClass].length === 0 ? (
                            <p style={{color: '#aaa', fontStyle: 'italic'}}>No games have been played in this class yet.</p>
                        ) : (
                            <div className="classes-grid">
                                {groupedGames[selectedClass].map((game) => (
                                    <div key={game.game_id} className="class-card" onClick={() => fetchLeaderboard(game)}>
                                        <h3 style={{color: '#0ac8f0'}}>{game.game_type}</h3>
                                        <p style={{fontSize: '0.8rem'}}>View Leaderboard</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'leaderboard' && leaderboardView === 'ranking' && leaderboardGame && (
                    <>
                        <div className="section-header">
                            <h2>{leaderboardGame.game_type} <span style={{fontSize:'0.6em', color:'#aaa'}}>LEADERBOARD</span></h2>
                            <button className="btn btn-secondary" onClick={() => setLeaderboardView('games')}>BACK</button>
                        </div>

                        {leaderboardData.length === 0 ? (
                            <div style={{textAlign:'center', padding:'50px', color:'#666'}}>
                                <h3>NO SCORES YET</h3>
                                <p>Be the first to complete this mission!</p>
                            </div>
                        ) : (
                            <>
                                <div style={podiumStyle}>
                                    {leaderboardData[1] && (
                                        <div style={rankCardStyle(1)}>
                                            <div style={{fontSize:'2rem'}}>🥈</div>
                                            <h4 style={{color:'#c0c0c0', margin:'5px 0'}}>{leaderboardData[1].student_name}</h4>
                                            <p style={{color:'#0ac8f0', fontWeight:'bold'}}>{leaderboardData[1].score}</p>
                                        </div>
                                    )}

                                    {leaderboardData[0] && (
                                        <div style={rankCardStyle(0)}>
                                            <div style={{fontSize:'3rem'}}>👑</div>
                                            <h3 style={{color:'#ffd700', margin:'5px 0'}}>{leaderboardData[0].student_name}</h3>
                                            <p style={{color:'#0ac8f0', fontWeight:'bold', fontSize:'1.2rem'}}>{leaderboardData[0].score}</p>
                                            <span style={{fontSize:'0.7rem', color:'#aaa'}}>{leaderboardData[0].time_taken}s</span>
                                        </div>
                                    )}

                                    {leaderboardData[2] && (
                                        <div style={rankCardStyle(2)}>
                                            <div style={{fontSize:'2rem'}}>🥉</div>
                                            <h4 style={{color:'#cd7f32', margin:'5px 0'}}>{leaderboardData[2].student_name}</h4>
                                            <p style={{color:'#0ac8f0', fontWeight:'bold'}}>{leaderboardData[2].score}</p>
                                        </div>
                                    )}
                                </div>

                                {leaderboardData.length > 3 && (
                                    <table className="students-table">
                                        <thead>
                                            <tr>
                                                <th>RANK</th>
                                                <th>STUDENT</th>
                                                <th>SCORE</th>
                                                <th>TIME</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaderboardData.slice(3).map((entry, index) => (
                                                <tr key={index}>
                                                    <td style={{fontWeight:'bold', color:'#888'}}>#{index + 4}</td>
                                                    <td>{entry.student_name} {entry.student_surname}</td>
                                                    <td style={{color: '#0ac8f0', fontWeight:'bold'}}>{entry.score}</td>
                                                    <td>{entry.time_taken}s</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </>
                        )}
                    </>
                )}
            </>
        )}
      </div>

      {/* --- JOIN CLASS POPUP --- */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>JOIN A CLASS</h2>
            <p style={{fontSize:'0.8rem', color:'#aaa', marginBottom:'15px'}}>
              Ask your teacher for the 6-character Class Code.
            </p>
            {joinMsg && <p className={joinMsg === 'Success!' ? "success-text" : "error-text"} style={{marginBottom: '10px'}}>{joinMsg}</p>}
            
            <form onSubmit={handleJoinClass}>
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="Enter Class Code" 
                  value={classCodeInput} 
                  onChange={(e) => {setClassCodeInput(e.target.value); setJoinMsg('');}} 
                  maxLength={6}
                  style={{textTransform: 'uppercase', textAlign: 'center', letterSpacing: '3px', fontSize: '1.2rem'}}
                  required 
                />
              </div>
              <div className="modal-actions-row">
                <button type="submit" className="btn btn-primary">JOIN</button>
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn btn-secondary">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentMenu;