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
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Error saving teacher" });
    }
    return res.status(200).json({ message: "Teacher registered!" });
  });
});

app.post("/api/student-signup", (req, res) => {
  const { uid, name, surname, username } = req.body;
  const sql = "INSERT INTO student (student_fid, student_name, student_surname, student_username) VALUES (?, ?, ?, ?)";
  
  db.query(sql, [uid, name, surname, username], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Error saving student" });
    }
    return res.status(200).json({ message: "Student registered!" });
  });
});

app.get("/api/check-teacher/:uid", (req, res) => {
  const uid = req.params.uid;
  const sql = "SELECT * FROM teacher WHERE teacher_fid = ?"; 
  
  db.query(sql, [uid], (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (results.length > 0) {
      return res.status(200).json({ isTeacher: true, teacher: results[0] });
    } else {
      return res.status(200).json({ isTeacher: false });
    }
  });
});

app.get("/api/check-student/:uid", (req, res) => {
  const uid = req.params.uid;
  const sql = "SELECT * FROM student WHERE student_fid = ?"; 
  
  db.query(sql, [uid], (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (results.length > 0) {
      return res.status(200).json({ isStudent: true, student: results[0] });
    } else {
      return res.status(200).json({ isStudent: false });
    }
  });
});

app.put("/api/update-username", (req, res) => {
  const { uid, role, newUsername } = req.body;
  
  let sql = "";
  if (role === 'teacher') {
    sql = "UPDATE teacher SET teacher_username = ? WHERE teacher_fid = ?";
  } else if (role === 'student') {
    sql = "UPDATE student SET student_username = ? WHERE student_fid = ?";
  } else {
    return res.status(400).json({ error: "Invalid role" });
  }

  db.query(sql, [newUsername, uid], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Error updating database" });
    }
    return res.status(200).json({ message: "Username updated!" });
  });
});

app.get("/api/get-teacher/:id", (req, res) => {
  const teacherId = req.params.id;
  const sql = "SELECT teacher_name, teacher_surname FROM teacher WHERE id_teacher = ?";
  
  db.query(sql, [teacherId], (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (results.length > 0) {
      return res.status(200).json({ found: true, teacher: results[0] });
    } else {
      return res.status(200).json({ found: false });
    }
  });
});

app.post("/api/check-username-availability", (req, res) => {
  const { username, role } = req.body;
  
  let sql = "";
  if (role === 'teacher') {
    sql = "SELECT * FROM teacher WHERE teacher_username = ?";
  } else if (role === 'student') {
    sql = "SELECT * FROM student WHERE student_username = ?";
  } else {
    return res.status(400).json({ error: "Invalid role" });
  }

  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      return res.json({ available: false });
    } else {
      return res.json({ available: true });
    }
  });
});

// --- CLASS ROUTES ---

