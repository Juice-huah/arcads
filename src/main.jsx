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
import UserProfile from './pages/UserProfile.jsx';
import Maze from './games/Maze.jsx'; 
import CreateMazeGame from './pages/CreateMazeGame.jsx';

import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/", 
        element: <HomePage />,
      },
      {
        path: "/signup", 
        // 2. ADDED role="teacher" to the existing SignUp route
        element: <SignUp role="teacher" />, 
      },
      {
        path: "/student-login", 
        element: <StudentLogin />,
      },
      { 
        path: "/student-menu", 
        element: <StudentMenu />,
      },
      { 
        path: "/teacher-menu", 
        element: <TeacherMenu />,
      },
      {
        path: "/teacher-login", 
        element: <TeacherLogin />,
      },
      {
        path: "/student-signup", 
        // 3. REPLACED StudentSignUp with SignUp and ADDED role="student"
        element: <SignUp role="student" />, 
      },
      {
        path: "/profile", 
        element: <UserProfile />,
      },
      {
        path: "/student/play/:gameId",
        element: (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '20px' }}>
            <Maze />
          </div>
        ),
      },
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