// src/components/WinScreen.jsx
import React, { useEffect } from "react";
import { MODES } from "../constants/gameData";

export default function WinScreen({ players, winner, mode, onRetry, onMenu }) {
  const actualWinner = winner || players[0];
  const loser = players.find(p => p.id !== actualWinner.id) || players[1];
  
  const isAI = mode === MODES.VS_AI;
  const isPlayerWinner = actualWinner.id === 0; // True if Player 1 wins

  useEffect(() => {
    if (isPlayerWinner) {
        const script  = document.createElement("script");
        script.src    = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
        script.onload = () => {
          if (!window.confetti) return;
          window.confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
          setTimeout(() => window.confetti({ particleCount: 100, spread: 80, origin: { x: 0.2, y: 0.5 } }), 600);
          setTimeout(() => window.confetti({ particleCount: 100, spread: 80, origin: { x: 0.8, y: 0.5 } }), 1000);
        };
        document.head.appendChild(script);
        return () => { if (document.head.contains(script)) document.head.removeChild(script); };
    }
  }, [isPlayerWinner]);

  return (
    <div className="screen" style={{ zIndex: 100, backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="card win-card" style={{ maxWidth: 500, padding: '40px 20px' }}>
        
        <div className="win-crown" style={{ fontSize: '4rem', marginBottom: '10px' }}>
            {isPlayerWinner ? "👑" : "💀"}
        </div>

     
        <h1 style={{
            color: isPlayerWinner ? '#14a014' : '#ff4444',
            fontSize: '1.8rem',
            fontFamily: "'Press Start 2P', cursive",
            margin: '10px 0',
            textShadow: '2px 2px 0 #000'
        }}>
            {isPlayerWinner ? "CONGRATULATIONS!" : "GAME OVER!"}
        </h1>

        <div className="win-player" style={{ color: actualWinner.char?.color || '#ffd700', fontSize: '1.2rem', marginBottom: '10px', fontFamily: "'Press Start 2P', cursive" }}>
            {actualWinner.name} Wins!
        </div>

        <div className="win-sub" style={{ color: '#aaa', marginBottom: '30px', fontSize: '0.9rem' }}>
          {isAI
            ? isPlayerWinner ? "You defeated the Computer! 🎉" : "The AI defeated you! 🤖"
            : `${actualWinner.name} is the Champion!`}
        </div>

        {/* Score Display */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '10px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: actualWinner.char?.color || '#fff' }}>{actualWinner.score}</div>
            <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: "'Press Start 2P', cursive", marginTop: '5px' }}>⭐ {actualWinner.name}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: loser.char?.color || '#fff' }}>{loser.score}</div>
            <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: "'Press Start 2P', cursive", marginTop: '5px' }}>⭐ {loser.name}</div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
            <button className="btn" onClick={onRetry} style={{ padding: '15px 20px', fontSize: '0.8rem', width: 'auto' }}>PLAY AGAIN</button>
            <button className="btn ghost" onClick={onMenu} style={{ padding: '15px 20px', fontSize: '0.8rem', width: 'auto', borderColor: '#ff4444', color: '#ff4444' }}>EXIT MENU</button>
        </div>
      </div>
    </div>
  );
}