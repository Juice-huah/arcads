import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

function AdminDashboard() {
    const navigate = useNavigate();

    // --- STATE MANAGEMENT ---
    const [stats, setStats] = useState({ students: 0, teachers: 0, games: 0 });
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [logs, setLogs] = useState([]);
    const [gameStats, setGameStats] = useState([]); 

    // --- SECURITY & DATA FETCHING ---
    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            navigate('/teacher-login');
            return;
        }
        fetchAllAdminData();
    }, [navigate]);

    const fetchAllAdminData = async () => {
        try {
            const res = await fetch('https://arcads-api.onrender.com/api/admin/dashboard-data');
            const data = await res.json();
            
            setStats(data.stats);
            setUsers(data.users);
            setClasses(data.classes);
            setLogs(data.logs);
            setGameStats(data.gameStats || []); 
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
    };

    // --- ACTIONS ---
    const handleLogout = async () => {
        await signOut(auth);
        localStorage.clear();
        navigate('/teacher-login');
    };

    const handleDatabaseExport = () => {
        window.open("https://arcads-api.onrender.com/api/admin/backup", "_blank");
    };

    const handleDeleteUser = async (uid, role) => {
        if (!window.confirm(`Are you sure you want to permanently delete this ${role}?`)) return;
        try {
            await fetch('https://arcads-api.onrender.com/api/delete-user', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, role })
            });
            fetchAllAdminData();
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const handleDeleteClass = async (classId) => {
        if (!window.confirm("Are you sure? This will wipe the class, its games, and all student scores associated with it.")) return;
        try {
            await fetch(`https://arcads-api.onrender.com/api/delete-class/${classId}`, {
                method: 'DELETE'
            });
            fetchAllAdminData();
        } catch (error) {
            console.error("Error deleting class:", error);
        }
    };

    // --- STYLES & HELPERS ---
    const tableHeaderStyle = { padding: '10px', borderBottom: '2px solid #ccc', textAlign: 'left', color: 'black', fontSize: '0.9rem' };
    const tableCellStyle = { padding: '10px', borderBottom: '1px solid #eee', color: 'black', fontSize: '0.9rem' };
    
    const maxGameCount = gameStats.length > 0 ? Math.max(...gameStats.map(g => g.count)) : 1;

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            
            {/* 🟢 CSS INJECTION: Hides standard navbar, sets dark blue background! */}
            <style>{`
                nav, header, .navbar, .header, .nav-container { display: none !important; }
                body { background-color: #14213d; } /* Arcads Dark Blue */
            `}</style>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#fca311', margin: 0 }}>ARCADS Admin Panel</h1>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={handleDatabaseExport} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Export Database Backup
                    </button>
                    <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#ff4c4c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Secure Logout
                    </button>
                </div>
            </div>

            {/* 1. LIVE SYSTEM ANALYTICS */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                <div style={{ flex: 1, backgroundColor: '#fca311', color: 'black', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <h2 style={{ fontSize: '3rem', margin: '0 0 10px 0', color: 'black' }}>{stats.students}</h2>
                    <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>Registered Students</p>
                </div>
                <div style={{ flex: 1, backgroundColor: 'white', color: 'black', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <h2 style={{ fontSize: '3rem', margin: '0 0 10px 0', color: 'black' }}>{stats.teachers}</h2>
                    <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>Active Teachers</p>
                </div>
                <div style={{ flex: 1, backgroundColor: '#e5e5e5', color: 'black', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <h2 style={{ fontSize: '3rem', margin: '0 0 10px 0', color: 'black' }}>{stats.games}</h2>
                    <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>Game Instances Running</p>
                </div>
            </div>

            {/* 2. SIMPLE BAR GRAPH FOR MOST POPULAR GAMES */}
            <div style={{ backgroundColor: 'white', border: '1px solid #ddd', padding: '25px', borderRadius: '10px', marginBottom: '40px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <h3 style={{ color: 'black', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>Most Popular Game Types (Created by Teachers)</h3>
                <div style={{ marginTop: '20px' }}>
                    {gameStats.map((game, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <div style={{ width: '180px', fontWeight: 'bold', color: '#333', textTransform: 'capitalize' }}>
                                {game.game_type.replace(/_/g, ' ')}
                            </div>
                            
                            <div style={{ flex: 1, backgroundColor: '#eee', borderRadius: '5px', height: '24px', overflow: 'hidden', margin: '0 20px' }}>
                                <div style={{ 
                                    width: `${(game.count / maxGameCount) * 100}%`, 
                                    backgroundColor: idx === 0 ? '#fca311' : '#14213d', 
                                    height: '100%',
                                    transition: 'width 1s ease-in-out'
                                }}></div>
                            </div>

                            <div style={{ width: '40px', textAlign: 'right', fontWeight: 'bold', color: '#14213d', fontSize: '1.1rem' }}>
                                {game.count}
                            </div>
                        </div>
                    ))}
                    {gameStats.length === 0 && <p style={{ color: '#666' }}>No games have been created yet.</p>}
                </div>
            </div>

            {/* MIDDLE SECTION: TABLES */}
            <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
                
                {/* 3. USER MANAGEMENT TABLE (NOW WITH UID AND NAME) */}
                <div style={{ flex: 1, border: '1px solid #ddd', padding: '25px', borderRadius: '10px', backgroundColor: 'white', maxHeight: '400px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ color: 'black', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>User Management</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={tableHeaderStyle}>Role</th>
                                <th style={tableHeaderStyle}>Name</th>
                                <th style={tableHeaderStyle}>Username</th>
                                <th style={tableHeaderStyle}>UID (Firebase)</th>
                                <th style={tableHeaderStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={idx}>
                                    <td style={tableCellStyle}><strong>{user.role}</strong></td>
                                    <td style={tableCellStyle}>{user.name}</td>
                                    <td style={tableCellStyle}>{user.username}</td>
                                    <td style={{...tableCellStyle, fontFamily: 'monospace', fontSize: '0.8rem', color: '#666'}}>{user.uid.substring(0,8)}...</td>
                                    <td style={tableCellStyle}>
                                        <button onClick={() => handleDeleteUser(user.uid, user.role.toLowerCase())} style={{ backgroundColor: '#ff4c4c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan="5" style={{...tableCellStyle, textAlign: 'center'}}>Loading users...</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* 4. CONTENT MODERATION (NOW WITH CREATOR NAME) */}
                <div style={{ flex: 1, border: '1px solid #ddd', padding: '25px', borderRadius: '10px', backgroundColor: 'white', maxHeight: '400px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ color: 'black', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>Global Class Moderation</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={tableHeaderStyle}>Class Name</th>
                                <th style={tableHeaderStyle}>Code</th>
                                <th style={tableHeaderStyle}>Created By</th>
                                <th style={tableHeaderStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map((cls, idx) => (
                                <tr key={idx}>
                                    <td style={tableCellStyle}>{cls.class_name}</td>
                                    <td style={tableCellStyle}><strong>{cls.class_code}</strong></td>
                                    <td style={tableCellStyle}>{cls.teacher_name || 'Unknown'}</td>
                                    <td style={tableCellStyle}>
                                        <button onClick={() => handleDeleteClass(cls.class_id)} style={{ backgroundColor: '#ff4c4c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>Wipe</button>
                                    </td>
                                </tr>
                            ))}
                            {classes.length === 0 && <tr><td colSpan="4" style={{...tableCellStyle, textAlign: 'center'}}>Loading classes...</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 5. LIVE ACTIVITY FEED */}
            <div style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginTop: 0, color: '#fca311' }}>Live System Activity Log</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {logs.map((log, idx) => (
                        <div key={idx} style={{ marginBottom: '8px', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                            <span style={{ color: '#aaa' }}>[{new Date(log.activity_timestamp).toLocaleString()}]</span> 
                            <span style={{ color: '#fff', marginLeft: '10px' }}>
                                Student (UID: {log.student_fid.substring(0,6)}...) performed action: <strong style={{color: '#fca311'}}>{log.activity_type}</strong>
                            </span>
                        </div>
                    ))}
                    {logs.length === 0 && <div style={{ color: '#aaa' }}>No recent activity detected.</div>}
                </div>
            </div>

        </div>
    );
}

export default AdminDashboard;