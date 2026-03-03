// ─────────────────────────────────────────────────────────────────────────────
//  TeacherMenu.jsx  –  Password-gated teacher interface for managing questions
//                      Add, edit, delete questions; set difficulty and type
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";

const FONT   = "'Cinzel', 'Palatino Linotype', serif";
const FONT_B = "'Crimson Text', 'Georgia', serif";

const TEACHER_PASSWORD = "teacher123"; // changeable in production

const TYPE_OPTIONS = ["definition", "synonym", "antonym", "grammar", "idiom"];
const DIFF_OPTIONS = [
  { value: 0, label: "Easy",   color: "#10b981" },
  { value: 1, label: "Medium", color: "#fbbf24" },
  { value: 2, label: "Hard",   color: "#ef4444" },
];
const LANG_OPTIONS = ["English", "Filipino"];

/* ── Password gate ───────────────────────────────────────────────────────── */
function PasswordGate({ onUnlock }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (pw === TEACHER_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div style={styles.gateWrap}>
      <div style={styles.gateBox}>
        <div style={{ fontSize: "3rem", textAlign: "center" }}>🏫</div>
        <h2 style={styles.gateTitle}>Teacher Access</h2>
        <p style={{ color: "#9ca3af", fontSize: "0.9rem", textAlign: "center" }}>
          Enter your teacher password to manage questions.
        </p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Password…"
          style={{
            ...styles.input,
            borderColor: error ? "#ef4444" : "rgba(255,255,255,0.15)",
            boxShadow: error ? "0 0 0 2px rgba(239,68,68,0.3)" : "none",
          }}
        />
        {error && <p style={{ color: "#ef4444", fontSize: "0.8rem" }}>Incorrect password. Try again.</p>}
        <button style={styles.btnPrimary} onClick={handleSubmit}>Unlock →</button>
        <p style={{ color: "#4b5563", fontSize: "0.72rem" }}>Default password: teacher123</p>
      </div>
    </div>
  );
}

/* ── Blank question template ─────────────────────────────────────────────── */
function blankQuestion() {
  return {
    id: `q_${Date.now()}`,
    type: "definition",
    difficulty: 0,
    language: "English",
    question: "",
    choices: ["", "", "", ""],
    answer: 0,
  };
}

