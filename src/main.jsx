// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/LogInAuthenticate.jsx';

import App from './App.jsx';
import HomePage from './pages/HomePage.jsx';
import SignUp from './pages/SignUp.jsx';
import TeacherLogin from './pages/TeacherLogin.jsx';
import TeacherMenu from './pages/TeacherMenu.jsx'; 
import StudentLogin from './pages/StudentLogin.jsx';
import StudentMenu from './pages/StudentMenu.jsx'; 
import StudentSignUp from './pages/StudentSignUp.jsx';
import UserProfile from './pages/UserProfile.jsx';
import Maze from './games/Maze.jsx'; // Make sure the file name matches exactly (Maze.jsx vs maze.jsx)
import CreateMazeGame from './pages/CreateMazeGame.jsx';

import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/", // The homepage
        element: <HomePage />,
      },
      {
        path: "/signup", // The sign-up page
        element: <SignUp />,
      },
      {
        path: "/student-login", // student login page
        element: <StudentLogin />,
      },
      { 
        path: "/student-menu",  // student menu
        element: <StudentMenu />,
      },
      { 
        path: "/teacher-menu",  // teacher menu
        element: <TeacherMenu />,
      },
      {
        path: "/teacher-login", // Teacher login page
        element: <TeacherLogin />,
      },
      {
        path: "/student-signup", // Student sign-up page
        element: <StudentSignUp />,
      },
      {
        path: "/profile", // User Profile page
        element: <UserProfile />,
      },
      // --- ADDED MISSING GAME ROUTE HERE ---
      {
        path: "/student/play/:gameId",
        element: (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '20px' }}>
            <Maze />
          </div>
        ),
      },
      // -------------------------------------
      {
        path: "/teacher/create-maze",
        element: <CreateMazeGame />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);