// ─────────────────────────────────────────────────────────────────────────────
//  Tower.jsx  –  SVG-designed defensive tower with level-specific projectiles
//                AND resized Box Answer Cards to fit 7 items
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { TOWER_LEVELS } from "../defensetower/gameData";

const FONT = "'Cinzel', 'Palatino Linotype', serif";

/* ── Tower SVG Designs ────────────────────────────────────────────────────── */
function TowerSVG({ towerLevel, firing }) {
  const c  = towerLevel.color;
  const lv = towerLevel.level;

  if (lv === 1) {
    return (
      <svg viewBox="0 0 80 120" width={80} height={120}>
        <rect x="8" y="50" width="64" height="70" rx="4" fill="#5c3317" />
        {[60,70,80,90,100,110].map((y, i) => (
          <line key={i} x1="8" y1={y} x2="72" y2={y} stroke="#3d200a" strokeWidth="1.5" />
        ))}
        {[20,35,52].map((x, i) => (
          <rect key={i} x={x} y="50" width="4" height="70" rx="1" fill="rgba(0,0,0,0.15)" />
        ))}
        {[6, 22, 38, 54, 65].map((x, i) => (
          <rect key={i} x={x} y="42" width="11" height="14" rx="2" fill="#6b3c1e" />
        ))}
        <rect x="33" y="62" width="14" height="22" rx="2" fill="rgba(0,0,0,0.5)" />
        <rect x="36" y="56" width="8" height="8" fill="rgba(0,0,0,0.4)" />
        <line x1="40" y1="0" x2="40" y2="44" stroke="#8b6040" strokeWidth="2" />
        <polygon points="40,4 62,12 40,22" fill={c}
          style={{ animation: "flagWave 1.4s ease-in-out infinite", transformOrigin: "40px 12px" }} />
        <rect x="33" y="62" width="14" height="22" rx="2" fill={firing ? `${c}66` : "#fbbf2422"} />
        <circle cx="40" cy="80" r="5" fill="rgba(0,0,0,0.35)" />
        <rect x="36" y="83" width="8" height="12" rx="2" fill="rgba(0,0,0,0.3)" />
      </svg>
    );
  }

  if (lv === 2) {
    return (
      <svg viewBox="0 0 80 130" width={80} height={130}>
        <rect x="4" y="50" width="72" height="80" rx="2" fill="#374151" />
        {[58, 72, 86, 100, 114].map((y, row) =>
          [4, 28, 52].map((x, col) => (
            <rect key={`${row}-${col}`} x={x} y={y} width={22} height={12}
              fill={row % 2 === col % 2 ? "#4b5563" : "#374151"}
              stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
          ))
        )}
        {[2, 18, 34, 50, 66].map((x, i) => (
          <rect key={i} x={x} y="42" width="12" height="14" rx="1" fill="#4b5563" />
        ))}
        <path d="M 25 130 L 25 95 Q 40 80 55 95 L 55 130 Z" fill="#111827" />
        <rect x="25" y="28" width="30" height="14" rx="3" fill="#6b4c2a" />
        <rect x="35" y="22" width="10" height="20" rx="2" fill="#92400e" />
        <line x1="15" y1="35" x2="65" y2="35" stroke={c} strokeWidth="3" strokeLinecap="round" />
        <line x1="40" y1="0" x2="40" y2="44" stroke="#9ca3af" strokeWidth="2" />
        <polygon points="40,4 62,12 40,22" fill={c}
          style={{ animation: "flagWave 1.2s ease-in-out infinite", transformOrigin: "40px 12px" }} />
        {firing && <rect x="4" y="50" width="72" height="80" rx="2" fill={`${c}18`} />}
      </svg>
    );
  }

  if (lv === 3) {
    return (
      <svg viewBox="0 0 80 140" width={80} height={140}>
        <rect x="10" y="60" width="60" height="80" rx="3" fill="#1e293b" />
        {[68, 80, 92, 104, 116, 128].map((y, row) =>
          [10, 30, 50].map((x, col) => (
            <rect key={`${row}-${col}`} x={x} y={y} width={18} height={10}
              fill={row % 2 === col % 2 ? "#2d3748" : "#1e293b"}
              stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
          ))
        )}
        {[8, 24, 40, 56, 68].map((x, i) => (
          <rect key={i} x={x} y="52" width="11" height="14" rx="1" fill="#2d3748" />
        ))}
        {[15, 35, 55, 70].map((x, i) => (
          <g key={i}>
            <line x1={x} y1="52" x2={x} y2="30" stroke="#94a3b8" strokeWidth="2" />
            <circle cx={x} cy="28" r="3" fill={c} style={{ filter: `drop-shadow(0 0 4px ${c})` }} />
          </g>
        ))}
        <circle cx="40" cy="20" r="18" fill={`${c}22`} stroke={c} strokeWidth="2" style={{ animation: "orbPulse 1s infinite alternate", filter: `drop-shadow(0 0 ${firing ? "16px" : "8px"} ${c})` }} />
        <text x="40" y="26" textAnchor="middle" fontSize="18">⚡</text>
        {firing && [0, 72, 144, 216, 288].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return ( <line key={i} x1="40" y1="20" x2={40 + Math.cos(rad) * 30} y2={20 + Math.sin(rad) * 30} stroke={c} strokeWidth="1.5" opacity="0.7" strokeDasharray="4 2" /> );
        })}
        <line x1="40" y1="-8" x2="40" y2="52" stroke="#64748b" strokeWidth="2" />
        <polygon points="40,0 60,8 40,18" fill={c} style={{ animation: "flagWave 1s ease-in-out infinite", transformOrigin: "40px 8px" }} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 80 150" width={80} height={150}>
      <polygon points="0,150 10,60 70,60 80,150" fill="#1c0505" />
      {[70, 85, 100, 115, 130, 145].map((y, row) =>
        [0, 20, 40, 60].map((x, col) => (
          <rect key={`${row}-${col}`} x={x + (row % 2 === 0 ? 10 : 0)} y={y} width={18} height={13} fill={row % 2 === col % 2 ? "#3d0b0b" : "#1c0505"} stroke="#0a0000" strokeWidth="0.5" />
        ))
      )}
      {[8, 22, 36, 50, 62].map((x, i) => ( <polygon key={i} points={`${x},60 ${x+6},42 ${x+12},60`} fill="#2d0808" /> ))}
      {[1, 2, 3].map((i) => ( <rect key={i} x={12 * i + 8} y="60" width="4" height="90" fill={`${c}55`} style={{ animation: `lavaFlow ${1 + i * 0.3}s ${i * 0.2}s infinite alternate` }} /> ))}
      <circle cx="40" cy="30" r="22" fill="transparent" stroke={c} strokeWidth="3" style={{ animation: "orbPulse 0.7s infinite alternate", filter: `drop-shadow(0 0 ${firing ? "20px" : "10px"} ${c})` }} />
      <text x="40" y="38" textAnchor="middle" fontSize="22">🔥</text>
      <line x1="40" y1="-6" x2="40" y2="42" stroke="#7f1d1d" strokeWidth="2.5" />
      <polygon points="40,0 64,10 40,22" fill={c} style={{ animation: "flagWave 0.9s ease-in-out infinite", transformOrigin: "40px 10px" }} />
      {firing && ( <rect x="0" y="0" width="80" height="150" fill={`${c}22`} style={{ animation: "fireGlow 0.5s ease" }} /> )}
    </svg>
  );
}

