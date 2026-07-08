// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

function AdminDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({ students: 0, teachers: 0, games: 0 });
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [logs, setLogs] = useState([]);
    const [gameStats, setGameStats] = useState([]); 
    
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            navigate('/teacher-login');
            return;
        }
        
        fetchAllAdminData();

        const pollingInterval = setInterval(() => {
            fetchAllAdminData();
        }, 30000); // 30 seconds

        return () => clearInterval(pollingInterval);
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

    const tableHeaderStyle = { padding: '15px', borderBottom: '2px solid #ccc', textAlign: 'left', color: 'black', fontSize: '1rem' };
    const tableCellStyle = { padding: '15px', borderBottom: '1px solid #eee', color: 'black', fontSize: '0.95rem' };
    
    const maxGameCount = gameStats.length > 0 ? Math.max(...gameStats.map(g => g.count)) : 1;

    const getTabStyle = (tabName) => ({
        padding: '12px 24px',
        backgroundColor: activeTab === tabName ? '#fca311' : 'transparent',
        color: activeTab === tabName ? 'black' : '#fca311',
        border: `2px solid #fca311`,
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1rem',
        transition: 'all 0.2s ease'
    });

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            
            <style>{`
                nav, header, .navbar, .header, .nav-container { display: none !important; }
                body { background-color: #14213d; } 
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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

            <div style={{ display: 'flex', gap: '15px', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '20px' }}>
                <button style={getTabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>
                    System Overview
                </button>
                <button style={getTabStyle('users')} onClick={() => setActiveTab('users')}>
                    User Management
                </button>
                <button style={getTabStyle('classes')} onClick={() => setActiveTab('classes')}>
                    Class Moderation
                </button>
            </div>

            {activeTab === 'dashboard' && (
                <div>
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

                    <div style={{ display: 'flex', gap: '30px' }}>
                        <div style={{ flex: 1, backgroundColor: 'white', border: '1px solid #ddd', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                            <h3 style={{ color: 'black', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>Most Popular Game Types</h3>
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

                        <div style={{ flex: 1, border: '1px solid #ddd', padding: '25px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginTop: 0, color: '#fca311' }}>Live System Activity Log</h3>
                            <div style={{ maxHeight: '750px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5', paddingRight: '10px' }}>
                                {logs.map((log, idx) => (
                                    <div key={idx} style={{ marginBottom: '10px', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                                        <span style={{ color: '#aaa' }}>[{new Date(log.activity_timestamp).toLocaleString()}]</span> 
                                        <div style={{ color: '#fff', marginTop: '4px' }}>
                                            Student (UID: {log.student_fid.substring(0,6)}...) performed action: <strong style={{color: '#fca311'}}>{log.activity_type}</strong>
                                        </div>
                                    </div>
                                ))}
                                {logs.length === 0 && <div style={{ color: '#aaa' }}>No recent activity detected.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'users' && (
                <div style={{ border: '1px solid #ddd', padding: '30px', borderRadius: '10px', backgroundColor: 'white', maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ color: 'black', borderBottom: '1px solid #ccc', paddingBottom: '15px', marginTop: 0, fontSize: '1.5rem' }}>Full User Directory</h3>
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
                                    <td style={tableCellStyle}>
                                        <span style={{ padding: '5px 10px', backgroundColor: user.role.toLowerCase() === 'teacher' ? '#14213d' : '#e5e5e5', color: user.role.toLowerCase() === 'teacher' ? 'white' : 'black', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{...tableCellStyle, fontWeight: 'bold'}}>{user.name}</td>
                                    <td style={tableCellStyle}>{user.username}</td>
                                    <td style={{...tableCellStyle, fontFamily: 'monospace', color: '#666'}}>{user.uid}</td>
                                    <td style={tableCellStyle}>
                                        <button onClick={() => handleDeleteUser(user.uid, user.role.toLowerCase())} style={{ backgroundColor: '#ff4c4c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Revoke Access</button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan="5" style={{...tableCellStyle, textAlign: 'center'}}>Loading users...</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
            {activeTab === 'classes' && (
                <div style={{ border: '1px solid #ddd', padding: '30px', borderRadius: '10px', backgroundColor: 'white', maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ color: 'black', borderBottom: '1px solid #ccc', paddingBottom: '15px', marginTop: 0, fontSize: '1.5rem' }}>Global Class Moderation</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={tableHeaderStyle}>Class Name</th>
                                <th style={tableHeaderStyle}>Access Code</th>
                                <th style={tableHeaderStyle}>Created By (Teacher)</th>
                                <th style={tableHeaderStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map((cls, idx) => (
                                <tr key={idx}>
                                    <td style={{...tableCellStyle, fontWeight: 'bold', fontSize: '1.1rem'}}>{cls.class_name}</td>
                                    <td style={{...tableCellStyle, color: '#14213d'}}><strong style={{ letterSpacing: '2px', backgroundColor: '#eee', padding: '5px 10px', borderRadius: '5px' }}>{cls.class_code}</strong></td>
                                    <td style={tableCellStyle}>{cls.teacher_name || 'Unknown User'}</td>
                                    <td style={tableCellStyle}>
                                        <button onClick={() => handleDeleteClass(cls.class_id)} style={{ backgroundColor: '#ff4c4c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Wipe Class Data</button>
                                    </td>
                                </tr>
                            ))}
                            {classes.length === 0 && <tr><td colSpan="4" style={{...tableCellStyle, textAlign: 'center'}}>Loading classes...</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}

export default AdminDashboard;