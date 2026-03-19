import express from "express";
import mysql from "mysql2"; // 🟢 Switched to mysql2
import cors from "cors";
import dotenv from "dotenv"; // 🟢 Added dotenv

dotenv.config(); // 🟢 Initialize environment variables

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 Upgraded to Connection Pool to prevent Render/Aiven sleep crashes
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    // 🟢 Set to false to solve the "self-signed certificate" error on Render
    rejectUnauthorized: false 
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the pool connection on startup
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database Pool Connection Failed:", err.message);
  } else {
    console.log("✅ Connected securely to AIVEN via Pool!");
    connection.release(); // Return the connection back to the pool
  }
});

// --- AUTH ROUTES ---

app.post("/api/teacher-signup", (req, res) => {
  const { uid, name, surname, username } = req.body;
  const sql = "INSERT INTO teacher (teacher_fid, teacher_name, teacher_surname, teacher_username) VALUES (?, ?, ?, ?)";
  db.query(sql, [uid, name, surname, username], (err, result) => {
    if (err) return res.status(500).json({ error: "Error saving teacher" });
    return res.status(200).json({ message: "Teacher registered!" });
  });
});

app.post("/api/student-signup", (req, res) => {
  const { uid, name, surname, username } = req.body;
  const sql = "INSERT INTO student (student_fid, student_name, student_surname, student_username) VALUES (?, ?, ?, ?)";
  db.query(sql, [uid, name, surname, username], (err, result) => {
    if (err) return res.status(500).json({ error: "Error saving student" });
    return res.status(200).json({ message: "Student registered!" });
  });
});

app.get("/api/check-teacher/:uid", (req, res) => {
  const sql = "SELECT * FROM teacher WHERE teacher_fid = ?"; 
  db.query(sql, [req.params.uid], (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (results.length > 0) return res.status(200).json({ isTeacher: true, teacher: results[0] });
    return res.status(200).json({ isTeacher: false });
  });
});

app.get("/api/check-student/:uid", (req, res) => {
  const sql = "SELECT * FROM student WHERE student_fid = ?"; 
  db.query(sql, [req.params.uid], (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (results.length > 0) return res.status(200).json({ isStudent: true, student: results[0] });
    return res.status(200).json({ isStudent: false });
  });
});

app.put("/api/update-username", (req, res) => {
  const { uid, role, newUsername } = req.body;
  let sql = role === 'teacher' ? "UPDATE teacher SET teacher_username = ? WHERE teacher_fid = ?" : "UPDATE student SET student_username = ? WHERE student_fid = ?";
  db.query(sql, [newUsername, uid], (err, result) => {
    if (err) return res.status(500).json({ error: "Error updating database" });
    return res.status(200).json({ message: "Username updated!" });
  });
});

app.post("/api/check-username-availability", (req, res) => {
  const { username, role } = req.body;
  let sql = role === 'teacher' ? "SELECT * FROM teacher WHERE teacher_username = ?" : "SELECT * FROM student WHERE student_username = ?";
  db.query(sql, [username], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    return res.json({ available: results.length === 0 });
  });
});

// --- CLASS ROUTES ---

const generateClassCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

app.post("/api/create-class", (req, res) => {
  const { teacher_fid, class_name } = req.body;
  if (!teacher_fid || !class_name) return res.status(400).json({error: "Missing fields"});

  const class_code = generateClassCode(); 
  const sql = "INSERT INTO classes (teacher_fid, class_name, class_code) VALUES (?, ?, ?)";
  db.query(sql, [teacher_fid, class_name, class_code], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "Class created!", classId: result.insertId, class_code });
  });
});

app.put("/api/edit-class/:class_id", (req, res) => {
  const { class_name } = req.body;
  const classId = req.params.class_id;
  
  if (!class_name) return res.status(400).json({ error: "Class name cannot be empty" });

  const sql = "UPDATE classes SET class_name = ? WHERE class_id = ?";
  db.query(sql, [class_name, classId], (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Class updated successfully!" });
  });
});