/* ── Question Form ───────────────────────────────────────────────────────── */
function QuestionForm({ initial, onSave, onCancel }) {
  const [q, setQ] = useState({ ...initial, choices: [...initial.choices] });
  const [errors, setErrors] = useState({});

  const set = (key, val) => setQ((prev) => ({ ...prev, [key]: val }));
  const setChoice = (i, val) =>
    setQ((prev) => {
      const c = [...prev.choices];
      c[i] = val;
      return { ...prev, choices: c };
    });

  const validate = () => {
    const e = {};
    if (!q.question.trim())               e.question = "Question is required";
    if (q.choices.some((c) => !c.trim())) e.choices  = "All 4 choices are required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(q);
  };

  const diffMeta = DIFF_OPTIONS[q.difficulty];

  return (
    <div style={styles.formCard}>
      {/* Type & Language row */}
      <div style={styles.row}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Type</label>
          <select style={styles.select} value={q.type} onChange={(e) => set("type", e.target.value)}>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Language</label>
          <select style={styles.select} value={q.language} onChange={(e) => set("language", e.target.value)}>
            {LANG_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Difficulty</label>
          <div style={styles.diffRow}>
            {DIFF_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => set("difficulty", d.value)}
                style={{
                  ...styles.diffBtn,
                  background: q.difficulty === d.value ? d.color + "33" : "transparent",
                  borderColor: q.difficulty === d.value ? d.color : "rgba(255,255,255,0.15)",
                  color: q.difficulty === d.value ? d.color : "#6b7280",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question text */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Question / Prompt</label>
        <textarea
          value={q.question}
          onChange={(e) => set("question", e.target.value)}
          placeholder="Type the question here…"
          rows={3}
          style={{
            ...styles.textarea,
            borderColor: errors.question ? "#ef4444" : "rgba(255,255,255,0.12)",
          }}
        />
        {errors.question && <span style={styles.errorText}>{errors.question}</span>}
      </div>

      {/* Choices */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          Answer Choices <span style={{ color: "#6b7280" }}>(select correct answer →)</span>
        </label>
        {errors.choices && <span style={styles.errorText}>{errors.choices}</span>}
        <div style={styles.choicesGrid}>
          {q.choices.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => set("answer", i)}
                title={i === q.answer ? "Correct answer" : "Set as correct answer"}
                style={{
                  ...styles.answerDot,
                  background: i === q.answer ? "#10b981" : "transparent",
                  borderColor: i === q.answer ? "#10b981" : "rgba(255,255,255,0.2)",
                }}
              >
                {i === q.answer ? "✓" : ["A","B","C","D"][i]}
              </button>
              <input
                value={c}
                onChange={(e) => setChoice(i, e.target.value)}
                placeholder={`Choice ${["A","B","C","D"][i]}`}
                style={{ ...styles.input, flex: 1, borderColor: "rgba(255,255,255,0.12)" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={styles.formActions}>
        <button style={styles.btnSecondary} onClick={onCancel}>Cancel</button>
        <button style={styles.btnPrimary} onClick={handleSave}>
          💾 Save Question
        </button>
      </div>
    </div>
  );
}

/* ── Question Row (in table) ─────────────────────────────────────────────── */
function QuestionRow({ q, onEdit, onDelete }) {
  const diff = DIFF_OPTIONS[q.difficulty];
  return (
    <div style={styles.qRow}>
      <div style={styles.qMeta}>
        <span style={{ ...styles.badge, background: diff.color + "22", color: diff.color }}>
          {diff.label}
        </span>
        <span style={{ ...styles.badge, background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}>
          {q.type}
        </span>
        {q.language === "Filipino" && (
          <span style={{ ...styles.badge, background: "rgba(255,215,0,0.08)", color: "#fbbf24" }}>
            🇵🇭
          </span>
        )}
      </div>
      <p style={styles.qText}>{q.question}</p>
      <div style={styles.qChoices}>
        {q.choices.map((c, i) => (
          <span
            key={i}
            style={{
              fontSize: "0.75rem",
              color: i === q.answer ? "#10b981" : "#6b7280",
              fontWeight: i === q.answer ? 700 : 400,
            }}
          >
            {["A","B","C","D"][i]}: {c}
            {i === q.answer && " ✓"}
          </span>
        ))}
      </div>
      <div style={styles.qActions}>
        <button style={styles.editBtn} onClick={() => onEdit(q)}>✏️ Edit</button>
        <button style={styles.deleteBtn} onClick={() => onDelete(q.id)}>🗑 Delete</button>
      </div>
    </div>
  );
}

/* ── Teacher Menu Main ───────────────────────────────────────────────────── */
export default function TeacherMenu({ questions, setQuestions, onBack }) {
  const [unlocked, setUnlocked]   = useState(false);
  const [editing, setEditing]     = useState(null);   // null | question object
  const [isAdding, setIsAdding]   = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterDiff, setFilterDiff] = useState("all");
  const [filterLang, setFilterLang] = useState("all");
  const [search, setSearch]       = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  // Filter
  const filtered = questions.filter((q) => {
    if (filterType !== "all" && q.type !== filterType) return false;
    if (filterDiff !== "all" && String(q.difficulty) !== filterDiff) return false;
    if (filterLang !== "all" && q.language !== filterLang) return false;
    if (search && !q.question.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // CRUD
  const handleSave = (q) => {
    if (editing) {
      setQuestions((prev) => prev.map((x) => (x.id === q.id ? q : x)));
    } else {
      setQuestions((prev) => [...prev, q]);
    }
    setEditing(null);
    setIsAdding(false);
  };

  const handleDelete = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; }
        select, input, textarea { outline: none; }
        select option { background: #1f2937; color: #e2d9c8; }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>🏫 Teacher Menu</h1>
          <p style={styles.pageSub}>{questions.length} questions in bank</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={styles.btnPrimary} onClick={() => { setIsAdding(true); setEditing(null); }}>
            + Add Question
          </button>
          <button style={styles.btnSecondary} onClick={onBack}>← Back</button>
        </div>
      </header>

      {/* Form (Add / Edit) */}
      {(isAdding || editing) && (
        <div style={styles.formWrap}>
          <h3 style={{ fontFamily: FONT, color: "#ffd700", marginBottom: 16 }}>
            {editing ? "✏️ Edit Question" : "✨ New Question"}
          </h3>
          <QuestionForm
            initial={editing ?? blankQuestion()}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setIsAdding(false); }}
          />
        </div>
      )}

      {/* Filters */}
      <div style={styles.filterBar}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search questions…"
          style={{ ...styles.input, maxWidth: 280 }}
        />
        <select style={styles.select} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select style={styles.select} value={filterDiff} onChange={(e) => setFilterDiff(e.target.value)}>
          <option value="all">All Difficulties</option>
          <option value="0">Easy</option>
          <option value="1">Medium</option>
          <option value="2">Hard</option>
        </select>
        <select style={styles.select} value={filterLang} onChange={(e) => setFilterLang(e.target.value)}>
          <option value="all">All Languages</option>
          <option value="English">English</option>
          <option value="Filipino">Filipino</option>
        </select>
        <span style={{ color: "#6b7280", fontSize: "0.82rem", fontFamily: FONT }}>
          {filtered.length} shown
        </span>
      </div>

      {/* Question list */}
      <div style={styles.listWrap}>
        {filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: "3rem" }}>📭</span>
            <p style={{ fontFamily: FONT, color: "#4b5563" }}>No questions match your filter.</p>
          </div>
        ) : (
          filtered.map((q) => (
            <QuestionRow
              key={q.id}
              q={q}
              onEdit={(q) => { setEditing(q); setIsAdding(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              onDelete={(id) => setDeleteConfirm(id)}
            />
          ))
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmBox}>
            <span style={{ fontSize: "2.5rem" }}>🗑️</span>
            <h3 style={{ fontFamily: FONT, color: "#ef4444" }}>Delete Question?</h3>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={styles.btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                style={{ ...styles.btnPrimary, background: "linear-gradient(135deg, #dc2626, #991b1b)" }}
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #0d1b2a, #050d14)",
    padding: "0 0 60px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px 32px",
    borderBottom: "1px solid rgba(255,215,0,0.15)",
    background: "rgba(0,0,0,0.3)",
    flexWrap: "wrap",
    gap: 16,
  },
  pageTitle: {
    fontFamily: FONT,
    fontSize: "clamp(1.4rem, 4vw, 2rem)",
    fontWeight: 700,
    background: "linear-gradient(135deg, #ffd700, #ff8c00)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    margin: 0,
  },
  pageSub: {
    fontFamily: FONT,
    fontSize: "0.8rem",
    color: "#4b5563",
    letterSpacing: "0.1em",
    marginTop: 4,
  },
  formWrap: {
    margin: "24px 32px",
    padding: "24px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,215,0,0.2)",
    borderRadius: 14,
  },
  filterBar: {
    display: "flex",
    gap: 12,
    padding: "16px 32px",
    flexWrap: "wrap",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  listWrap: {
    padding: "20px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  qRow: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    transition: "background 0.2s",
  },
  qMeta: { display: "flex", gap: 8, flexWrap: "wrap" },
  badge: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 5,
    fontSize: "0.7rem",
    fontFamily: FONT,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  qText: {
    fontFamily: FONT_B,
    fontSize: "0.95rem",
    color: "#e2d9c8",
    margin: 0,
    lineHeight: 1.5,
  },
  qChoices: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  qActions: { display: "flex", gap: 8, justifyContent: "flex-end" },
  editBtn: {
    background: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.3)",
    borderRadius: 6,
    color: "#93c5fd",
    fontFamily: FONT,
    fontSize: "0.75rem",
    padding: "5px 14px",
    cursor: "pointer",
    letterSpacing: "0.06em",
  },
  deleteBtn: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 6,
    color: "#fca5a5",
    fontFamily: FONT,
    fontSize: "0.75rem",
    padding: "5px 14px",
    cursor: "pointer",
    letterSpacing: "0.06em",
  },
  formCard: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  row: { display: "flex", gap: 16, flexWrap: "wrap" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 160 },
  label: {
    fontFamily: FONT,
    fontSize: "0.65rem",
    letterSpacing: "0.12em",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  input: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 7,
    color: "#e2d9c8",
    fontFamily: FONT_B,
    fontSize: "0.95rem",
    padding: "9px 13px",
    width: "100%",
    transition: "border-color 0.2s",
  },
  textarea: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid",
    borderRadius: 7,
    color: "#e2d9c8",
    fontFamily: FONT_B,
    fontSize: "0.95rem",
    padding: "10px 13px",
    width: "100%",
    resize: "vertical",
    lineHeight: 1.5,
  },
  select: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 7,
    color: "#e2d9c8",
    fontFamily: FONT_B,
    fontSize: "0.9rem",
    padding: "8px 12px",
    cursor: "pointer",
  },
  diffRow: { display: "flex", gap: 6 },
  diffBtn: {
    flex: 1,
    padding: "6px 10px",
    border: "1px solid",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: "0.7rem",
    letterSpacing: "0.08em",
    transition: "background 0.2s, color 0.2s, border-color 0.2s",
    background: "transparent",
  },
  answerDot: {
    width: 32,
    height: 32,
    border: "2px solid",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: "0.75rem",
    color: "#fff",
    flexShrink: 0,
    transition: "background 0.2s, border-color 0.2s",
  },
  choicesGrid: { display: "flex", flexDirection: "column", gap: 8 },
  formActions: { display: "flex", gap: 12, justifyContent: "flex-end" },
  btnPrimary: {
    padding: "10px 24px",
    background: "linear-gradient(135deg, #b45309, #92400e)",
    border: "none",
    borderRadius: 7,
    color: "#fef3c7",
    fontFamily: FONT,
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    cursor: "pointer",
    textTransform: "uppercase",
    boxShadow: "0 4px 12px rgba(180,83,9,0.35)",
  },
  btnSecondary: {
    padding: "10px 22px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 7,
    color: "#9ca3af",
    fontFamily: FONT,
    fontSize: "0.82rem",
    letterSpacing: "0.08em",
    cursor: "pointer",
    textTransform: "uppercase",
  },
  errorText: {
    color: "#f87171",
    fontSize: "0.75rem",
    fontFamily: FONT,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "60px 20px",
  },
  gateWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  gateBox: {
    background: "linear-gradient(160deg, #0d1b2a, #111827)",
    border: "1px solid rgba(255,215,0,0.2)",
    borderRadius: 16,
    padding: "40px 48px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    alignItems: "center",
    maxWidth: 420,
    width: "100%",
  },
  gateTitle: {
    fontFamily: FONT,
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "#ffd700",
    margin: 0,
  },
  confirmOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    backdropFilter: "blur(4px)",
  },
  confirmBox: {
    background: "#111827",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 14,
    padding: "36px 48px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    textAlign: "center",
  },
};