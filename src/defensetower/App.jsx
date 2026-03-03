// ─────────────────────────────────────────────────────────────────────────────
//  App.jsx  –  Root: castle-themed menu → map-select → game → teacher → gameover
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from "react";
import GameScreen  from "./scoreboard/GameScreen";
import TeacherMenu from "./cooldowns/TeacherMenu";
import Scoreboard  from "./cooldowns/Scoreboard";
import MapSelect   from "./cooldowns/MapSelect";
import { defaultQuestions } from "./effects/gameData";

const FONT   = "'Cinzel','Palatino Linotype',serif";
const FONT_B = "'Crimson Text','Georgia',serif";

/* ── Castle Wall Background SVG ───────────────────────────────────────────── */
function CastleWallBg() {
  return (
    // 🟢 FIXED: Changed to absolute so it stays perfectly inside the game container
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0, borderRadius: "inherit" }}>
      {/* Sky gradient */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(to bottom, #0a1628 0%, #0d1f3c 40%, #1a0e0e 100%)",
      }}/>
      {/* Stars */}
      {Array.from({length:80},(_,i)=>(
        <div key={i} style={{
          position:"absolute",
          left:`${(i*13.7)%100}%`,
          top:`${(i*17.3)%65}%`,
          width: i%5===0 ? 2.5 : 1.5,
          height: i%5===0 ? 2.5 : 1.5,
          borderRadius:"50%",
          background: i%7===0 ? "#ffd700" : "#fff",
          opacity: 0.3 + (i%4)*0.15,
          animation:`twinkle ${2+i%3}s ${(i%4)*0.8}s infinite alternate`,
        }}/>
      ))}
      {/* Moon */}
      <div style={{
        position:"absolute", top:"6%", right:"12%",
        width:70, height:70, borderRadius:"50%",
        background:"radial-gradient(circle at 35% 35%, #ffe9a0, #f5c842)",
        boxShadow:"0 0 40px rgba(245,200,66,0.3), 0 0 80px rgba(245,200,66,0.15)",
        animation:"moonGlow 4s infinite alternate",
      }}/>
      {/* Distant mountain silhouettes */}
      <svg style={{position:"absolute",bottom:"28%",left:0,right:0,width:"100%"}} viewBox="0 0 1200 160" preserveAspectRatio="none">
        <polygon points="0,160 0,100 120,40 240,90 360,20 480,80 600,30 720,70 840,10 960,60 1080,30 1200,55 1200,160" fill="rgba(5,8,20,0.8)"/>
        <polygon points="0,160 0,120 100,80 200,110 350,60 500,100 650,50 800,90 950,40 1100,75 1200,55 1200,160" fill="rgba(5,8,20,0.6)"/>
      </svg>
      {/* Castle main structure */}
      <svg style={{position:"absolute",bottom:"28%",left:"50%",transform:"translateX(-50%)",width:"min(800px,80vw)"}} viewBox="0 0 800 280" preserveAspectRatio="xMidYMax meet">
        {/* Main wall */}
        <rect x="50" y="100" width="700" height="180" fill="#1a1008"/>
        {/* Stone texture rows */}
        {[108,128,148,168,188,208,228,248,268].map((y,row)=>
          [50,100,150,200,250,300,350,400,450,500,550,600,650,700].map((x,col)=>(
            <rect key={`${row}-${col}`} x={x+(row%2===0?25:0)} y={y} width={48} height={18}
              fill={row%2===col%2?"#251508":"#1a1008"} stroke="#0a0804" strokeWidth="0.5"/>
          ))
        )}
        {/* Left tower */}
        <rect x="20" y="40" width="100" height="240" fill="#1e1209"/>
        <rect x="20" y="28" width="15" height="20" fill="#1e1209"/>
        <rect x="40" y="28" width="15" height="20" fill="#1e1209"/>
        <rect x="60" y="28" width="15" height="20" fill="#1e1209"/>
        <rect x="80" y="28" width="15" height="20" fill="#1e1209"/>
        <rect x="100" y="28" width="16" height="20" fill="#1e1209"/>
        {/* Left tower window */}
        <rect x="55" y="90" width="24" height="38" rx="12" fill="rgba(255,180,40,0.15)"/>
        <rect x="59" y="96" width="16" height="26" rx="8" fill="rgba(255,180,40,0.25)" style={{animation:"torchWin 1.2s infinite alternate"}}/>
        {/* Right tower */}
        <rect x="680" y="40" width="100" height="240" fill="#1e1209"/>
        <rect x="680" y="28" width="15" height="20" fill="#1e1209"/>
        <rect x="700" y="28" width="15" height="20" fill="#1e1209"/>
        <rect x="720" y="28" width="15" height="20" fill="#1e1209"/>
        <rect x="740" y="28" width="15" height="20" fill="#1e1209"/>
        <rect x="760" y="28" width="16" height="20" fill="#1e1209"/>
        <rect x="721" y="90" width="24" height="38" rx="12" fill="rgba(255,180,40,0.15)"/>
        <rect x="725" y="96" width="16" height="26" rx="8" fill="rgba(255,180,40,0.25)" style={{animation:"torchWin 1.4s 0.3s infinite alternate"}}/>
        {/* Center battlements */}
        {[150,200,250,300,350,400,450,500,550,600].map((x,i)=>(
          <rect key={i} x={x} y="88" width="36" height="24" rx="2" fill="#251508"/>
        ))}
        {/* Gate arch */}
        <path d="M 330 280 L 330 160 Q 400 120 470 160 L 470 280 Z" fill="#050300"/>
        {/* Gate bars */}
        {[340,360,380,400,420,440,460].map((x,i)=>(
          <line key={i} x1={x} y1="170" x2={x} y2="280" stroke="rgba(80,50,10,0.5)" strokeWidth="2"/>
        ))}
        {[175,200,220,240,260].map((y,i)=>(
          <line key={i} x1="330" y1={y} x2="470" y2={y} stroke="rgba(80,50,10,0.4)" strokeWidth="1.5"/>
        ))}
        {/* Wall walk torches */}
        {[200,400,600].map((x,i)=>(
          <g key={i}>
            <rect x={x-3} y="92" width="6" height="20" fill="#5c3317"/>
            <circle cx={x} cy="90" r="6" fill="#ff8c00" style={{animation:`torchFlame ${0.7+i*0.2}s ${i*0.15}s infinite alternate`, filter:"url(#glow)"}}/>
          </g>
        ))}
        {/* Flags */}
        {[70,730].map((x,i)=>(
          <g key={i}>
            <line x1={x} y1="0" x2={x} y2="42" stroke="#6b4c2a" strokeWidth="3"/>
            <polygon points={`${x},4 ${x+38},16 ${x},28`} fill={i===0?"#dc2626":"#1d4ed8"}
              style={{animation:`flagWave ${1.2+i*0.2}s ease-in-out infinite`, transformOrigin:`${x}px 16px`}}/>
          </g>
        ))}
        {/* Center flag */}
        <line x1="400" y1="30" x2="400" y2="92" stroke="#6b4c2a" strokeWidth="3"/>
        <polygon points="400,34 440,46 400,58" fill="#ffd700"
          style={{animation:"flagWave 1.1s ease-in-out infinite", transformOrigin:"400px 46px"}}/>
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
      </svg>
      {/* Ground / path */}
      <div style={{
        position:"absolute", bottom:"0%", left:0, right:0, height:"30%",
        background:"linear-gradient(to bottom, #1a1208, #0d0b06)",
        borderTop:"3px solid rgba(100,70,20,0.4)",
      }}/>
      {/* Cobblestone path */}
      <div style={{
        position:"absolute", bottom:0, left:"38%", right:"38%", height:"28%",
        background:"linear-gradient(to bottom, #2a1f0e, #1a1208)",
        borderLeft:"2px solid rgba(80,50,15,0.4)",
        borderRight:"2px solid rgba(80,50,15,0.4)",
      }}/>
      {/* Fog layer */}
      <div style={{
        position:"absolute", bottom:"27%", left:0, right:0, height:80,
        background:"linear-gradient(to top, rgba(20,15,5,0.6), transparent)",
        pointerEvents:"none",
      }}/>
      {/* Torches on path */}
      {[["25%","bottom 22%"],["75%","bottom 22%"]].map(([left,bottom],i)=>(
        <div key={i} style={{
          position:"absolute", left, bottom:"22%",
          display:"flex", flexDirection:"column", alignItems:"center",
          zIndex:2,
        }}>
          <div style={{fontSize:"1.4rem", animation:`torchFlame ${0.8+i*0.3}s ${i*0.2}s infinite alternate`}}>🔥</div>
          <div style={{width:4,height:28,background:"#5c3317",borderRadius:"1px 1px 0 0"}}/>
        </div>
      ))}
      <style>{`
        @keyframes twinkle { from{opacity:0.2;} to{opacity:0.9;} }
        @keyframes moonGlow { from{box-shadow:0 0 30px rgba(245,200,66,0.2);} to{box-shadow:0 0 60px rgba(245,200,66,0.4);} }
        @keyframes flagWave { 0%,100%{transform:rotate(-12deg) scaleX(1);} 50%{transform:rotate(12deg) scaleX(0.82);} }
        @keyframes torchFlame { from{opacity:0.75;transform:scaleY(1);} to{opacity:1;transform:scaleY(1.18);} }
        @keyframes torchWin { from{opacity:0.2;} to{opacity:0.5;} }
        @keyframes slideUp { from{opacity:0;transform:translateY(28px);} to{opacity:1;transform:none;} }
        @keyframes glow { 0%,100%{text-shadow:0 0 20px #ffd700aa;} 50%{text-shadow:0 0 40px #ff8c00cc,0 0 80px #ffd70055;} }
        @keyframes bannerPulse { from{opacity:0.7;} to{opacity:1;} }
        * { box-sizing:border-box; margin:0; padding:0; }
        body { margin:0; overflow-x:hidden; }
      `}</style>
    </div>
  );
}

