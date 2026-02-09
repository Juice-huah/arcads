# 🎮 Arcads: Gamified Assessment Platform

**Arcads** is a web-based educational platform that transforms traditional classroom assessments into interactive RPG-style games. Teachers can create classes and assign "game-based" quizzes, while students play to learn, unlock doors, and compete on leaderboards.

![Project Status](https://img.shields.io/badge/Status-In%20Development-orange)
![Tech Stack](https://img.shields.io/badge/Stack-React%20|%20Node.js%20|%20MySQL%20|%20Firebase-blue)

## ✨ Features

* **For Teachers:**
  * Create and manage Classes.
  * **Game Library:** Create "Maze Escape" assignments with custom questions.
  * **Analytics:** View student scores and leaderboard rankings.
  * Manage student enrollment (Add/Remove students).
* **For Students:**
  * **Interactive Gameplay:** Solve questions to unlock doors and finish the maze.
  * **Dashboards:** View assigned activities by Class.
  * **Leaderboards:** Compete for the top spot in the "Hall of Fame."
* **Tech Features:**
  * Secure Authentication via **Firebase**.
  * Real-time gameplay logic using HTML5 Canvas.
  * Persistent data storage with **MySQL**.

---

## 🛠️ Prerequisites

Before running this project, ensure you have the following installed:

1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **MySQL Server** (and a workbench like MySQL Workbench or XAMPP) - [Download](https://dev.mysql.com/downloads/installer/)
3. **Git** - [Download](https://git-scm.com/)

---

## 🚀 Installation & Setup

1. Clone the Repository
    ```bash
    git clone [https://github.com/Juice-huah/arcads.git](https://github.com/Juice-huah/arcads.git)
    cd arcads

2. Database Setup (MySQL)

    Open your MySQL Workbench or Command Line.

    Create a new database named arcads_dbs.

    Run the following SQL commands to create the necessary tables:

    CREATE DATABASE IF NOT EXISTS arcads_dbs;
    USE arcads_dbs;

    -- Teachers Table
    CREATE TABLE teacher (
    teacher_fid VARCHAR(255) PRIMARY KEY,
    teacher_name VARCHAR(255),
    teacher_surname VARCHAR(255),
    teacher_username VARCHAR(255) UNIQUE
    );

    -- Students Table
    CREATE TABLE student (
    student_fid VARCHAR(255) PRIMARY KEY,
    student_name VARCHAR(255),
    student_surname VARCHAR(255),
    student_username VARCHAR(255) UNIQUE
    );

    -- Classes Table
    CREATE TABLE classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_fid VARCHAR(255),
    class_name VARCHAR(255),
    FOREIGN KEY (teacher_fid) REFERENCES teacher(teacher_fid)
    );

    -- Class Members Table
    CREATE TABLE class_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT,
    student_fid VARCHAR(255),
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (student_fid) REFERENCES student(student_fid)
    );

    -- Game Instances
    CREATE TABLE game_instances (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_fid VARCHAR(255),
    class_id INT,
    game_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_fid) REFERENCES teacher(teacher_fid),
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
    );

    -- Game Questions
    CREATE TABLE game_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT,
    question_text TEXT,
    choice_a VARCHAR(255),
    choice_b VARCHAR(255),
    choice_c VARCHAR(255),
    choice_d VARCHAR(255),
    correct_answer INT, -- 0 for A, 1 for B, etc.
    FOREIGN KEY (game_id) REFERENCES game_instances(game_id)
    );

    -- Scores
    CREATE TABLE scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_fid VARCHAR(255),
    game_id INT,
    score INT,
    time_taken INT, -- in seconds
    FOREIGN KEY (student_fid) REFERENCES student(student_fid),
    FOREIGN KEY (game_id) REFERENCES game_instances(game_id)
    );


3. Backend Setup (Server)

    Navigate to the server directory and install dependencies.

    # Assuming backend code is in a 'server' folder
    cd server
    npm install express mysql2 cors nodemon

    Important: Open index.js and update the password field in the database connection to match your local MySQL password.


4. Frontend Setup (Client)

    Open a new terminal and navigate to the client/root directory.

    # Assuming frontend is in the root or 'client' folder
    cd client 
    npm install
    npm install firebase react-router-dom axios


5. Firebase Configuration

    Go to Firebase Console.

    Create a project and enable Authentication (Email/Password).

    Copy your Firebase Config keys.

    Create a file named firebase.js in your src folder and paste your keys:

    import { initializeApp } from "firebase/app";
    import { getAuth } from "firebase/auth";

    const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "...",
    appId: "..."
    };

    const app = initializeApp(firebaseConfig);
    export const auth = getAuth(app);


Codes to Run

You need to run both the backend and frontend terminals simultaneously.

Terminal 1 (Backend API):

    cd server
    node index.js
    # Server should run on http://localhost:8081

Terminal 2 (Frontend React App):

    cd client
    npm start
    # App should open on http://localhost:3000


Project Structure

    /server: Contains index.js (API Routes for Auth, Classes, Games, Leaderboard).

    /src/pages: Contains main views (TeacherMenu.jsx, StudentMenu.jsx, Maze.jsx).

    /src/components: Reusable UI components.

    /src/games: Game logic files (Canvas rendering, Physics).

How to Play (Maze Escape)

    Controls: Use Arrow Keys to move.

    Objective: Find keys, unlock doors, and reach the finish line.

    Map Legend:

        🔵 Blue Circles (🌀): Portals to teleport to new areas.

        🟧 Orange Squares (🔒): Locked doors requiring you to answer a question.

        🟡 Gold Dots (🔑): Keys/Clues needed to progress.

        🟩 Green Block (🏁): Finish line (triggers score save).