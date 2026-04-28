import express from "express";
import mysql from "mysql2"; 
import cors from "cors";
import dotenv from "dotenv"; 
import ExcelJS from "exceljs"; // 🟢 NEW: Added for Excel generation

dotenv.config(); 

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false 
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true,
  timezone: '+08:00'
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database Pool Connection Failed:", err.message);
  } else {
    console.log("✅ Connected securely to AIVEN via Pool!");
    
    const createLocksTable = `
      CREATE TABLE IF NOT EXISTS student_game_locks (
          game_id INT,
          student_fid VARCHAR(255),
          PRIMARY KEY (game_id, student_fid)
      )`;
    connection.query(createLocksTable, (err) => {
        if (err) console.error("Failed to ensure student_game_locks table:", err.message);
        else console.log("✅ student_game_locks table ready.");
    });

    connection.release(); 
  }
});

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

app.post('/api/create-game', (req, res) => {
    const { teacher_fid, class_id, game_type, custom_title, questions, game_data, open_datetime, close_datetime, time_limit } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type, custom_title, open_datetime, close_datetime, time_limit) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sqlGame, [teacher_fid, class_id, game_type, custom_title || null, open_datetime || null, close_datetime || null, time_limit || 0], (err, result) => {
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

app.post('/api/create-adventure', (req, res) => {
    const { teacher_fid, class_id, custom_title, questions, open_datetime, close_datetime, time_limit } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type, custom_title, open_datetime, close_datetime, time_limit) VALUES (?, ?, 'adventure', ?, ?, ?, ?)";
    db.query(sqlGame, [teacher_fid, class_id, custom_title || null, open_datetime || null, close_datetime || null, time_limit || 0], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to create instance" });
        const newGameId = result.insertId; 
        const questionValues = questions.map(q => {
            let type = q.type; 
            let cA, cB, cC, cD, correct;
            if (type === 'multiple_choice') {
                cA = q.choiceA || ""; cB = q.choiceB || ""; cC = q.choiceC || ""; cD = q.choiceD || "";
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
    const { teacher_fid, class_id, custom_title, questions, open_datetime, close_datetime, time_limit } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type, custom_title, open_datetime, close_datetime, time_limit) VALUES (?, ?, 'word_quest', ?, ?, ?, ?)";
    db.query(sqlGame, [teacher_fid, class_id, custom_title || null, open_datetime || null, close_datetime || null, time_limit || 0], (err, result) => {
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
// 🟢 NEW: EXPORT CLASS PERFORMANCE TO EXCEL ROUTE
app.get('/api/export-class-performance/:class_id', (req, res) => {
    const classId = req.params.class_id;
    const sortMode = req.query.sort || 'alphabetical';
    const className = req.query.className || 'Unknown Class';

    // 1. Get total items
    const sqlTotalItems = `
        SELECT COUNT(*) as total_items 
        FROM game_questions 
        WHERE game_id IN (SELECT game_id FROM game_instances WHERE class_id = ?)`;

    // 2. Get student scores
    const sqlStudentScores = `
        SELECT s.student_fid, s.student_name, s.student_surname,
               COUNT(DISTINCT sc.game_id) as games_played,
               SUM(sc.score) as accumulated_score
        FROM class_members cm
        JOIN student s ON cm.student_fid = s.student_fid
        LEFT JOIN scores sc ON cm.student_fid = sc.student_fid
             AND sc.game_id IN (SELECT game_id FROM game_instances WHERE class_id = ?)
        WHERE cm.class_id = ?
        GROUP BY s.student_fid`;

    db.query(sqlTotalItems, [classId], (err, itemsResult) => {
        if (err) return res.status(500).json({ error: "Database error fetching total items" });
        const classTotalItems = itemsResult[0].total_items || 0;

        db.query(sqlStudentScores, [classId, classId], async (err2, studentsResult) => {
            if (err2) return res.status(500).json({ error: "Database error fetching scores" });

            let formatted = studentsResult.map(student => {
                const score = student.accumulated_score || 0;
                let accuracy = 0;
                let grade = 0;
                let descriptor = "No Data";

                if (classTotalItems > 0 && student.games_played > 0) {
                    accuracy = (score / classTotalItems) * 100;
                    grade = Math.round((score / classTotalItems) * 50 + 50); 
                    
                    if (grade >= 90) descriptor = "Outstanding (O)";
                    else if (grade >= 85) descriptor = "Very Satisfactory (VS)";
                    else if (grade >= 80) descriptor = "Satisfactory (S)";
                    else if (grade >= 75) descriptor = "Fairly Satisfactory (FS)";
                    else descriptor = "Did Not Meet Expectations (DNME)";
                }
                return { ...student, accuracy, grade, descriptor };
            });

            // Apply Sorting
            if (sortMode === 'alphabetical') {
                formatted.sort((a, b) => (a.student_surname || "").localeCompare(b.student_surname || ""));
            } else if (sortMode === 'best') {
                formatted.sort((a, b) => b.grade - a.grade);
            } else if (sortMode === 'worst') {
                formatted.sort((a, b) => a.grade - b.grade);
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Class Performance');

            // Header block
            worksheet.addRow(['CLASS OVERALL PERFORMANCE']);
            worksheet.addRow(['CLASS NAME:', className]);
            worksheet.addRow([]);

            worksheet.getCell('A1').font = { bold: true, size: 14 };
            worksheet.getCell('A2').font = { bold: true };

            const headerRow = worksheet.addRow(['No.', 'Last Name', 'First Name', 'Games Played', 'Total Score', 'Accuracy', 'Final Grade', 'DepEd Descriptor']);
            headerRow.font = { bold: true };
            headerRow.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFD9E1F2'} };

            worksheet.columns = [
                { key: 'no', width: 5 },
                { key: 'last_name', width: 20 },
                { key: 'first_name', width: 20 },
                { key: 'games', width: 15 },
                { key: 'score', width: 15 },
                { key: 'accuracy', width: 12 },
                { key: 'grade', width: 15 },
                { key: 'descriptor', width: 35 }
            ];

            formatted.forEach((s, i) => {
                worksheet.addRow({
                    no: i + 1,
                    last_name: s.student_surname,
                    first_name: s.student_name,
                    games: s.games_played,
                    score: s.games_played > 0 ? `${s.accumulated_score || 0} / ${classTotalItems}` : '-',
                    accuracy: s.accuracy > 0 ? `${s.accuracy.toFixed(1)}%` : '-',
                    grade: s.grade > 0 ? `${s.grade}%` : '-',
                    descriptor: s.descriptor
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Class_Performance_${classId}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        });
    });
});

app.post('/api/create-enchanted-forest', (req, res) => {
    const { teacher_fid, class_id, custom_title, game_data, open_datetime, close_datetime, time_limit } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type, custom_title, open_datetime, close_datetime, time_limit) VALUES (?, ?, 'enchanted_forest', ?, ?, ?, ?)";
    db.query(sqlGame, [teacher_fid, class_id, custom_title || null, open_datetime || null, close_datetime || null, time_limit || 0], (err, result) => {
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
    const { teacher_fid, class_id, custom_title, questions, open_datetime, close_datetime, time_limit } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type, custom_title, open_datetime, close_datetime, time_limit) VALUES (?, ?, 'whack_a_mole', ?, ?, ?, ?)";
    db.query(sqlGame, [teacher_fid, class_id, custom_title || null, open_datetime || null, close_datetime || null, time_limit || 0], (err, result) => {
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
    const { teacher_fid, class_id, custom_title, words, open_datetime, close_datetime, time_limit } = req.body;
    const sqlGame = "INSERT INTO game_instances (teacher_fid, class_id, game_type, custom_title, open_datetime, close_datetime, time_limit) VALUES (?, ?, 'startype', ?, ?, ?, ?)";
    db.query(sqlGame, [teacher_fid, class_id, custom_title || null, open_datetime || null, close_datetime || null, time_limit || 0], (err, result) => {
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

app.post('/api/duplicate-game', (req, res) => {
    const { original_game_id, new_class_id, teacher_fid } = req.body;
    if (!original_game_id || !new_class_id || !teacher_fid) return res.status(400).json({ error: "Missing required fields" });
    const fetchGameSql = "SELECT game_type, custom_title, open_datetime, close_datetime, time_limit FROM game_instances WHERE game_id = ?";
    db.query(fetchGameSql, [original_game_id], (err, gameResults) => {
        if (err) return res.status(500).json({ error: "Database error fetching original game" });
        if (gameResults.length === 0) return res.status(404).json({ error: "Original activity not found" });
        const game = gameResults[0];
        const insertGameSql = "INSERT INTO game_instances (teacher_fid, class_id, game_type, custom_title, open_datetime, close_datetime, time_limit) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.query(insertGameSql, [teacher_fid, new_class_id, game.game_type, game.custom_title, game.open_datetime, game.close_datetime, game.time_limit], (err2, insertResult) => {
            if (err2) return res.status(500).json({ error: "Database error creating new game instance" });
            const newGameId = insertResult.insertId;
            const fetchQuestionsSql = "SELECT question_text, question_type, choice_a, choice_b, choice_c, choice_d, correct_answer FROM game_questions WHERE game_id = ?";
            db.query(fetchQuestionsSql, [original_game_id], (err3, questionsResult) => {
                if (err3) return res.status(500).json({ error: "Database error fetching original questions" });
                if (questionsResult.length === 0) return res.json({ message: "Activity duplicated (no questions to copy)!", gameId: newGameId });
                const insertQuestionsSql = "INSERT INTO game_questions (game_id, question_text, question_type, choice_a, choice_b, choice_c, choice_d, correct_answer) VALUES ?";
                const questionValues = questionsResult.map(q => [newGameId, q.question_text, q.question_type, q.choice_a, q.choice_b, q.choice_c, q.choice_d, q.correct_answer]);
                db.query(insertQuestionsSql, [questionValues], (err4) => {
                    if (err4) return res.status(500).json({ error: "Database error copying questions" });
                    return res.json({ message: "Activity successfully duplicated and assigned!", gameId: newGameId });
                });
            });
        });
    });
});

app.delete('/api/reset-student-attempt', (req, res) => {
    const { game_id, student_fid } = req.body;
    if (!game_id || !student_fid) return res.status(400).json({ error: "Missing game_id or student_fid" });
    const deleteAnswersSql = "DELETE FROM student_answers WHERE game_id = ? AND student_fid = ?";
    db.query(deleteAnswersSql, [game_id, student_fid], (err1) => {
        if (err1) return res.status(500).json({ error: "Failed to clear student answers" });
        const deleteScoreSql = "DELETE FROM scores WHERE game_id = ? AND student_fid = ?";
        db.query(deleteScoreSql, [game_id, student_fid], (err2) => {
            if (err2) return res.status(500).json({ error: "Failed to clear student score" });
            res.json({ message: "Student attempt successfully reset!" });
        });
    });
});

app.post('/api/toggle-student-lock', (req, res) => {
    const { game_id, student_fid, lock_status } = req.body;
    if (lock_status) {
        const sql = "INSERT IGNORE INTO student_game_locks (game_id, student_fid) VALUES (?, ?)";
        db.query(sql, [game_id, student_fid], (err) => {
            if (err) return res.status(500).json({ error: "Failed to lock student" });
            res.json({ message: "Student locked out." });
        });
    } else {
        const sql = "DELETE FROM student_game_locks WHERE game_id = ? AND student_fid = ?";
        db.query(sql, [game_id, student_fid], (err) => {
            if (err) return res.status(500).json({ error: "Failed to unlock student" });
            res.json({ message: "Student unlocked." });
        });
    }
});

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

// 🟢 UPDATED: Item Analysis Data Logic (with dynamic sorting built in)
// 🟢 UPDATED: Item Analysis Data Logic (Now includes Mean, Max, Min, and Participants)
app.get('/api/item-analysis/:game_id', (req, res) => {
    const gameId = req.params.game_id;
    const sortMode = req.query.sort || 'numerical'; 

    const sqlItems = `
        SELECT q.id as question_id, q.question_text,
               SUM(CASE WHEN sa.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
               SUM(CASE WHEN sa.is_correct = 0 THEN 1 ELSE 0 END) as wrong_count
        FROM game_questions q
        LEFT JOIN student_answers sa ON q.id = sa.question_id
        WHERE q.game_id = ?
        GROUP BY q.id`;

    // 🟢 NEW: Query to grab the DepEd Header metrics
    const sqlSummary = `
        SELECT 
            COUNT(student_fid) as total_participants,
            AVG(score) as mean_score,
            MAX(score) as highest_score,
            MIN(score) as lowest_score
        FROM scores
        WHERE game_id = ?`;
        
    db.query(sqlItems, [gameId], (err, itemsResult) => {
        if (err) return res.status(500).json({ error: "Database error on items" });

        db.query(sqlSummary, [gameId], (err2, summaryResult) => {
            if (err2) return res.status(500).json({ error: "Database error on summary" });

            let formattedItems = itemsResult.map(row => {
                const total = parseInt(row.correct_count || 0) + parseInt(row.wrong_count || 0);
                const accuracy = total > 0 ? (parseInt(row.correct_count) / total) * 100 : 0;
                return { ...row, accuracy_percentage: accuracy, total_answers: total };
            });

            if (sortMode === 'least_correct') {
                formattedItems.sort((a, b) => a.accuracy_percentage - b.accuracy_percentage);
            } else if (sortMode === 'best_correct') {
                formattedItems.sort((a, b) => b.accuracy_percentage - a.accuracy_percentage);
            }

            // Return BOTH the summary stats and the item data
            res.json({
                summary: summaryResult[0],
                items: formattedItems
            });
        });
    });
});

// 🟢 UPDATED: EXPORT ITEM ANALYSIS TO EXCEL (With DepEd Header Layout)
app.get('/api/export-item-analysis/:game_id', (req, res) => {
    const gameId = req.params.game_id;
    const sortMode = req.query.sort || 'numerical';
    const className = req.query.className || 'Unknown Class';
    const activityName = req.query.activityName || 'Unknown Activity';

    const sqlItems = `
        SELECT q.id as question_id, q.question_text,
               SUM(CASE WHEN sa.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
               SUM(CASE WHEN sa.is_correct = 0 THEN 1 ELSE 0 END) as wrong_count
        FROM game_questions q
        LEFT JOIN student_answers sa ON q.id = sa.question_id
        WHERE q.game_id = ?
        GROUP BY q.id`;

    const sqlSummary = `
        SELECT 
            COUNT(student_fid) as total_participants,
            AVG(score) as mean_score,
            MAX(score) as highest_score,
            MIN(score) as lowest_score
        FROM scores
        WHERE game_id = ?`;

    db.query(sqlItems, [gameId], async (err, itemsResult) => {
        if (err) return res.status(500).json({ error: "Database error" });

        db.query(sqlSummary, [gameId], async (err2, summaryResult) => {
            if (err2) return res.status(500).json({ error: "Database error" });

            let formatted = itemsResult.map(row => {
                const total = parseInt(row.correct_count || 0) + parseInt(row.wrong_count || 0);
                const accuracy = total > 0 ? (parseInt(row.correct_count) / total) * 100 : 0;
                return { ...row, accuracy_percentage: accuracy, total_answers: total };
            });

            if (sortMode === 'least_correct') {
                formatted.sort((a, b) => a.accuracy_percentage - b.accuracy_percentage);
            } else if (sortMode === 'best_correct') {
                formatted.sort((a, b) => b.accuracy_percentage - a.accuracy_percentage);
            }

            const summary = summaryResult[0];
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Item Analysis');

            // 🟢 NEW: Add the Top Header Block exactly like the image
            worksheet.addRow(['CLASS NAME:', className]);
            worksheet.addRow(['ACTIVITY NAME:', activityName]);
            worksheet.addRow(['STUDENTS PARTICIPATED:', summary.total_participants || 0]);
            worksheet.addRow(['NUMBER OF ITEMS:', formatted.length]);
            worksheet.addRow(['MEAN SCORE:', summary.mean_score ? parseFloat(summary.mean_score).toFixed(2) : '0.00']);
            worksheet.addRow(['HIGHEST SCORE:', summary.highest_score || 0]);
            worksheet.addRow(['LOWEST SCORE:', summary.lowest_score || 0]);

            // Styling the header rows
            for (let i = 1; i <= 7; i++) {
                worksheet.getCell(`A${i}`).font = { bold: true };
            }

            worksheet.addRow([]); // Blank spacer row

            // Add Table Headers
            const headerRow = worksheet.addRow(['Item No.', 'Question', 'Correct', 'Wrong', 'Accuracy']);
            headerRow.font = { bold: true };
            headerRow.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFD9E1F2'} }; // Light blue header like the image

            worksheet.columns = [
                { key: 'item_no', width: 25 }, // Wider for the header labels
                { key: 'question', width: 60 },
                { key: 'correct', width: 12 },
                { key: 'wrong', width: 12 },
                { key: 'accuracy', width: 15 }
            ];

            // Add the data rows
            formatted.forEach((item, index) => {
                worksheet.addRow({
                    item_no: index + 1,
                    question: item.question_text,
                    correct: item.correct_count || 0,
                    wrong: item.wrong_count || 0,
                    accuracy: `${Math.round(item.accuracy_percentage)}%`
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=ItemAnalysis_Game_${gameId}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
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
    const sql = `SELECT g.game_id, g.game_type, g.custom_title, g.created_at, g.open_datetime, g.close_datetime, g.time_limit, g.is_active, c.class_name, c.class_id FROM game_instances g JOIN classes c ON g.class_id = c.class_id WHERE g.teacher_fid = ? ORDER BY g.created_at DESC`;
    db.query(sql, [req.params.teacher_fid], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.get('/api/gradebook/:game_id', (req, res) => {
    const gameId = req.params.game_id;
    const sql = `
        SELECT s.student_fid, s.student_name, s.student_surname, sc.score as raw_score, sc.time_taken,
               (SELECT COUNT(*) FROM game_questions WHERE game_id = ?) as total_items,
               CASE WHEN sgl.student_fid IS NOT NULL THEN 1 ELSE 0 END as is_locked
        FROM class_members cm
        JOIN student s ON cm.student_fid = s.student_fid
        LEFT JOIN scores sc ON s.student_fid = sc.student_fid AND sc.game_id = ?
        LEFT JOIN student_game_locks sgl ON s.student_fid = sgl.student_fid AND sgl.game_id = ?
        WHERE cm.class_id = (SELECT class_id FROM game_instances WHERE game_id = ?)
        ORDER BY s.student_surname ASC`;
    db.query(sql, [gameId, gameId, gameId, gameId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});
// 🟢 NEW: Class Overall Performance (DepEd Grading)
app.get('/api/class-performance/:class_id', (req, res) => {
    const classId = req.params.class_id;

    // 1. Get total possible items for ALL games assigned to this class combined
    const sqlTotalItems = `
        SELECT COUNT(*) as total_items 
        FROM game_questions 
        WHERE game_id IN (SELECT game_id FROM game_instances WHERE class_id = ?)`;

    // 2. Get accumulated scores for each student across all those games
    const sqlStudentScores = `
        SELECT s.student_fid, s.student_name, s.student_surname,
               COUNT(DISTINCT sc.game_id) as games_played,
               SUM(sc.score) as accumulated_score
        FROM class_members cm
        JOIN student s ON cm.student_fid = s.student_fid
        LEFT JOIN scores sc ON cm.student_fid = sc.student_fid
             AND sc.game_id IN (SELECT game_id FROM game_instances WHERE class_id = ?)
        WHERE cm.class_id = ?
        GROUP BY s.student_fid
        ORDER BY s.student_surname ASC`;

    db.query(sqlTotalItems, [classId], (err, itemsResult) => {
        if (err) return res.status(500).json({ error: "Database error fetching total items" });
        const classTotalItems = itemsResult[0].total_items || 0;

        db.query(sqlStudentScores, [classId, classId], (err2, studentsResult) => {
            if (err2) return res.status(500).json({ error: "Database error fetching student scores" });

            // 3. Calculate Transmuted Grade and DepEd Descriptor
            const performanceData = studentsResult.map(student => {
                const score = student.accumulated_score || 0;
                let accuracy = 0;
                let grade = 0;
                let descriptor = "No Data";

                if (classTotalItems > 0 && student.games_played > 0) {
                    accuracy = (score / classTotalItems) * 100;
                    grade = Math.round((score / classTotalItems) * 50 + 50); // Base-50

                    // DepEd Qualitative Scale
                    if (grade >= 90) descriptor = "Outstanding (O)";
                    else if (grade >= 85) descriptor = "Very Satisfactory (VS)";
                    else if (grade >= 80) descriptor = "Satisfactory (S)";
                    else if (grade >= 75) descriptor = "Fairly Satisfactory (FS)";
                    else descriptor = "Did Not Meet Expectations (DNME)";
                }

                return {
                    ...student,
                    class_total_items: classTotalItems,
                    accuracy: accuracy,
                    grade: grade,
                    descriptor: descriptor
                };
            });

            res.json(performanceData);
        });
    });
});
app.get('/api/check-lock/:game_id/:student_fid', (req, res) => {
  const { game_id, student_fid } = req.params;
  const sql = "SELECT * FROM student_game_locks WHERE game_id = ? AND student_fid = ?";
  db.query(sql, [game_id, student_fid], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ isLocked: results.length > 0 });
  });
});

app.get('/api/student-games/:student_fid', (req, res) => {
    const sql = `
        SELECT c.class_name, c.class_id, t.teacher_name, t.teacher_surname, g.game_id, g.game_type, g.custom_title, g.created_at, g.open_datetime, g.close_datetime, g.time_limit, g.is_active, sc.score as raw_score, sc.time_taken,
               (SELECT COUNT(*) FROM game_questions WHERE game_id = g.game_id) as total_items,
               CASE WHEN sgl.student_fid IS NOT NULL THEN 1 ELSE 0 END as is_locked
        FROM class_members cm
        LEFT JOIN classes c ON cm.class_id = c.class_id
        LEFT JOIN teacher t ON c.teacher_fid = t.teacher_fid
        LEFT JOIN game_instances g ON c.class_id = g.class_id
        LEFT JOIN scores sc ON sc.game_id = g.game_id AND sc.student_fid = cm.student_fid
        LEFT JOIN student_game_locks sgl ON sgl.student_fid = cm.student_fid AND sgl.game_id = g.game_id
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

app.delete('/api/delete-user', (req, res) => {
    const { uid, role } = req.body;
    const sql = role === 'teacher' ? "DELETE FROM teacher WHERE teacher_fid = ?" : "DELETE FROM student WHERE student_fid = ?";
    db.query(sql, [uid], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "User data wiped successfully." });
    });
});

// 🟢 NEW: EXPORT GRADES TO EXCEL ROUTE
app.get('/api/export-grades/:game_id', async (req, res) => {
    const gameId = req.params.game_id;
    const sql = `
        SELECT s.student_fid, s.student_name, s.student_surname, sc.score as raw_score, sc.time_taken,
               (SELECT COUNT(*) FROM game_questions WHERE game_id = ?) as total_items,
               CASE WHEN sgl.student_fid IS NOT NULL THEN 1 ELSE 0 END as is_locked
        FROM class_members cm
        JOIN student s ON cm.student_fid = s.student_fid
        LEFT JOIN scores sc ON s.student_fid = sc.student_fid AND sc.game_id = ?
        LEFT JOIN student_game_locks sgl ON s.student_fid = sgl.student_fid AND sgl.game_id = ?
        WHERE cm.class_id = (SELECT class_id FROM game_instances WHERE game_id = ?)
        ORDER BY s.student_surname ASC`;

    db.query(sql, [gameId, gameId, gameId, gameId], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Class Grades');

        worksheet.columns = [
            { header: 'No.', key: 'row_num', width: 5 },
            { header: 'Last Name', key: 'student_surname', width: 20 },
            { header: 'First Name', key: 'student_name', width: 20 },
            { header: 'Raw Score', key: 'raw_score', width: 12 },
            { header: 'Total Items', key: 'total_items', width: 12 },
            { header: 'Transmuted Grade', key: 'grade', width: 18 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true };

        results.forEach((row, index) => {
            const hasPlayed = row.raw_score !== null;
            const grade = hasPlayed ? Math.round((row.raw_score / (row.total_items || 1)) * 50 + 50) : 0;
            let status = hasPlayed ? (grade >= 75 ? 'PASSED' : 'FAILED') : 'PENDING';
            if (row.is_locked) status = 'LOCKED';

            worksheet.addRow({
                row_num: index + 1,
                student_surname: row.student_surname,
                student_name: row.student_name,
                raw_score: hasPlayed ? row.raw_score : '-',
                total_items: row.total_items || 1,
                grade: hasPlayed ? `${grade}%` : '-',
                status: status
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Grades_Game_${gameId}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    });
});

// 🟢 NEW: EXPORT ITEM ANALYSIS TO EXCEL ROUTE
app.get('/api/export-item-analysis/:game_id', (req, res) => {
    const gameId = req.params.game_id;
    const sortMode = req.query.sort || 'numerical';

    const sql = `
        SELECT q.id as question_id, q.question_text,
               SUM(CASE WHEN sa.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
               SUM(CASE WHEN sa.is_correct = 0 THEN 1 ELSE 0 END) as wrong_count
        FROM game_questions q
        LEFT JOIN student_answers sa ON q.id = sa.question_id
        WHERE q.game_id = ?
        GROUP BY q.id`;

    db.query(sql, [gameId], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        let formatted = results.map(row => {
            const total = parseInt(row.correct_count || 0) + parseInt(row.wrong_count || 0);
            const accuracy = total > 0 ? (parseInt(row.correct_count) / total) * 100 : 0;
            return { ...row, accuracy_percentage: accuracy, total_answers: total };
        });

        if (sortMode === 'least_correct') {
            formatted.sort((a, b) => a.accuracy_percentage - b.accuracy_percentage);
        } else if (sortMode === 'best_correct') {
            formatted.sort((a, b) => b.accuracy_percentage - a.accuracy_percentage);
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Item Analysis');

        worksheet.columns = [
            { header: 'Item No.', key: 'item_no', width: 10 },
            { header: 'Question', key: 'question', width: 50 },
            { header: 'Correct', key: 'correct', width: 12 },
            { header: 'Wrong', key: 'wrong', width: 12 },
            { header: 'Accuracy', key: 'accuracy', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true };

        formatted.forEach((item, index) => {
            worksheet.addRow({
                item_no: index + 1,
                question: item.question_text,
                correct: item.correct_count || 0,
                wrong: item.wrong_count || 0,
                accuracy: `${Math.round(item.accuracy_percentage)}%`
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=ItemAnalysis_Game_${gameId}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    });
});

app.get('/keep-alive', (req, res) => {
    res.status(200).json({ status: "Render is awake!" });
    db.query('SELECT 1', (err, result) => {
        if (err) console.error("Background Aiven ping failed:", err.message);
    });
});

app.get('/api/admin/backup', (req, res) => {
    const sqlUsers = `SELECT 'Student' as role, student_name as name, student_username as username FROM student UNION SELECT 'Teacher' as role, teacher_name as name, teacher_username as username FROM teacher`;
    db.query(sqlUsers, (err, users) => {
        if (err) return res.status(500).json({ error: "Failed to backup users" });
        db.query("SELECT * FROM scores", (err, scores) => {
             if (err) return res.status(500).json({ error: "Failed to backup scores" });
             const backupData = {
                 backupDate: new Date().toLocaleString(),
                 system: "ARCADS Gamified LMS",
                 total_accounts: users.length,
                 total_scores_recorded: scores.length,
                 accounts: users,
                 scores: scores
             };
             res.setHeader('Content-Type', 'application/json');
             res.setHeader('Content-Disposition', 'attachment; filename=arcads_database_backup.json');
             res.send(JSON.stringify(backupData, null, 2));
        });
    });
});

app.get('/api/admin/dashboard-data', (req, res) => {
    const sqlStats = "SELECT (SELECT COUNT(*) FROM student) as students, (SELECT COUNT(*) FROM teacher) as teachers, (SELECT COUNT(*) FROM game_instances) as games";
    const sqlUsers = `SELECT student_fid as uid, 'Student' as role, student_username as username, CONCAT(student_name, ' ', student_surname) as name FROM student UNION SELECT teacher_fid as uid, 'Teacher' as role, teacher_username as username, CONCAT(teacher_name, ' ', teacher_surname) as name FROM teacher`;
    const sqlClasses = `SELECT c.class_id, c.class_name, c.class_code, CONCAT(t.teacher_name, ' ', t.teacher_surname) as teacher_name FROM classes c LEFT JOIN teacher t ON c.teacher_fid = t.teacher_fid ORDER BY c.created_at DESC`;
    const sqlLogs = "SELECT played_at as activity_timestamp, student_fid, CONCAT('Completed a game with score: ', score) as activity_type FROM scores ORDER BY played_at DESC LIMIT 15";
    const sqlGameStats = "SELECT game_type, COUNT(*) as count FROM game_instances GROUP BY game_type ORDER BY count DESC";

    db.query(sqlStats, (err1, statsResult) => {
        if (err1) return res.status(500).json({ error: "Database error" });
        db.query(sqlUsers, (err2, usersResult) => {
            if (err2) return res.status(500).json({ error: "Database error" });
            db.query(sqlClasses, (err3, classesResult) => {
                if (err3) return res.status(500).json({ error: "Database error" });
                db.query(sqlLogs, (err4, logsResult) => {
                    if (err4) return res.status(500).json({ error: "Database error" });
                    db.query(sqlGameStats, (err5, gameStatsResult) => {
                        if (err5) return res.status(500).json({ error: "Database error" });
                        res.json({
                            stats: statsResult[0],
                            users: usersResult,
                            classes: classesResult,
                            logs: logsResult,
                            gameStats: gameStatsResult
                        });
                    });
                });
            });
        });
    });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});