app.get("/api/get-classes/:teacher_fid", (req, res) => {
  const sql = "SELECT * FROM classes WHERE teacher_fid = ?";
  db.query(sql, [req.params.teacher_fid], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

app.get("/api/class-members/:class_id", (req, res) => {
  const sql = `
    SELECT cm.student_fid as cm_fid, s.student_name, s.student_surname, s.student_username 
    FROM class_members cm
    LEFT JOIN student s ON cm.student_fid = s.student_fid
    WHERE cm.class_id = ?
  `;
  db.query(sql, [req.params.class_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

app.post("/api/add-student-to-class", (req, res) => {
  const { class_id, student_email } = req.body;
  const findStudentSql = "SELECT student_fid FROM student WHERE student_username = ?"; 
  
  db.query(findStudentSql, [student_email], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Student not found with that username" });

    const student_fid = results[0].student_fid;
    const addSql = "INSERT INTO class_members (class_id, student_fid) VALUES (?, ?)";
    
    db.query(addSql, [class_id, student_fid], (err, result) => {
      if (err) return res.status(400).json({ error: "Student already in class or DB error" });
      res.json({ message: "Student added!" });
    });
  });
});

app.post("/api/join-class", (req, res) => {
  const { student_fid, class_code } = req.body;

  const findClassSql = "SELECT class_id FROM classes WHERE class_code = ?";
  db.query(findClassSql, [class_code], (err, classResults) => {
    if (err) return res.status(500).json({ error: "Database error 1" });
    if (classResults.length === 0) return res.status(404).json({ error: "Invalid class code." });
    
    const class_id = classResults[0].class_id;

    const checkDupSql = "SELECT id FROM class_members WHERE class_id = ? AND student_fid = ?";
    db.query(checkDupSql, [class_id, student_fid], (err, dupResults) => {
        if (err) return res.status(500).json({ error: "Database error 2" });
        if (dupResults.length > 0) return res.status(400).json({ error: "You are already in this class!" });

        const checkStudentSql = "SELECT student_fid FROM student WHERE student_fid = ?";
        db.query(checkStudentSql, [student_fid], (err, studentResults) => {
            if (err) return res.status(500).json({ error: "Database error 3" });
            if (studentResults.length === 0) return res.status(404).json({ error: "Your MySQL record is missing. Please re-register." });

            const addSql = "INSERT INTO class_members (class_id, student_fid) VALUES (?, ?)";
            db.query(addSql, [class_id, student_fid], (err, result) => {
              if (err) return res.status(500).json({ error: "Error joining class" });
              res.json({ message: "Successfully joined the class!" });
            });
        });
    });
  });
});

app.delete("/api/remove-student", (req, res) => {
  const { class_id, student_fid } = req.body;
  const sql = "DELETE FROM class_members WHERE class_id = ? AND student_fid = ?";
  db.query(sql, [class_id, student_fid], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "Student removed" });
  });
});

app.delete('/api/delete-game/:game_id', (req, res) => {
    const gameId = req.params.game_id;
    const sqlScores = "DELETE FROM scores WHERE game_id = ?";
    db.query(sqlScores, [gameId], (err1) => {
        if (err1) return res.status(500).json({ error: "Database error" });
        const sqlQuestions = "DELETE FROM game_questions WHERE game_id = ?";
        db.query(sqlQuestions, [gameId], (err2) => {
            if (err2) return res.status(500).json({ error: "Database error" });
            const sqlInstance = "DELETE FROM game_instances WHERE game_id = ?";
            db.query(sqlInstance, [gameId], (err3) => {
                if (err3) return res.status(500).json({ error: "Database error" });
                res.json({ message: "Game deleted successfully" });
            });
        });
    });
});

// --- SCHEDULE MANAGEMENT ROUTES ---
app.put('/api/update-schedule/:game_id', (req, res) => {
    const { open_datetime, close_datetime, time_limit } = req.body;
    const sql = "UPDATE game_instances SET open_datetime = ?, close_datetime = ?, time_limit = ? WHERE game_id = ?";
    db.query(sql, [open_datetime || null, close_datetime || null, time_limit || 0, req.params.game_id], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to update schedule" });
        res.json({ message: "Schedule updated successfully!" });
    });
});

app.put('/api/toggle-activity/:game_id', (req, res) => {
    const { is_active } = req.body;
    const sql = "UPDATE game_instances SET is_active = ? WHERE game_id = ?";
    db.query(sql, [is_active, req.params.game_id], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to toggle activity" });
        res.json({ message: "Activity status updated!" });
    });
});

// --- CORE GAME CREATION ROUTE (Updated) ---
app.post('/api/create-game', (req, res) => {
    const { teacher_fid, class_id, game_type, questions, game_data, open_datetime, close_datetime, time_limit } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type, open_datetime, close_datetime, time_limit) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sqlGame, [teacher_fid, class_id, game_type, open_datetime || null, close_datetime || null, time_limit || 0], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to create game" });
        const newGameId = result.insertId; 

        if (game_data) {
            const sqlConfig = `INSERT INTO game_questions (game_id, question_text, question_type, choice_a, choice_b, choice_c, choice_d, correct_answer) VALUES (?, ?, 'config', '', '', '', '', 0)`;
            db.query(sqlConfig, [newGameId, game_data], (err2) => {
                if (err2) return res.status(500).json({ error: "Failed to save configuration" });
                return res.json({ message: "Game config created successfully!", gameId: newGameId });
            });
            return;
        }
        if (!questions || questions.length === 0) {
            return res.json({ message: "Game instance created successfully!", gameId: newGameId, game_id: newGameId });
        }
        const sqlQuestion = `INSERT INTO game_questions (game_id, question_text, choice_a, choice_b, choice_c, choice_d, correct_answer) VALUES ?`;
        const questionValues = questions.map(q => [newGameId, q.q, q.choices[0] || "", q.choices[1] || "", q.choices[2] || "", q.choices[3] || "", q.correct || 0]);
        db.query(sqlQuestion, [questionValues], (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to save questions" });
            res.json({ message: "Game created successfully!", gameId: newGameId });
        });
    });
});

