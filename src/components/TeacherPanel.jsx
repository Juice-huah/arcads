// src/components/TeacherPanel.jsx
// PIN-protected question editor for teachers.
// Default PIN: 1234  →  change `CORRECT_PIN` below to update.

import { useState } from "react";

const CORRECT_PIN = "1234";
const CATEGORIES  = ["Vocabulary", "Grammar", "Literature", "Idioms", "Reading"];
const DIFFICULTIES = ["easy", "medium", "hard"];

const BLANK_FORM = {
  question:   "",
  options:    ["", "", "", ""],
  correct:    "",
  category:   "Vocabulary",
  difficulty: "easy",
};

export default function TeacherPanel({ questions, onSave, onClose }) {
  const [pin,      setPin]      = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  const [list,    setList]    = useState(questions);
  const [editing, setEditing] = useState(null);       // question id being edited, or null
  const [form,    setForm]    = useState(BLANK_FORM);

  // ── PIN gate ────────────────────────────────────────────────────────

  const tryPin = () => {
    if (pin === CORRECT_PIN) { setUnlocked(true); setPinError(false); }
    else                     { setPinError(true);  setPin("");         }
  };

  if (!unlocked) {
    return (
      <div className="modal-overlay">
        <div className="modal-box">
          <div className="pin-screen">
            <div style={{ fontSize: 48, marginBottom: 10 }}>🔐</div>
            <h2 style={{ fontFamily: "Cinzel", color: "#ffd700", marginBottom: 6 }}>Teacher Access</h2>
            <p style={{ color: "#a89060", fontStyle: "italic", marginBottom: 20 }}>
              Enter PIN to edit questions
            </p>
            <input
              className="field-input"
              type="password"
              placeholder="Enter PIN (default: 1234)"
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === "Enter" && tryPin()}
              style={{ textAlign: "center", fontSize: 18, letterSpacing: 4 }}
            />
            {pinError && (
              <p style={{ color: "#ff4444", marginBottom: 8, fontStyle: "italic" }}>
                ✗ Incorrect PIN
              </p>
            )}
            <button className="btn" onClick={tryPin}>Unlock</button>
            <button className="btn ghost" style={{ marginTop: 8 }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Editor helpers ────────────────────────────────────────────────

  const startEdit = (q) => {
    setEditing(q ? q.id : null);
    setForm(q ? { ...q, options: [...q.options] } : { ...BLANK_FORM, options: ["", "", "", ""] });
  };

  const updateOption = (i, val) => {
    const opts = [...form.options];
    opts[i] = val;
    setForm(f => ({ ...f, options: opts }));
  };

  const saveQuestion = () => {
    if (!form.question || !form.correct) return;
    if (editing) {
      setList(l => l.map(q => q.id === editing ? { ...form, id: editing } : q));
    } else {
      setList(l => [...l, { ...form, id: Date.now() }]);
    }
    startEdit(null);
  };

  const deleteQuestion = (id) => setList(l => l.filter(q => q.id !== id));

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="modal-overlay" style={{ alignItems: "flex-start", paddingTop: 40 }}>
      <div
        className="modal-box"
        style={{ maxWidth: 800, width: "96%", maxHeight: "86vh", overflow: "hidden" }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontFamily: "Cinzel Decorative", color: "#ffd700", fontSize: 18 }}>
            📚 Question Editor
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn sm" onClick={() => { onSave(list); onClose(); }}>
              💾 Save &amp; Close
            </button>
            <button className="btn sm danger" onClick={onClose}>✕ Discard</button>
          </div>
        </div>

        <div className="teacher-wrap">
          {/* ── Question List ── */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: "Cinzel", fontSize: 12, color: "#ffd700", letterSpacing: 1 }}>
                QUESTIONS ({list.length})
              </span>
              <button className="btn sm" onClick={() => startEdit(null)}>+ Add New</button>
            </div>

            <div className="q-list">
              {list.map(q => (
                <div key={q.id} className={`q-item${editing === q.id ? " editing" : ""}`}>
                  <div className="q-text" onClick={() => startEdit(q)} style={{ cursor: "pointer" }}>
                    {q.question}
                  </div>
                  <div className="q-meta">
                    {q.category} · {q.difficulty} · ✓ {q.correct}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                    <button className="btn sm ghost" onClick={() => startEdit(q)}>✏️ Edit</button>
                    <button className="btn sm danger" onClick={() => deleteQuestion(q.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Editor Form ── */}
          <div className="q-editor">
            <h3 style={{ fontFamily: "Cinzel", color: "#ffd700", marginBottom: 14, fontSize: 14 }}>
              {editing ? "Edit Question" : "New Question"}
            </h3>

            <div className="field-label">Question</div>
            <textarea
              className="field-textarea"
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              placeholder="Type the question..."
            />

            {form.options.map((opt, i) => (
              <div key={i}>
                <div className="field-label">Option {i + 1}</div>
                <input
                  className="field-input"
                  value={opt}
                  onChange={e => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                />
              </div>
            ))}

            <div className="field-label">Correct Answer</div>
            <select
              className="field-select"
              value={form.correct}
              onChange={e => setForm(f => ({ ...f, correct: e.target.value }))}
            >
              <option value="">-- Select correct answer --</option>
              {form.options.filter(Boolean).map((o, i) => (
                <option key={i} value={o}>{o}</option>
              ))}
            </select>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div className="field-label">Category</div>
                <select
                  className="field-select"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="field-label">Difficulty</div>
                <select
                  className="field-select"
                  value={form.difficulty}
                  onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                >
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <button className="btn" onClick={saveQuestion} style={{ marginTop: 4 }}>
              {editing ? "✓ Update Question" : "＋ Add Question"}
            </button>
            {editing && (
              <button className="btn ghost" onClick={() => startEdit(null)} style={{ marginTop: 8 }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