const FEATURES = [
  { icon:"⚔️",  name:"Matching Combat",   desc:"Match enemy prompts to answer towers for lethal accuracy" },
  { icon:"🐉",  name:"Boss Monsters",      desc:"Epic boss battles every 5 waves with unique abilities" },
  { icon:"❄️",  name:"Special Abilities",  desc:"Ice Freeze, Arrow Storm & Shield Wall with cooldowns" },
  { icon:"🎯",  name:"Combo Streaks",      desc:"Chain correct matches for power shots & score multipliers" },
  { icon:"🔥",  name:"Tower Upgrades",     desc:"Wooden → Ballista → Storm Tower → Inferno Spire" },
  { icon:"🗺️",  name:"3 Battlefields",     desc:"Grasslands, Desert, and Frozen Keep" },
  { icon:"💥",  name:"Impact Effects",     desc:"Screen shake, damage numbers, elemental projectile trails" },
  { icon:"🏫",  name:"Teacher Mode",       desc:"Fully customizable vocabulary question bank" },
];

function MainMenu({ onStart, onTeacher }) {
  const [hoverPlay, setHoverPlay] = useState(false);
  return (
    <div style={styles.menu}>
      <div style={{animation:"slideUp 0.7s ease both", textAlign:"center", position:"relative", zIndex:1}}>
        <div style={{fontSize:"clamp(3rem,8vw,5rem)", marginBottom:8, animation:"bannerPulse 2s infinite alternate"}}>🏰</div>
        <h1 style={{
          fontFamily:FONT,
          fontSize:"clamp(2.2rem,5.5vw,4rem)",
          fontWeight:900, letterSpacing:"0.08em", lineHeight:1.1,
          background:"linear-gradient(135deg,#ffd700 0%,#ff8c00 50%,#dc2626 100%)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
          animation:"glow 3s infinite",
          textShadow:"none",
        }}>
          WORD TOWER<br/>DEFENSE
        </h1>
        <p style={{
          fontFamily:FONT_B, fontSize:"clamp(0.9rem,2.2vw,1.15rem)",
          color:"#9b8c6a", letterSpacing:"0.14em", textTransform:"uppercase",
          marginTop:8, fontStyle:"italic",
        }}>
          Match · Defend · Conquer
        </p>
      </div>

      {/* Badges */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",animation:"slideUp 0.7s 0.08s ease both",position:"relative",zIndex:1}}>
        {["🇵🇭 Filipino","🇺🇸 English","📖 Vocabulary","⚔️ Matching Type"].map(b=>(
          <span key={b} style={{
            fontFamily:FONT, fontSize:"0.78rem", color:"#a08060",
            background:"rgba(255,180,50,0.08)", border:"1px solid rgba(255,180,50,0.25)",
            padding:"5px 14px", borderRadius:6, letterSpacing:"0.08em",
          }}>{b}</span>
        ))}
      </div>

      {/* Mechanic description */}
      <div style={{
        maxWidth:480, textAlign:"center",
        background:"rgba(255,200,80,0.06)", border:"1px solid rgba(255,200,80,0.15)",
        borderRadius:12, padding:"14px 20px",
        animation:"slideUp 0.7s 0.15s ease both", position:"relative", zIndex:1,
      }}>
        <p style={{fontFamily:FONT_B,fontSize:"0.92rem",color:"#c9b99a",lineHeight:1.7,fontStyle:"italic"}}>
          Enemies march bearing <span style={{color:"#ffd700"}}>word prompts</span>. 
          Select the <span style={{color:"#f97316"}}>matching answer</span> from the panel below
          to fire your tower and defend the castle!
        </p>
      </div>

      {/* Buttons */}
      <div style={{display:"flex",flexDirection:"column",gap:14,alignItems:"center",width:"100%",maxWidth:340,animation:"slideUp 0.7s 0.2s ease both",position:"relative",zIndex:1}}>
        <button
          style={{
            width:"100%", padding:"16px 32px",
            fontFamily:FONT, fontSize:"1.1rem", fontWeight:700, letterSpacing:"0.12em",
            border:"none", borderRadius:8, cursor:"pointer", textTransform:"uppercase",
            background:"linear-gradient(135deg,#b45309,#92400e)",
            color:"#fef3c7",
            boxShadow: hoverPlay ? "0 8px 32px rgba(180,83,9,0.7),inset 0 1px 0 rgba(255,255,255,0.2)" : "0 4px 20px rgba(180,83,9,0.5),inset 0 1px 0 rgba(255,255,255,0.15)",
            transform: hoverPlay ? "scale(1.03) translateY(-2px)" : "none",
            transition:"transform 0.15s,box-shadow 0.15s",
          }}
          onMouseEnter={()=>setHoverPlay(true)}
          onMouseLeave={()=>setHoverPlay(false)}
          onClick={onStart}
        >
          🏰 Begin the Siege
        </button>
        <button
          style={{
            width:"100%", padding:"12px 28px",
            fontFamily:FONT, fontSize:"0.95rem", letterSpacing:"0.1em",
            border:"2px solid rgba(100,130,200,0.35)", borderRadius:8,
            background:"rgba(30,50,100,0.15)", color:"#7ec8e3", cursor:"pointer",
            textTransform:"uppercase", transition:"background 0.2s,border-color 0.2s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(30,50,100,0.3)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(30,50,100,0.15)";}}
          onClick={onTeacher}
        >
          🏫 Teacher Menu
        </button>
      </div>

      {/* Feature cards */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",
        gap:12, maxWidth:720, width:"100%",
        animation:"slideUp 0.7s 0.28s ease both", position:"relative", zIndex:1,
      }}>
        {FEATURES.map(f=>(
          <div key={f.name} style={{
            background:"rgba(255,255,255,0.03)",
            border:"1px solid rgba(255,200,80,0.1)",
            borderRadius:10, padding:"14px 12px", textAlign:"center",
            transition:"border-color 0.2s,background 0.2s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,200,80,0.25)";e.currentTarget.style.background="rgba(255,200,80,0.05)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,200,80,0.1)";e.currentTarget.style.background="rgba(255,255,255,0.03)";}}
          >
            <div style={{fontSize:"1.8rem",marginBottom:7}}>{f.icon}</div>
            <div style={{fontFamily:FONT,fontSize:"0.8rem",color:"#ffd700",letterSpacing:"0.06em",textTransform:"uppercase"}}>{f.name}</div>
            <div style={{fontFamily:FONT_B,fontSize:"0.76rem",color:"#6b7280",marginTop:4,lineHeight:1.5}}>{f.desc}</div>
          </div>
        ))}
      </div>
      <p style={{color:"#3a3028",fontSize:"0.72rem",letterSpacing:"0.1em",position:"relative",zIndex:1}}>
        FOR EDUCATIONAL USE · GRADE 4–10 · SOUND ON FOR BEST EXPERIENCE 🔊
      </p>
    </div>
  );
}

