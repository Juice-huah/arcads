// ─────────────────────────────────────────────────────────────────────────────
//  EnemyLane.jsx  –  Enemy sprites with PROMPT text bubbles for matching
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { CATEGORY_META } from "../defensetower/gameData";

const FONT   = "'Cinzel','Palatino Linotype',serif";
const FONT_B = "'Crimson Text','Georgia',serif";

const WALK_ANIM = {
  hop:     "walkHop",
  shuffle: "walkShuffle",
  stomp:   "walkStomp",
  glide:   "walkGlide",
  crawl:   "walkCrawl",
  float:   "walkFloat",
};

/* ── Prompt Bubble ────────────────────────────────────────────────────────── */
function PromptBubble({ prompt, category, isBoss, isUrgent }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.definition;
  return (
    <div style={{
      position: "absolute",
      bottom: "calc(100% + 6px)",
      left: "50%",
      transform: "translateX(-50%)",
      width: "max-content",
      maxWidth: "180px", // 🟢 Prevents it from getting too wide, forces word wrap
      background: isBoss
        ? `linear-gradient(135deg, rgba(30,0,0,0.95), rgba(80,0,0,0.9))`
        : `linear-gradient(135deg, rgba(5,10,20,0.96), rgba(10,20,40,0.92))`,
      border: `1.5px solid ${isUrgent ? "#ef444488" : `${meta.color}66`}`,
      borderRadius: 8,
      padding: isBoss ? "8px 14px" : "6px 12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      boxShadow: `0 2px 12px rgba(0,0,0,0.6), 0 0 8px ${meta.color}22`,
      zIndex: 9,
      pointerEvents: "none",
      animation: isUrgent ? "promptUrgent 0.5s infinite alternate" : "none",
    }}>
      {/* 🟢 FIXED: Prompt label now wraps to multiple lines instead of cutting off! */}
      <div style={{
        fontFamily: FONT,
        fontSize: isBoss ? "0.85rem" : "0.75rem",
        fontWeight: 700,
        color: isBoss ? "#ef4444" : meta.color,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        textAlign: "center",
        whiteSpace: "normal",   /* Allows text to drop to next line */
        wordWrap: "break-word", /* Breaks long words if needed */
        lineHeight: 1.3,
        textShadow: `0 0 8px ${meta.color}88`,
      }}>
        {prompt}
      </div>
      
      {/* Category icon */}
      <div style={{
        fontSize: "0.55rem",
        color: "#9ca3af",
        fontFamily: FONT,
        letterSpacing: "0.1em",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}>
        <span>{meta.icon}</span>
        <span style={{ textTransform: "uppercase" }}>{meta.label}</span>
      </div>
      
      {/* Arrow pointing down */}
      <div style={{
        position: "absolute",
        bottom: -6,
        left: "50%",
        transform: "translateX(-50%)",
        width: 0,
        height: 0,
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderTop: `6px solid ${isUrgent ? "#ef4444" : meta.color}`,
        opacity: 0.8,
      }} />
    </div>
  );
}

/* ── HP Bar ────────────────────────────────────────────────────────────────── */
function HpBar({ hp, maxHp, color, isBoss }) {
  const pct = Math.max(0, hp / maxHp);
  const barColor = pct > 0.6 ? "#10b981" : pct > 0.3 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{
      width: isBoss ? 72 : 44,
      background: "rgba(0,0,0,0.6)",
      borderRadius: 4, overflow: "hidden",
      border: `1px solid ${color}44`,
      height: isBoss ? 8 : 5, position: "relative",
    }}>
      <div style={{
        height: "100%", width: `${pct * 100}%`,
        background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
        borderRadius: 4, transition: "width 0.25s ease",
        boxShadow: `0 0 4px ${barColor}88`,
      }} />
    </div>
  );
}

/* ── Freeze aura ──────────────────────────────────────────────────────────── */
function FreezeAura() {
  return (
    <div style={{
      position:"absolute", inset:-8, borderRadius:"50%",
      border:"2px solid #60a5fa", background:"rgba(96,165,250,0.12)",
      animation:"freezePulse 0.8s infinite alternate", pointerEvents:"none",
    }}>
      {[0,60,120,180,240,300].map((angle,i) => (
        <div key={i} style={{
          position:"absolute", top:"50%", left:"50%",
          width:3, height:8, background:"#93c5fd", borderRadius:2,
          transformOrigin:"top center",
          transform:`rotate(${angle}deg) translateY(-${14+i%2*4}px)`,
          opacity:0.85,
        }}/>
      ))}
    </div>
  );
}

/* ── Boss Aura ────────────────────────────────────────────────────────────── */
function BossAura({ color }) {
  return (
    <>
      <div style={{
        position:"absolute", inset:-16, borderRadius:"50%",
        border:`2px solid ${color}`,
        boxShadow:`0 0 20px ${color}88, 0 0 40px ${color}44`,
        animation:"bossAuraPulse 1.2s infinite alternate", pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", top:-22, left:"50%",
        transform:"translateX(-50%)",
        fontSize:"0.95rem",
        animation:"bossAuraPulse 0.8s infinite alternate",
      }}>👑</div>
    </>
  );
}

