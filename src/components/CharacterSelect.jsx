// src/components/CharacterSelect.jsx
import React, { useState, useEffect } from "react";
import { MODES } from "../constants/gameData";

import hero1Img from "../assets/wordquest/images/hero_1.png";
import hero2Img from "../assets/wordquest/images/hero_2.png";
import hero3Img from "../assets/wordquest/images/hero_3.png";
import hero4Img from "../assets/wordquest/images/hero_4.png"; 
import hero5Img from "../assets/wordquest/images/hero_5.png"; 
import hero6Img from "../assets/wordquest/images/hero_6.png"; 

const CHARACTERS = [
  { id: "char_1", name: "Warrior", img: hero1Img, idleImg: hero1Img, runImg: hero1Img, color: "#ff4444" },
  { id: "char_2", name: "Mage",    img: hero2Img, idleImg: hero2Img, runImg: hero2Img, color: "#a020f0" },
  { id: "char_3", name: "Archer",  img: hero3Img, idleImg: hero3Img, runImg: hero3Img, color: "#ffff00" },
  { id: "char_4", name: "Rogue",   img: hero4Img, idleImg: hero4Img, runImg: hero4Img, color: "#ff8800" },
  { id: "char_5", name: "Cleric",  img: hero5Img, idleImg: hero5Img, runImg: hero5Img, color: "#00ffff" },
  { id: "char_6", name: "Paladin", img: hero6Img, idleImg: hero6Img, runImg: hero6Img, color: "#44ff88" }
];

export default function CharacterSelect({ mode, onConfirm, onBack }) {
  const [p1, setP1] = useState(CHARACTERS[0]);
  const [p2, setP2] = useState(CHARACTERS[1]);

  const isAI = mode === MODES.VS_AI;

  useEffect(() => {
    if (isAI) {
      const availableCharacters = CHARACTERS.filter(c => c.id !== p1.id);
      const randomPick = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
      setP2(randomPick);
    }
  }, [isAI]);

  const handleP1Select = (selectedChar) => {
    if (selectedChar.id === p2.id) {
      if (isAI) {
        // If P1 takes the Computer's character, make the Computer pick a new one
        const available = CHARACTERS.filter(c => c.id !== selectedChar.id);
        setP2(available[Math.floor(Math.random() * available.length)]);
      } else {
        return; 
      }
    }
    setP1(selectedChar);
  };

  const handleP2Select = (selectedChar) => {
    if (isAI) return;
    if (selectedChar.id === p1.id) return; 
    setP2(selectedChar);
  };

  return (
    <div className="screen">
      <div className="card" style={{ maxWidth: 850 }}> 
        <h2 style={{ fontFamily: "Press Start 2P", color: "#fca311", marginBottom: 30, fontSize: "1.2rem" }}>
          CHOOSE YOUR HEROES
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
          
          <div>
            <h3 style={{ color: "#fff", fontFamily: "Press Start 2P", fontSize: "0.8rem", marginBottom: 15 }}>Player 1</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {CHARACTERS.map(c => {
                const isLocked = !isAI && c.id === p2.id; 

                return (
                  <div
                    key={`p1_${c.id}`}
                    onClick={() => handleP1Select(c)}
                    style={{
                      border: p1.id === c.id ? `3px solid ${c.color}` : "3px solid #333",
                      background: p1.id === c.id ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.5)",
                      padding: "10px 5px", borderRadius: 10, 
                      cursor: isLocked ? "not-allowed" : "pointer",
                      transform: p1.id === c.id ? "scale(1.05)" : "scale(1)",
                      opacity: isLocked ? 0.3 : 1,
                      filter: isLocked ? "grayscale(100%)" : "none",
                      transition: "all 0.2s",
                      textAlign: "center"
                    }}
                  >
                    <img src={c.img} alt={c.name} style={{ width: '100%', height: 50, objectFit: "contain" }} />
                    <p style={{ color: "#fff", fontSize: "0.6rem", marginTop: 8 }}>
                      {isLocked ? "TAKEN" : c.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 style={{ color: "#fff", fontFamily: "Press Start 2P", fontSize: "0.8rem", marginBottom: 15 }}>
              {isAI ? "Opponent (Computer)" : "Player 2"}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {CHARACTERS.map(c => {
                const isLocked = c.id === p1.id;

                return (
                  <div
                    key={`p2_${c.id}`}
                    onClick={() => handleP2Select(c)}
                    style={{
                      border: p2.id === c.id ? `3px solid ${c.color}` : "3px solid #333",
                      background: p2.id === c.id ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.5)",
                      padding: "10px 5px", borderRadius: 10, 
                      cursor: isAI ? "default" : (isLocked ? "not-allowed" : "pointer"),
                      transform: p2.id === c.id ? "scale(1.05)" : "scale(1)",
                      opacity: isLocked ? 0.3 : 1,
                      filter: isLocked ? "grayscale(100%)" : "none",
                      transition: "all 0.2s",
                      textAlign: "center"
                    }}
                  >
                    <img src={c.img} alt={c.name} style={{ width: '100%', height: 50, objectFit: "contain" }} />
                    <p style={{ color: "#fff", fontSize: "0.6rem", marginTop: 8 }}>
                      {isLocked ? "TAKEN" : c.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 40 }}>
          <button className="btn ghost" style={{ width: "auto", padding: "15px 30px" }} onClick={onBack}>BACK</button>
          <button className="btn" style={{ width: "auto", padding: "15px 30px" }} onClick={() => onConfirm([p1, p2])}>START QUEST</button>
        </div>
      </div>
    </div>
  );
}