app.post("/api/create-class", (req, res) => {
  const { teacher_fid, class_name } = req.body;
  // Make sure to validate input
  if (!teacher_fid || !class_name) return res.status(400).json({error: "Missing fields"});

  const sql = "INSERT INTO classes (teacher_fid, class_name) VALUES (?, ?)";
  db.query(sql, [teacher_fid, class_name], (err, result) => {
    if (err) {
        console.error("Create Class Error:", err);
        return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Class created!", classId: result.insertId });
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
    SELECT s.student_name, s.student_surname, s.student_username, s.student_fid 
    FROM class_members cm
    JOIN student s ON cm.student_fid = s.student_fid
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
      if (err) {
        if(err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "Student already in class" });
        return res.status(500).json({ error: "Error adding student" });
      }
      res.json({ message: "Student added!" });
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

// --- GAME ROUTES ---

app.post('/api/create-game', (req, res) => {
    const { teacher_fid, class_id, game_type, questions } = req.body;

    // 1. Insert the Game Instance first
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type) VALUES (?, ?, ?)";
    
    db.query(sqlGame, [teacher_fid, class_id, game_type], (err, result) => {
        if (err) {
            console.error("Error creating game instance:", err);
            return res.status(500).json({ error: "Failed to create game" });
        }

        const newGameId = result.insertId; 
        console.log("Game created with ID:", newGameId);

        // 2. Insert the Questions
        const sqlQuestion = `
            INSERT INTO game_questions 
            (game_id, question_text, choice_a, choice_b, choice_c, choice_d, correct_answer) 
            VALUES ?
        `;

        const questionValues = questions.map(q => [
            newGameId,
            q.q,
            q.choices[0],
            q.choices[1],
            q.choices[2],
            q.choices[3],
            q.correct
        ]);

        db.query(sqlQuestion, [questionValues], (err, result) => {
            if (err) {
                console.error("Error saving questions:", err);
                return res.status(500).json({ error: "Failed to save questions" });
            }
            
            res.json({ message: "Game created successfully!", gameId: newGameId });
        });
    });
});

// --- UPDATED ROUTE ---
app.get('/api/get-teacher-classes/:teacher_fid', (req, res) => {
    const teacherId = req.params.teacher_fid;

    // FIX: Using alias so frontend receives 'id' and 'name'
    // This assumes your table columns are 'class_id' and 'class_name'
    const query = "SELECT class_id as id, class_name as name FROM classes WHERE teacher_fid = ?";

    db.query(query, [teacherId], (err, results) => {
        if (err) {
            console.error("Error fetching classes:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// --- GET GAMES ROUTE ---
app.get('/api/get-games/:teacher_fid', (req, res) => {
    const teacherId = req.params.teacher_fid;
    
    // Join with classes table to get the Class Name (e.g., "IT Elective 3")
    const sql = `
        SELECT g.game_id, g.game_type, g.created_at, c.class_name 
        FROM game_instances g
        JOIN classes c ON g.class_id = c.class_id
        WHERE g.teacher_fid = ?
        ORDER BY g.created_at DESC
    `;

    db.query(sql, [teacherId], (err, results) => {
        if (err) {
            console.error("Error fetching games:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

app.get('/api/student-games/:student_fid', (req, res) => {
    const studentId = req.params.student_fid;
    
    const sql = `
        SELECT g.game_id, g.game_type, g.created_at, c.class_name, t.teacher_name, t.teacher_surname
        FROM class_members cm
        JOIN game_instances g ON cm.class_id = g.class_id
        JOIN classes c ON g.class_id = c.class_id
        JOIN teacher t ON g.teacher_fid = t.teacher_fid
        WHERE cm.student_fid = ?
        ORDER BY g.created_at DESC
    `;

    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Error fetching student games:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});
app.get('/api/game-questions/:game_id', (req, res) => {
    const gameId = req.params.game_id;
    
    const sql = `
        SELECT * FROM game_questions 
        WHERE game_id = ?
    `;

    db.query(sql, [gameId], (err, results) => {
        if (err) {
            console.error("Error fetching questions:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});
// --- SAVE SCORE ROUTE (Updated for 'scores' table) ---
app.post('/api/save-score', (req, res) => {
    const { student_fid, game_id, score, time_taken } = req.body;

    // We changed 'game_scores' to 'scores' to match your existing table
    const sql = "INSERT INTO scores (student_fid, game_id, score, time_taken) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [student_fid, game_id, score, time_taken], (err, result) => {
        if (err) {
            console.error("Error saving score:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Score saved!" });
    });
});
app.get('/api/leaderboard/:game_id', (req, res) => {
    const gameId = req.params.game_id;

    // Join 'scores' with 'student' to get names
    // Order by Score (Highest) first, then Time (Lowest/Fastest) second
    const sql = `
        SELECT s.student_name, s.student_surname, sc.score, sc.time_taken
        FROM scores sc
        JOIN student s ON sc.student_fid = s.student_fid
        WHERE sc.game_id = ?
        ORDER BY sc.score DESC, sc.time_taken ASC
        LIMIT 50
    `;

    db.query(sql, [gameId], (err, results) => {
        if (err) {
            console.error("Leaderboard error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});
app.listen(8081, () => {
  console.log("Backend server is running on http://localhost:8081");
});