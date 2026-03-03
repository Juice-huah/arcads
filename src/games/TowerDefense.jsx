// src/games/TowerDefense.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";

import GameScreen  from "../defensetower/GameScreen";
import Scoreboard  from "../defensetower/Scoreboard";
import MapSelect   from "../defensetower/MapSelect";
import { defaultQuestions } from "../defensetower/gameData";

const FONT   = "'Cinzel','Palatino Linotype',serif";
const FONT_B = "'Crimson Text','Georgia',serif";

/* ── ☀️ DAYTIME Castle Wall Background SVG ───────────────────────────────── */
function CastleWallBg() {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
      {/* Smooth Daytime Sky Gradient */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, #5cb3ff 0%, #8ed6ff 40%, #dff2fc 100%)" }}/>

      {/* Soft Glowing Sun */}
      <div style={{
        position:"absolute", top:"12%", right:"15%", width:150, height:150, borderRadius:"50%",
        background:"radial-gradient(circle at 40% 40%, #fff6b0 0%, #ffcc5c 60%, #fba922 100%)",
        boxShadow:"0 0 60px rgba(251,169,34,0.4), 0 0 120px rgba(251,169,34,0.2)",
      }}/>

      {/* Layered Vector Mountains */}
      <svg style={{position:"absolute",bottom:"25%",left:0,right:0,width:"100%",height:"45%"}} viewBox="0 0 1200 400" preserveAspectRatio="none">
        {/* Background Mountains */}
        <polygon points="0,400 150,150 350,300 550,100 800,280 1000,120 1200,250 1200,400" fill="#6c825e"/>
        {/* Shading/Depth Polygons */}
        <polygon points="150,150 250,220 350,300 150,400" fill="#52664b"/>
        <polygon points="550,100 650,200 800,280 550,400" fill="#52664b"/>
        <polygon points="1000,120 1100,200 1200,250 1000,400" fill="#52664b"/>
        
        {/* Foreground Mountains */}
        <polygon points="0,400 80,250 250,400" fill="#4a5d40"/>
        <polygon points="80,250 150,320 250,400" fill="#35462d"/>
        <polygon points="850,400 1050,200 1200,350 1200,400" fill="#4a5d40"/>
        <polygon points="1050,200 1120,280 1200,350 1050,400" fill="#35462d"/>
        <polygon points="250,400 400,280 600,400" fill="#4a5d40"/>
        <polygon points="400,280 500,340 600,400" fill="#35462d"/>
      </svg>

      {/* Daytime Castle / Gate */}
      <svg style={{position:"absolute",bottom:"25%",left:"50%",transform:"translateX(-50%)",width:"min(800px,80vw)"}} viewBox="0 0 800 280" preserveAspectRatio="xMidYMax meet">
        {/* Main Wall */}
        <rect x="100" y="120" width="600" height="160" fill="#b07d54"/>
        {[128,148,168,188,208,228,248,268].map((y,row)=>
          [100,150,200,250,300,350,400,450,500,550,600,650].map((x,col)=>(
            <rect key={`${row}-${col}`} x={x+(row%2===0?25:0)} y={y} width={48} height={18} fill={row%2===col%2?"#a06f47":"#b07d54"} stroke="#8b5a33" strokeWidth="1"/>
          ))
        )}
        
        {/* Gate Arch */}
        <path d="M 330 280 L 330 160 Q 400 120 470 160 L 470 280 Z" fill="#3e2723"/>
        {[340,360,380,400,420,440,460].map((x,i)=>( <line key={i} x1={x} y1="170" x2={x} y2="280" stroke="#271612" strokeWidth="3"/> ))}
        {[175,200,220,240,260].map((y,i)=>( <line key={i} x1="330" y1={y} x2="470" y2={y} stroke="#271612" strokeWidth="2"/> ))}

        {/* Left Tower */}
        <rect x="50" y="40" width="100" height="240" fill="#a06f47"/>
        <rect x="50" y="28" width="15" height="20" fill="#a06f47"/>
        <rect x="70" y="28" width="15" height="20" fill="#a06f47"/>
        <rect x="90" y="28" width="15" height="20" fill="#a06f47"/>
        <rect x="110" y="28" width="15" height="20" fill="#a06f47"/>
        <rect x="130" y="28" width="20" height="20" fill="#a06f47"/>
        <rect x="85" y="90" width="30" height="45" rx="15" fill="#7a5230"/>
        <text x="100" y="115" fill="#e2d9c8" fontSize="24" fontFamily={FONT} textAnchor="middle" opacity="0.6">0</text>
        
        {/* Right Tower */}
        <rect x="650" y="40" width="100" height="240" fill="#a06f47"/>
        <rect x="650" y="28" width="15" height="20" fill="#a06f47"/>
        <rect x="670" y="28" width="15" height="20" fill="#a06f47"/>
        <rect x="690" y="28" width="15" height="20" fill="#a06f47"/>
        <rect x="710" y="28" width="15" height="20" fill="#a06f47"/>
        <rect x="730" y="28" width="20" height="20" fill="#a06f47"/>
        <rect x="685" y="90" width="30" height="45" rx="15" fill="#7a5230"/>
        <text x="700" y="115" fill="#e2d9c8" fontSize="24" fontFamily={FONT} textAnchor="middle" opacity="0.6">0</text>
        
        {/* Flags */}
        <line x1="100" y1="0" x2="100" y2="42" stroke="#5c4033" strokeWidth="3"/>
        <polygon points="100,4 140,14 100,24" fill="#dc2626" style={{animation:`flagWave 1.5s ease-in-out infinite`, transformOrigin:`100px 14px`}}/>
        <line x1="700" y1="0" x2="700" y2="42" stroke="#5c4033" strokeWidth="3"/>
        <polygon points="700,4 740,14 700,24" fill="#1d4ed8" style={{animation:`flagWave 1.4s ease-in-out infinite`, transformOrigin:`700px 14px`}}/>
      </svg>

      {/* Foreground Brick Wall (Bottom 25%) */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"25%", background:"#b07d54", overflow:"hidden", borderTop:"4px solid #8b5a33" }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="brick" width="60" height="20" patternUnits="userSpaceOnUse">
            <rect width="60" height="20" fill="#b07d54"/>
            <rect width="30" height="9" x="0" y="0" fill="#a06f47" stroke="#8b5a33" strokeWidth="1"/>
            <rect width="30" height="9" x="30" y="0" fill="#b07d54" stroke="#8b5a33" strokeWidth="1"/>
            <rect width="30" height="9" x="-15" y="10" fill="#b07d54" stroke="#8b5a33" strokeWidth="1"/>
            <rect width="30" height="9" x="15" y="10" fill="#a06f47" stroke="#8b5a33" strokeWidth="1"/>
            <rect width="30" height="9" x="45" y="10" fill="#b07d54" stroke="#8b5a33" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#brick)"/>
        </svg>
      </div>

      {/* Wall Torches */}
      {[15, 85].map((pos, i) => (
         <div key={i} style={{ position:"absolute", left:`${pos}%`, bottom:"18%", display:"flex", flexDirection:"column", alignItems:"center", zIndex:2 }}>
          <div style={{fontSize:"1.8rem", animation:`torchFlame ${0.8+i*0.3}s ${i*0.2}s infinite alternate`}}>🔥</div>
          <div style={{width:8,height:35,background:"#4e342e",borderRadius:"2px 2px 0 0"}}/>
          <div style={{width:16,height:8,background:"#3e2723",borderRadius:"2px"}}/>
        </div>
      ))}
      
      <style>{`
        @keyframes flagWave { 0%,100%{transform:rotate(-8deg) scaleX(1);} 50%{transform:rotate(8deg) scaleX(0.85);} }
        @keyframes torchFlame { from{opacity:0.85;transform:scaleY(0.95);} to{opacity:1;transform:scaleY(1.1);} }
        @keyframes slideUp { from{opacity:0;transform:translateY(28px);} to{opacity:1;transform:none;} }
        * { box-sizing:border-box; margin:0; padding:0; }
        body { margin:0; overflow-x:hidden; }
      `}</style>
    </div>
  );
}

