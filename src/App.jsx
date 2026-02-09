// src/App.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      <Outlet /> {/* The Maze game will appear here when the route matches */}
      <Footer />
    </div>
  );
}


export default App;