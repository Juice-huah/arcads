// ─────────────────────────────────────────────────────────────────────────────
//  Castle.jsx  –  Detailed SVG castle with animated cracks, HP display,
//                 and shield-active glow overlay
// ─────────────────────────────────────────────────────────────────────────────

const FONT = "'Cinzel', 'Palatino Linotype', serif";

function Cracks({ damageLevel }) {
  if (damageLevel === 0) return null;
  const cracks = [
    "M 28 18 Q 38 32 24 48 Q 18 56 22 68",
    "M 62 12 Q 52 28 66 44 Q 70 52 64 60",
    "M 14 58 Q 28 68 18 82 Q 12 90 20 100",
    "M 68 55 Q 54 63 70 76 Q 78 84 72 96",
    "M 40 30 Q 50 44 36 60 Q 30 68 42 80",
  ].slice(0, damageLevel);

  return (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
      viewBox="0 0 90 130">
      {cracks.map((d, i) => (
        <path key={i} d={d} stroke="rgba(0,0,0,0.55)" strokeWidth="2.5"
          fill="none" strokeLinecap="round"
          style={{ animation: `crackReveal 0.3s ${i * 0.1}s ease both` }} />
      ))}
    </svg>
  );
}

/* ── Shield Aura ─────────────────────────────────────────────────────────── */
function ShieldAura() {
  return (
    <div style={{
      position: "absolute",
      inset: -12,
      borderRadius: 12,
      border: "3px solid #a78bfa",
      background: "rgba(167,139,250,0.08)",
      boxShadow: "0 0 20px #a78bfa88, 0 0 40px #7c3aed44",
      animation: "shieldPulse 1s infinite alternate",
      pointerEvents: "none",
      zIndex: 5,
    }}>
      {/* Shield rune symbols at corners */}
      {[[-8,-8],[-8,"auto"],["auto",-8],["auto","auto"]].map(([t,l], i) => (
        <div key={i} style={{
          position: "absolute",
          top: t === "auto" ? undefined : t,
          bottom: t === "auto" ? -8 : undefined,
          left: l === "auto" ? undefined : l,
          right: l === "auto" ? -8 : undefined,
          width: 16,
          height: 16,
          background: "#7c3aed",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.55rem",
        }}>✦</div>
      ))}
    </div>
  );
}

