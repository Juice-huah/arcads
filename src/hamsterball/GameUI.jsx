// ─── src/hamsterball/GameUI.jsx ───────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { WORLDS, SKINS, KEYFRAMES, STREAK_BOOSTS, WORD_CATEGORIES, CATEGORIZED_WORDS, getTargetLetter } from "./gameData.js";

export function GlobalStyles() { return <style>{KEYFRAMES}</style>; }

export function Btn({ children, onClick, color="#60a5fa", style={}, disabled=false, size="md" }) {
  const [h,setH] = useState(false);
  const pad = size==="lg"?"14px 28px":size==="sm"?"7px 14px":"11px 22px";
  const fs  = size==="lg"?16:size==="sm"?12:14;
  return (
    <button onClick={disabled?undefined:onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:h&&!disabled?`${color}1c`:"rgba(255,255,255,.04)",
        border:`1.5px solid ${disabled?"rgba(255,255,255,.1)":h?color:color+"55"}`,
        borderRadius:12, padding:pad, color:disabled?"rgba(255,255,255,.25)":color,
        fontFamily:"'Exo 2',monospace", fontSize:fs, fontWeight:700, letterSpacing:1.5,
        cursor:disabled?"not-allowed":"pointer", transition:"all .15s",
        transform:h&&!disabled?"translateX(5px)":"none",
        boxShadow:h&&!disabled?`0 4px 18px ${color}33`:"none", ...style }}>
      {children}
    </button>
  );
}

export function MenuScreen({ onPlay, onSkins, onExit, bestStreak, bestScore, unlockedSkins }) {
  const stars = Array.from({length:55},(_,i)=>({
    left:`${(i*17.3)%100}%`, top:`${(i*13.7)%100}%`, s:i%5===0?3.5:1.5,
    d:`${(i*.12)%3}s`, t:`${1.5+(i%5)*.4}s`,
  }));
  return (
    <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 38%,#0d1b2a 0%,#050c14 100%)",
      display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",zIndex:500}}>
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        {stars.map((s,i)=>(
          <div key={i} style={{position:"absolute",borderRadius:"50%",
            background:i%6===0?"#c084fc":i%4===0?"#38bdf8":"#fff",
            left:s.left,top:s.top,width:s.s,height:s.s,opacity:.18,
            animation:`hPulse ${s.t} ${s.d} ease-in-out infinite`}} />
        ))}
      </div>
      <div style={{position:"relative",zIndex:5,textAlign:"center",animation:"hSlideUp .6s ease-out"}}>
        <div style={{fontSize:108,animation:"hFloat 3.0s ease-in-out infinite",
          filter:"drop-shadow(0 0 55px rgba(74,222,128,.9)) drop-shadow(0 0 22px rgba(192,132,252,.6))",marginBottom:10}}>🐹</div>
        <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:"clamp(32px,6vw,68px)",
          background:"linear-gradient(135deg,#fff 0%,#86efac 35%,#c084fc 70%,#f9a8d4 100%)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:2,lineHeight:1}}>
          HamsterBall
        </div>
        <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:"clamp(16px,2.5vw,26px)",
          color:"rgba(255,255,255,.42)",letterSpacing:7,marginBottom:18,textTransform:"uppercase"}}>
          Word Chain Race
        </div>
        {bestScore > 0 && (
          <div style={{display:"inline-flex",gap:18,background:"rgba(251,191,36,.08)",
            border:"1px solid rgba(251,191,36,.25)",borderRadius:30,padding:"6px 22px",marginBottom:28}}>
            <span style={{fontFamily:"'Exo 2',sans-serif",fontSize:12,color:"#fbbf24"}}>🏆 {bestScore.toLocaleString()}</span>
            <span style={{color:"rgba(255,255,255,.2)"}}>|</span>
            <span style={{fontFamily:"'Exo 2',sans-serif",fontSize:12,color:"#4ade80"}}>🔥 ×{bestStreak} best streak</span>
            <span style={{color:"rgba(255,255,255,.2)"}}>|</span>
            <span style={{fontFamily:"'Exo 2',sans-serif",fontSize:12,color:"#c084fc"}}>🐹 {unlockedSkins} skins</span>
          </div>
        )}
      </div>
      <div style={{position:"relative",zIndex:5,display:"flex",flexDirection:"column",gap:10,minWidth:340}}>
        {[
          {label:"▶  PLAY",            sub:"Roll & chain words across 5 worlds!", color:"#4ade80", fn:onPlay},
          {label:"🐹  HAMSTER SKINS",  sub:"Unlock at streak milestones",          color:"#c084fc", fn:onSkins},
          {label:"🚪  EXIT ARCADE",    sub:"Return to student dashboard",          color:"#ef4444", fn:onExit},
        ].map((b,i)=>{
          const [h,setH] = useState(false);
          return (
            <button key={i} onClick={b.fn} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
              style={{background:h?`${b.color}12`:"rgba(255,255,255,.04)",
                border:`1.5px solid ${h?b.color:b.color+"44"}`,borderRadius:14,padding:"15px 22px",
                cursor:"pointer",textAlign:"left",fontFamily:"'Exo 2',sans-serif",
                transform:h?"translateX(8px)":"none",transition:"all .16s",
                animation:`hSlideUp .5s ${i*.1+.12}s ease-out both`,
                boxShadow:h?`0 8px 32px ${b.color}22`:"none"}}>
              <div style={{fontSize:15,fontWeight:700,letterSpacing:2,color:b.color}}>{b.label}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:3,fontFamily:"'Nunito',sans-serif"}}>{b.sub}</div>
            </button>
          );
        })}
      </div>
      <div style={{position:"relative",zIndex:5,marginTop:22,fontFamily:"'Nunito',sans-serif",
        fontSize:11,color:"rgba(255,255,255,.18)",letterSpacing:2,textAlign:"center",animation:"hSlideUp .5s .5s ease-out both"}}>
        ← → STEER &nbsp;·&nbsp; SPACE / ↑ JUMP (DOUBLE JUMP ENABLED!)
      </div>
    </div>
  );
}

