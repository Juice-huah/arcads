// ─────────────────────────────────────────────────────────────────────────────
//  QuestionModal.jsx  –  Word-puzzle popup with boss visuals, power-shot
//                        feedback, combo streaks and 10s timer ring
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";

const FONT   = "'Cinzel', 'Palatino Linotype', serif";
const FONT_B = "'Crimson Text', 'Georgia', serif";

const TYPE_META = {
  definition: { label:"Definition",  icon:"📖", color:"#7c3aed" },
  synonym:    { label:"Synonym",     icon:"🔗", color:"#0891b2" },
  antonym:    { label:"Antonym",     icon:"↔️",  color:"#065f46" },
  grammar:    { label:"Grammar",     icon:"✏️",  color:"#92400e" },
  idiom:      { label:"Idiom",       icon:"💬", color:"#9d174d" },
};

const TIME_LIMIT_MS = 10000;

/* ── Countdown Ring ──────────────────────────────────────────────────────── */
function TimerRing({ pct, color }) {
  const r    = 28;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={circ - circ * pct}
        strokeLinecap="round" transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.5s" }} />
      <text x="36" y="40" textAnchor="middle" fontFamily={FONT}
        fontSize="14" fontWeight="700" fill={color}>
        {Math.ceil((pct * TIME_LIMIT_MS) / 1000)}s
      </text>
    </svg>
  );
}

/* ── Choice Button ───────────────────────────────────────────────────────── */
function ChoiceBtn({ text, index, selected, reveal, isCorrect, onClick, towerColor }) {
  let bg     = "rgba(255,255,255,0.05)";
  let border = "1px solid rgba(255,255,255,0.1)";
  let color  = "#e2d9c8";

  if (reveal) {
    if (isCorrect) {
      bg = "rgba(16,185,129,0.22)"; border = "2px solid #10b981"; color = "#6ee7b7";
    } else if (selected && !isCorrect) {
      bg = "rgba(239,68,68,0.22)"; border = "2px solid #ef4444"; color = "#fca5a5";
    }
  } else if (selected) {
    bg = `${towerColor ?? "#fbbf24"}22`; border = `1px solid ${towerColor ?? "#fbbf24"}`; color = "#fde68a";
  }

  return (
    <button
      onClick={onClick}
      disabled={reveal}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "12px 16px",
        background: bg, border, borderRadius: 8,
        color, fontFamily: FONT_B, fontSize: "1rem",
        cursor: reveal ? "default" : "pointer",
        textAlign: "left",
        transition: "background 0.2s, border-color 0.2s, transform 0.1s",
        transform: !reveal && selected ? "scale(1.018)" : "none",
        width: "100%",
        lineHeight: 1.4,
      }}
    >
      <span style={{
        minWidth: 26, height: 26, borderRadius: 6,
        background: reveal && isCorrect ? "#10b981"
          : reveal && selected ? "#ef4444"
          : "rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT, fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
        transition: "background 0.25s",
      }}>
        {["A","B","C","D"][index]}
      </span>
      {text}
    </button>
  );
}

/* ── Boss Warning Banner ─────────────────────────────────────────────────── */
function BossWarning({ enemy }) {
  if (!enemy.type.isBoss) return null;
  return (
    <div style={{
      background: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.5)",
      borderRadius: 8,
      padding: "8px 16px",
      fontFamily: FONT,
      fontSize: "0.72rem",
      color: "#ef4444",
      letterSpacing: "0.1em",
      textAlign: "center",
      animation: "bossBlink 0.7s infinite alternate",
    }}>
      ⚠️ BOSS ENEMY — Answer correctly to deal damage! · {enemy.type.ability}
    </div>
  );
}

