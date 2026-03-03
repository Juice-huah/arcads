// ─────────────────────────────────────────────────────────────────────────────
//  HUD.jsx  –  Heads-Up Display with lives, score, streak, wave, tower,
//              category indicator and special ability bar
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";
import SpecialAbilityBar from "./SpecialAbilityBar";
import { CATEGORY_META } from "../defensetower/gameData";

const FONT   = "'Cinzel','Palatino Linotype',serif";
const FONT_B = "'Crimson Text','Georgia',serif";

function streakLabel(streak) {
  if (streak >= 10) return { text:"LEGENDARY 🌟", color:"#ff4500", glow:"#ff4500" };
  if (streak >= 6)  return { text:"BLAZING 🔥",   color:"#f97316", glow:"#f97316" };
  if (streak >= 3)  return { text:"HOT ⚡",        color:"#fbbf24", glow:"#fbbf24" };
  return null;
}

function ScoreDisplay({ score }) {
  const prevRef = useRef(score);
  const bump = score !== prevRef.current;
  useEffect(() => { prevRef.current = score; }, [score]);
  return (
    <div style={S.scoreWrap}>
      <span style={S.label}>SCORE</span>
      <span style={{ ...S.scoreNum, animation: bump ? "scoreBump 0.35s ease" : "none" }}>
        {score.toLocaleString()}
      </span>
    </div>
  );
}

function LivesDisplay({ lives, maxLives, shieldActive }) {
  return (
    <div style={S.livesWrap}>
      <span style={S.label}>{shieldActive ? "🛡️ LIVES" : "LIVES"}</span>
      <div style={{ display:"flex", gap:3, alignItems:"center" }}>
        {Array.from({length:maxLives}).map((_,i)=>(
          <span key={i} style={{
            fontSize:"1.25rem",
            filter: i<lives
              ? shieldActive ? "drop-shadow(0 0 5px #a78bfa)" : "drop-shadow(0 0 5px #ef4444)"
              : "grayscale(1) opacity(0.2)",
            transition:"filter 0.35s",
            animation: i===lives-1 && lives>0 ? "heartPulse 0.5s ease" : "none",
          }}>
            {shieldActive && i<lives ? "💜" : "❤️"}
          </span>
        ))}
      </div>
    </div>
  );
}

function StreakDisplay({ streak }) {
  const label = streakLabel(streak);
  return (
    <div style={S.streakWrap}>
      <span style={S.label}>STREAK</span>
      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
        <span style={{fontSize:"1.3rem"}}>
          {streak>=10?"🌟":streak>=6?"🔥":streak>=3?"⚡":"💬"}
        </span>
        <span style={{
          fontFamily:FONT, fontSize:"1.45rem", fontWeight:700,
          color: label?.color ?? "#e2d9c8",
          textShadow: label ? `0 0 12px ${label.glow}aa` : "none",
          minWidth:28, textAlign:"center",
        }}>{streak}</span>
        {label && (
          <span style={{
            fontSize:"0.6rem", fontFamily:FONT, letterSpacing:"0.1em",
            color:label.color, textShadow:`0 0 8px ${label.glow}`,
            alignSelf:"flex-end", marginBottom:2,
          }}>{label.text}</span>
        )}
      </div>
    </div>
  );
}

function TowerBadge({ towerLevel }) {
  return (
    <div style={S.towerBadgeWrap}>
      <span style={S.label}>TOWER</span>
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:2,
        border:`1px solid ${towerLevel.color}`, borderRadius:8,
        padding:"4px 10px", background:"rgba(0,0,0,0.4)",
        boxShadow:`0 0 10px ${towerLevel.color}44`,
        transition:"border-color 0.5s,box-shadow 0.5s",
      }}>
        <span style={{fontSize:"1.3rem"}}>{towerLevel.emoji}</span>
        <span style={{fontSize:"0.66rem",fontFamily:FONT,color:towerLevel.color,letterSpacing:"0.08em"}}>
          {towerLevel.label}
        </span>
      </div>
    </div>
  );
}

