// src/components/QuestionModal.jsx
import React, { useState, useEffect, useRef } from "react";

// Helper function to color-code difficulty if you don't have it in helpers yet
const diffColor = (diff) => {
  if (diff === 'easy') return { bg: '#14a01422', color: '#44ff88' };
  if (diff === 'hard') return { bg: '#ff444422', color: '#ff4444' };
  return { bg: '#fca31122', color: '#fca311' }; // medium
};

export default function QuestionModal({ question, onAnswer, doublePoints, isAI }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft,  setTimeLeft] = useState(15);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          if (!answered) { 
              setAnswered(true); 
              setTimeout(() => onAnswer(false, question.correct), 1200); 
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [answered, onAnswer, question.correct]);

  // AI auto-answers after a short "thinking" pause
  useEffect(() => {
    if (!isAI) return;
    const delay = 1200 + Math.random() * 1000;
    const t = setTimeout(() => {
      if (!answered) {
        clearInterval(timerRef.current);
        // AI answer is resolved by parent via onAnswer(correct) — we just show the AI is done
        setSelected("__ai__");
        setAnswered(true);
        setTimeout(() => onAnswer("__ai_resolve__"), 1000);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [isAI, answered, onAnswer]);

  const handleAnswer = (opt) => {
    if (answered || isAI) return;
    clearInterval(timerRef.current);
    setSelected(opt);
    setAnswered(true);
    setTimeout(() => onAnswer(opt === question.correct, question.correct), 1400);
  };

  const dc = diffColor(question.difficulty || 'medium');
  const timerColor = timeLeft > 8 ? "#44ff88" : timeLeft > 4 ? "#ff9800" : "#ff4444";

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-box" style={{ width: '90%', maxWidth: '500px', background: '#0a2240', border: '4px solid #fca311', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
        
        {/* Header Info */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: '15px' }}>
          <span style={{ fontSize: '0.8rem', color: '#aaa', fontFamily: "'Press Start 2P', cursive" }}>{question.category || "Quest"}</span>
          <span style={{ background: dc.bg, color: dc.color, marginLeft: 8, padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
              {(question.difficulty || 'medium').toUpperCase()}
          </span>
          {doublePoints && <span style={{ marginLeft: "auto", color: "#ffd700", fontSize: '0.8rem', fontFamily: "'Press Start 2P', cursive" }}>⚡ DOUBLE!</span>}
          {!isAI && <span style={{ marginLeft: doublePoints ? 8 : "auto", color: timerColor, fontFamily: "'Press Start 2P', cursive", fontSize: '0.9rem' }}>⏱ {timeLeft}s</span>}
          {isAI && <span style={{ marginLeft: "auto", color: "#ce93d8", fontFamily: "'Press Start 2P', cursive", fontSize: '0.7rem' }}>🤖 AI answering…</span>}
        </div>

        {/* Timer bar — only for human */}
        {!isAI && (
          <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ height: "100%", transition: "width 1s linear", width: `${(timeLeft / 15) * 100}%`, background: timerColor }} />
          </div>
        )}

        {/* AI thinking bar */}
        {isAI && !answered && (
          <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#ce93d8,#9c27b0)", animation: "pulseGlow 1.5s ease-in-out infinite", width: '100%' }} />
          </div>
        )}

        {/* The Question */}
        <p style={{ fontSize: '1.2rem', color: '#fff', margin: '20px 0', lineHeight: '1.5', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            "{question.question}"
        </p>

        {/* The Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {question.options.map(opt => {
            let bgColor = "#0d2c54";
            let borderColor = "#555";
            
            if (answered && !isAI) {
              if (opt === question.correct) {
                  bgColor = "#14a014"; 
                  borderColor = "#0f7a0f";
              } else if (opt === selected) {
                  bgColor = "#e03616"; 
                  borderColor = "#900";
              }
            }

            return (
              <button 
                key={opt} 
                onClick={() => handleAnswer(opt)} 
                disabled={answered || isAI}
                style={{
                    background: bgColor,
                    color: 'white',
                    border: `2px solid ${borderColor}`,
                    padding: '15px',
                    borderRadius: '8px',
                    cursor: (answered || isAI) ? 'default' : 'pointer',
                    transition: '0.2s',
                    fontSize: '1rem',
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Result Banner */}
        {answered && !isAI && (
          <div style={{
              marginTop: '20px',
              padding: '15px',
              borderRadius: '8px',
              background: selected === question.correct ? 'rgba(20, 160, 20, 0.2)' : 'rgba(224, 54, 22, 0.2)',
              border: `2px solid ${selected === question.correct ? '#14a014' : '#e03616'}`,
              color: selected === question.correct ? '#44ff88' : '#ff4444',
              fontFamily: "'Press Start 2P', cursive",
              fontSize: '0.8rem',
              lineHeight: '1.5'
          }}>
            {selected === question.correct
              ? `✨ CORRECT! +${doublePoints ? 20 : 10} PTS${doublePoints ? " (DOUBLE!)" : ""}!`
              : `💔 WRONG! ANSWER: "${question.correct}"\n${timeLeft === 0 ? "⏱ TIME'S UP!" : "-10 HP"}`}
          </div>
        )}
      </div>
    </div>
  );
}