app.post('/api/add-question', (req, res) => {
    const { game_id, question_text, choice_a, choice_b, choice_c, choice_d, correct_answer } = req.body;
    const sql = `INSERT INTO game_questions (game_id, question_text, choice_a, choice_b, choice_c, choice_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [game_id, question_text, choice_a || "", choice_b || "", choice_c || "", choice_d || "", correct_answer || 0], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to save question" });
        res.json({ message: "Question added successfully!" });
    });
});

// --- SPECIALIZED GAME ROUTES (Updated) ---

app.post('/api/create-adventure', (req, res) => {
    const { teacher_fid, class_id, questions, open_datetime, close_datetime, time_limit } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type, open_datetime, close_datetime, time_limit) VALUES (?, ?, 'adventure', ?, ?, ?)";
    db.query(sqlGame, [teacher_fid, class_id, open_datetime || null, close_datetime || null, time_limit || 0], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to create instance" });
        const newGameId = result.insertId; 
        const questionValues = questions.map(q => {
            let type = q.type; 
            let cA, cB, cC, cD, correct;
            if (type === 'multiple_choice') {
                cA = q.choiceA || ""; 
                cB = q.choiceB || ""; 
                cC = q.choiceC || ""; 
                cD = q.choiceD || "";
                correct = parseInt(q.correctAnswer) || 0; 
            } else if (type === 'true_false') {
                cA = 'True'; cB = 'False'; cC = ""; cD = "";
                correct = parseInt(q.correctAnswer) || 0; 
            } else if (type === 'identification') {
                cA = q.choiceA || ""; cB = ""; cC = ""; cD = "";
                correct = 0; 
            }
            return [newGameId, q.question, type, cA, cB, cC, cD, correct];
        });
        const sqlQuestions = `INSERT INTO game_questions (game_id, question_text, question_type, choice_a, choice_b, choice_c, choice_d, correct_answer) VALUES ?`;
        db.query(sqlQuestions, [questionValues], (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to save questions" });
            res.json({ message: "Adventure created!", gameId: newGameId });
        });
    });
});

app.post('/api/create-word-quest', (req, res) => {
    const { teacher_fid, class_id, questions, open_datetime, close_datetime, time_limit } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type, open_datetime, close_datetime, time_limit) VALUES (?, ?, 'word_quest', ?, ?, ?)";
    db.query(sqlGame, [teacher_fid, class_id, open_datetime || null, close_datetime || null, time_limit || 0], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to create" });
        const newGameId = result.insertId; 
        const questionValues = questions.map(q => {
            const finalCorrect = q.options.indexOf(q.correct) >= 0 ? q.options.indexOf(q.correct) : 0;
            return [newGameId, q.question, 'multiple_choice', q.options[0] || "", q.options[1] || "", q.options[2] || "", q.options[3] || "", finalCorrect];
        });
        const sqlQuestions = `INSERT INTO game_questions (game_id, question_text, question_type, choice_a, choice_b, choice_c, choice_d, correct_answer) VALUES ?`;
        db.query(sqlQuestions, [questionValues], (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to save" });
            res.json({ message: "Word Quest created!", gameId: newGameId });
        });
    });
});

app.post('/api/create-enchanted-forest', (req, res) => {
    const { teacher_fid, class_id, game_data, open_datetime, close_datetime, time_limit } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type, open_datetime, close_datetime, time_limit) VALUES (?, ?, 'enchanted_forest', ?, ?, ?)";
    db.query(sqlGame, [teacher_fid, class_id, open_datetime || null, close_datetime || null, time_limit || 0], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed" });
        const newGameId = result.insertId; 
        const parsedData = JSON.parse(game_data);
        const questionValues = [];
        parsedData.locations.forEach((loc, locIdx) => {
            loc.words.forEach(word => {
                questionValues.push([newGameId, word.hint || "No hint", 'enchanted_forest', word.scrambled || "", locIdx.toString(), 'regular', word.answer || "", 0]);
            });
            loc.bossWords.forEach(word => {
                questionValues.push([newGameId, word.hint || "No hint", 'enchanted_forest', word.scrambled || "", locIdx.toString(), 'boss', word.answer || "", 0]);
            });
        });
        const sqlQuestions = `INSERT INTO game_questions (game_id, question_text, question_type, choice_a, choice_b, choice_c, choice_d, correct_answer) VALUES ?`;
        db.query(sqlQuestions, [questionValues], (err2) => {
            if (err2) return res.status(500).json({ error: "Failed" });
            res.json({ message: "Enchanted Forest created!", gameId: newGameId });
        });
    });
});

app.post('/api/create-whack-a-mole', (req, res) => {
    const { teacher_fid, class_id, questions, open_datetime, close_datetime, time_limit } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type, open_datetime, close_datetime, time_limit) VALUES (?, ?, 'whack_a_mole', ?, ?, ?)";
    db.query(sqlGame, [teacher_fid, class_id, open_datetime || null, close_datetime || null, time_limit || 0], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed" });
        const newGameId = result.insertId; 
        const questionValues = questions.map(q => {
            const optMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
            return [newGameId, q.question_text, 'multiple_choice', q.choice_a || "", q.choice_b || "", q.choice_c || "", q.choice_d || "", optMap[q.correct_option] || 0];
        });
        const sqlQuestions = `INSERT INTO game_questions (game_id, question_text, question_type, choice_a, choice_b, choice_c, choice_d, correct_answer) VALUES ?`;
        db.query(sqlQuestions, [questionValues], (err) => {
            if (err) return res.status(500).json({ error: "Failed" });
            res.json({ message: "Whack-a-Mole created!", gameId: newGameId });
        });
    });
});

app.post('/api/create-startype', (req, res) => {
    const { teacher_fid, class_id, words, open_datetime, close_datetime, time_limit } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type, open_datetime, close_datetime, time_limit) VALUES (?, ?, 'startype', ?, ?, ?)";
    
    db.query(sqlGame, [teacher_fid, class_id, open_datetime || null, close_datetime || null, time_limit || 0], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to create instance" });
        const newGameId = result.insertId; 
        
        const questionValues = words.map(w => {
            return [newGameId, w.word, 'startype', w.difficulty || "Easy", '', '', '', 0];
        });

        const sqlQuestions = `INSERT INTO game_questions (game_id, question_text, question_type, choice_a, choice_b, choice_c, choice_d, correct_answer) VALUES ?`;
        db.query(sqlQuestions, [questionValues], (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to save words" });
            res.json({ message: "StarType created!", gameId: newGameId });
        });
    });
});

// ==========================================
// 5. RESTORED: STATS & ANSWER TRACKING ROUTES
// ==========================================

app.post('/api/save-answers', (req, res) => {
    const { answers } = req.body; 
    if (!answers || answers.length === 0) return res.json({ message: "No answers to save." });
    const sql = "INSERT INTO student_answers (student_fid, game_id, question_id, is_correct) VALUES ?";
    const values = answers.map(a => [a.student_fid, a.game_id, a.question_id, a.is_correct]);
    db.query(sql, [values], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "Answers saved successfully!" });
    });
});

app.get('/api/item-analysis/:game_id', (req, res) => {
    const gameId = req.params.game_id;
    const sql = `
        SELECT q.id as question_id, q.question_text,
               SUM(CASE WHEN sa.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
               SUM(CASE WHEN sa.is_correct = 0 THEN 1 ELSE 0 END) as wrong_count
        FROM game_questions q
        LEFT JOIN student_answers sa ON q.id = sa.question_id
        WHERE q.game_id = ?
        GROUP BY q.id`;
    db.query(sql, [gameId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// ==========================================
// 6. GRADEBOOK, SCORES, AND LEADERBOARD
// ==========================================

app.get('/api/get-teacher-classes/:teacher_fid', (req, res) => {
    const query = "SELECT class_id as id, class_name as name FROM classes WHERE teacher_fid = ?";
    db.query(query, [req.params.teacher_fid], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.get('/api/get-games/:teacher_fid', (req, res) => {
    const sql = `SELECT g.game_id, g.game_type, g.created_at, g.open_datetime, g.close_datetime, g.time_limit, g.is_active, c.class_name, c.class_id FROM game_instances g JOIN classes c ON g.class_id = c.class_id WHERE g.teacher_fid = ? ORDER BY g.created_at DESC`;
    db.query(sql, [req.params.teacher_fid], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.get('/api/gradebook/:game_id', (req, res) => {
    const gameId = req.params.game_id;
    const sql = `
        SELECT s.student_fid, s.student_name, s.student_surname, sc.score as raw_score, sc.time_taken,
               (SELECT COUNT(*) FROM game_questions WHERE game_id = ?) as total_items
        FROM class_members cm
        JOIN student s ON cm.student_fid = s.student_fid
        LEFT JOIN scores sc ON s.student_fid = sc.student_fid AND sc.game_id = ?
        WHERE cm.class_id = (SELECT class_id FROM game_instances WHERE game_id = ?)
        ORDER BY s.student_surname ASC`;
    db.query(sql, [gameId, gameId, gameId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// 🟢 UPDATED: Pulls schedule info for StudentMenu
app.get('/api/student-games/:student_fid', (req, res) => {
    const sql = `
        SELECT c.class_name, c.class_id, t.teacher_name, t.teacher_surname, g.game_id, g.game_type, g.created_at, g.open_datetime, g.close_datetime, g.time_limit, g.is_active, sc.score as raw_score, sc.time_taken,
               (SELECT COUNT(*) FROM game_questions WHERE game_id = g.game_id) as total_items
        FROM class_members cm
        LEFT JOIN classes c ON cm.class_id = c.class_id
        LEFT JOIN teacher t ON c.teacher_fid = t.teacher_fid
        LEFT JOIN game_instances g ON c.class_id = g.class_id
        LEFT JOIN scores sc ON sc.game_id = g.game_id AND sc.student_fid = cm.student_fid
        WHERE cm.student_fid = ?
        ORDER BY c.class_name ASC, g.created_at DESC`;
    db.query(sql, [req.params.student_fid], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.get('/api/game-questions/:game_id', (req, res) => {
    db.query(`SELECT * FROM game_questions WHERE game_id = ?`, [req.params.game_id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.post('/api/save-score', (req, res) => {
    const { student_fid, game_id, score, time_taken } = req.body;
    const sql = "INSERT INTO scores (student_fid, game_id, score, time_taken) VALUES (?, ?, ?, ?)";
    db.query(sql, [student_fid, game_id, score, time_taken], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "Score saved!" });
    });
});

app.get('/api/leaderboard/:game_id', (req, res) => {
    const sql = `SELECT s.student_name, s.student_surname, sc.score, sc.time_taken FROM scores sc JOIN student s ON sc.student_fid = s.student_fid WHERE sc.game_id = ? ORDER BY sc.score DESC, sc.time_taken ASC LIMIT 50`;
    db.query(sql, [req.params.game_id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// --- RESTORED: FULL CLASS DELETION ---
app.delete("/api/delete-class/:class_id", (req, res) => {
  const classId = req.params.class_id;

  const delAnswers = "DELETE FROM student_answers WHERE game_id IN (SELECT game_id FROM game_instances WHERE class_id = ?)";
  const delScores = "DELETE FROM scores WHERE game_id IN (SELECT game_id FROM game_instances WHERE class_id = ?)";
  const delQuestions = "DELETE FROM game_questions WHERE game_id IN (SELECT game_id FROM game_instances WHERE class_id = ?)";
  const delGames = "DELETE FROM game_instances WHERE class_id = ?";
  const delMembers = "DELETE FROM class_members WHERE class_id = ?";
  const delClass = "DELETE FROM classes WHERE class_id = ?";

  db.query(delAnswers, [classId], () => {
    db.query(delScores, [classId], (err1) => {
      if (err1) return res.status(500).json({ error: "Failed to delete scores" });
      db.query(delQuestions, [classId], (err2) => {
        if (err2) return res.status(500).json({ error: "Failed to delete questions" });
        db.query(delGames, [classId], (err3) => {
          if (err3) return res.status(500).json({ error: "Failed to delete games" });
          db.query(delMembers, [classId], (err4) => {
            if (err4) return res.status(500).json({ error: "Failed to delete members" });
            db.query(delClass, [classId], (err5) => {
              if (err5) return res.status(500).json({ error: "Failed to delete class" });
              res.json({ message: "Class completely deleted!" });
            });
          });
        });
      });
    });
  });
});

// --- DELETE USER ACCOUNT ---
app.delete('/api/delete-user', (req, res) => {
    const { uid, role } = req.body;
    
    // Depending on the role, delete from the correct table. 
    const sql = role === 'teacher' 
        ? "DELETE FROM teacher WHERE teacher_fid = ?" 
        : "DELETE FROM student WHERE student_fid = ?";

    db.query(sql, [uid], (err, result) => {
        if (err) {
            console.error("Error deleting user from DB:", err);
            return res.status(500).json({ error: "Database error during deletion." });
        }
        res.json({ message: "User data wiped from MySQL successfully." });
    });
});

// A dedicated route just to keep Render and Aiven awake
app.get('/keep-alive', (req, res) => {
    // A super simple, lightweight query to wake up Aiven via the pool
    db.query('SELECT 1', (err, result) => {
        if (err) {
            console.error("Keep-alive error:", err);
            return res.status(500).json({ error: "Database sleep error" });
        }
        res.status(200).json({ status: "Render and Aiven are awake!" });
    });
});

app.get('/api/admin/backup', (req, res) => {
    // 1. Grab all registered users
    const sqlUsers = `
        SELECT 'Student' as role, student_name as name, student_username as username FROM student
        UNION
        SELECT 'Teacher' as role, teacher_name as name, teacher_username as username FROM teacher
    `;
    
    db.query(sqlUsers, (err, users) => {
        if (err) return res.status(500).json({ error: "Failed to backup users" });
        
        // 2. Grab all scores
        db.query("SELECT * FROM scores", (err, scores) => {
             if (err) return res.status(500).json({ error: "Failed to backup scores" });
             
             // 3. Package it all together
             const backupData = {
                 backupDate: new Date().toLocaleString(),
                 system: "ARCADS Gamified LMS",
                 total_accounts: users.length,
                 total_scores_recorded: scores.length,
                 accounts: users,
                 scores: scores
             };

             // 4. Tell the browser to download this as a file
             res.setHeader('Content-Type', 'application/json');
             res.setHeader('Content-Disposition', 'attachment; filename=arcads_database_backup.json');
             res.send(JSON.stringify(backupData, null, 2));
        });
    });
});

// 🟢 NEW: MASSIVE ADMIN DASHBOARD DATA ROUTE
app.get('/api/admin/dashboard-data', (req, res) => {
    const sqlStats = "SELECT (SELECT COUNT(*) FROM student) as students, (SELECT COUNT(*) FROM teacher) as teachers, (SELECT COUNT(*) FROM game_instances) as games";

    const sqlUsers = `
        SELECT student_fid as uid, 'Student' as role, student_username as username FROM student
        UNION
        SELECT teacher_fid as uid, 'Teacher' as role, teacher_username as username FROM teacher
    `;

    const sqlClasses = "SELECT class_id, class_name, class_code FROM classes ORDER BY created_at DESC";

    const sqlLogs = "SELECT played_at as activity_timestamp, student_fid, CONCAT('Completed a game with score: ', score) as activity_type FROM scores ORDER BY played_at DESC LIMIT 15";

    // 🟢 NEW: Query to count the most popular game types for the graph
    const sqlGameStats = "SELECT game_type, COUNT(*) as count FROM game_instances GROUP BY game_type ORDER BY count DESC";

    db.query(sqlStats, (err1, statsResult) => {
        if (err1) return res.status(500).json({ error: "Database error 1" });

        db.query(sqlUsers, (err2, usersResult) => {
            if (err2) return res.status(500).json({ error: "Database error 2" });

            db.query(sqlClasses, (err3, classesResult) => {
                if (err3) return res.status(500).json({ error: "Database error 3" });

                db.query(sqlLogs, (err4, logsResult) => {
                    if (err4) return res.status(500).json({ error: "Database error 4" });

                    // 🟢 Execute the graph query
                    db.query(sqlGameStats, (err5, gameStatsResult) => {
                        if (err5) return res.status(500).json({ error: "Database error 5" });

                        res.json({
                            stats: statsResult[0],
                            users: usersResult,
                            classes: classesResult,
                            logs: logsResult,
                            gameStats: gameStatsResult // Send graph data to React
                        });
                    });
                });
            });
        });
    });
});

// 🟢 Updated Port for Cloud Deployment
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});