/* ── Leg animation ────────────────────────────────────────────────────────── */
function Legs({ walkStyle, color, isBoss }) {
  if (walkStyle === "float" || walkStyle === "glide") return null;
  const s = isBoss ? 11 : 7;
  return (
    <div style={{ display:"flex", gap:4, justifyContent:"center", marginTop:1 }}>
      <div style={{
        width:s, height:s+2, background:color, borderRadius:"0 0 3px 3px",
        animation:`legL ${walkStyle==="stomp"?"0.48s":"0.38s"} infinite alternate`,
        transformOrigin:"top center",
      }}/>
      <div style={{
        width:s, height:s+2, background:color, borderRadius:"0 0 3px 3px",
        animation:`legR ${walkStyle==="stomp"?"0.48s":"0.38s"} 0.2s infinite alternate`,
        transformOrigin:"top center",
      }}/>
    </div>
  );
}

/* ── Death effect ─────────────────────────────────────────────────────────── */
function DeathEffect({ enemy, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 750);
    return () => clearTimeout(t);
  }, [onDone]);
  const anim = {
    burst:"dieBurst", collapse:"dieCollapse", fade:"dieFade",
    explode:"dieExplode", implode:"dieImplode",
  }[enemy.type.deathStyle] ?? "dieFade";
  return (
    <div style={{
      position:"absolute", bottom:"calc(18% + 66px)", left:`${enemy.position}%`,
      transform:"translateX(-50%)",
      fontSize:`${2.6*(enemy.type.size??1)}rem`,
      animation:`${anim} 0.75s ease-out forwards`,
      pointerEvents:"none", zIndex:8, userSelect:"none",
    }}>
      {enemy.type.emoji}
    </div>
  );
}

/* ── Enemy Sprite ──────────────────────────────────────────────────────────── */
function EnemySprite({ enemy, isTarget }) {
  const isFrozen = enemy.frozen;
  const isBoss   = enemy.type.isBoss;
  const walkAnim = WALK_ANIM[enemy.type.walkStyle] ?? "walkHop";
  const baseSize = isBoss ? 3.0 : 2.2;
  const size     = baseSize * (enemy.type.size ?? 1);
  const isUrgent = enemy.position < 22;

  return (
    <div style={{
      position: "absolute",
      bottom: "calc(18% + 66px)",
      left: `${enemy.position}%`,
      // 🟢 FIXED: If this is the active target, force its z-index to 50 so it is ALWAYS on top!
      zIndex: isTarget ? 50 : (isBoss ? 8 : 5), 
      pointerEvents: "none",
      transform: "translateX(-50%)",
      transition: "left 0.05s linear",
    }}>
    
    <div
      title={`${enemy.type.label} — Match "${enemy.prompt}" with the correct answer`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        position: "relative",
        animation: isFrozen ? "none"
          : `${walkAnim} ${enemy.type.speed < 0.8 ? "0.7s" : "0.42s"} ease-in-out infinite`,
      }}
    >
      {/* TARGET ARROW */}
      {isTarget && (
        <div style={{
            position: "absolute",
            bottom: "calc(100% + 55px)", 
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animation: "targetBounce 0.6s alternate infinite ease-in-out",
            zIndex: 20,
            pointerEvents: "none"
        }}>
            <div style={{
                background: "#ef4444", color: "#fff", fontFamily: FONT,
                fontSize: "0.65rem", fontWeight: 900, padding: "2px 8px",
                borderRadius: "4px", letterSpacing: "0.1em",
                boxShadow: "0 4px 10px rgba(239,68,68,0.5)"
            }}>
                TARGET
            </div>
            <div style={{
                color: "#ef4444", fontSize: "1.2rem", marginTop: "-4px",
                textShadow: "0 4px 10px rgba(239,68,68,0.5)"
            }}>▼</div>
        </div>
      )}

      {/* Prompt bubble */}
      <PromptBubble
        prompt={enemy.prompt}
        category={enemy.category}
        isBoss={isBoss}
        isUrgent={isUrgent || isTarget}
      />

      {/* Freeze / Boss Aura */}
      {isFrozen && <FreezeAura />}
      {isBoss && !isFrozen && <BossAura color={enemy.type.color} />}

      {/* Sprite body */}
      <div style={{ position:"relative", display:"flex", flexDirection:"column", alignItems:"center" }}>
        <div style={{
          fontSize: `${size}rem`,
          lineHeight: 1,
          transform: "scaleX(-1)",
          userSelect: "none",
          filter: isFrozen
            ? "hue-rotate(180deg) brightness(0.9)"
            : isBoss
            ? `drop-shadow(0 0 14px ${enemy.type.color}) drop-shadow(0 0 28px ${enemy.type.color}88) brightness(1.2)`
            : isUrgent
            ? "drop-shadow(0 0 8px #ef4444) brightness(1.15)"
            : "brightness(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
          transition: "filter 0.3s",
        }}>
          {enemy.type.emoji}
        </div>
        {!isFrozen && <Legs walkStyle={enemy.type.walkStyle} color={enemy.type.color} isBoss={isBoss} />}
      </div>

      {/* HP bar */}
      {enemy.maxHp > 1 && (
        <HpBar hp={enemy.hp} maxHp={enemy.maxHp} color={enemy.type.color} isBoss={isBoss} />
      )}

      {/* Label */}
      <span style={{
        fontFamily: FONT, textTransform: "uppercase", fontSize: isBoss ? "0.6rem" : "0.52rem",
        padding: "1px 5px", borderRadius: 3, color: isBoss ? "#fff" : enemy.type.color,
        background: isBoss ? `${enemy.type.color}cc` : "rgba(0,0,0,0.65)",
        border: isBoss ? `1px solid ${enemy.type.color}` : "none",
        fontWeight: isBoss ? 700 : 400, letterSpacing: isBoss ? "0.12em" : "0.08em",
        whiteSpace: "nowrap", pointerEvents: "none",
      }}>
        {isBoss ? "⚠ " : ""}{enemy.type.label}
      </span>
    </div>
    </div>
  );
}