export function WorldScreen({ scores, onSelect, onBack }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(4,6,18,.97)",display:"flex",
      alignItems:"center",justifyContent:"center",flexDirection:"column",zIndex:500,overflow:"auto",padding:"20px 0"}}>
      <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:34,color:"#fff",letterSpacing:2,marginBottom:6,animation:"hSlideUp .4s"}}>
        Choose Your World
      </div>
      <div style={{fontSize:13,color:"rgba(255,255,255,.35)",marginBottom:26,fontFamily:"'Nunito',sans-serif"}}>
        All worlds unlocked — pick any terrain! 🌍
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(192px,1fr))",gap:14,maxWidth:860,padding:"0 20px",width:"100%"}}>
        {WORLDS.map((w,i)=>{
          const [h,setH] = useState(false); const sc = scores[w.id];
          return (
            <div key={w.id} onClick={()=>onSelect(w.id)} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
              style={{background:h?`${w.color}0e`:"rgba(255,255,255,.04)",
                border:`1.5px solid ${h?w.color:w.color+"44"}`,borderRadius:18,padding:"18px 16px",
                cursor:"pointer",transition:"all .2s",
                transform:h?"translateY(-5px)":"none",boxShadow:h?`0 12px 36px ${w.color}33`:"none",
                animation:`hSlideUp .4s ${i*.07}s ease-out both`,position:"relative"}}>
              <div style={{fontSize:36,marginBottom:8}}>{w.emoji}</div>
              <div style={{fontFamily:"'Exo 2',sans-serif",fontSize:9,color:w.color,letterSpacing:2,
                background:w.color+"22",padding:"3px 8px",borderRadius:5,display:"inline-block",marginBottom:6}}>
                WORLD {w.id}
              </div>
              <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:15,color:w.color,marginBottom:5}}>{w.name}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.45)",fontFamily:"'Nunito',sans-serif",lineHeight:1.5,marginBottom:8}}>{w.desc}</div>
              {sc && <div style={{fontFamily:"'Exo 2',sans-serif",fontSize:11,color:"#fbbf24"}}>🏆 {sc.score?.toLocaleString()} &nbsp;·&nbsp; 🔥×{sc.streak}</div>}
              <div style={{position:"absolute",top:10,right:10,fontSize:10,color:w.color,
                background:w.color+"22",padding:"2px 7px",borderRadius:5,fontFamily:"'Exo 2',sans-serif",fontWeight:700}}>✓ FREE</div>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:24}}><Btn onClick={onBack} color="#60a5fa">← BACK</Btn></div>
    </div>
  );
}

