// src/components/ModeSelect.jsx
// Shown after choosing VS AI — lets player pick difficulty before character select

import { AI_DIFFICULTY } from "../constants/gameData";

export default function ModeSelect({ onConfirm, onBack }) {
  return (
    <div className="screen">
      <div className="card" style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🤖</div>
        <h2 style={{ fontFamily: "Cinzel Decorative", color: "#ffd700", fontSize: 20, marginBottom: 6 }}>
          VS Computer
        </h2>
        <p style={{ color: "#a89060", fontStyle: "italic", marginBottom: 24, fontSize: 14 }}>
          Choose your opponent's difficulty
        </p>

        {Object.entries(AI_DIFFICULTY).map(([key, diff]) => (
          <button
            key={key}
            onClick={() => onConfirm(diff)}
            style={{
              display: "block", width: "100%", margin: "8px 0",
              padding: "18px 20px", border: `1px solid ${diff.color}44`,
              borderRadius: 14, background: "#0d1e2e", color: diff.color,
              fontFamily: "Cinzel", fontSize: 15, cursor: "pointer",
              transition: "all 0.25s", textAlign: "left",
              boxShadow: `0 0 0 ${diff.color}00`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${diff.color}11`;
              e.currentTarget.style.boxShadow  = `0 0 20px ${diff.color}33`;
              e.currentTarget.style.transform  = "scale(1.02)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#0d1e2e";
              e.currentTarget.style.boxShadow  = `0 0 0 ${diff.color}00`;
              e.currentTarget.style.transform  = "scale(1)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 32 }}>{diff.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, letterSpacing: 1 }}>{diff.label}</div>
                <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 3, fontStyle: "italic" }}>
                  {key === "EASY"   && "AI answers correctly 35% of the time. Great for beginners!"}
                  {key === "MEDIUM" && "AI answers correctly 65% of the time. A fair challenge."}
                  {key === "HARD"   && "AI answers correctly 88% of the time. Can you beat it?"}
                </div>
              </div>
            </div>
          </button>
        ))}

        <button className="btn ghost" style={{ marginTop: 12 }} onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}