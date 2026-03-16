// src/defensetower/Scoreboard.jsx
import React from 'react';

const FONT = "'Cinzel', 'Palatino Linotype', serif";
const FONT_B = "'Crimson Text', 'Georgia', serif";

export default function Scoreboard({ score, maxScore, wave, streak, onMenu, isScoreSaved }) {
  
  // 🟢 DYNAMIC GRADE CALCULATION: Based on the exact number of questions
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  
  let grade = "D";
  let color = "#ef4444";
  let message = "Study Harder!";

  if (percentage >= 90) { 
    grade = "S";
    color = "#ffd700";
    message = "Outstanding Scholar!";
  } else if (percentage >= 75) { 
    grade = "A";
    color = "#10b981";
    message = "Great Defender!";
  } else if (percentage >= 60) { 
    grade = "B";
    color = "#3b82f6";
    message = "Solid Effort!";
  } else if (percentage >= 40) { 
    grade = "C";
    color = "#f59e0b";
    message = "Keep Practicing!";
  }

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "linear-gradient(to bottom, #050a0f, #0f172a)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center", 
      padding: "20px",
      zIndex: 100,
      overflow: "hidden"
    }}>
      <style>{`
        @keyframes scorePop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes gradeGlow { 0%, 100% { box-shadow: 0 0 20px ${color}66; } 50% { box-shadow: 0 0 50px ${color}; } }
      `}</style>

      <div style={{
        animation: "scorePop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
        background: "rgba(15,23,42,0.8)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "24px",
        padding: "40px",
        maxWidth: "500px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
      }}>
        
        {/* Header */}
        <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>{percentage >= 90 ? "👑" : "💀"}</div>
        <h1 style={{
          margin: "0 0 20px 0",
          fontFamily: FONT,
          fontSize: "2.2rem",
          color: percentage >= 90 ? "#ffd700" : "#f59e0b",
          textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          textAlign: "center"
        }}>
          {percentage >= 90 ? "LEGENDARY BATTLE" : "BATTLE CONCLUDED"}
        </h1>

        {/* Score */}
        <div style={{ fontFamily: FONT_B, color: "#9ca3af", letterSpacing: "0.15em", fontSize: "0.8rem", textTransform: "uppercase" }}>FINAL SCORE</div>
        <div style={{
          fontFamily: FONT,
          fontSize: "4rem",
          fontWeight: 900,
          background: "linear-gradient(135deg, #ffd700, #ff8c00)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1,
          marginBottom: "30px"
        }}>
          {score} <span style={{fontSize: "2rem", color: "#6b7280"}}>/ {maxScore}</span>
        </div>

        {/* Center Grade Circle */}
        <div style={{
          width: "90px", height: "90px",
          borderRadius: "50%",
          border: `4px solid ${color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONT, fontSize: "3rem", fontWeight: "bold",
          color: color,
          animation: "gradeGlow 2s infinite",
          marginBottom: "10px"
        }}>
          {grade}
        </div>
        <div style={{ fontFamily: FONT_B, color: color, fontStyle: "italic", fontSize: "1.1rem", marginBottom: "30px" }}>
          {message}
        </div>

        {/* Stats Grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", width: "100%", marginBottom: "30px"
        }}>
          <div style={statBox}>
            <span style={statIcon}>🌊</span>
            <span style={statLabel}>WAVES CLEARED</span>
            <span style={statValue}>{wave - 1}</span>
          </div>
          <div style={statBox}>
            <span style={statIcon}>🔥</span>
            <span style={statLabel}>BEST STREAK</span>
            <span style={statValue}>{streak}x</span>
          </div>
        </div>

        {/* 🟢 NEW: Clean Exit System. Auto-saves and has only 1 button. */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "center", width: "100%" }}>
            <div style={{
                background: 'rgba(0,0,0,0.5)', 
                padding: '15px 20px', 
                borderRadius: '8px', 
                border: isScoreSaved ? '2px solid #48bb78' : '2px dashed #aaa',
                width: '100%',
                textAlign: 'center'
            }}>
                <p style={{color: isScoreSaved ? '#48bb78' : '#fbd38d', fontSize: '1rem', margin: 0, fontWeight: 'bold'}}>
                    {isScoreSaved ? '✅ PROGRESS SAVED' : '⏳ Saving results...'}
                </p>
            </div>
            
            <button 
                onClick={onMenu}
                style={{
                  width: "100%", padding: "15px", borderRadius: "8px", border: "2px solid #4b5563",
                  background: "transparent", color: "#d1d5db", fontFamily: FONT, 
                  fontWeight: "bold", fontSize: "1.1rem", cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseOver={(e) => { e.target.style.background = '#4b5563'; e.target.style.color = '#fff'; }}
                onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#d1d5db'; }}
            >
              🚪 EXIT TO ARCADE
            </button>
        </div>

      </div>
    </div>
  );
}

const statBox = {
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "12px",
  padding: "15px 10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "5px"
};

const statIcon = { fontSize: "1.2rem" };
const statLabel = { fontFamily: FONT_B, fontSize: "0.6rem", color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" };
const statValue = { fontFamily: FONT, fontSize: "1.3rem", color: "#e2e8f0", fontWeight: "bold" };