export function SkinScreen({ bestStreak, selectedSkin, onSelect, onBack }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(4,6,18,.97)",display:"flex",
      alignItems:"center",justifyContent:"center",flexDirection:"column",zIndex:500,overflow:"auto",padding:"20px 0"}}>
      <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:28,color:"#c084fc",letterSpacing:2,marginBottom:4}}>
        🐹 Hamster Skins
      </div>
      <div style={{fontSize:12,color:"rgba(255,255,255,.35)",marginBottom:24,fontFamily:"'Nunito',sans-serif",textAlign:"center",padding:"0 20px"}}>
        Build word streaks to unlock new hamster looks!<br/>
        <span style={{color:"rgba(255,255,255,.22)",fontSize:11}}>Your best streak: 🔥×{bestStreak} · Milestones: ×5, ×10, ×15, ×20, ×30</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,maxWidth:640,padding:"0 20px",width:"100%"}}>
        {SKINS.map((s,i)=>{
          const locked = bestStreak < s.streakUnlock; const active = selectedSkin===s.id;
          const [h,setH] = useState(false);
          const bodyHex = `#${s.body.toString(16).padStart(6,"0")}`;
          const pct = s.streakUnlock > 0 ? Math.min(100,(bestStreak/s.streakUnlock)*100) : 100;
          return (
            <div key={s.id} onClick={()=>!locked&&onSelect(s.id)}
              onMouseEnter={()=>!locked&&setH(true)} onMouseLeave={()=>setH(false)}
              style={{background:active?"rgba(192,132,252,.18)":h?"rgba(255,255,255,.06)":"rgba(255,255,255,.03)",
                border:`2px solid ${active?"#c084fc":locked?"rgba(255,255,255,.06)":h?"rgba(192,132,252,.7)":"rgba(255,255,255,.1)"}`,
                borderRadius:16,padding:"16px 12px",cursor:locked?"not-allowed":"pointer",opacity:locked?.45:1,
                textAlign:"center",transition:"all .2s",transform:h&&!locked?"translateY(-4px)":"none",
                boxShadow:active?"0 0 28px rgba(192,132,252,.4)":"none",
                animation:`hSlideUp .4s ${i*.06}s ease-out both`}}>
              <div style={{fontSize:40,marginBottom:8,filter:locked?"grayscale(1) brightness(.5)":"none",
                animation:active?"hFloat 2.5s ease-in-out infinite":"none"}}>🐹</div>
              <div style={{width:18,height:18,borderRadius:"50%",background:bodyHex,margin:"0 auto 8px",border:"2px solid rgba(255,255,255,.3)"}} />
              <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:14,color:active?"#c084fc":"#fff",marginBottom:4}}>{s.name}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.4)",fontFamily:"'Nunito',sans-serif",marginBottom:8}}>{s.desc}</div>
              {locked?(
                <div>
                  <div style={{fontFamily:"'Exo 2',sans-serif",fontSize:9,color:"#fbbf24",marginBottom:6}}>🔒 Streak ×{s.streakUnlock}</div>
                  <div style={{height:4,background:"rgba(255,255,255,.08)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#f97316,#fbbf24)",borderRadius:3,transition:"width .5s"}} />
                  </div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,.3)",marginTop:3,fontFamily:"'Exo 2',sans-serif"}}>{bestStreak}/{s.streakUnlock}</div>
                </div>
              ):active?(
                <div style={{fontFamily:"'Exo 2',sans-serif",fontSize:10,color:"#4ade80",letterSpacing:1}}>✓ EQUIPPED</div>
              ):(
                <div style={{fontFamily:"'Exo 2',sans-serif",fontSize:9,color:"rgba(255,255,255,.3)"}}>click to equip</div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{marginTop:24}}><Btn onClick={onBack} color="#c084fc">← BACK</Btn></div>
    </div>
  );
}