export default function Castle({ lives, maxLives, shieldActive }) {
  const healthPct   = lives / maxLives;
  const damageLevel = maxLives - lives;
  const isLow       = lives <= 1;
  const isDanger    = lives <= 2;

  const wallColor  = isDanger ? "#7f1d1d" : healthPct < 0.6 ? "#4b1d1d" : "#1e293b";
  const towerColor = isDanger ? "#991b1b" : healthPct < 0.6 ? "#5b2c2c" : "#0f172a";
  const roofColor  = isDanger ? "#b91c1c" : "#374151";

  return (
    <div style={styles.castleWrap}>
      <style>{`
        @keyframes castleShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-5px); }
          40%     { transform: translateX(5px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
        @keyframes dangerPulse {
          0%,100% { filter: drop-shadow(0 0 0 rgba(239,68,68,0)); }
          50%     { filter: drop-shadow(0 0 18px rgba(239,68,68,0.6)); }
        }
        @keyframes flagFlap {
          0%,100% { transform: rotate(-12deg) scaleX(1);   }
          50%      { transform: rotate(12deg)  scaleX(0.8); }
        }
        @keyframes shieldPulse {
          from { opacity:0.7; transform:scale(0.98); }
          to   { opacity:1.0; transform:scale(1.02); }
        }
        @keyframes crackReveal {
          from { stroke-dashoffset:100; stroke-dasharray:100; }
          to   { stroke-dashoffset:0; }
        }
        @keyframes torchFlicker {
          0%,100% { opacity:0.8; transform:scaleY(1);   }
          50%     { opacity:1;   transform:scaleY(1.2); }
        }
      `}</style>

      <div style={{
        position: "relative",
        animation: damageLevel >= 4
          ? "castleShake 0.35s ease infinite"
          : isLow
          ? "dangerPulse 0.9s ease infinite"
          : "none",
      }}>
        {/* Shield active glow */}
        {shieldActive && <ShieldAura />}

        <svg viewBox="0 0 90 135" width={90} height={135}
          style={{ display:"block", filter: isDanger ? "saturate(1.3)" : "none" }}>

          {/* ── Left Tower ── */}
          <rect x="0" y="28" width="26" height="107" rx="2" fill={towerColor} />
          {/* Tower top (pitched roof) */}
          <polygon points="0,28 13,12 26,28" fill={roofColor} />
          {/* Battlements */}
          <rect x="0"  y="21" width="7" height="12" fill={towerColor} />
          <rect x="10" y="21" width="6" height="12" fill={towerColor} />
          <rect x="19" y="21" width="7" height="12" fill={towerColor} />
          {/* Window */}
          <rect x="8" y="60" width="10" height="14" rx="2" fill="rgba(0,0,0,0.6)" />
          <rect x="9" y="61" width="8" height="8" rx="1"
            fill={isDanger ? "#ef444466" : "#fbbf2433"} />
          {/* Stone lines */}
          {[38,50,62,74,86,98].map((y, i) => (
            <line key={i} x1="0" y1={y} x2="26" y2={y} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
          ))}

          {/* ── Right Tower ── */}
          <rect x="64" y="28" width="26" height="107" rx="2" fill={towerColor} />
          <polygon points="64,28 77,12 90,28" fill={roofColor} />
          <rect x="64" y="21" width="7" height="12" fill={towerColor} />
          <rect x="74" y="21" width="6" height="12" fill={towerColor} />
          <rect x="83" y="21" width="7" height="12" fill={towerColor} />
          <rect x="72" y="60" width="10" height="14" rx="2" fill="rgba(0,0,0,0.6)" />
          <rect x="73" y="61" width="8" height="8" rx="1"
            fill={isDanger ? "#ef444466" : "#fbbf2433"} />
          {[38,50,62,74,86,98].map((y, i) => (
            <line key={i} x1="64" y1={y} x2="90" y2={y} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
          ))}

          {/* ── Main Wall ── */}
          <rect x="5" y="50" width="80" height="85" rx="2" fill={wallColor} />
          {/* Wall texture */}
          {[58, 68, 78, 88, 98, 108, 118].map((y, row) =>
            [5, 22, 39, 57, 74].map((x, col) => (
              <rect key={`${row}-${col}`}
                x={x + (row % 2 === 0 ? 8 : 0)} y={y}
                width={15} height={8}
                fill={row % 2 === col % 2 ? `${wallColor}ee` : `${wallColor}cc`}
                stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
            ))
          )}
          {/* Center battlements */}
          {[5, 19, 33, 47, 61, 75].map((x, i) => (
            <rect key={i} x={x} y="43" width="11" height="13" rx="1" fill={wallColor} />
          ))}

          {/* Gate arch */}
          <path d="M 28 135 L 28 88 Q 45 72 62 88 L 62 135 Z" fill="#050a0d" />
          {/* Gate portcullis bars */}
          {[33, 39, 45, 51, 57].map((x, i) => (
            <line key={i} x1={x} y1="88" x2={x} y2="135" stroke="rgba(100,100,100,0.4)" strokeWidth="1.5" />
          ))}
          {[94, 104, 114, 124].map((y, i) => (
            <line key={i} x1="28" y1={y} x2="62" y2={y} stroke="rgba(100,100,100,0.35)" strokeWidth="1" />
          ))}

          {/* Wall-walk torches */}
          <circle cx="18" cy="56" r="3" fill={isDanger ? "#ef4444" : "#fbbf24"}
            style={{ animation: "torchFlicker 0.9s infinite alternate" }} />
          <circle cx="72" cy="56" r="3" fill={isDanger ? "#ef4444" : "#fbbf24"}
            style={{ animation: "torchFlicker 1.1s 0.3s infinite alternate" }} />

          {/* Flag */}
          <line x1="45" y1="-4" x2="45" y2="44" stroke="#6b7280" strokeWidth="2" />
          <polygon
            points="45,2 68,11 45,22"
            fill={isDanger ? "#ef4444" : shieldActive ? "#a78bfa" : "#ffd700"}
            style={{ animation: "flagFlap 1.3s ease-in-out infinite", transformOrigin: "45px 11px" }}
          />
        </svg>

        <Cracks damageLevel={damageLevel} />
      </div>

      {/* HP Bar */}
      <div style={styles.hpWrap}>
        <div style={{ ...styles.hpLabel, color: isLow ? "#ef4444" : shieldActive ? "#a78bfa" : "#6b7280" }}>
          {isLow ? "⚠️ CRITICAL" : shieldActive ? "🛡️ SHIELDED" : "Castle HP"}
        </div>
        <div style={styles.hpBarBg}>
          <div style={{
            ...styles.hpBarFill,
            width: `${healthPct * 100}%`,
            background: shieldActive
              ? "linear-gradient(90deg, #7c3aed, #a78bfa)"
              : isLow
              ? "linear-gradient(90deg, #ef4444, #dc2626)"
              : healthPct < 0.6
              ? "linear-gradient(90deg, #f59e0b, #d97706)"
              : "linear-gradient(90deg, #10b981, #059669)",
            transition: "width 0.4s ease, background 0.4s",
          }} />
        </div>
        <div style={{ ...styles.hpNum, color: isLow ? "#ef4444" : "#e2d9c8" }}>
          {lives}/{maxLives}
        </div>
      </div>
    </div>
  );
}

const styles = {
  castleWrap: {
    position: "absolute",
    left: 6,
    bottom: "calc(18% + 56px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 10,
  },
  hpWrap: {
    marginTop: 6,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    width: 94,
  },
  hpLabel: {
    fontFamily: FONT,
    fontSize: "0.52rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    transition: "color 0.4s",
    textAlign: "center",
  },
  hpBarBg: {
    width: "100%",
    height: 7,
    background: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  hpBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  hpNum: {
    fontFamily: FONT,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    transition: "color 0.4s",
  },
};