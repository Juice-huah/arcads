// src/components/PlayerPanel.jsx
import React from "react";
export default function PlayerPanel({ player, isActive, isAI }) {
  const hp = Math.max(0, Math.min(100, player.health));
  const hpColor = (hp) => hp > 60 ? "#44ff88" : hp > 30 ? "#ff9800" : "#ff4444";

  return (
    <div className="player-panel sidebar-card" style={{ "--p-color": player.char.color, borderColor: isActive ? player.char.color : "#333", boxShadow: isActive ? `0 0 20px ${player.char.color}66` : "none" }}>
      <div className="player-header">
        {/* Render Image instead of Emoji */}
        <img src={player.char.img} alt={player.char.name} style={{ width: "50px", height: "50px", objectFit: "contain", dropShadow: `0 0 5px ${player.char.color}` }} />
        <div>
          <div className="player-name">
            {player.name}
          </div>
          <div className="player-meta">{player.char.name} · Tile {player.pos}</div>
        </div>
        {isActive && <span style={{ marginLeft: "auto", fontSize: 10, color: "#ffd700", fontFamily: "Press Start 2P" }}>TURN</span>}
      </div>
      <div className="hp-bar-wrap">
        <div className="hp-bar" style={{ width: hp + "%", background: hpColor(hp) }} />
      </div>
      <div className="hp-text">❤️ {hp} / 100 HP</div>
      <div style={{ marginTop: 6 }}>
        <span className="score-badge">⭐ {player.score} pts</span>
        {player.streak >= 3 && <span style={{ background: '#ff4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', marginLeft: '5px' }}>🔥 ×{player.streak}</span>}
        {player.skipTurn  && <span style={{ background: '#555', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', marginLeft: '5px' }}>⏸ Skip</span>}
      </div>
    </div>
  );
}