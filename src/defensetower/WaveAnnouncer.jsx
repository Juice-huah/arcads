// ─────────────────────────────────────────────────────────────────────────────
//  WaveAnnouncer.jsx  –  Full-screen dramatic overlay perfectly synced to 4-waves
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { getWaveConfig, ENEMY_TYPES, BOSS_TYPES } from "../defensetower/gameData";

const FONT   = "'Cinzel', 'Palatino Linotype', serif";
const FONT_B = "'Crimson Text', 'Georgia', serif";

const WAVE_FLAVOR = [
  "The horde advances!",
  "More enemies pour through the gate!",
  "Reinforce the walls — they're coming!",
  "They just keep coming!", // Boss
];

const BOSS_FLAVOR = [
  "The final champion leads the assault!",
];

const COUNTDOWN_SEC = 4;

export default function WaveAnnouncer({ wave, onDone }) {
  const [count, setCount]   = useState(COUNTDOWN_SEC);
  const [visible, setVisible] = useState(true);

  // 🟢 Fetches perfectly synced config
  const cfg     = getWaveConfig(wave);
  const isBoss  = cfg.isBossWave;
  
  // Custom flavor text based on the 4 exact waves
  const flavor  = isBoss ? BOSS_FLAVOR[0] : WAVE_FLAVOR[(wave - 1) % WAVE_FLAVOR.length];
  const bossForWave = isBoss ? BOSS_TYPES[0] : null;

  useEffect(() => {
    setCount(COUNTDOWN_SEC);
    setVisible(true);
    const interval = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(interval);
          setVisible(false);
          setTimeout(onDone, 300);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [wave, onDone]);

  if (!visible) return null;

  return (
    <div style={{
      ...styles.overlay,
      background: isBoss
        ? "rgba(30,0,0,0.92)"
        : "rgba(0,0,0,0.86)",
    }}>
      <style>{`
        @keyframes waveIn {
          from { opacity:0; transform:scale(1.15); }
          to   { opacity:1; transform:scale(1);   }
        }
        @keyframes bossRoar {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.06); }
        }
        @keyframes countPop {
          0%   { transform: scale(1.5); opacity:0.4; }
          60%  { transform: scale(0.92); }
          100% { transform: scale(1);   opacity:1;   }
        }
        @keyframes titleSlide {
          from { opacity:0; transform:translateY(-28px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes bossGlow {
          0%,100% { text-shadow: 0 0 24px #ef4444; }
          50%     { text-shadow: 0 0 60px #ef4444, 0 0 120px #ff000055; }
        }
        @keyframes shimmer {
          0%,100% { opacity:0.7; }
          50%     { opacity:1;   }
        }
        @keyframes bossEmojiFloat {
          0%,100% { transform: translateY(0) rotate(-4deg); }
          50%     { transform: translateY(-8px) rotate(4deg); }
        }
      `}</style>

      <div style={styles.panel}>
        {/* Boss badge */}
        {isBoss && (
          <div style={styles.bossBadge}>
            ⚠️ FINAL BOSS WAVE ⚠️
          </div>
        )}

        {/* Wave number */}
        <div style={{ animation: "titleSlide 0.5s ease both", textAlign: "center" }}>
          <div style={styles.waveLabel}>Wave</div>
          <div style={{
            ...styles.waveNum,
            animation: isBoss
              ? "bossGlow 1.2s infinite, titleSlide 0.5s ease both"
              : "titleSlide 0.5s ease both",
            color: isBoss ? "#ef4444" : wave === 3 ? "#f97316" : "#ffd700",
          }}>
            {wave}
          </div>
        </div>

        {/* Boss reveal */}
        {isBoss && bossForWave && (
          <div style={styles.bossReveal}>
            <div style={{
              fontSize: "4rem",
              animation: "bossEmojiFloat 1.5s ease-in-out infinite",
              filter: `drop-shadow(0 0 16px ${bossForWave.color})`,
            }}>
              {bossForWave.emoji}
            </div>
            <div style={{
              fontFamily: FONT, fontSize: "1.1rem", fontWeight: 700,
              color: bossForWave.color,
              textShadow: `0 0 12px ${bossForWave.color}`,
            }}>
              {bossForWave.label} approaches!
            </div>
            <div style={{ fontFamily: FONT_B, fontSize: "0.85rem", color: "#9ca3af", fontStyle: "italic" }}>
              He has called the final horde!
            </div>
          </div>
        )}

        {/* Flavor */}
        <p style={{ ...styles.flavor, color: isBoss ? "#f87171" : "#9ca3af" }}>
          "{flavor}"
        </p>

        {/* 🟢 EXACT STATS DISPLAY */}
        <div style={styles.statsRow}>
          <div style={styles.statChip}>
            <span style={styles.statIcon}>👹</span>
            <span style={styles.statVal}>{cfg.enemyCount}</span>
            <span style={styles.statLabel}>Enemies</span>
          </div>
          <div style={styles.statChip}>
            <span style={styles.statIcon}>⚡</span>
            <span style={styles.statVal}>{cfg.speedMultiplier.toFixed(1)}×</span>
            <span style={styles.statLabel}>Speed</span>
          </div>
          <div style={styles.statChip}>
            <span style={styles.statIcon}>📚</span>
            <span style={styles.statVal}>{cfg.difficulty}</span>
            <span style={styles.statLabel}>Difficulty</span>
          </div>
        </div>

        {/* Enemy preview */}
        {!isBoss && (
          <div style={styles.enemyPreview}>
            <span style={styles.previewLabel}>Possible enemies:</span>
            <div style={styles.previewIcons}>
              {ENEMY_TYPES.slice(0, Math.min(wave + 1, ENEMY_TYPES.length)).map(e => (
                <span key={e.id} title={e.label}
                  style={{ fontSize: "1.5rem", filter: `drop-shadow(0 0 4px ${e.color})` }}>
                  {e.emoji}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Countdown */}
        <div style={styles.countdownWrap}>
          <div style={{
            ...styles.countNum,
            key: count,
            color: count <= 2 ? "#ef4444" : isBoss ? "#f97316" : "#ffd700",
            textShadow: `0 0 30px ${count <= 2 ? "#ef4444" : isBoss ? "#f97316" : "#ffd700"}`,
            animation: "countPop 0.9s ease both",
          }}>
            {count}
          </div>
          <div style={styles.countLabel}>
            {isBoss ? "Prepare yourself…" : "Prepare your defenses…"}
          </div>
        </div>

        {/* Progress bar */}
        <div style={styles.progressBg}>
          <div style={{
            ...styles.progressFill,
            width: `${((COUNTDOWN_SEC - count) / COUNTDOWN_SEC) * 100}%`,
            transition: "width 1s linear",
            background: isBoss
              ? "linear-gradient(90deg, #ef4444, #dc2626)"
              : "linear-gradient(90deg, #ffd700, #f97316)",
          }} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 150,
    backdropFilter: "blur(10px)",
    animation: "waveIn 0.4s ease both",
  },
  panel: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
    maxWidth: 500, width: "92%",
    textAlign: "center",
    padding: "36px 30px",
    background: "linear-gradient(160deg, rgba(13,27,42,0.99), rgba(17,24,39,0.99))",
    border: "1px solid rgba(255,215,0,0.15)",
    borderRadius: 22,
    boxShadow: "0 40px 100px rgba(0,0,0,0.95)",
  },
  bossBadge: {
    fontFamily: FONT, fontSize: "0.75rem", letterSpacing: "0.2em",
    color: "#ef4444",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.5)",
    borderRadius: 6, padding: "5px 18px",
    animation: "shimmer 0.8s infinite",
  },
  bossReveal: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    background: "rgba(239,68,68,0.07)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 12, padding: "18px 28px",
    width: "100%",
  },
  waveLabel: {
    fontFamily: FONT, fontSize: "0.8rem", letterSpacing: "0.3em",
    color: "#6b7280", textTransform: "uppercase",
  },
  waveNum: {
    fontFamily: FONT,
    fontSize: "clamp(5rem, 16vw, 8rem)",
    fontWeight: 900, lineHeight: 0.9,
    transition: "color 0.5s",
  },
  flavor: {
    fontFamily: FONT_B, fontStyle: "italic", fontSize: "1rem",
    maxWidth: 360, lineHeight: 1.5,
  },
  statsRow: {
    display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center",
  },
  statChip: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    padding: "10px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, minWidth: 70,
  },
  statIcon: { fontSize: "1.3rem" },
  statVal: { fontFamily: FONT, fontSize: "0.95rem", fontWeight: 700, color: "#e2d9c8" },
  statLabel: {
    fontSize: "0.6rem", color: "#6b7280",
    fontFamily: FONT, letterSpacing: "0.1em", textTransform: "uppercase",
  },
  enemyPreview: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
  },
  previewLabel: {
    fontFamily: FONT, fontSize: "0.62rem", letterSpacing: "0.15em",
    color: "#6b7280", textTransform: "uppercase",
  },
  previewIcons: { display: "flex", gap: 10 },
  countdownWrap: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
  },
  countNum: {
    fontFamily: FONT, fontSize: "3.8rem", fontWeight: 900, lineHeight: 1,
    transition: "color 0.3s",
  },
  countLabel: {
    fontFamily: FONT_B, fontSize: "0.82rem",
    color: "#4b5563", letterSpacing: "0.12em", textTransform: "uppercase",
  },
  progressBg: {
    width: "100%", height: 4,
    background: "rgba(255,255,255,0.07)",
    borderRadius: 2, overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
};