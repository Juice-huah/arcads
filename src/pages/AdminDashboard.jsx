import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

function AdminDashboard() {
    const navigate = useNavigate();

    // Safety check: Kick them out if they aren't the admin
    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            navigate('/teacher-login');
        }
    }, [navigate]);

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.clear();
        navigate('/teacher-login');
    };

    const handleDatabaseExport = () => {
        window.open("https://arcads-api.onrender.com/api/admin/backup", "_blank");
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #fca311', paddingBottom: '20px', marginBottom: '30px' }}>
                <h1 style={{ color: '#14213d', margin: 0 }}>ARCADS Admin Control Panel</h1>
                <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#ff4c4c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Secure Logout
                </button>
            </div>

            {/* Top Analytics Cards */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                <div style={{ flex: 1, backgroundColor: '#fca311', color: 'white', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>142</h2>
                    <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>Total Registered Students</p>
                </div>
                <div style={{ flex: 1, backgroundColor: '#14213d', color: 'white', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>12</h2>
                    <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>Active Teachers</p>
                </div>
                <div style={{ flex: 1, backgroundColor: '#e5e5e5', color: '#14213d', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>64</h2>
                    <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>Game Instances Running</p>
                </div>
            </div>

            {/* Bottom Admin Tools */}
            <div style={{ display: 'flex', gap: '30px' }}>
                {/* User Management Module */}
                <div style={{ flex: 2, border: '1px solid #ddd', padding: '25px', borderRadius: '10px', backgroundColor: '#fafafa' }}>
                    <h3 style={{ color: '#14213d', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>User Management</h3>
                    <p style={{ color: '#666' }}>Active Directory Control coming soon...</p>
                    {/* You can drop a table component here later to list users */}
                </div>

                {/* System Settings & Backup Module */}
                <div style={{ flex: 1, border: '1px solid #ddd', padding: '25px', borderRadius: '10px', backgroundColor: '#fafafa' }}>
                    <h3 style={{ color: '#14213d', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>System Security</h3>
                    <p style={{ color: '#666', marginBottom: '20px' }}>Generate a raw data export of all Aiven MySQL records.</p>
                    <button 
                        onClick={handleDatabaseExport}
                        style={{ width: '100%', padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Export Database Backup
                    </button>
                </div>
            </div>

        </div>
    );
}

export default AdminDashboard;