export default function App() {
  const [screen,      setScreen]      = useState("menu");
  const [questions,   setQuestions]   = useState(defaultQuestions);
  const [gameResult,  setGameResult]  = useState(null);
  const [selectedMap, setSelectedMap] = useState("grasslands");

  const handleGameOver = useCallback((score,wave,streak,accuracy) => {
    setGameResult({score,wave,streak,accuracy});
    setScreen("gameover");
  },[]);

  const handleMapSelect = useCallback((mapId) => {
    setSelectedMap(mapId);
    setScreen("game");
  },[]);

  return (
    // 🟢 FIXED: Changed minHeight to height and used 100dvh
    <div style={{
      width:"100vw", height:"100dvh",
      fontFamily:FONT_B, color:"#e2d9c8",
      overflow:"hidden", position:"relative",
      background:"#050a0f",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');`}</style>

      {screen==="menu" && <><CastleWallBg/><MainMenu onStart={()=>setScreen("mapselect")} onTeacher={()=>setScreen("teacher")}/></>}
      {screen==="mapselect" && <MapSelect onSelect={handleMapSelect} onBack={()=>setScreen("menu")}/>}
      {screen==="game" && <GameScreen questions={questions} onGameOver={handleGameOver} onExit={()=>setScreen("menu")} mapId={selectedMap}/>}
      {screen==="teacher" && <TeacherMenu questions={questions} setQuestions={setQuestions} onBack={()=>setScreen("menu")}/>}
      {screen==="gameover" && gameResult && (
        <Scoreboard {...gameResult} onRestart={()=>setScreen("mapselect")} onMenu={()=>setScreen("menu")}/>
      )}
    </div>
  );
}

const styles = {
  menu: {
    display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center",
    height:"100%", gap:28, padding:"40px 20px", // 🟢 FIXED: Changed minHeight to height
    position:"relative", zIndex:1,
  },
};