/* ── Projectile Types ──────────────────────────────────────────────────────── */
function ArrowProjectile({ color }) { return ( <svg width="32" height="10" viewBox="0 0 32 10" style={{ position: "absolute", top: "35%", left: "100%", animation: "projectileFly 0.5s ease-out forwards", zIndex: 20, pointerEvents: "none", filter: `drop-shadow(0 0 3px ${color})` }}> <line x1="0" y1="5" x2="26" y2="5" stroke={color} strokeWidth="2" /> <polygon points="26,1 32,5 26,9" fill={color} /> </svg> ); }
function BoltProjectile({ color }) { return ( <div style={{ position: "absolute", top: "33%", left: "100%", width: 20, height: 20, borderRadius: "50%", background: `radial-gradient(circle, #fff, ${color})`, boxShadow: `0 0 12px ${color}, 0 0 24px ${color}88`, animation: "projectileFly 0.45s ease-out forwards", zIndex: 20, pointerEvents: "none", }} /> ); }
function LightningBeam({ color }) { return ( <div style={{ position: "absolute", top: "30%", left: "100%", width: "70vw", height: 4, background: `linear-gradient(90deg, ${color}, ${color}aa, transparent)`, boxShadow: `0 0 12px ${color}, 0 -4px 8px ${color}44, 0 4px 8px ${color}44`, animation: "lightningBeam 0.35s ease-out forwards", zIndex: 20, pointerEvents: "none", borderRadius: 2, }}> <svg style={{ position: "absolute", top: -6, left: 0, width: "100%", height: 16 }}> <polyline points="0,8 20,2 40,14 60,2 80,14 100,2 120,14 140,2 160,14 200,2 240,8" fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" strokeDasharray="4 2" /> </svg> </div> ); }
function FireballProjectile({ color }) { return ( <div style={{ position: "absolute", top: "28%", left: "100%", width: 28, height: 28, borderRadius: "50%", background: `radial-gradient(circle at 40% 35%, #fff 0%, #ffff00 20%, ${color} 55%, #7f1d1d 100%)`, boxShadow: `0 0 20px ${color}, 0 0 40px ${color}88, 0 0 60px rgba(239,68,68,0.4)`, animation: "projectileFly 0.42s ease-out forwards", zIndex: 20, pointerEvents: "none", }}> <div style={{ position: "absolute", right: "80%", top: "20%", width: 40, height: 18, background: `linear-gradient(90deg, transparent, ${color}88, transparent)`, borderRadius: "50%", filter: "blur(3px)", }} /> </div> ); }

export function GameProjectile({ tier }) {
  const projs = {
    arrow    : { el: <div style={{ width:48, height:5, background:"#d97706", borderRadius:2, position:"relative" }}><div style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)", width:0, height:0, borderTop:"5px solid transparent", borderBottom:"5px solid transparent", borderLeft:"8px solid #d97706" }}/></div>, dur:"0.5s", an:"projArrow" },
    bolt     : { el: <div style={{ width:40, height:8, background:"linear-gradient(90deg,#9ca3af,#e5e7eb)", borderRadius:3, boxShadow:"0 0 8px #9ca3af" }}/>, dur:"0.45s", an:"projBolt" },
    lightning: { el: <div style={{ width:72, height:4, background:"linear-gradient(90deg,#fbbf24,#fff,#fbbf24)", borderRadius:2, boxShadow:"0 0 18px #fbbf24, 0 0 36px #fbbf2488" }}/>, dur:"0.4s", an:"projLightning" },
    fireball : { el: <div style={{ fontSize:"1.6rem", lineHeight:1, filter:"drop-shadow(0 0 14px #f97316)" }}>🔥</div>, dur:"0.55s", an:"projFireball" },
  };
  const p = projs[tier?.projectile] ?? projs.arrow;
  return (
    <>
      <style>{`
        @keyframes projArrow     { from{transform:translateX(0) rotate(-10deg);opacity:1;} to{transform:translateX(72vw) rotate(-10deg);opacity:0;} }
        @keyframes projBolt      { from{transform:translateX(0);opacity:1;} to{transform:translateX(72vw);opacity:0;} }
        @keyframes projFireball  { from{transform:translateX(0) scale(1);opacity:1;} to{transform:translateX(72vw) scale(1.5);opacity:0;} }
        @keyframes projLightning { 0%{width:0;opacity:1;} 50%{width:72vw;opacity:1;} 100%{width:72vw;opacity:0;} }
      `}</style>
      <div style={{ position:"fixed", left:"17%", top:"55%", animation:`${p.an} ${p.dur} ease-out forwards`, zIndex:20, pointerEvents:"none" }}>
        {p.el}
      </div>
    </>
  );
}

/* ── Main Defensive Tower Component ───────────────────────────────────────── */
export default function Tower({ towerLevel, firing, streak }) {
  const [prevStreak, setPrevStreak] = useState(streak);
  const [upgradeFlash, setUpgradeFlash] = useState(false);

  useEffect(() => {
    const currIdx = TOWER_LEVELS.findIndex(t => t.level === towerLevel.level);
    const prevLevel = TOWER_LEVELS.find((t, i) => prevStreak >= t.unlockStreak && (i === TOWER_LEVELS.length - 1 || prevStreak < TOWER_LEVELS[i + 1].unlockStreak));
    if (prevLevel && towerLevel.level > prevLevel.level) {
      setUpgradeFlash(true); setTimeout(() => setUpgradeFlash(false), 1400);
    }
    setPrevStreak(streak);
  }, [streak, prevStreak, towerLevel]);

  const nextLevel = TOWER_LEVELS.find(t => t.level === towerLevel.level + 1);

  return (
    <div style={styles.towerWrap}>
      <style>{`
        @keyframes flagWave { 0%,100% { transform: rotate(-10deg) scaleX(1); } 50% { transform: rotate(10deg) scaleX(0.82); } }
        @keyframes towerFire { 0% { transform: scale(1); } 20% { transform: scale(1.12) rotate(-2deg); } 50% { transform: scale(0.94) rotate(1.5deg); } 100% { transform: scale(1); } }
        @keyframes towerIdle { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes upgradeShine { 0%,100% { filter: brightness(1); } 30% { filter: brightness(2) drop-shadow(0 0 20px ${towerLevel.color}); } }
        @keyframes orbPulse { from { opacity:0.7; transform: scale(0.95); } to { opacity:1.0; transform: scale(1.05); } }
        @keyframes lavaFlow { from { opacity:0.4; height: 90px; } to { opacity:0.8; height: 95px; } }
        @keyframes fireGlow { 0% { opacity:0.6; } 100% { opacity:0; } }
        @keyframes upgradePop { 0% { transform: translateX(-50%) scale(0) translateY(0); opacity:1; } 60% { transform: translateX(-50%) scale(1.1) translateY(-10px); opacity:1; } 100% { transform: translateX(-50%) scale(0.8) translateY(-30px); opacity:0; } }
      `}</style>

      <Projectile towerLevel={towerLevel} active={firing} />

      <div style={{ position: "relative", animation: firing ? "towerFire 0.55s ease" : upgradeFlash ? "upgradeShine 1.4s ease" : "towerIdle 3s ease-in-out infinite", filter: `drop-shadow(0 0 ${firing ? "18px" : "8px"} ${towerLevel.color}66)`, transition: "filter 0.4s", }}>
        <TowerSVG towerLevel={towerLevel} firing={firing} />
      </div>

      <div style={{ ...styles.towerName, color: towerLevel.color }}>{towerLevel.label}</div>
      <div style={styles.attackDesc}>{towerLevel.attackDesc}</div>

      {upgradeFlash && ( <div style={styles.upgradeBanner}>🆙 {towerLevel.label} Unlocked!</div> )}

      {nextLevel && (
        <div style={styles.upgradeHint}>
          {nextLevel.unlockStreak - streak > 0 ? `${nextLevel.icon} ${nextLevel.unlockStreak - streak} streak → ${nextLevel.label}` : null}
        </div>
      )}
    </div>
  );
}

const styles = {
  towerWrap: { position: "absolute", left: 120, bottom: "calc(18% + 56px)", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10, overflow: "visible" },
  towerName: { fontFamily: FONT, fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4, textAlign: "center", transition: "color 0.6s" },
  attackDesc: { fontFamily: "'Crimson Text', serif", fontSize: "0.6rem", color: "#4b5563", textAlign: "center", marginTop: 1 },
  upgradeBanner: { position: "absolute", top: -44, left: "50%", background: "linear-gradient(135deg, #ffd700, #ff8c00)", color: "#1a0e00", fontFamily: FONT, fontSize: "0.68rem", fontWeight: 700, padding: "5px 14px", borderRadius: 6, whiteSpace: "nowrap", letterSpacing: "0.1em", boxShadow: "0 4px 16px rgba(255,215,0,0.6)", animation: "upgradePop 1.4s ease forwards", zIndex: 30, pointerEvents: "none" },
  upgradeHint: { marginTop: 4, fontFamily: "'Crimson Text', serif", fontSize: "0.62rem", color: "#4b5563", textAlign: "center", whiteSpace: "nowrap" },
};

// ─────────────────────────────────────────────────────────────────────────────
//  AnswerTower  –  Sized down so 7 boxes fit perfectly on a row
// ─────────────────────────────────────────────────────────────────────────────
const F1 = "'Cinzel','Palatino Linotype',serif";

export function AnswerTower({ word, idx, isCorrect, onSelect, disabled, lastClicked }) {
  const clicked = lastClicked === idx;
  const right   = clicked && isCorrect;
  const wrong   = clicked && !isCorrect;
  
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => !disabled && onSelect(idx, word)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "1 1 12%", // 🟢 This ensures 7 boxes fit dynamically
        minWidth: "100px",
        maxWidth: "140px",
        minHeight: "65px", // Slightly smaller to fit UI better
        background: right ? "linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.9))" 
                  : wrong ? "linear-gradient(135deg, rgba(239,68,68,0.9), rgba(185,28,28,0.9))" 
                  : "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))",
        border: `2px solid ${right ? "#10b981" : wrong ? "#ef4444" : isHovered && !disabled ? "#ffd700" : "#475569"}`,
        borderRadius: "10px", 
        padding: "8px 10px",
        margin: "0 2px 8px 2px", 
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.2s ease",
        transform: isHovered && !disabled ? "translateY(-4px)" : "translateY(0)",
        animation: wrong ? "misfireShake 0.4s ease" : "none",
        boxShadow: right ? "0 6px 15px rgba(16,185,129,0.4)" 
                 : wrong ? "0 6px 15px rgba(239,68,68,0.4)" 
                 : isHovered && !disabled ? "0 6px 15px rgba(255,215,0,0.2)" 
                 : "0 3px 8px rgba(0,0,0,0.5)",
        outline: "none"
      }}
    >
      <style>{`
        @keyframes misfireShake { 0%,100%{transform:translateX(0);} 20%{transform:translateX(-8px);} 40%{transform:translateX(8px);} 60%{transform:translateX(-5px);} 80%{transform:translateX(5px);} }
      `}</style>
      
      <span style={{
        fontFamily: F1,
        fontSize: "0.9rem", // Adjusted font so large words still fit
        fontWeight: 800,
        color: right ? "#fff" : wrong ? "#fff" : isHovered && !disabled ? "#ffd700" : "#e2e8f0",
        textAlign: "center",
        lineHeight: 1.2,
        letterSpacing: "0.03em",
        textShadow: "0 2px 4px rgba(0,0,0,0.8)",
        wordWrap: "break-word",
        whiteSpace: "normal",
        width: "100%",
      }}>
        {right && "✓ "}{wrong && "✗ "}{word}
      </span>
    </button>
  );
}