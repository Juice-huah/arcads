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
  const [groupedGames, setGroupedGames] = useState({}); // { "IT Elective": [Game1, Game2] }
  
  // UI State
  const [activeTab, setActiveTab] = useState('classes'); 
  const [selectedClass, setSelectedClass] = useState(null); 
  
  // Leaderboard Specific State
  const [leaderboardView, setLeaderboardView] = useState('list'); // 'list' (classes), 'games' (select game), 'ranking' (show scores)
  const [leaderboardGame, setLeaderboardGame] = useState(null); // The specific game selected
  const [leaderboardData, setLeaderboardData] = useState([]); // The scores

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
        data.forEach(game => {
            const className = game.class_name;
            if (!groups[className]) groups[className] = [];
            groups[className].push(game);
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

  const fetchLeaderboard = async (game) => {
      setLeaderboardGame(game);
      setLeaderboardData([]); // Clear previous
      setLeaderboardView('ranking'); // Switch view

      try {
          const res = await fetch(`http://localhost:8081/api/leaderboard/${game.game_id}`);
          const data = await res.json();
          if(Array.isArray(data)) setLeaderboardData(data);
      } catch (err) {
          console.error("Error fetching ranking", err);
      }
  };

  // --- STYLES FOR TOP 3 ---
  const podiumStyle = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: '20px',
      marginBottom: '40px',
      marginTop: '20px'
  };

  const rankCardStyle = (rank) => {
      let color = '#fff';
      let height = '120px';
      let border = '2px solid #555';
      
      if(rank === 0) { color = '#ffd700'; height = '160px'; border = '4px solid #ffd700'; } // Gold
      if(rank === 1) { color = '#c0c0c0'; height = '140px'; border = '4px solid #c0c0c0'; } // Silver
      if(rank === 2) { color = '#cd7f32'; height = '130px'; border = '4px solid #cd7f32'; } // Bronze

      return {
          width: '150px',
          height: height,
          backgroundColor: '#222',
          border: border,
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxShadow: `0 0 15px ${rank === 0 ? 'rgba(255, 215, 0, 0.3)' : 'transparent'}`,
          position: 'relative'
      };
  };

  return (
    <div className="teacher-dashboard">
      
      {/* --- SIDEBAR --- */}
      <div className="sidebar">
        <h3 style={{color: '#0ac8f0', textAlign:'center'}}>STUDENT</h3>
        
        <button 
          className={`sidebar-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => {setActiveTab('classes'); setSelectedClass(null);}}
        >
          My Classes
        </button>

        <button 
          className={`sidebar-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => {
              setActiveTab('leaderboard'); 
              setSelectedClass(null); 
              setLeaderboardView('list');
          }}
        >
          Leaderboard
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="content-area">

        {loading ? <p>Loading...</p> : (
            <>
                {/* ========================================================== */}
                {/* TAB 1: MY CLASSES (Existing Code)                          */}
                {/* ========================================================== */}
                {activeTab === 'classes' && !selectedClass && (
                    <>
                        <div className="section-header"><h2>MY CLASSES</h2></div>
                        <div className="classes-grid">
                            {Object.keys(groupedGames).length === 0 ? (
                                <p style={{color:'#aaa'}}>No classes found.</p>
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
                        <div className="classes-grid">
                            {groupedGames[selectedClass].map((game) => (
                                <div key={game.game_id} className="class-card" style={{borderColor: '#0ac8f0'}}>
                                    <h3 style={{color: '#0ac8f0'}}>{game.game_type}</h3>
                                    <p style={{fontSize: '0.8rem', color: '#fff'}}>Assigned by Prof. {game.teacher_surname}</p>
                                    <Link to={`/student/play/${game.game_id}`}>
                                        <button className="btn btn-primary" style={{width: '100%', marginTop: '15px'}}>START GAME</button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ========================================================== */}
                {/* TAB 2: LEADERBOARD (New Logic)                             */}
                {/* ========================================================== */}
                
                {/* STEP 1: SELECT CLASS FOR LEADERBOARD */}
                {activeTab === 'leaderboard' && leaderboardView === 'list' && (
                    <>
                        <div className="section-header"><h2>HALL OF FAME</h2></div>
                        <p style={{color: '#aaa', marginBottom: '20px'}}>Select a class to view rankings.</p>
                        <div className="classes-grid">
                            {Object.keys(groupedGames).map((className) => (
                                <div 
                                    key={className} 
                                    className="class-card" 
                                    style={{border: '1px solid #ffd700'}}
                                    onClick={() => { setSelectedClass(className); setLeaderboardView('games'); }}
                                >
                                    <h3 style={{color: '#ffd700'}}>{className}</h3>
                                    <p style={{color: '#aaa'}}>View Rankings</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* STEP 2: SELECT GAME FOR LEADERBOARD */}
                {activeTab === 'leaderboard' && leaderboardView === 'games' && selectedClass && (
                    <>
                        <div className="section-header">
                            <h2>{selectedClass} Rankings</h2>
                            <button className="btn btn-secondary" onClick={() => setLeaderboardView('list')}>BACK</button>
                        </div>
                        <p style={{color: '#aaa', marginBottom: '20px'}}>Select an activity.</p>
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

                {/* STEP 3: THE ACTUAL LEADERBOARD (Top 3 Big + List) */}
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
                                {/* --- TOP 3 PODIUM --- */}
                                <div style={podiumStyle}>
                                    {/* SILVER (2nd) */}
                                    {leaderboardData[1] && (
                                        <div style={rankCardStyle(1)}>
                                            <div style={{fontSize:'2rem'}}>🥈</div>
                                            <h4 style={{color:'#c0c0c0', margin:'5px 0'}}>{leaderboardData[1].student_name}</h4>
                                            <p style={{color:'#0ac8f0', fontWeight:'bold'}}>{leaderboardData[1].score}</p>
                                        </div>
                                    )}

                                    {/* GOLD (1st) */}
                                    {leaderboardData[0] && (
                                        <div style={rankCardStyle(0)}>
                                            <div style={{fontSize:'3rem'}}>👑</div>
                                            <h3 style={{color:'#ffd700', margin:'5px 0'}}>{leaderboardData[0].student_name}</h3>
                                            <p style={{color:'#0ac8f0', fontWeight:'bold', fontSize:'1.2rem'}}>{leaderboardData[0].score}</p>
                                            <span style={{fontSize:'0.7rem', color:'#aaa'}}>{leaderboardData[0].time_taken}s</span>
                                        </div>
                                    )}

                                    {/* BRONZE (3rd) */}
                                    {leaderboardData[2] && (
                                        <div style={rankCardStyle(2)}>
                                            <div style={{fontSize:'2rem'}}>🥉</div>
                                            <h4 style={{color:'#cd7f32', margin:'5px 0'}}>{leaderboardData[2].student_name}</h4>
                                            <p style={{color:'#0ac8f0', fontWeight:'bold'}}>{leaderboardData[2].score}</p>
                                        </div>
                                    )}
                                </div>

                                {/* --- REST OF THE LIST (4th onwards) --- */}
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
    </div>
  );
};

export default StudentMenu;