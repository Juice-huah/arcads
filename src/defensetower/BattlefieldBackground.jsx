// ─────────────────────────────────────────────────────────────────────────────
//  BattlefieldBackground.jsx  –  Layered animated medieval castle battlefield:
//  sky, stars/moon (night), animated flags, torch flames, drifting fog,
//  hills, cobblestone path, fence, and detailed ground detail.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo } from "react";
import { MAP_CONFIGS } from "../defensetower/gameData";

/* ── Stars (night maps) ───────────────────────────────────────────────────── */
function Stars({ map }) {
  // Frozen map is now daytime — no stars
  return null;
  if (map.id !== "frozen") return null;
  return (
    <>
      {Array.from({length:50},(_,i)=>(
        <div key={i} style={{
          position:"absolute",
          left:`${(i*13.7)%100}%`,
          top:`${(i*9.3)%55}%`,
          width: i%4===0 ? 2 : 1.5,
          height: i%4===0 ? 2 : 1.5,
          borderRadius:"50%",
          background:"#fff",
          opacity:0.25+(i%4)*0.15,
          animation:`twinkle ${2+i%3}s ${(i%5)*0.6}s infinite alternate`,
        }}/>
      ))}
    </>
  );
}

/* ── Moon ─────────────────────────────────────────────────────────────────── */
function Moon({ map }) {
  // Frozen map is now daytime — no moon
  return null;
  if (map.id !== "frozen") return null;
  return (
    <div style={{
      position:"absolute", top:"5%", right:"8%",
      width:50, height:50, borderRadius:"50%",
      background:"radial-gradient(circle at 38% 38%, #fff5cc, #e8d060)",
      boxShadow:"0 0 30px rgba(240,210,80,0.3)",
      animation:"moonGlow 4s infinite alternate",
    }}/>
  );
}

/* ── Animated Clouds ─────────────────────────────────────────────────────── */
function Clouds({ map }) {
  const clouds = useMemo(() => Array.from({length:6},(_,i)=>({
    id:i, y:8+i*6, width:80+i*28, height:26+i*5,
    speed:26+i*7, delay:-i*7, opacity:0.4+(i%3)*0.15,
  })),[]);
  return (
    <>
      {clouds.map(c=>(
        <div key={c.id} style={{
          position:"absolute", top:`${c.y}%`,
          width:c.width, height:c.height,
          background:map.cloudColor,
          borderRadius:"50%",
          boxShadow:`${c.width*.3}px 0 ${c.width*.3}px ${map.cloudColor},${c.width*-.2}px 0 ${c.width*.2}px ${map.cloudColor}`,
          filter:"blur(2.5px)",
          opacity:c.opacity,
          animation:`cloudDrift ${c.speed}s ${c.delay}s linear infinite`,
        }}/>
      ))}
    </>
  );
}

/* ── Distant Castle / Keep Silhouette ─────────────────────────────────────── */
function DistantKeep({ map }) {
  const fill = map.id==="frozen" ? "rgba(80,120,160,0.35)" : "rgba(15,10,25,0.45)";
  return (
    <svg viewBox="0 0 340 130" style={{
      position:"absolute", bottom:"34%", right:"4%",
      width:"min(300px,26vw)", opacity:0.55, pointerEvents:"none",
      filter:`blur(1.2px) drop-shadow(0 0 10px ${map.hillColors[0]}55)`,
    }}>
      {/* Main wall */}
      <rect x="40" y="55" width="260" height="75" fill={fill}/>
      {/* Left tower */}
      <rect x="18" y="25" width="55" height="105" fill={fill}/>
      {[20,34,48,60].map((x,i)=><rect key={i} x={x} y="16" width="11" height="15" fill={fill}/>)}
      {/* Right tower */}
      <rect x="267" y="25" width="55" height="105" fill={fill}/>
      {[268,282,296,308].map((x,i)=><rect key={i} x={x} y="16" width="11" height="15" fill={fill}/>)}
      {/* Battlements */}
      {[54,78,102,126,150,174,198,222,246].map((x,i)=><rect key={i} x={x} y="47" width="18" height="12" fill={fill}/>)}
      {/* Gate */}
      <path d="M 140 130 L 140 82 Q 170 65 200 82 L 200 130 Z" fill="rgba(0,0,0,0.5)"/>
      {/* Flags */}
      {[46,290].map((x,i)=>(
        <g key={i}>
          <line x1={x} y1="0" x2={x} y2="26" stroke="rgba(120,90,30,0.8)" strokeWidth="1.5"/>
          <polygon points={`${x},2 ${x+24},10 ${x},18`} fill={i===0?"#dc262688":"#1d4ed888"}
            style={{animation:`flagFar 1.4s ease-in-out infinite`, transformOrigin:`${x}px 10px`}}/>
        </g>
      ))}
    </svg>
  );
}

