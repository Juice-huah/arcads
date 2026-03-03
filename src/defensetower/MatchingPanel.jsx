// ─────────────────────────────────────────────────────────────────────────────
//  MatchingPanel.jsx  –  Matching-type answer card panel
//  Replaces QuestionModal. Shows answer cards at bottom; player picks one
//  and the tower auto-targets the matching enemy.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { CATEGORY_META, GAME_CONSTANTS } from "../effects/gameData";

const FONT   = "'Cinzel', 'Palatino Linotype', serif";
const FONT_B = "'Crimson Text', 'Georgia', serif";

/* ── Timer Bar ────────────────────────────────────────────────────────────── */
function TimerBar({ pct, category }) {
  const meta  = CATEGORY_META[category] ?? CATEGORY_META.synonym;
  const color = pct > 0.55 ? meta.color : pct > 0.25 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{
      width: "100%", height: 4,
      background: "rgba(255,255,255,0.07)",
      borderRadius: 2, overflow: "hidden",
    }}>
      <div style={{
        height: "100%", borderRadius: 2,
        width: `${pct * 100}%`,
        background: `linear-gradient(90deg, ${color}, ${color}aa)`,
        transition: "width 0.1s linear, background 0.5s",
        boxShadow: pct < 0.25 ? `0 0 8px ${color}` : "none",
      }} />
    </div>
  );
}

/* ── Answer Card ──────────────────────────────────────────────────────────── */
function AnswerCard({ card, onSelect, disabled, lastResult, enemies }) {
  const [hovered, setHovered] = useState(false);
  const meta = CATEGORY_META[card.category] ?? CATEGORY_META.synonym;

  // Is there a matching live enemy for this card?
  const hasLiveMatch = enemies.some(e => e.answer === card.answer && !e.dying);
  // Is an enemy close to the castle with this answer?
  const matchingEnemy = enemies.find(e => e.answer === card.answer && !e.dying);
  const isUrgent = matchingEnemy && matchingEnemy.position < 25;

  // Result feedback styling
  const isJustCorrect  = lastResult?.card?.id === card.id && lastResult?.correct;
  const isJustWrong    = lastResult?.card?.id === card.id && lastResult?.correct === false;
  const isMisfire      = lastResult?.card?.id === card.id && lastResult?.misfire;

  let border = `1px solid ${hasLiveMatch ? `${meta.color}44` : "rgba(255,255,255,0.07)"}`;
  let bg     = hasLiveMatch ? meta.bgColor : "rgba(255,255,255,0.03)";
  let textColor = hasLiveMatch ? "#e2d9c8" : "#6b7280";
  let glow   = "none";

  if (isJustCorrect) {
    bg = "rgba(16,185,129,0.22)"; border = "2px solid #10b981"; textColor = "#6ee7b7";
    glow = "0 0 20px rgba(16,185,129,0.4)";
  } else if (isJustWrong || isMisfire) {
    bg = "rgba(239,68,68,0.18)"; border = "2px solid #ef4444"; textColor = "#fca5a5";
  } else if (isUrgent && hasLiveMatch) {
    border = `2px solid #ef4444`; bg = "rgba(239,68,68,0.1)";
    glow = "0 0 12px rgba(239,68,68,0.3)";
  } else if (hovered && !disabled && hasLiveMatch) {
    border = `1px solid ${meta.color}`;
    glow = `0 0 12px ${meta.color}33`;
  }

  return (
    <button
      onClick={() => !disabled && onSelect(card)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        position: "relative",
        padding: "10px 14px",
        background: bg,
        border,
        borderRadius: 10,
        cursor: disabled ? "default" : "pointer",
        color: textColor,
        fontFamily: FONT_B,
        fontSize: "0.92rem",
        lineHeight: 1.3,
        textAlign: "left",
        transition: "background 0.2s, border-color 0.2s, transform 0.1s, box-shadow 0.2s",
        transform: !disabled && hovered && hasLiveMatch ? "translateY(-2px) scale(1.02)" : "none",
        boxShadow: glow,
        minHeight: 52,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 3,
        opacity: disabled && !isJustCorrect && !isJustWrong && !isMisfire ? 0.5 : 1,
        animation: isJustCorrect ? "cardCorrect 0.5s ease" : isJustWrong ? "cardWrong 0.5s ease" : "none",
      }}
    >
      {/* Category badge */}
      <div style={{
        fontSize: "0.58rem",
        fontFamily: FONT,
        letterSpacing: "0.1em",
        color: hasLiveMatch ? meta.color : "#4b5563",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}>
        {meta.icon} {meta.label}
        {isUrgent && hasLiveMatch && (
          <span style={{ color: "#ef4444", animation: "blink 0.6s infinite alternate" }}>⚠️ CLOSE!</span>
        )}
        {isJustCorrect && <span style={{ color: "#10b981" }}>✓ HIT!</span>}
        {(isJustWrong || isMisfire) && <span style={{ color: "#ef4444" }}>✗ {isMisfire ? "MISFIRE" : "WRONG"}</span>}
      </div>

      {/* Answer text */}
      <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{card.answer}</span>

      {/* Live match indicator */}
      {hasLiveMatch && !disabled && (
        <div style={{
          position: "absolute",
          top: 5,
          right: 6,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: isUrgent ? "#ef4444" : meta.color,
          boxShadow: `0 0 6px ${isUrgent ? "#ef4444" : meta.color}`,
          animation: "dotPulse 1.2s infinite alternate",
        }} />
      )}
    </button>
  );
}

