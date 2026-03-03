// ─────────────────────────────────────────────────────────────────────────────
//  MapSelect.jsx  –  Castle-themed battlefield map selection
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { MAP_CONFIGS } from "../defensetower/gameData";

const FONT   = "'Cinzel','Palatino Linotype',serif";
const FONT_B = "'Crimson Text','Georgia',serif";

/* ── Mini Castle silhouette for card preview ─────────────────────────────── */
function MiniCastle({ color, accent }) {
  return (
    <svg viewBox="0 0 200 90" style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:"80%",opacity:0.6,pointerEvents:"none"}}>
      <rect x="20" y="35" width="160" height="55" fill={color}/>
      <rect x="0"  y="15" width="50" height="75" fill={color}/>
      <rect x="150" y="15" width="50" height="75" fill={color}/>
      {[1,14,27,40].map((x,i)=><rect key={i} x={x} y="6" width="10" height="12" fill={color}/>)}
      {[150,163,177,190].map((x,i)=><rect key={i} x={x} y="6" width="10" height="12" fill={color}/>)}
      {[25,45,65,85,105,125,145,165].map((x,i)=><rect key={i} x={x} y="28" width="14" height="10" fill={color}/>)}
      <path d="M 80 90 L 80 60 Q 100 48 120 60 L 120 90 Z" fill="rgba(0,0,0,0.5)"/>
      <line x1="100" y1="0" x2="100" y2="30" stroke="rgba(150,120,60,0.7)" strokeWidth="2"/>
      <polygon points="100,2 118,10 100,18" fill={accent} style={{animation:"cardFlag 1.3s ease-in-out infinite", transformOrigin:"100px 10px"}}/>
    </svg>
  );
}

/* ── Map Card ─────────────────────────────────────────────────────────────── */
function MapCard({ map, selected, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const active = selected || hovered;

  // Map-specific castle color
  const castleColor = map.id==="frozen" ? "rgba(20,40,80,0.7)" : map.id==="desert" ? "rgba(50,25,5,0.7)" : "rgba(10,15,5,0.7)";

  return (
    <div
      onClick={() => onSelect(map.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor:"pointer",
        border:`2px solid ${active ? map.accent : "rgba(255,255,255,0.08)"}`,
        borderRadius:16, overflow:"hidden",
        transition:"transform 0.2s, box-shadow 0.2s, border-color 0.2s",
        transform: active ? "scale(1.04) translateY(-5px)" : "scale(1)",
        boxShadow: active
          ? `0 20px 50px rgba(0,0,0,0.65), 0 0 28px ${map.accent}44`
          : "0 6px 24px rgba(0,0,0,0.4)",
        flex:"1 1 220px", maxWidth:255,
        position:"relative",
      }}
    >
      {/* Sky / scene preview */}
      <div style={{
        height:130,
        background:`linear-gradient(to bottom, ${map.sky[0]}, ${map.sky[1]}, ${map.sky[2]})`,
        position:"relative", overflow:"hidden",
      }}>
        {/* No stars or moon — frozen map is daytime */}
        {/* Sun for frozen map */}
        {map.id==="frozen" && (
          <div style={{
            position:"absolute", top:8, right:14,
            width:26, height:26, borderRadius:"50%",
            background:"radial-gradient(circle at 40% 40%, #fff9c4, #ffe082)",
            boxShadow:"0 0 18px rgba(255,235,100,0.6), 0 0 6px rgba(255,220,50,0.8)",
          }}/>
        )}
        {/* Drifting clouds */}
        <div style={{
          position:"absolute", top:14, left:"5%",
          width:75, height:22, background:map.cloudColor,
          borderRadius:"50%", filter:"blur(2px)", opacity:0.75,
          animation:"cloudDriftCard 11s -2s linear infinite",
        }}/>
        <div style={{
          position:"absolute", top:28, left:"55%",
          width:50, height:16, background:map.cloudColor,
          borderRadius:"50%", filter:"blur(1.5px)", opacity:0.6,
          animation:"cloudDriftCard 8s -5s linear infinite",
        }}/>
        {/* Hills */}
        <div style={{
          position:"absolute", bottom:24, left:"-5%", right:"-5%",
          height:38, background:map.hillColors[1],
          borderRadius:"50% 50% 0 0", opacity:0.65,
        }}/>
        {/* Ground strip */}
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:26,
          background:`linear-gradient(to bottom, ${map.path}, ${map.ground[1]})`,
          borderTop:`2px solid ${map.accent}44`,
        }}/>
        {/* Castle silhouette */}
        <MiniCastle color={castleColor} accent={map.accent}/>
        {/* Map icon */}
        <div style={{
          position:"absolute", top:8, left:10,
          fontSize:"1.6rem",
          filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
        }}>{map.icon}</div>
        {/* Selected badge */}
        {selected && (
          <div style={{
            position:"absolute", top:8, right:8,
            fontFamily:FONT, fontSize:"0.58rem", letterSpacing:"0.12em",
            color:"#fff", background:map.accent, padding:"3px 9px",
            borderRadius:4, fontWeight:700,
          }}>✓ CHOSEN</div>
        )}
        {/* Fog at bottom */}
        <div style={{
          position:"absolute", bottom:24, left:0, right:0, height:18,
          background:`linear-gradient(to top, ${map.fogColor}, transparent)`,
          pointerEvents:"none",
        }}/>
      </div>

      {/* Info panel */}
      <div style={{
        background:"linear-gradient(to bottom, rgba(8,15,28,0.98), rgba(5,8,18,0.99))",
        padding:"13px 15px 15px",
      }}>
        <div style={{
          fontFamily:FONT, fontSize:"0.92rem", fontWeight:700,
          color: active ? map.accent : "#e2d9c8",
          letterSpacing:"0.08em", marginBottom:5,
          transition:"color 0.2s",
        }}>{map.name}</div>
        <div style={{
          fontFamily:FONT_B, fontSize:"0.8rem", color:"#6b7280",
          lineHeight:1.5, fontStyle:"italic",
        }}>{map.desc}</div>
        {/* Accent bar */}
        <div style={{
          marginTop:10, height:2,
          background:`linear-gradient(90deg, ${map.accent}, transparent)`,
          borderRadius:1, width: active ? "100%" : "0%",
          transition:"width 0.32s ease",
        }}/>
      </div>
    </div>
  );
}

