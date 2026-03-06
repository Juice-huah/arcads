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
  
  // Join Class State (RESTORED & MATCHED)
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
            if (row.game_id) groups[className].push(row);
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

  // 🟢 REPOSITORY VERSION: Bulletproof Game Router Function
  const getGameRoute = (gameType, gameId) => {
      const type = String(gameType).toLowerCase().replace(/\s+/g, '_');
      if (type.includes('adventure')) return `/student/play-adventure/${gameId}`;
      if (type.includes('word_quest')) return `/student/play-word-quest/${gameId}`;
      if (type.includes('enchanted_forest')) return `/student/play-enchanted-forest/${gameId}`;
      if (type.includes('whack_a_mole')) return `/student/play-whack-a-mole/${gameId}`;
      if (type.includes('tower_defense')) return `/student/play-tower-defense/${gameId}`;
      if (type.includes('hamsterball')) return `/student/play-hamsterball/${gameId}`;
      return `/student/play/${gameId}`; 
  };

  const switchTab = (tab) => {
      setActiveTab(tab);
      setSelectedClass(null);
      setLeaderboardView('list');
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
      <div className="sidebar">
        <h3 style={{color: '#0ac8f0', textAlign:'center'}}>STUDENT</h3>
        <button className={`sidebar-btn ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => switchTab('classes')}>My Classes</button>
        <button className={`sidebar-btn ${activeTab === 'grades' ? 'active' : ''}`} onClick={() => switchTab('grades')}>My Grades</button>
        <button className={`sidebar-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => switchTab('leaderboard')}>Leaderboard</button>
      </div>

      <div className="content-area">
        {loading ? <p>Loading...</p> : (
            <>
                {/* TAB 1: MY CLASSES (Uses Router Logic) */}
                {activeTab === 'classes' && !selectedClass && (
                    <>
                        <div className="section-header">
                            <h2>MY CLASSES</h2>
                            <button className="btn btn-primary" onClick={() => setShowJoinModal(true)}>+ JOIN CLASS</button>
                        </div>
                        <div className="classes-grid">
                            {Object.keys(groupedGames).length === 0 ? (
                                <p style={{color:'#aaa'}}>No classes found. Click "+ Join Class" to get started!</p>
                            ) : (
                                Object.keys(groupedGames).map((className) => (
                                    <div key={className} className="class-card" onClick={() => setSelectedClass(className)} style={{ overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                                        <h3 style={{ color: '#fff', textAlign: 'center', margin: '0 0 10px 0', width: '100%', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: '1.4' }}>{className}</h3>
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
                        <div className="classes-grid">
                            {groupedGames[selectedClass].map((game) => (
                                <div key={game.game_id} className="class-card" style={{borderColor: '#0ac8f0'}}>
                                    <h3 style={{color: '#0ac8f0'}}>{game.game_type}</h3>
                                    <p style={{fontSize: '0.8rem', color: '#fff'}}>Assigned by Prof. {game.teacher_surname || "Unknown"}</p>
                                    {game.raw_score !== null ? (
                                        <div style={{marginTop: '15px', padding: '10px', backgroundColor: 'rgba(20, 160, 20, 0.2)', borderRadius: '5px', textAlign: 'center'}}>
                                            <span style={{color: '#14a014', fontWeight: 'bold'}}>COMPLETED</span>
                                        </div>
                                    ) : (
                                        <Link to={getGameRoute(game.game_type, game.game_id)}>
                                            <button className="btn btn-primary" style={{width: '100%', marginTop: '15px'}}>START GAME</button>
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* TAB 2: MY GRADES (RESTORED LOCAL LOGIC) */}
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
                                                <td style={{color: '#0ac8f0', fontWeight: 'bold'}}>{game.game_type}</td>
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
                    </>
                )}

                {/* TAB 3: LEADERBOARD */}
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
                        <div className="classes-grid">
                            {groupedGames[selectedClass].map((game) => (
                                <div key={game.game_id} className="class-card" onClick={() => fetchLeaderboard(game)}>
                                    <h3 style={{color: '#0ac8f0'}}>{game.game_type}</h3>
                                    <p style={{fontSize: '0.8rem'}}>View Leaderboard</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'leaderboard' && leaderboardView === 'ranking' && leaderboardGame && (
                    <>
                        <div className="section-header">
                            <h2>{leaderboardGame.game_type.replace('_', ' ').toUpperCase()} <span style={{fontSize:'0.6em', color:'#aaa'}}>LEADERBOARD</span></h2>
                            <button className="btn btn-secondary" onClick={() => setLeaderboardView('games')}>BACK</button>
                        </div>
                        <div style={podiumStyle}>
                            {leaderboardData[1] && <div style={rankCardStyle(1)}>🥈<h4 style={{color:'#c0c0c0'}}>{leaderboardData[1].student_name}</h4><p>{leaderboardData[1].score}</p></div>}
                            {leaderboardData[0] && <div style={rankCardStyle(0)}>👑<h3 style={{color:'#ffd700'}}>{leaderboardData[0].student_name}</h3><p>{leaderboardData[0].score}</p></div>}
                            {leaderboardData[2] && <div style={rankCardStyle(2)}>🥉<h4 style={{color:'#cd7f32'}}>{leaderboardData[2].student_name}</h4><p>{leaderboardData[2].score}</p></div>}
                        </div>
                    </>
                )}
            </>
        )}
      </div>

      {/* JOIN CLASS MODAL (RESTORED) */}
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
    </div>
  );
};

export default StudentMenu;