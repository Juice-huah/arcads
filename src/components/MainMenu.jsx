// src/components/MainMenu.jsx
import { useState, useEffect } from "react";
import { ABOUT_TILES } from "../constants/gameData";

// ─── Generate Random Twinkling Stars ──────────────────────────────────────────
const STARS = Array.from({ length: 60 }, () => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: Math.random() * 2.5 + 1,
  dur: (Math.random() * 3 + 2).toFixed(1),
  del: (Math.random() * 2).toFixed(1),
  color: Math.random() > 0.8 ? '#fca311' : '#ffffff' // Occasional gold star
}));

export default function MainMenu({ onSelectMode, onExit }) {
  const [showAbout, setShowAbout] = useState(false);

  if (showAbout) {
    return (
      <div className="screen" style={{
        position: 'absolute', inset: 0, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, #1a0d2e 0%, #05020a 100%)',
        overflow: 'hidden'
      }}>
        {/* Starry Background */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {STARS.map((s, i) => (
            <div key={i} style={{
              position: 'absolute', left: s.left, top: s.top,
              width: s.size, height: s.size, backgroundColor: s.color,
              borderRadius: '50%', boxShadow: `0 0 6px ${s.color}`,
              animation: `twinkle ${s.dur}s infinite alternate ${s.del}s`
            }} />
          ))}
        </div>

        <div className="card" style={{ 
          position: 'relative', zIndex: 10,
          maxWidth: 480, width: '90%',
          background: 'rgba(12, 24, 44, 0.95)', 
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: 16, padding: '30px',
          boxShadow: '0 15px 50px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.1)',
          animation: 'slideUp 0.4s ease-out'
        }}>
          <div style={{ fontSize: 54, marginBottom: 10, filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }}>📜</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", color: "#ffd700", marginBottom: 12, letterSpacing: '2px' }}>About Word Quest</h2>
          <p style={{ color: "#c0a060", fontStyle: "italic", lineHeight: 1.8, fontSize: 15 }}>
            Word Quest Adventure is an educational board game for high school English class.
            Roll dice, answer vocabulary and grammar questions, climb ladders, avoid snakes,
            and collect power-ups on your quest to tile 100!
          </p>
          
          <div style={{ margin: "20px 0", padding: 18, background: "rgba(0, 0, 0, 0.4)", border: '1px solid #1e3a5f', borderRadius: 10, textAlign: "left" }}>
            <div style={{ fontFamily: "'Cinzel', serif", color: "#ffd700", fontSize: 13, marginBottom: 12, letterSpacing: '1px' }}>✦ SPECIAL TILES ✦</div>
            {ABOUT_TILES.map(([icon, name, desc]) => (
              <div key={name} style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 14, alignItems: 'center' }}>
                <span style={{ fontSize: '1.4rem', width: 30, textAlign: 'center', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.4))' }}>{icon}</span>
                <span style={{ color: "#ffd700", width: 90, fontWeight: 'bold' }}>{name}</span>
                <span style={{ color: "#8a9ab0", lineHeight: 1.4 }}>{desc}</span>
              </div>
            ))}
          </div>
          
          <button 
            className="btn" 
            onClick={() => setShowAbout(false)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(255,215,0,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none'; }}
            style={{ 
              width: '100%', padding: '12px', fontSize: 16, 
              background: 'linear-gradient(135deg, #2a2a35 0%, #1a1a24 100%)', 
              color: '#ffd700', border: '1px solid #ffd70044', borderRadius: 8,
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Cinzel', serif", letterSpacing: '1px'
            }}
          >
            🏠 Return to Keep
          </button>
        </div>
        <style>{`@keyframes twinkle { 0% { opacity: 0.1; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1.2); } }`}</style>
      </div>
    );
  }

  return (
    <div className="screen" style={{
      position: 'absolute', inset: 0, 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, #1a0d2e 0%, #05020a 100%)',
      overflow: 'hidden'
    }}>
      {/* Starry Background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {STARS.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', left: s.left, top: s.top,
            width: s.size, height: s.size, backgroundColor: s.color,
            borderRadius: '50%', boxShadow: `0 0 8px ${s.color}`,
            animation: `twinkle ${s.dur}s infinite alternate ${s.del}s`
          }} />
        ))}
      </div>

      <div className="card" style={{ 
        position: 'relative', zIndex: 10,
        maxWidth: 420, width: '90%', textAlign: 'center',
        background: 'rgba(12, 24, 44, 0.85)', 
        border: '1px solid rgba(100, 181, 246, 0.2)',
        borderRadius: 20, padding: '40px 30px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 0 30px rgba(100,181,246,0.05)',
        animation: 'fadeIn 0.5s ease'
      }}>
        
        {/* Animated crest */}
        <div style={{ fontSize: 64, marginBottom: 10, animation: "titlePulse 3s ease-in-out infinite", filter: "drop-shadow(0 0 20px rgba(255,215,0,0.5))" }}>🏰</div>
        
        <div className="game-title" style={{ 
          fontFamily: "'Cinzel', serif", fontSize: '2.8rem', fontWeight: 900, 
          color: '#ffffff', textShadow: '0 0 20px rgba(100,181,246,0.8)', margin: 0 
        }}>
          Word Quest
        </div>
        <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, color: "#fca311", marginBottom: 10, letterSpacing: '4px' }}>
          Adventure
        </div>
        <p className="game-subtitle" style={{ color: '#a0c4ff', fontStyle: 'italic', marginBottom: 35, fontSize: '0.95rem' }}>
          An English Vocabulary Board Game for Heroes
        </p>

        {/* Mode buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 15 }}>
          
          {/* Multiplayer Button */}
          <button 
            className="btn" 
            onClick={() => onSelectMode("multiplayer")} 
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(77,208,225,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)'; }}
            style={{ 
              fontSize: 15, padding: "20px 10px", 
              background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)", 
              color: "#4dd0e1", border: "1px solid rgba(77,208,225,0.4)", borderRadius: 12,
              boxShadow: "0 4px 15px rgba(0,0,0,0.5)", cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8, filter: 'drop-shadow(0 0 8px rgba(77,208,225,0.6))' }}>👥</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 'bold', letterSpacing: '1px' }}>Multiplayer</div>
            <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4, opacity: 0.7, fontFamily: "sans-serif" }}>2 Players</div>
          </button>

          {/* VS AI Button */}
          <button 
            className="btn" 
            onClick={() => onSelectMode("vs_ai")} 
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(156,39,176,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)'; }}
            style={{ 
              fontSize: 15, padding: "20px 10px", 
              background: "linear-gradient(135deg, #1a0d2e 0%, #3d1a6e 50%, #1a0d2e 100%)", 
              color: "#e1bee7", border: "1px solid rgba(156,39,176,0.5)", borderRadius: 12,
              boxShadow: "0 4px 15px rgba(0,0,0,0.5)", cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8, filter: 'drop-shadow(0 0 8px rgba(156,39,176,0.6))' }}>🤖</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 'bold', letterSpacing: '1px' }}>VS Computer</div>
            <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4, opacity: 0.7, fontFamily: "sans-serif" }}>1 Player</div>
          </button>
        </div>

        {/* View Rules Button */}
        <button 
          className="btn ghost" 
          onClick={() => setShowAbout(true)}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          style={{ 
            width: '100%', padding: '12px', fontSize: 14, marginBottom: 10,
            background: 'transparent', color: '#8a9ab0', 
            border: '1px solid rgba(138,154,176,0.3)', borderRadius: 8,
            cursor: 'pointer', transition: 'background 0.2s', letterSpacing: '1px'
          }}
        >
          📜 View Game Rules
        </button>

        {/* ── NEW: EXIT GAME BUTTON ── */}
        <button 
          className="btn ghost" 
          onClick={onExit} // Calls the prop passed from your wrapper
          onMouseEnter={e => { 
            e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)'; 
            e.currentTarget.style.borderColor = '#ff4d4d';
            e.currentTarget.style.color = '#ffb3b3';
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.background = 'transparent'; 
            e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.3)';
            e.currentTarget.style.color = '#ff4d4d';
          }}
          style={{ 
            width: '100%', padding: '12px', fontSize: 14, 
            background: 'transparent', color: '#ff4d4d', 
            border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: 8,
            cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '1px'
          }}
        >
          🚪 Exit Game
        </button>

      </div>
      <style>{`
        @keyframes twinkle { 
          0% { opacity: 0.1; transform: scale(0.8); } 
          100% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 10px currentColor; } 
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}