/* ── Question Modal ──────────────────────────────────────────────────────── */
export default function QuestionModal({ enemy, question, onAnswer, streak, towerLevel }) {
  const [selected, setSelected]   = useState(null);
  const [reveal, setReveal]       = useState(false);
  const [timeLeft, setTimeLeft]   = useState(TIME_LIMIT_MS);
  const startRef                  = useRef(Date.now());
  const timerRef                  = useRef(null);

  useEffect(() => {
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const left = Math.max(0, TIME_LIMIT_MS - (Date.now() - startRef.current));
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(timerRef.current);
        handleSubmit(null);
      }
    }, 100);
    return () => clearInterval(timerRef.current);
  }, []); // eslint-disable-line

  const handleSubmit = (choiceIndex) => {
    clearInterval(timerRef.current);
    const elapsed = Date.now() - startRef.current;
    const correct = choiceIndex === question.answer;
    setSelected(choiceIndex);
    setReveal(true);
    setTimeout(() => onAnswer(correct, elapsed), 1100);
  };

  if (!question) return null;

  const timePct    = timeLeft / TIME_LIMIT_MS;
  const meta       = TYPE_META[question.type] ?? TYPE_META.definition;
  const ringColor  = timePct > 0.5 ? "#10b981" : timePct > 0.25 ? "#fbbf24" : "#ef4444";
  const isBoss     = enemy.type?.isBoss;
  const towerColor = towerLevel?.color ?? "#fbbf24";

  return (
    <div style={styles.overlay}>
      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform: scale(0.86) translateY(22px); }
          to   { opacity:1; transform: scale(1)   translateY(0);     }
        }
        @keyframes bossBlink {
          from { opacity:0.7; }
          to   { opacity:1.0; }
        }
        @keyframes correctFlash {
          0%   { background: rgba(16,185,129,0.35); }
          100% { background: transparent; }
        }
      `}</style>

      <div style={{
        ...styles.modal,
        borderColor: isBoss ? "rgba(239,68,68,0.4)" : "rgba(255,215,0,0.15)",
        boxShadow: isBoss
          ? "0 32px 80px rgba(0,0,0,0.85), 0 0 40px rgba(239,68,68,0.2)"
          : "0 32px 80px rgba(0,0,0,0.8)",
      }}>
        {/* Boss warning */}
        <BossWarning enemy={enemy} />

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.enemyChip}>
              <span style={{
                fontSize: isBoss ? "2.4rem" : "1.8rem",
                filter: isBoss ? `drop-shadow(0 0 8px ${enemy.type.color})` : "none",
              }}>
                {enemy.type.emoji}
              </span>
              <div>
                <div style={{
                  fontFamily: FONT, fontSize: "0.7rem",
                  color: enemy.type.color, letterSpacing: "0.1em", textTransform: "uppercase",
                  fontWeight: isBoss ? 700 : 400,
                }}>
                  {isBoss ? "⚠ " : ""}{enemy.type.label}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                  {isBoss ? `${enemy.hp}/${enemy.maxHp} HP remaining` : "is attacking!"}
                </div>
              </div>
            </div>

            <div style={{
              ...styles.typeBadge,
              background: `${meta.color}28`,
              borderColor: meta.color,
            }}>
              <span>{meta.icon}</span>
              <span style={{ fontFamily: FONT, fontSize: "0.68rem", letterSpacing: "0.1em", color: meta.color }}>
                {meta.label}
              </span>
              {question.language === "Filipino" && (
                <span style={{ fontSize: "0.65rem", color: "#6b7280", marginLeft: 4 }}>🇵🇭</span>
              )}
              {question.difficulty === 2 && (
                <span style={{ fontSize: "0.65rem", color: "#ef4444", marginLeft: 4 }}>🔴 Hard</span>
              )}
            </div>
          </div>

          <TimerRing pct={timePct} color={ringColor} />
        </div>

        {/* Streak / power-shot hint */}
        {streak >= 3 && (
          <div style={{
            background: `${towerColor}18`,
            border: `1px solid ${towerColor}44`,
            borderRadius: 8,
            padding: "7px 16px",
            fontFamily: FONT,
            fontSize: "0.72rem",
            color: towerColor,
            letterSpacing: "0.06em",
            textAlign: "center",
          }}>
            {streak >= 10 ? "🌟" : streak >= 6 ? "🔥" : "⚡"} {streak}× Combo
            {" — "}{streak >= 6 ? "POWER SHOT active!" : "Bonus points active!"}
          </div>
        )}

        {/* Question */}
        <div style={styles.questionBox}>
          <p style={styles.questionText}>{question.question}</p>
        </div>

        {/* Choices */}
        <div style={styles.choicesGrid}>
          {question.choices.map((choice, i) => (
            <ChoiceBtn
              key={i}
              text={choice}
              index={i}
              selected={selected === i}
              reveal={reveal}
              isCorrect={i === question.answer}
              towerColor={towerColor}
              onClick={() => !reveal && handleSubmit(i)}
            />
          ))}
        </div>

        {/* Result */}
        {reveal && (
          <div style={{
            ...styles.resultBanner,
            background: selected === question.answer ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)",
            borderColor: selected === question.answer ? "#10b981" : "#ef4444",
            color: selected === question.answer ? "#6ee7b7" : "#fca5a5",
            animation: selected === question.answer ? "correctFlash 1.1s ease" : "none",
          }}>
            {selected === question.answer
              ? `✅ Correct! ${isBoss ? "Boss takes damage!" : "Tower fires!"}`
              : `❌ Wrong! Correct answer: "${question.choices[question.answer]}"`
            }
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100,
    backdropFilter: "blur(8px)",
    padding: 20,
  },
  modal: {
    background: "linear-gradient(160deg, #0d1b2a 0%, #111827 100%)",
    border: "1px solid",
    borderRadius: 18,
    padding: "26px 30px",
    maxWidth: 580,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    animation: "modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
  },
  header: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 12,
  },
  headerLeft: {
    display: "flex", flexDirection: "column", gap: 8,
  },
  enemyChip: {
    display: "flex", alignItems: "center", gap: 10,
  },
  typeBadge: {
    display: "inline-flex", alignItems: "center", gap: 6,
    border: "1px solid", borderRadius: 6,
    padding: "4px 12px", width: "fit-content",
  },
  questionBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: "16px 18px",
  },
  questionText: {
    fontFamily: FONT,
    fontSize: "clamp(0.92rem, 2.5vw, 1.15rem)",
    color: "#f3e8d0",
    lineHeight: 1.65,
    margin: 0,
  },
  choicesGrid: {
    display: "flex", flexDirection: "column", gap: 8,
  },
  resultBanner: {
    border: "1px solid",
    borderRadius: 8,
    padding: "10px 18px",
    fontFamily: FONT,
    fontSize: "0.85rem",
    letterSpacing: "0.04em",
    textAlign: "center",
    lineHeight: 1.5,
  },
};