export function CountdownScreen({ count, world }) {
  const [k,setK] = useState(0);
  useEffect(()=>setK(c=>c+1),[count]);
  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",
      justifyContent:"center",flexDirection:"column",zIndex:500,pointerEvents:"none"}}>
      <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,color:"rgba(255,255,255,.5)",
        letterSpacing:5,marginBottom:20,textTransform:"uppercase"}}>
        {world?.emoji} {world?.name} · GET READY
      </div>
      <div key={k} style={{fontFamily:"'Fredoka One',sans-serif",fontWeight:900,
        fontSize:count===0?72:148,color:count===0?"#4ade80":"#fbbf24",
        textShadow:`0 0 100px ${count===0?"#4ade80":"#fbbf24"}, 0 0 44px ${count===0?"#4ade8066":"#fbbf2466"}`,
        animation:"hCountdown .9s ease-out"}}>
        {count===0?"ROLL! 🐹":count}
      </div>
    </div>
  );
}

export function GameHUD({ hud }) {
  const { score, lives, hp, combo, timerSec, worldName, worldColor, worldEmoji, activePowerups, streak, gameTime } = hud;
  const timerPct = Math.min(100,(timerSec/(gameTime||120))*100);
  const tc = timerPct>50?"#4ade80":timerPct>25?"#fbbf24":"#f87171";
  const hpC = hp>60?"linear-gradient(90deg,#4ade80,#22d3ee)":hp>30?"linear-gradient(90deg,#fbbf24,#f97316)":"linear-gradient(90deg,#ef4444,#f43f5e)";
  const mins=Math.floor(timerSec/60), secs=Math.floor(timerSec%60);

  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:250}}>
      <div style={{position:"absolute",top:0,left:0,right:0,padding:"10px 16px 14px",
        background:"linear-gradient(180deg,rgba(4,6,18,.95) 0%,rgba(4,6,18,.55) 75%,transparent 100%)",
        display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div style={{minWidth:130}}>
          <div style={{display:"flex",gap:5,marginBottom:6}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{fontSize:20,opacity:i<lives?1:.15,filter:i<lives?"drop-shadow(0 0 10px #4ade80)":"none",transition:"all .3s"}}>
                {i<lives?"🐹":"💀"}
              </div>
            ))}
          </div>
          <div style={{width:120,height:8,background:"rgba(255,255,255,.09)",borderRadius:5,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${hp}%`,background:hpC,borderRadius:5,transition:"width .22s"}} />
          </div>
          <div style={{fontFamily:"'Exo 2',sans-serif",fontSize:9,color:"rgba(255,255,255,.3)",letterSpacing:2,marginTop:3}}>ENERGY {hp}%</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Exo 2',sans-serif",fontSize:10,color:worldColor,letterSpacing:2,
            background:worldColor+"22",border:`1px solid ${worldColor}44`,padding:"3px 12px",borderRadius:20,display:"inline-block",marginBottom:6}}>
            {worldEmoji} {worldName}
          </div>
          {streak >= 3 && (
            <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:14,
              color:streak>=10?"#c084fc":streak>=6?"#38bdf8":"#f97316",
              background:"rgba(0,0,0,.65)",borderRadius:10,padding:"3px 12px",
              animation:"hBounce .6s ease-in-out infinite",display:"inline-block"}}>
              🔥 {streak} STREAK!
            </div>
          )}
        </div>
        <div style={{textAlign:"right",minWidth:130}}>
          <div style={{fontFamily:"'Exo 2',sans-serif",fontSize:9,color:"rgba(255,255,255,.35)",letterSpacing:3}}>SCORE</div>
          <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:28,color:"#fbbf24",lineHeight:1,textShadow:"0 0 24px #fbbf2488"}}>{score.toLocaleString()}</div>
          <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:22,color:tc,lineHeight:1.2,
            animation:timerPct<25?"hPulse .5s ease-in-out infinite":"none"}}>
            ⏱ {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
          </div>
          <div style={{width:90,height:3,background:"rgba(255,255,255,.09)",borderRadius:2,overflow:"hidden",marginTop:4,marginLeft:"auto"}}>
            <div style={{height:"100%",width:`${timerPct}%`,background:tc,transition:"width .5s,background .5s"}} />
          </div>
        </div>
      </div>
      {combo >= 2 && (
        <div style={{position:"absolute",top:76,left:"50%",transform:"translateX(-50%)",
          fontFamily:"'Fredoka One',sans-serif",fontSize:combo>=10?26:combo>=6?22:18,
          color:combo>=10?"#f43f5e":combo>=6?"#f97316":"#fbbf24",textShadow:"0 0 28px currentColor",
          background:"rgba(0,0,0,.7)",border:`2px solid ${combo>=10?"#f43f5e":combo>=6?"#f97316":"#fbbf2488"}`,
          borderRadius:14,padding:"5px 18px",animation:"hBounce .55s ease-in-out infinite"}}>
          ✨ ×{combo} COMBO
        </div>
      )}
      <div style={{position:"absolute",bottom:220,left:14,display:"flex",flexDirection:"column",gap:5}}>
        {Object.entries(activePowerups||{}).map(([id,t])=>{
          if(!t||t<=0) return null;
          const colors={boost:"#f97316",double:"#c084fc"}; const c=colors[id]||"#fff";
          return (
            <div key={id} style={{background:"rgba(0,0,0,.8)",border:`1px solid ${c}`,borderRadius:8,
              padding:"4px 10px",display:"flex",alignItems:"center",gap:6,color:c,
              fontFamily:"'Exo 2',sans-serif",fontSize:11,fontWeight:700,animation:"hGlow .9s ease-in-out infinite"}}>
              {id==="boost"?"⚡":"✨"} {id.toUpperCase()} {Math.ceil(t)}s
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 🟢 NEW: 4-CHOICE CHAIN LINK OVERLAY 
export function WordPromptOverlay({ promptData, onSubmit, flash, worldColor }) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setSelected(null);
  }, [promptData?.word]);

  if (!promptData || !promptData.options) return null;
  const { word, targetLetter, options, correct } = promptData;
  const col = worldColor || "#4ade80";

  const handleSelect = (opt) => {
    if (selected) return; 
    setSelected(opt);
    onSubmit(opt);
  };

  const isCorrect = flash === "correct";
  const isWrong   = flash === "wrong";
  const borderCol = isCorrect ? "#4ade80" : isWrong ? "#ef4444" : col;
  const bgGrad    = isCorrect
    ? "linear-gradient(160deg,rgba(4,8,24,.96) 0%,rgba(20,50,30,.96) 100%)"
    : isWrong
    ? "linear-gradient(160deg,rgba(4,8,24,.96) 0%,rgba(50,15,15,.96) 100%)"
    : "linear-gradient(160deg,rgba(4,8,28,.94) 0%,rgba(10,14,34,.94) 100%)";

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 450 }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 100%, transparent 35%, rgba(4,8,30,.52) 100%)",
      }} />

      <div style={{
        position: "absolute", top: 78, left: 14, pointerEvents: "none",
        background: "rgba(251,191,36,.13)", border: "1.5px solid rgba(251,191,36,.55)",
        borderRadius: 10, padding: "5px 13px",
        fontFamily: "'Exo 2',sans-serif", fontSize: 10, color: "#fbbf24",
        letterSpacing: 2, animation: "hPulse 1s ease-in-out infinite",
      }}>🐢 SLOW MOTION</div>

      <div style={{
        position: "absolute", top: "14%", left: "50%",
        transform: "translateX(-50%)",
        width: "min(560px, 94vw)",
        pointerEvents: "all",
        background: bgGrad,
        border: `2.5px solid ${borderCol}`,
        borderRadius: 26,
        padding: "26px 28px 22px",
        boxShadow: `0 0 90px ${col}50, 0 28px 64px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.07)`,
        animation: isWrong ? "hShake .5s ease-in-out" : isCorrect ? "hCorrect .5s ease-in-out" : "hRingEntry .4s cubic-bezier(.2,1.3,.5,1) both",
      }}>

        {/* 🟢 THEMED AS A PHYSICAL CHAIN LINK! */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          
          <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, color: "rgba(255,255,255,.45)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
            Build the Chain!
          </div>

          <div style={{
            display: "inline-block", background: "rgba(0,0,0,0.6)", 
            border: `2px solid ${col}`, borderRadius: 20, padding: "10px 30px",
            fontFamily: "'Fredoka One',sans-serif", fontSize: 42, color: col,
            letterSpacing: 4
          }}>
            {word.toUpperCase()}
          </div>

          <div style={{ fontSize: 36, color: "#fbbf24", margin: "5px 0", animation: "hFloat 1s infinite" }}>
            🔗
          </div>

          <div style={{
            display: "inline-block", background: "rgba(251,191,36,0.15)", 
            border: `2px dashed #fbbf24`, borderRadius: 20, padding: "10px 30px",
            fontFamily: "'Fredoka One',sans-serif", fontSize: 42, color: "#fbbf24",
            letterSpacing: 4
          }}>
            {targetLetter} <span style={{ opacity: 0.3 }}>_ _ _</span>
          </div>
        </div>

        {/* 4 BUTTON GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {options.map((opt, idx) => {
                let btnBg = `${col}1c`;
                let btnBorder = `${col}88`;
                let btnText = "#fff";

                if (selected) {
                    if (opt === correct) {
                        btnBg = "rgba(74,222,128,.2)"; 
                        btnBorder = "#4ade80"; 
                        btnText = "#4ade80";
                    } else if (opt === selected) {
                        btnBg = "rgba(239,68,68,.2)"; 
                        btnBorder = "#ef4444"; 
                        btnText = "#f87171";
                    } else {
                        btnBg = "rgba(255,255,255,.05)"; 
                        btnBorder = "rgba(255,255,255,.1)"; 
                        btnText = "rgba(255,255,255,.3)";
                    }
                }

                return (
                    <button 
                        key={`${opt}-${idx}`}
                        onClick={() => handleSelect(opt)}
                        disabled={!!selected}
                        style={{
                            padding: "18px 10px", 
                            borderRadius: 16, 
                            background: btnBg, 
                            border: `2.5px solid ${btnBorder}`,
                            color: btnText, 
                            fontFamily: "'Fredoka One',sans-serif", 
                            fontSize: 22, 
                            cursor: selected ? "default" : "pointer",
                            transition: "all .2s", 
                            letterSpacing: 2, 
                            textTransform: "uppercase",
                            boxShadow: selected ? "none" : `0 4px 15px ${col}22`
                        }}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>

        <div style={{
          textAlign: "center", marginTop: 16, minHeight: 28,
          fontFamily: "'Fredoka One',sans-serif", fontSize: 18,
          color: isCorrect ? "#4ade80" : isWrong ? "#f87171" : "transparent",
          textShadow: isCorrect ? "0 0 22px #4ade80" : isWrong ? "0 0 22px #ef4444" : "none",
          transition: "color .2s",
        }}>
          {isCorrect && "✓ Correct! Path cleared — keep rolling!"}
          {isWrong   && "✗ Not quite — try again!"}
        </div>
      </div>
    </div>
  );
}

export function ScorePop({ id, text, sx, sy, isWord, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone, 1100); return ()=>clearTimeout(t); },[]);
  return (
    <div style={{position:"absolute",left:sx,top:sy,transform:"translateX(-50%)",
      fontFamily:isWord?"'Fredoka One',sans-serif":"'Exo 2',sans-serif",
      fontSize:isWord?17:13,fontWeight:700,
      color:isWord?"#4ade80":text.includes("✗")?"#f87171":"#fbbf24",
      pointerEvents:"none",animation:"hPop 1.05s ease-out forwards",
      textShadow:"0 2px 8px rgba(0,0,0,.8)",whiteSpace:"nowrap",zIndex:800}}>
      {text}
    </div>
  );
}

export function Confetti() {
  const pieces = Array.from({length:50},(_,i)=>({
    left:`${Math.random()*100}%`,
    color:["#4ade80","#38bdf8","#fbbf24","#c084fc","#f97316","#f43f5e"][i%6],
    delay:`${Math.random()*.6}s`, size:6+Math.random()*8, dur:`${1.2+Math.random()*.8}s`,
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:700,overflow:"hidden"}}>
      {pieces.map((p,i)=>(
        <div key={i} style={{position:"absolute",top:"-10px",left:p.left,width:p.size,height:p.size,
          background:p.color,borderRadius:Math.random()>.5?"50%":"2px",
          animation:`hPop ${p.dur} ${p.delay} ease-in forwards`,transform:`rotate(${Math.random()*360}deg)`}} />
      ))}
    </div>
  );
}

export function SkinUnlockBanner({ skin, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,4200); return ()=>clearTimeout(t); },[]);
  return (
    <div style={{position:"fixed",top:"18%",left:"50%",animation:"hStreakAnim 4.0s ease-out forwards",
      zIndex:900,pointerEvents:"none",textAlign:"center"}}>
      <div style={{background:"rgba(4,6,18,.95)",border:"2px solid #c084fc",borderRadius:20,padding:"20px 36px",
        boxShadow:"0 0 60px rgba(192,132,252,.5), 0 0 120px rgba(192,132,252,.2)"}}>
        <div style={{fontSize:44,marginBottom:8,animation:"hSpinFast 1.2s ease-out"}}>🐹</div>
        <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:13,color:"rgba(255,255,255,.5)",letterSpacing:4,marginBottom:6,textTransform:"uppercase"}}>SKIN UNLOCKED!</div>
        <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:28,color:"#c084fc",textShadow:"0 0 30px #c084fc"}}>✨ {skin.name}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.5)",fontFamily:"'Nunito',sans-serif",marginTop:4}}>{skin.desc}</div>
      </div>
    </div>
  );
}

export function StreakAnnouncement({ boost, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,2800); return ()=>clearTimeout(t); },[]);
  return (
    <div style={{position:"fixed",top:"26%",left:"50%",animation:"hStreakAnim 2.6s ease-out forwards",zIndex:890,pointerEvents:"none",textAlign:"center"}}>
      <div style={{background:"rgba(4,6,18,.9)",border:`2px solid ${boost.color}`,borderRadius:18,
        padding:"16px 30px",boxShadow:`0 0 45px ${boost.color}44`}}>
        <div style={{fontSize:36}}>{boost.emoji}</div>
        <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:22,color:boost.color}}>{boost.label}!</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.4)",fontFamily:"'Nunito',sans-serif",marginTop:3}}>×{boost.streak} streak bonus</div>
      </div>
    </div>
  );
}

export function EndScreen({ won, data, onRetry, onMenu, onNext }) {
  const stars = data?.accuracy >= 90 ? 3 : data?.accuracy >= 70 ? 2 : 1;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(4,6,18,.97)",display:"flex",
      alignItems:"center",justifyContent:"center",flexDirection:"column",zIndex:600}}>
      <div style={{textAlign:"center",animation:"hFadeInScale .5s ease-out"}}>
        <div style={{fontSize:80,marginBottom:10,animation:"hFloat 2s ease-in-out infinite",
          filter:`drop-shadow(0 0 40px ${won?"#4ade80":"#f87171"}88)`}}>
          {won?"🏆":"🐹"}
        </div>
        <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:44,
          color:won?"#4ade80":"#f87171",marginBottom:4,textShadow:`0 0 50px ${won?"#4ade80":"#f87171"}88`}}>
          {won?"You Won!":"Keep Going!"}
        </div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.4)",fontFamily:"'Nunito',sans-serif",letterSpacing:3,marginBottom:28,textTransform:"uppercase"}}>
          {won?"Excellent rolling & chaining!":"Great effort — practice makes perfect!"}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:24}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{fontSize:32,opacity:i<stars?1:.2,filter:i<stars?"drop-shadow(0 0 12px #fbbf24)":"none",transition:`all .3s ${i*.15}s`}}>⭐</div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:26,minWidth:320}}>
          {[
            {label:"Score",    value:data?.score?.toLocaleString()||0, icon:"🏆", c:"#fbbf24"},
            {label:"Streak",   value:`×${data?.maxStreak||0}`,         icon:"🔥", c:"#f97316"},
            {label:"Words",    value:data?.chainLen||0,                 icon:"📝", c:"#4ade80"},
            {label:"Accuracy", value:`${data?.accuracy||0}%`,           icon:"🎯", c:"#38bdf8"},
          ].map(s=>(
            <div key={s.label} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:"14px 16px",textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:4}}>{s.icon}</div>
              <div style={{fontFamily:"'Fredoka One',sans-serif",fontSize:24,color:s.c}}>{s.value}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.35)",fontFamily:"'Exo 2',sans-serif",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn onClick={onRetry} color="#4ade80" size="lg">🔄 Try Again</Btn>
          {onNext && <Btn onClick={onNext} color="#fbbf24" size="lg">Next World →</Btn>}
          <Btn onClick={onMenu} color="#60a5fa" size="lg">🏠 Menu</Btn>
        </div>
      </div>
    </div>
  );
}

export function Dpad({ onLeft, onRight, onJump }) {
  return (
    <div style={{position:"fixed",bottom:16,left:16,zIndex:350,display:"flex",gap:10,pointerEvents:"all",alignItems:"center"}}>
      {[["←",onLeft],["→",onRight]].map(([arrow,fn])=>(
        <button key={arrow} onClick={fn}
          onTouchStart={e=>{e.preventDefault();fn();}}
          style={{width:52,height:52,borderRadius:14,background:"rgba(255,255,255,.1)",
            border:"1.5px solid rgba(255,255,255,.22)",color:"rgba(255,255,255,.8)",
            fontSize:22,cursor:"pointer",fontFamily:"'Fredoka One',sans-serif",
            WebkitTapHighlightColor:"transparent",userSelect:"none",transition:"all .1s"}}>
          {arrow}
        </button>
      ))}
      <button onClick={onJump} onTouchStart={e=>{e.preventDefault();onJump();}}
        style={{width:60,height:60,borderRadius:14,background:"rgba(74,222,128,.15)",
          border:"2px solid rgba(74,222,128,.55)",color:"#4ade80",
          fontSize:22,cursor:"pointer",fontFamily:"'Fredoka One',sans-serif",
          WebkitTapHighlightColor:"transparent",userSelect:"none",marginLeft:8}}>
        ↑
      </button>
    </div>
  );
}