/* ── Hills ────────────────────────────────────────────────────────────────── */
function Hills({ map }) {
  return (
    <>
      <div style={{
        position:"absolute", bottom:"30%", left:"-5%", right:"-5%", height:"22%",
        background:map.hillColors[2]||map.hillColors[0],
        borderRadius:"50% 50% 0 0 / 80% 80% 0 0",
        opacity:0.5, filter:"blur(3px)",
      }}/>
      <div style={{
        position:"absolute", bottom:"26%", left:"-10%", width:"62%", height:"20%",
        background:map.hillColors[1],
        borderRadius:"50% 50% 0 0 / 70% 70% 0 0",
        opacity:0.7, filter:"blur(1px)",
      }}/>
      <div style={{
        position:"absolute", bottom:"24%", right:"-5%", width:"56%", height:"18%",
        background:map.hillColors[1],
        borderRadius:"50% 50% 0 0 / 70% 70% 0 0",
        opacity:0.6, filter:"blur(1px)",
      }}/>
    </>
  );
}

/* ── Decorations (trees/cacti/crystals) ──────────────────────────────────── */
function Decorations({ map }) {
  const items = useMemo(()=>{
    if (map.id==="grasslands")
      return [{x:14,type:"tree",s:1},{x:28,type:"tree",s:.75},{x:74,type:"tree",s:1.1},{x:86,type:"tree",s:.85}];
    if (map.id==="desert")
      return [{x:17,type:"cactus",s:1},{x:44,type:"cactus",s:.7},{x:69,type:"cactus",s:1.2},{x:83,type:"cactus",s:.9}];
    return [{x:11,type:"crystal",s:1},{x:36,type:"crystal",s:.8},{x:64,type:"crystal",s:1.1},{x:87,type:"crystal",s:.75}];
  },[map.id]);
  return (
    <>
      {items.map((item,i)=>(
        <div key={i} style={{
          position:"absolute", bottom:"calc(18% + 58px)",
          left:`${item.x}%`, transform:`scale(${item.s})`,
          transformOrigin:"bottom center", pointerEvents:"none",
          opacity:0.7, fontSize:item.type==="tree"?"2rem":item.type==="cactus"?"1.8rem":"1.4rem",
        }}>
          {item.type==="tree"?"🌲":item.type==="cactus"?"🌵":"🔷"}
        </div>
      ))}
    </>
  );
}

/* ── Animated Castle Flags (left edge where castle sits) ──────────────────── */
function CastleFlags({ map }) {
  const colors = map.id==="frozen" ? ["#1d4ed8","#60a5fa"] : map.id==="desert" ? ["#dc2626","#fb923c"] : ["#dc2626","#ffd700"];
  return (
    <div style={{position:"absolute",left:0,bottom:"calc(18%+56px)",zIndex:12,pointerEvents:"none"}}>
      {[{x:8,h:44,c:colors[0]},{x:88,h:52,c:colors[1]}].map((f,i)=>(
        <div key={i} style={{
          position:"absolute", left:f.x, bottom:"calc(18% + 56px)",
          display:"flex", flexDirection:"column", alignItems:"center",
        }}>
          <div style={{
            width:28, height:16, borderRadius:"0 4px 4px 0",
            background:f.c, opacity:0.85,
            animation:`flagWave ${1.2+i*.2}s ease-in-out infinite`,
            transformOrigin:"left center",
            boxShadow:`0 0 6px ${f.c}66`,
          }}/>
          <div style={{width:3,height:f.h,background:"rgba(100,70,20,0.8)",borderRadius:"1px"}}/>
        </div>
      ))}
    </div>
  );
}