function MainMenu({ onStart, navigate }) {
  const [hoverPlay, setHoverPlay] = useState(false);
  return (
    <div style={styles.menu}>
      {/* Title */}
      <div style={{animation:"slideUp 0.7s ease both", textAlign:"center", position:"relative", zIndex:1}}>
        <div style={{fontSize:"clamp(2.5rem,5vw,3.5rem)", marginBottom:0, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.2))"}}>🏰</div>
        <h1 style={{
          fontFamily:FONT, fontSize:"clamp(2.5rem,6vw,4.5rem)", fontWeight:900, letterSpacing:"0.05em", lineHeight:1.1,
          color: "#8b4513", /* 🟢 Solid Brown Title matching your image */
          textShadow: "2px 2px 0px #d2a679, 4px 4px 8px rgba(0,0,0,0.2)",
          margin: "10px 0"
        }}>WORD TOWER<br/>DEFENSE</h1>
        <p style={{
          fontFamily:FONT_B, fontSize:"clamp(0.9rem,2.2vw,1.15rem)", color:"#4e342e", letterSpacing:"0.15em", textTransform:"uppercase", marginTop:5, fontStyle:"italic", fontWeight:"bold"
        }}>Match · Defend · Conquer</p>
      </div>

      {/* Tags */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",animation:"slideUp 0.7s 0.08s ease both",position:"relative",zIndex:1}}>
        {["🇵🇭 Filipino","🇺🇸 English","📖 Vocabulary","⚔️ Matching Type"].map(b=>(
          <span key={b} style={{
            fontFamily:FONT, fontSize:"0.75rem", color:"#5d4037", background:"rgba(215, 168, 118, 0.8)", border:"1px solid #bcaaa4", padding:"6px 16px", borderRadius:4, letterSpacing:"0.08em", boxShadow:"0 2px 4px rgba(0,0,0,0.1)"
          }}>{b}</span>
        ))}
      </div>

      {/* Brown Description Panel */}
      <div style={{
        maxWidth:500, textAlign:"center", background:"rgba(78, 52, 46, 0.85)", border:"2px solid #3e2723", borderRadius:12, padding:"18px 24px", animation:"slideUp 0.7s 0.15s ease both", position:"relative", zIndex:1, boxShadow:"0 8px 24px rgba(0,0,0,0.3)", backdropFilter:"blur(4px)"
      }}>
        <p style={{fontFamily:FONT_B,fontSize:"0.95rem",color:"#d7ccc8",lineHeight:1.7,fontStyle:"italic"}}>
          Enemies march bearing <span style={{color:"#ffb300", fontWeight:"bold"}}>word prompts</span>. 
          Select the <span style={{color:"#ff8a65", fontWeight:"bold"}}>matching answer</span> from the panel below
          to fire your tower and defend the castle!
        </p>
      </div>

      {/* Buttons */}
      <div style={{display:"flex",flexDirection:"column",gap:14,alignItems:"center",width:"100%",maxWidth:340,animation:"slideUp 0.7s 0.2s ease both",position:"relative",zIndex:1}}>
        <button
          style={{
            width:"100%", padding:"16px 32px", fontFamily:FONT, fontSize:"1.1rem", fontWeight:700, letterSpacing:"0.12em",
            border:"2px solid #e65100", borderRadius:8, cursor:"pointer", textTransform:"uppercase",
            background:"linear-gradient(135deg, #f57c00, #e65100)", color:"#fff",
            boxShadow: hoverPlay ? "0 6px 20px rgba(230, 81, 0, 0.5)" : "0 4px 12px rgba(230, 81, 0, 0.3)",
            transform: hoverPlay ? "scale(1.02) translateY(-2px)" : "none", transition:"all 0.2s ease",
          }}
          onMouseEnter={()=>setHoverPlay(true)} onMouseLeave={()=>setHoverPlay(false)} onClick={onStart}
        >
          🏰 Begin the Siege
        </button>
        <button
          style={{
            width:"100%", padding:"12px 28px", fontFamily:FONT, fontSize:"0.95rem", letterSpacing:"0.1em",
            border:"2px solid #5d4037", borderRadius:8, background:"rgba(62, 39, 35, 0.9)", color:"#d7ccc8", cursor:"pointer", textTransform:"uppercase", transition:"all 0.2s ease",
            boxShadow:"0 4px 10px rgba(0,0,0,0.2)"
          }}
          onMouseEnter={e=>{e.currentTarget.style.background="#3e2723"; e.currentTarget.style.color="#fff"}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(62, 39, 35, 0.9)"; e.currentTarget.style.color="#d7ccc8"}}
          onClick={() => navigate('/student-menu')}
        >
          🚪 Exit to Menu
        </button>
      </div>
    </div>
  );
}

export default function TowerDefense() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("menu");
  const [questions, setQuestions] = useState(defaultQuestions);
  const [gameResult, setGameResult] = useState(null);
  const [selectedMap, setSelectedMap] = useState("grasslands");
  const [isScoreSaved, setIsScoreSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
    });

    const fetchQuestions = async () => {
      try {
        const res = await fetch(`http://localhost:8081/api/game-questions/${gameId}`);
        const data = await res.json();
        if (data && data.length > 0) {
          const mapped = data.map(q => {
            let diff = "Easy";
            let cleanPrompt = q.question_text;
            
            const match = q.question_text.match(/^\[(.*?)\]\s*(.*)$/);
            if (match) {
                diff = match[1];
                cleanPrompt = match[2];
            }

            return {
                id: q.question_id,
                category: "definition", 
                difficulty: diff, 
                prompt: cleanPrompt,
                answer: q[`choice_${['a','b','c','d'][parseInt(q.correct_answer)]}`] || q.choice_a,
                choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
                correctIndex: parseInt(q.correct_answer)
            };
          });
          setQuestions(mapped);
        }
      } catch (err) {
        console.error("Error fetching custom questions:", err);
      }
    };

    if (gameId) fetchQuestions();
    return () => unsubscribe();
  }, [gameId]);

  const saveScoreToDB = async (finalScore) => {
    if (!user || !gameId || isScoreSaved) return;
    try {
      await fetch('http://localhost:8081/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          student_fid: user.uid, 
          game_id: gameId, 
          score: finalScore, 
          time_taken: 0 
        })
      });
      setIsScoreSaved(true);
    } catch (err) {
      console.error("Error saving score:", err);
    }
  };

  const handleGameOver = useCallback((score, wave, streak, accuracy) => {
    setGameResult({ score, wave, streak, accuracy });
    setScreen("gameover");
  }, []);

  const handleMapSelect = useCallback((mapId) => {
    setSelectedMap(mapId);
    setScreen("game");
  }, []);

  return (
    <div style={{
      width: "100%", 
      height: "calc(100vh - 80px)",
      position: "relative",
      fontFamily: FONT_B, 
      color: "#e2d9c8",
      overflow: "hidden", 
      background: "#8ed6ff", // Fallback sky color
    }}>
        {screen==="menu" && <><CastleWallBg/><MainMenu onStart={()=>setScreen("mapselect")} navigate={navigate} /></>}
        {screen==="mapselect" && <MapSelect onSelect={handleMapSelect} onBack={()=>setScreen("menu")}/>}
        
        {screen==="game" && <GameScreen questions={questions} onGameOver={handleGameOver} onExit={()=>setScreen("menu")} mapId={selectedMap}/>}
        
        {screen==="gameover" && gameResult && (
            <Scoreboard 
                {...gameResult} 
                onRestart={()=>{ setIsScoreSaved(false); setScreen("mapselect"); }} 
                onMenu={()=>navigate('/student-menu')}
                onSaveScore={() => saveScoreToDB(gameResult.score)}
                isScoreSaved={isScoreSaved}
            />
        )}
    </div>
  );
}

const styles = {
  menu: {
    display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center",
    height:"100%", gap:28, padding:"40px 20px",
    position:"relative", zIndex:1,
  },
};