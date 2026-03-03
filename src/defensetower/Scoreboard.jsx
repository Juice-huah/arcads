// src/defensetower/Scoreboard.jsx
import React from 'react';

const FONT = "'Cinzel', 'Palatino Linotype', serif";
const FONT_B = "'Crimson Text', 'Georgia', serif";

export default function Scoreboard({ score, wave, streak, onRestart, onMenu, onSaveScore, isScoreSaved }) {
  // Determine performance grade based on SCORE (out of 30) instead of accuracy
  let grade = "D";
  let color = "#ef4444";
  let message = "Study Harder!";

  if (score >= 27) { // 90% of 30
    grade = "S";
    color = "#ffd700";
    message = "Outstanding Scholar!";
  } else if (score >= 22) { // 75% of 30
    grade = "A";
    color = "#10b981";
    message = "Great Defender!";
  } else if (score >= 18) { // 60% of 30
    grade = "B";
    color = "#3b82f6";
    message = "Solid Effort!";
  } else if (score >= 12) { // 40% of 30
    grade = "C";
    color = "#f59e0b";
    message = "Keep Practicing!";
  }

  // 🟢 FIXED: This now triggers the actual database save!
  const handleSaveScore = async () => {
      if (isScoreSaved) return;
      await onSaveScore();
      alert("Score saved successfully!");
  };

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
        <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>{wave >= 4 && score > 0 ? "👑" : "💀"}</div>
        <h1 style={{
          margin: "0 0 20px 0",
          fontFamily: FONT,
          fontSize: "2.2rem",
          color: wave >= 4 && score > 0 ? "#ffd700" : "#f59e0b",
          textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          textAlign: "center"
        }}>
          {wave >= 4 && score > 0 ? "LEGENDARY BATTLE" : "CASTLE FALLEN"}
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
          {score} <span style={{fontSize: "2rem", color: "#6b7280"}}>/ 30</span>
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
            <span style={statLabel}>WAVES SURVIVED</span>
            <span style={statValue}>{wave}</span>
          </div>
          <div style={statBox}>
            <span style={statIcon}>🔥</span>
            <span style={statLabel}>BEST STREAK</span>
            <span style={statValue}>{streak}x</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
          <button 
            onClick={onRestart}
            style={{
              width: "100%", padding: "12px", borderRadius: "8px", border: "none",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff", fontFamily: FONT, fontWeight: "bold", fontSize: "1rem",
              cursor: "pointer", boxShadow: "0 4px 15px rgba(16,185,129,0.3)"
            }}
          >
            ⚔️ RETRY / PLAY AGAIN
          </button>
          
          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button 
                onClick={handleSaveScore}
                disabled={isScoreSaved}
                style={{
                  flex: 1, padding: "12px", borderRadius: "8px", border: "none",
                  background: isScoreSaved ? "#374151" : "#3b82f6", 
                  color: isScoreSaved ? "#9ca3af" : "#fff", 
                  fontFamily: FONT, fontWeight: "bold", fontSize: "0.9rem", 
                  cursor: isScoreSaved ? "default" : "pointer"
                }}
              >
                {isScoreSaved ? "✅ SAVED" : "💾 SAVE SCORE"}
              </button>
              
              <button 
                onClick={onMenu}
                style={{
                  flex: 1, padding: "12px", borderRadius: "8px", border: "2px solid #4b5563",
                  background: "transparent", color: "#d1d5db", fontFamily: FONT, 
                  fontWeight: "bold", fontSize: "0.9rem", cursor: "pointer"
                }}
              >
                🚪 MAIN MENU
              </button>
          </div>
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