/* ── Fence ────────────────────────────────────────────────────────────────── */
function Fence({ map }) {
  const posts = Array.from({length:18},(_,i)=>i);
  const pColor = map.id==="frozen"?"#a8d8ea":map.id==="desert"?"#8b6914":"#6b4c2a";
  const rColor = map.id==="frozen"?"rgba(168,216,234,0.6)":"rgba(120,80,30,0.5)";
  return (
    <div style={{position:"absolute",bottom:"calc(18% + 56px)",left:0,right:0,height:28,pointerEvents:"none"}}>
      <div style={{position:"absolute",left:0,right:0,top:"35%",height:2,background:rColor}}/>
      <div style={{position:"absolute",left:0,right:0,top:"65%",height:2,background:rColor}}/>
      {posts.map(i=>(
        <div key={i} style={{
          position:"absolute", left:`${(i/18)*100}%`, top:0,
          width:4, height:"100%", background:pColor, borderRadius:"1px 1px 0 0",
          boxShadow:"1px 0 3px rgba(0,0,0,0.3)",
        }}/>
      ))}
    </div>
  );
}

/* ── Ground + Path ────────────────────────────────────────────────────────── */
function Ground({ map }) {
  const isIce    = map.id==="frozen";
  const isDesert = map.id==="desert";
  const groundGrad = isIce
    ? "linear-gradient(to bottom, #7ec8e3, #a8dadc)"
    : isDesert
    ? "linear-gradient(to bottom, #c8941a, #8b6914)"
    : "linear-gradient(to bottom, #2d6e12, #1a4a08)";
  const pathColor = isIce ? "#d0eef6" : isDesert ? "#e0c060" : "#a07840";

  return (
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:"calc(18% + 58px)"}}>
      {/* Ground base */}
      <div style={{position:"absolute",inset:0,background:groundGrad,borderTop:`3px solid ${isIce?"#60b8d8":isDesert?"#b07a10":"#1a5008"}`}}/>
      {/* Dirt path */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:58,
        background:`linear-gradient(to bottom, ${pathColor}cc, ${pathColor}88)`,
        borderTop:`2px solid ${isIce?"#b0d8e8":isDesert?"#c8a030":"#8b6520"}`,
        borderBottom:`2px solid ${isIce?"#90c8d8":isDesert?"#a07010":"#6b4a10"}`,
      }}>
        {/* Path texture */}
        {Array.from({length:22}).map((_,i)=>(
          <div key={i} style={{
            position:"absolute", left:`${i*4.8}%`, top:"40%",
            width:"3%", height:2,
            background:isIce?"rgba(180,220,240,0.35)":isDesert?"rgba(160,120,30,0.25)":"rgba(120,80,20,0.28)",
            borderRadius:1, animation:`pathRoll 2s ${i*.15}s infinite alternate`,
          }}/>
        ))}
        {/* Cobblestone stones on path */}
        {!isIce && Array.from({length:12}).map((_,i)=>(
          <div key={i} style={{
            position:"absolute",
            left:`${i*9+2}%`, top:"55%",
            width:"5%", height:8,
            background:isDesert?"rgba(160,130,40,0.3)":"rgba(100,70,20,0.25)",
            borderRadius:3, border:`1px solid ${isDesert?"rgba(140,110,30,0.2)":"rgba(80,50,10,0.2)"}`,
          }}/>
        ))}
      </div>
      {/* Grass blades */}
      {!isIce && !isDesert && Array.from({length:28}).map((_,i)=>(
        <div key={i} style={{
          position:"absolute", bottom:58,
          left:`${(i/28)*100 + (Math.sin(i)*2)}%`,
          width:3, height:10+i%8,
          background:"linear-gradient(to top, #2d6e12, #4caf30)",
          borderRadius:"50% 50% 0 0",
          transformOrigin:"bottom center",
          animation:`grassSway ${1.4+i%3*.4}s ${(i%4)*.5}s ease-in-out infinite alternate`,
        }}/>
      ))}
      {/* Ice cracks */}
      {isIce && (
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.28,pointerEvents:"none"}}>
          {Array.from({length:8},(_,i)=>(
            <line key={i} x1={`${i*14}%`} y1="0" x2={`${i*14+7}%`} y2="100%"
              stroke="#90c8e0" strokeWidth="1" strokeDasharray="4 8"/>
          ))}
        </svg>
      )}
      {/* Desert rocks */}
      {isDesert && [12,35,57,79].map((x,i)=>(
        <div key={i} style={{
          position:"absolute", left:`${x}%`, bottom:58,
          width:18+i*5, height:10+i*3,
          background:"radial-gradient(ellipse at 40% 40%, #d4a32a, #8b6914)",
          borderRadius:"50% 50% 40% 40%", opacity:0.7,
        }}/>
      ))}
    </div>
  );
}