/* ── MapSelect Main ───────────────────────────────────────────────────────── */
export default function MapSelect({ onSelect, onBack }) {
  const [chosen, setChosen] = useState("grasslands");
  const selected = MAP_CONFIGS.find(m=>m.id===chosen) ?? MAP_CONFIGS[0];

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        @keyframes cloudDriftCard { from{transform:translateX(-130px);} to{transform:translateX(320px);} }
        @keyframes cardFlag { 0%,100%{transform:rotate(-10deg) scaleX(1);} 50%{transform:rotate(10deg) scaleX(0.82);} }
        @keyframes twinkle  { from{opacity:0.2;} to{opacity:0.9;} }
        @keyframes fadeSlide{ from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:none;} }
        * { box-sizing:border-box; margin:0; padding:0; }
      `}</style>

      {/* Background */}
      <div style={{
        position:"fixed", inset:0, zIndex:0,
        background:`radial-gradient(ellipse at 50% 25%, ${selected.sky[0]}33 0%, #060c18 65%)`,
        transition:"background 0.7s ease",
      }}/>
      {/* Subtle stone pattern overlay */}
      <div style={{
        position:"fixed", inset:0, zIndex:0, opacity:0.03,
        backgroundImage:"repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px)",
        backgroundSize:"48px 48px",
      }}/>

      <div style={{...styles.content, position:"relative", zIndex:1}}>
        {/* Header */}
        <div style={{textAlign:"center", animation:"fadeSlide 0.5s ease both"}}>
          <div style={{fontSize:"2.2rem", marginBottom:8}}>🗺️</div>
          <h2 style={{
            fontFamily:FONT, fontSize:"clamp(1.5rem,4.5vw,2.4rem)", fontWeight:900,
            background:"linear-gradient(135deg, #ffd700, #ff8c00)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
          }}>
            Choose Your Battlefield
          </h2>
          <p style={{fontFamily:FONT_B, fontSize:"0.95rem", color:"#6b7280", fontStyle:"italic", marginTop:6}}>
            Each map is a different medieval fortress to defend
          </p>
        </div>

        {/* Cards */}
        <div style={{...styles.cardsRow, animation:"fadeSlide 0.5s 0.1s ease both"}}>
          {MAP_CONFIGS.map(map=>(
            <MapCard key={map.id} map={map} selected={chosen===map.id} onSelect={setChosen}/>
          ))}
        </div>

        <div style={{fontFamily:FONT_B, fontSize:"0.82rem", color:"#4b5563", textAlign:"center", animation:"fadeSlide 0.5s 0.18s ease both"}}>
          All maps share the same wave difficulty · appearance only
        </div>

        {/* Action buttons */}
        <div style={{display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center", animation:"fadeSlide 0.5s 0.24s ease both"}}>
          <button style={styles.btnBack} onClick={onBack}>← Back to Menu</button>
          <button style={{
            ...styles.btnStart,
            boxShadow:`0 8px 28px ${selected.accent}66`,
            background:`linear-gradient(135deg, ${selected.accent}cc, ${selected.accent}88)`,
          }} onClick={()=>onSelect(chosen)}>
            ⚔️ Deploy to {selected.name}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight:"100vh", display:"flex", alignItems:"center",
    justifyContent:"center", padding:"36px 20px", position:"relative", overflow:"hidden",
  },
  content: {
    display:"flex", flexDirection:"column", alignItems:"center",
    gap:26, maxWidth:860, width:"100%",
  },
  cardsRow: {
    display:"flex", gap:18, flexWrap:"wrap",
    justifyContent:"center", width:"100%",
  },
  btnBack: {
    padding:"11px 26px",
    background:"transparent", border:"2px solid rgba(255,255,255,0.12)",
    borderRadius:8, color:"#9ca3af",
    fontFamily:"'Cinzel','Palatino Linotype',serif",
    fontSize:"0.86rem", letterSpacing:"0.1em", cursor:"pointer",
    transition:"border-color 0.2s,color 0.2s",
  },
  btnStart: {
    padding:"14px 36px", border:"none", borderRadius:8,
    color:"#0a0800",
    fontFamily:"'Cinzel','Palatino Linotype',serif",
    fontSize:"1rem", fontWeight:700, letterSpacing:"0.12em",
    cursor:"pointer", textTransform:"uppercase",
    transition:"transform 0.15s,box-shadow 0.2s",
  },
};