/* ── Category Header Banner ───────────────────────────────────────────────── */
function CategoryBanner({ category, wave }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.synonym;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "6px 14px",
      background: meta.bgColor,
      border: `1px solid ${meta.color}44`,
      borderRadius: 8,
      flexShrink: 0,
    }}>
      <span style={{ fontSize: "1.2rem" }}>{meta.icon}</span>
      <div>
        <div style={{ fontFamily: FONT, fontSize: "0.62rem", letterSpacing: "0.15em", color: meta.color, textTransform: "uppercase" }}>
          {meta.label} MATCHING
        </div>
        <div style={{ fontFamily: FONT_B, fontSize: "0.72rem", color: "#9ca3af", fontStyle: "italic" }}>
          {meta.desc} · Wave {wave}
        </div>
      </div>
      <div style={{
        marginLeft: "auto",
        width: 28, height: 28,
        borderRadius: "50%",
        border: `2px solid ${meta.color}66`,
        background: `${meta.color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT,
        fontSize: "0.65rem",
        fontWeight: 700,
        color: meta.color,
      }}>
        {meta.projectile === "fireball" ? "🔥" : meta.projectile === "lightning" ? "⚡" : meta.projectile === "bolt" ? "❄️" : "🏹"}
      </div>
    </div>
  );
}

/* ── Streak + Combo Display ───────────────────────────────────────────────── */
function StreakBadge({ streak, category }) {
  if (streak < 2) return null;
  const meta = CATEGORY_META[category] ?? CATEGORY_META.synonym;
  const icon = streak >= 10 ? "🌟" : streak >= 6 ? "🔥" : "⚡";
  const label = streak >= 10 ? "LEGENDARY!" : streak >= 6 ? "BLAZING COMBO!" : "COMBO!";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "5px 14px",
      background: `${meta.color}18`,
      border: `1px solid ${meta.color}44`,
      borderRadius: 20,
      fontFamily: FONT,
      fontSize: "0.68rem",
      color: meta.color,
      letterSpacing: "0.08em",
      flexShrink: 0,
      animation: streak % 1 === 0 ? "badgePop 0.3s ease" : "none",
    }}>
      {icon} {streak}× {label}
    </div>
  );
}

/* ── Instruction Prompt ───────────────────────────────────────────────────── */
function InstructionHint({ enemies, category }) {
  const activeCount = enemies.filter(e => !e.dying).length;
  const meta = CATEGORY_META[category] ?? CATEGORY_META.synonym;
  if (activeCount === 0) return null;
  return (
    <div style={{
      fontFamily: FONT_B,
      fontSize: "0.78rem",
      color: "#6b7280",
      fontStyle: "italic",
      textAlign: "center",
      flexShrink: 0,
    }}>
      ⚔️ {activeCount} {activeCount === 1 ? "enemy" : "enemies"} approaching — 
      {" "}<span style={{ color: meta.color }}>select the correct {meta.label.toLowerCase()} match</span> to fire!
    </div>
  );
}

/* ── Main Matching Panel ──────────────────────────────────────────────────── */
export default function MatchingPanel({
  enemies,
  answerCards,
  onSelectAnswer,
  streak,
  category,
  wave,
  timerPct,
  lastResult,
  disabled,
}) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.synonym;

  return (
    <div style={styles.panel}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        @keyframes cardCorrect {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes cardWrong {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          40%     { transform: translateX(6px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
        @keyframes dotPulse {
          from { opacity:0.5; transform:scale(0.8); }
          to   { opacity:1; transform:scale(1.2); }
        }
        @keyframes badgePop {
          0%  { transform:scale(0.9); }
          60% { transform:scale(1.08); }
          100%{ transform:scale(1); }
        }
        @keyframes blink {
          from { opacity: 0.6; }
          to   { opacity: 1; }
        }
        @keyframes panelSlideUp {
          from { transform:translateY(20px); opacity:0; }
          to   { transform:translateY(0); opacity:1; }
        }
      `}</style>

      {/* Timer bar at very top */}
      <TimerBar pct={timerPct} category={category} />

      {/* Top row: category banner + streak badge */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <CategoryBanner category={category} wave={wave} />
        <StreakBadge streak={streak} category={category} />
        <InstructionHint enemies={enemies} category={category} />
      </div>

      {/* Answer cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 8,
        animation: "panelSlideUp 0.3s ease both",
      }}>
        {answerCards.map(card => (
          <AnswerCard
            key={card.id}
            card={card}
            enemies={enemies}
            onSelect={onSelectAnswer}
            disabled={disabled}
            lastResult={lastResult}
          />
        ))}
        {answerCards.length === 0 && (
          <div style={{
            gridColumn: "1/-1",
            textAlign: "center",
            fontFamily: FONT,
            color: "#4b5563",
            fontSize: "0.78rem",
            letterSpacing: "0.12em",
            padding: "12px 0",
          }}>
            Preparing next wave…
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex", gap: 12, flexWrap: "wrap",
        fontFamily: FONT, fontSize: "0.55rem", color: "#4b5563",
        letterSpacing: "0.1em", textTransform: "uppercase",
        justifyContent: "center",
      }}>
        <span>● <span style={{ color: meta.color }}>Glowing</span> = enemy on screen</span>
        <span>⚠️ <span style={{ color: "#ef4444" }}>Red</span> = enemy near castle</span>
        <span>● Dim = decoy / no match</span>
      </div>
    </div>
  );
}

const styles = {
  panel: {
    position: "relative",
    zIndex: 25,
    background: "linear-gradient(to top, rgba(0,0,0,0.98), rgba(0,0,0,0.88))",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: "10px 16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    backdropFilter: "blur(6px)",
    maxHeight: "40vh",
    overflowY: "auto",
  },
};