/* ── Sky ──────────────────────────────────────────────────────────────────── */
function Sky({ map, wave }) {
  // Keep daytime throughout — only subtle darkening at very high waves (max 8%)
  const dark = Math.min(wave / 80, 0.08);
  return (
    <div style={{
      position:"absolute", inset:0,
      background:`linear-gradient(to bottom, ${map.sky[0]}, ${map.sky[1]}, ${map.sky[2]})`,
      filter:`brightness(${1 - dark})`,
      transition:"filter 3s ease",
    }}/>
  );
}

/* ── Fog / Atmosphere ─────────────────────────────────────────────────────── */
function Fog({ map, wave }) {
  const intensity = 0.07 + Math.min(wave/30, 0.10);
  return (
    <>
      <div style={{
        position:"absolute", bottom:"calc(18% + 56px - 2px)",
        left:0, right:0, height:60,
        background:`linear-gradient(to top, ${map.fogColor}, transparent)`,
        opacity: intensity, pointerEvents:"none",
      }}/>
      {/* Secondary distant fog */}
      <div style={{
        position:"absolute", bottom:"28%", left:0, right:0, height:60,
        background:`linear-gradient(to top, ${map.fogColor.replace(')','').replace('rgba','rgba').replace(/[\d.]+\)$/,`${intensity*0.6})`)}, transparent)`,
        pointerEvents:"none",
      }}/>
    </>
  );
}

/* ── Main BattlefieldBackground ───────────────────────────────────────────── */
export default function BattlefieldBackground({ mapId="grasslands", wave=1 }) {
  const map = MAP_CONFIGS.find(m=>m.id===mapId) ?? MAP_CONFIGS[0];

  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden",zIndex:0}}>
      <style>{`
        @keyframes cloudDrift { from{transform:translateX(-200px);}  to{transform:translateX(110vw);} }
        @keyframes grassSway  { from{transform:rotate(-13deg);}      to{transform:rotate(9deg);}    }
        @keyframes pathRoll   { from{opacity:0.2;}                   to{opacity:0.6;}               }
        @keyframes flagWave   { 0%,100%{transform:rotate(-13deg) scaleX(1);} 50%{transform:rotate(13deg) scaleX(0.8);} }
        @keyframes flagFar    { 0%,100%{transform:rotate(-8deg) scaleX(1);}  50%{transform:rotate(8deg) scaleX(0.85);} }
        @keyframes torchFlame { 0%,100%{opacity:0.8;transform:scaleY(1);}    50%{opacity:1;transform:scaleY(1.18);} }
        @keyframes twinkle    { from{opacity:0.2;} to{opacity:0.9;} }
        @keyframes moonGlow   { from{box-shadow:0 0 20px rgba(240,210,80,0.2);} to{box-shadow:0 0 50px rgba(240,210,80,0.4);} }
      `}</style>

      <Sky map={map} wave={wave}/>
      <Stars map={map}/>
      <Moon map={map}/>
      <Clouds map={map}/>
      <DistantKeep map={map}/>
      <Hills map={map}/>
      <Decorations map={map}/>
      <CastleFlags map={map}/>
      <Fence map={map}/>
      <Ground map={map}/>
      <Fog map={map} wave={wave}/>

      {/* Path torches */}
      {[22,50,78].map((x,i)=>(
        <div key={i} style={{
          position:"absolute", bottom:"calc(18% + 56px)",
          left:`${x}%`, display:"flex", flexDirection:"column",
          alignItems:"center", pointerEvents:"none", zIndex:2,
        }}>
          <div style={{fontSize:"1.05rem", animation:`torchFlame ${0.75+i*.2}s ${i*.15}s infinite alternate`}}>🔥</div>
          <div style={{
            width:3, height:22,
            background:map.id==="frozen"?"#90c8e0":"#6b4a18",
            borderRadius:1,
          }}/>
        </div>
      ))}
    </div>
  );
}