/* ── Enemy Lane ────────────────────────────────────────────────────────────── */
export default function EnemyLane({ enemies, dyingEnemies = [], onDeathDone, targetId }) {
  return (
    <div style={styles.lane}>
      <style>{`
        @keyframes walkHop { 0%,100% { transform:translateY(0) scaleY(1); } 25% { transform:translateY(-7px) scaleY(1.1); } 75% { transform:translateY(-3px) scaleY(1.05); } }
        @keyframes walkShuffle { 0%,100% { transform:rotate(-3deg); } 50% { transform:rotate(3deg); } }
        @keyframes walkStomp { 0%,100% { transform:translateY(0) scaleY(1); } 30% { transform:translateY(-9px) scaleY(1.12); } 60% { transform:translateY(2px) scaleY(0.9); } }
        @keyframes walkGlide { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @keyframes walkCrawl { 0%,100% { transform:translateY(0) scaleX(0.94); } 50% { transform:translateY(4px) scaleX(1.06); } }
        @keyframes walkFloat { 0%,100% { transform:translateY(0) rotate(-4deg); } 50% { transform:translateY(-12px) rotate(4deg); } }
        @keyframes legL { from{transform:rotate(-26deg);} to{transform:rotate(16deg);} }
        @keyframes legR { from{transform:rotate(16deg);} to{transform:rotate(-26deg);} }
        @keyframes dieBurst { 0% {transform:scale(1);opacity:1;} 40% {transform:scale(1.7);opacity:0.8;} 100%{transform:scale(0);opacity:0;} }
        @keyframes dieCollapse { 0% {transform:scaleY(1);opacity:1;} 50% {transform:translateY(12px) scaleY(0.2) scaleX(1.6);opacity:0.7;} 100%{transform:translateY(22px) scaleY(0) scaleX(2);opacity:0;} }
        @keyframes dieFade { 0% {transform:none;opacity:1;} 60% {transform:translateY(-22px) rotate(18deg);opacity:0.6;} 100%{transform:translateY(-44px) rotate(36deg);opacity:0;} }
        @keyframes dieExplode { 0% {transform:scale(1);opacity:1;filter:brightness(1);} 20% {transform:scale(2.4);opacity:1;filter:brightness(3.5);} 100%{transform:scale(0);opacity:0;filter:brightness(0);} }
        @keyframes dieImplode { 0% {transform:scale(1) rotate(0deg);opacity:1;} 40% {transform:scale(1.4) rotate(200deg);opacity:0.9;} 100%{transform:scale(0) rotate(560deg);opacity:0;} }
        @keyframes freezePulse { from{opacity:0.55;transform:scale(0.94);} to{opacity:1;transform:scale(1.06);} }
        @keyframes bossAuraPulse { from{opacity:0.45;} to{opacity:1;} }
        @keyframes promptUrgent { from{border-color:rgba(239,68,68,0.4);} to{border-color:rgba(239,68,68,0.9); box-shadow:0 0 12px rgba(239,68,68,0.4);} }
        @keyframes targetBounce { from { transform: translateX(-50%) translateY(0); } to { transform: translateX(-50%) translateY(-10px); } }
      `}</style>

      {enemies.map(e => <EnemySprite key={e.id} enemy={e} isTarget={e.id === targetId} />)}

      {dyingEnemies.map(e => (
        <DeathEffect key={`d-${e.id}`} enemy={e} onDone={() => onDeathDone && onDeathDone(e.id)} />
      ))}
    </div>
  );
}

const styles = {
  lane: { position:"absolute", inset:0, overflow:"visible", zIndex:3 },
};