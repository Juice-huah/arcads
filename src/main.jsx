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
import ContactUs from './pages/ContactUs.jsx'; 
import GameLibrary from './pages/GameLibrary.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx'; // Added Import

// --- GAME IMPORTS ---
import Maze from './games/Maze.jsx'; 
import AdventureBattle from './games/AdventureBattle.jsx';
import WordQuest from './games/WordQuest.jsx';
import EnchantedForest from './games/EnchantedForest.jsx';
import WhackAMole from './games/WhackAMole.jsx';
import TowerDefense from './games/TowerDefense.jsx'; 
import HamsterBall from './games/HamsterBall.jsx';
import StarType from './games/StarType.jsx'; 

// --- GAME CREATION PAGES ---
import CreateMazeGame from './pages/CreateMazeGame.jsx';
import CreateAdventure from './pages/CreateAdventure.jsx';
import CreateWordQuest from './pages/CreateWordQuest.jsx';
import CreateEnchantedForest from './pages/CreateEnchantedForest.jsx'; 
import CreateWhackAMole from './pages/CreateWhackAMole.jsx';
import CreateTowerDefense from './pages/CreateTowerDefense.jsx';
import CreateHamsterBall from './pages/CreateHamsterBall.jsx';
import CreateStarType from './pages/CreateStarType.jsx';

import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/games", element: <GameLibrary /> },
      { path: "/signup", element: <SignUp role="teacher" /> },
      { path: "/student-login", element: <StudentLogin /> },
      { path: "/student-menu", element: <StudentMenu /> },
      { path: "/teacher-menu", element: <TeacherMenu /> },
      { path: "/teacher-login", element: <TeacherLogin /> },
      { path: "/forgot-password", element: <ForgotPassword /> }, // Added Route
      { path: "/student-signup", element: <SignUp role="student" /> },
      { path: "/profile", element: <UserProfile /> },
      { path: "/contact", element: <ContactUs /> }, 
      
      {
        path: "/student/play/:gameId",
        element: (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '20px' }}>
            <Maze />
          </div>
        ),
      },
      { path: "/teacher/create-maze", element: <CreateMazeGame /> },
      { path: "/student/play-adventure/:gameId", element: <AdventureBattle /> },
      { path: "/teacher/create-adventure", element: <CreateAdventure /> },
      { path: "/student/play-word-quest/:gameId", element: <WordQuest /> },
      { path: "/teacher/create-word-quest", element: <CreateWordQuest /> },
      { path: "/teacher/create-enchanted-forest", element: <CreateEnchantedForest /> },
      { path: "/student/play-enchanted-forest/:gameId", element: <EnchantedForest /> },
      { path: "/teacher/create-whack-a-mole", element: <CreateWhackAMole /> },
      { path: "/student/play-whack-a-mole/:gameId", element: <WhackAMole /> },
      { path: "/teacher/create-tower-defense", element: <CreateTowerDefense /> },
      { path: "/student/play-tower-defense/:gameId", element: <TowerDefense /> },
      { path: "/teacher/create-hamsterball", element: <CreateHamsterBall /> },
      { path: "/student/play-hamsterball/:gameId", element: <HamsterBall /> },
      { path: "/teacher/create-startype", element: <CreateStarType /> },
      { path: "/student/play-startype/:gameId", element: <StarType /> },
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