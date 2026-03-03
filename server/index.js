// server/index.js
import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Kwekkwek100%", 
  database: "arcads_dbs"
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

// --- GAME ROUTES ---

app.post('/api/create-game', (req, res) => {
    const { teacher_fid, class_id, game_type, questions } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type) VALUES (?, ?, ?)";
    
    db.query(sqlGame, [teacher_fid, class_id, game_type], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to create game" });

        const newGameId = result.insertId; 
        const sqlQuestion = `INSERT INTO game_questions (game_id, question_text, choice_a, choice_b, choice_c, choice_d, correct_answer) VALUES ?`;

        const questionValues = questions.map(q => [newGameId, q.q, q.choices[0], q.choices[1], q.choices[2], q.choices[3], q.correct]);

        db.query(sqlQuestion, [questionValues], (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to save questions" });
            res.json({ message: "Game created successfully!", gameId: newGameId });
        });
    });
});

app.get('/api/get-teacher-classes/:teacher_fid', (req, res) => {
    const query = "SELECT class_id as id, class_name as name FROM classes WHERE teacher_fid = ?";
    db.query(query, [req.params.teacher_fid], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.get('/api/get-games/:teacher_fid', (req, res) => {
    const sql = `
        SELECT g.game_id, g.game_type, g.created_at, c.class_name, c.class_id 
        FROM game_instances g
        JOIN classes c ON g.class_id = c.class_id
        WHERE g.teacher_fid = ?
        ORDER BY g.created_at DESC
    `;
    db.query(sql, [req.params.teacher_fid], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.get('/api/gradebook/:game_id', (req, res) => {
    const gameId = req.params.game_id;
    const sql = `
        SELECT
            s.student_fid, s.student_name, s.student_surname,
            sc.score as raw_score, sc.time_taken,
            (SELECT COUNT(*) FROM game_questions WHERE game_id = ?) as total_items
        FROM class_members cm
        JOIN student s ON cm.student_fid = s.student_fid
        LEFT JOIN scores sc ON s.student_fid = sc.student_fid AND sc.game_id = ?
        WHERE cm.class_id = (SELECT class_id FROM game_instances WHERE game_id = ?)
        ORDER BY s.student_surname ASC, s.student_name ASC
    `;
    db.query(sql, [gameId, gameId, gameId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.get('/api/student-games/:student_fid', (req, res) => {
    const studentFid = req.params.student_fid;
    const sql = `
        SELECT 
            c.class_name, c.class_id, 
            t.teacher_name, t.teacher_surname, 
            g.game_id, g.game_type, g.created_at,
            sc.score as raw_score, sc.time_taken,
            (SELECT COUNT(*) FROM game_questions WHERE game_id = g.game_id) as total_items
        FROM class_members cm
        LEFT JOIN classes c ON cm.class_id = c.class_id
        LEFT JOIN teacher t ON c.teacher_fid = t.teacher_fid
        LEFT JOIN game_instances g ON c.class_id = g.class_id
        LEFT JOIN scores sc ON sc.game_id = g.game_id AND sc.student_fid = cm.student_fid
        WHERE cm.student_fid = ?
        ORDER BY c.class_name ASC, g.created_at DESC
    `;
    db.query(sql, [studentFid], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.get('/api/game-questions/:game_id', (req, res) => {
    const sql = `SELECT * FROM game_questions WHERE game_id = ?`;
    db.query(sql, [req.params.game_id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// --- NEW ROUTE: SAVE INDIVIDUAL ANSWERS ---
app.post('/api/save-answers', (req, res) => {
    const { answers } = req.body; 
    // answers should be an array of objects: [{ student_fid, game_id, question_id, is_correct }]
    if (!answers || answers.length === 0) return res.json({ message: "No answers to save." });

    const sql = "INSERT INTO student_answers (student_fid, game_id, question_id, is_correct) VALUES ?";
    const values = answers.map(a => [a.student_fid, a.game_id, a.question_id, a.is_correct]);

    db.query(sql, [values], (err, result) => {
        if (err) {
            console.error("Error saving item answers:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Answers saved successfully!" });
    });
});

// --- NEW ROUTE: FETCH ITEM ANALYSIS ---
app.get('/api/item-analysis/:game_id', (req, res) => {
    const gameId = req.params.game_id;
    const sql = `
        SELECT 
            q.id as question_id,
            q.question_text,
            SUM(CASE WHEN sa.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
            SUM(CASE WHEN sa.is_correct = 0 THEN 1 ELSE 0 END) as wrong_count
        FROM game_questions q
        LEFT JOIN student_answers sa ON q.id = sa.question_id
        WHERE q.game_id = ?
        GROUP BY q.id
    `;
    db.query(sql, [gameId], (err, results) => {
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
    const sql = `
        SELECT s.student_name, s.student_surname, sc.score, sc.time_taken
        FROM scores sc
        JOIN student s ON sc.student_fid = s.student_fid
        WHERE sc.game_id = ?
        ORDER BY sc.score DESC, sc.time_taken ASC
        LIMIT 50
    `;
    db.query(sql, [req.params.game_id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.listen(8081, () => {
  console.log("Backend server is running on http://localhost:8081");
});