function WaveBadge({ wave, isBossWave }) {
  return (
    <div style={S.waveBadgeWrap}>
      <span style={{
        ...S.label,
        color: isBossWave ? "#ef4444" : "#6b7280",
        animation: isBossWave ? "bossLabelPulse 0.8s infinite alternate" : "none",
      }}>
        {isBossWave ? "⚠ BOSS WAVE" : "WAVE"}
      </span>
      <div style={{
        fontFamily:FONT, fontSize:"2rem", fontWeight:900, lineHeight:1,
        color: isBossWave ? "#ef4444" : undefined,
        textShadow: isBossWave ? "0 0 20px #ef4444" : undefined,
        WebkitTextFillColor: isBossWave ? "#ef4444" : undefined,
        background: isBossWave ? "none" : "linear-gradient(135deg,#ffd700,#ff8c00)",
        WebkitBackgroundClip: isBossWave ? "unset" : "text",
        backgroundClip: isBossWave ? "unset" : "text",
        animation: isBossWave ? "bossLabelPulse 0.8s infinite alternate" : "none",
      }}>
        {wave}
      </div>
    </div>
  );
}

/* ── Category badge ────────────────────────────────────────────────────────── */
function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.definition;
  return (
    <div style={S.catBadgeWrap}>
      <span style={S.label}>MATCH</span>
      <div style={{
        display:"flex", alignItems:"center", gap:5,
        border:`1px solid ${meta.color}66`,
        borderRadius:8, padding:"4px 10px",
        background:`${meta.color}12`,
      }}>
        <span style={{fontSize:"1.1rem"}}>{meta.icon}</span>
        <span style={{
          fontFamily:FONT, fontSize:"0.64rem",
          color:meta.color, letterSpacing:"0.08em",
          textTransform:"uppercase",
        }}>{meta.label}</span>
      </div>
    </div>
  );
}

export default function HUD({ wave, lives, score, streak, towerLevel, abilityState, onAbility, shieldActive, isBossWave, category }) {
  return (
    <header style={S.hud}>
      <style>{`
        @keyframes scoreBump { 0%{transform:scale(1);} 40%{transform:scale(1.22);color:#ffd700;} 100%{transform:scale(1);} }
        @keyframes heartPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(0.62);} }
        @keyframes bossLabelPulse { from{opacity:0.7;} to{opacity:1;} }
      `}</style>

      <WaveBadge wave={wave} isBossWave={isBossWave}/>
      <LivesDisplay lives={lives} maxLives={5} shieldActive={shieldActive}/>
      <ScoreDisplay score={score}/>
      <StreakDisplay streak={streak}/>
      {category && <CategoryBadge category={category}/>}
      <TowerBadge towerLevel={towerLevel}/>

      {abilityState && (
        <SpecialAbilityBar
          cooldowns={abilityState.cooldowns}
          onActivate={onAbility}
          wave={wave}
          shieldActive={shieldActive}
        />
      )}
    </header>
  );
}

const S = {
  hud: {
    display:"flex", alignItems:"center", justifyContent:"space-around",
    gap:10, padding:"7px 18px",
    background:"linear-gradient(to bottom, rgba(0,0,0,0.92), rgba(0,0,0,0.7))",
    borderBottom:"1px solid rgba(255,215,0,0.12)",
    flexWrap:"wrap", zIndex:20, position:"relative",
    backdropFilter:"blur(5px)",
  },
  label: {
    display:"block", fontFamily:FONT, fontSize:"0.52rem",
    letterSpacing:"0.18em", color:"#6b7280",
    textTransform:"uppercase", marginBottom:3, textAlign:"center",
  },
  scoreWrap:    { display:"flex", flexDirection:"column", alignItems:"center" },
  scoreNum: {
    fontFamily:FONT, fontSize:"1.65rem", fontWeight:700,
    color:"#ffd700", textShadow:"0 0 14px #ffd700aa", display:"inline-block",
  },
  livesWrap:    { display:"flex", flexDirection:"column", alignItems:"center" },
  streakWrap:   { display:"flex", flexDirection:"column", alignItems:"center" },
  waveBadgeWrap:{ display:"flex", flexDirection:"column", alignItems:"center" },
  towerBadgeWrap:{ display:"flex", flexDirection:"column", alignItems:"center" },
  catBadgeWrap: { display:"flex", flexDirection:"column", alignItems:"center" },
};