// src/components/GameScreen.jsx
import React, { useState } from "react";
import Board from "./Board";
import PlayerPanel from "./PlayerPanel";
import QuestionModal from "./QuestionModal";
import { MODES } from "../constants/gameData";

export default function GameScreen({
  players, currentPlayer, movingPlayer, gameLocked, diceVal, diceRolling, highlightTile, log,
  modal, mode, aiDifficulty, aiThinking,
  onRoll, onAnswer, onSkip, onRestart, onGoMenu
}) {
  const isAI = mode === MODES.VS_AI;
  const [showHud, setShowHud] = useState(true);

  const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Cinzel', serif, 'Segoe UI'", 
      color: '#fff',
      zIndex: 10,
      position: 'relative'
    }}>
      

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        padding: '20px 30px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '250px' }}>
          <div style={{ 
            color: '#ffd700', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '1px',
            display: 'flex', alignItems: 'center', gap: '8px', textShadow: '1px 1px 2px #000' 
          }}>
            ⚔️ {players[currentPlayer].name.toUpperCase()}'S TURN
          </div>
          {isAI && (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', border: '1px solid #555', borderRadius: '20px', 
              padding: '5px 15px', fontSize: '0.8rem', color: '#ffd700', width: 'fit-content', letterSpacing: '1px' 
            }}>
              ⚔️ {aiDifficulty?.label} AI
            </div>
          )}
        </div>

        {/* CENTER: Mini VS Scoreboard */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '20px', 
          background: 'rgba(0,0,0,0.4)', padding: '10px 30px', borderRadius: '30px', 
          border: '1px solid #333', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={players[0].char.img} alt="P1" style={{ width: 24, height: 24, objectFit: 'contain' }}/>
              <span style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>
                {players[0].name.toUpperCase()} · <span style={{ color: '#ffd700' }}>{players[0].score}PTS</span> <span style={{ color: '#aaa', fontSize: '0.7rem' }}>{players[0].health}HP</span>
              </span>
           </div>
           <div style={{ color: '#555', fontSize: '1.2rem', fontWeight: 'bold' }}>VS</div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={players[1].char.img} alt="P2" style={{ width: 24, height: 24, objectFit: 'contain' }}/>
              <span style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>
                {players[1].name.toUpperCase()} · <span style={{ color: '#0ac8f0' }}>{players[1].score}PTS</span> <span style={{ color: '#aaa', fontSize: '0.7rem' }}>{players[1].health}HP</span>
              </span>
           </div>
        </div>

        {/* RIGHT: Hide/Show HUD Button */}
        <div style={{ width: '250px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => setShowHud(!showHud)} 
            style={{ 
              background: 'transparent', border: '1px solid #ffd700', color: '#ffd700', 
              padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontFamily: "'Cinzel', serif",
              transition: 'all 0.2s'
            }}
          >
            {showHud ? '▶ HIDE HUD' : '◀ SHOW HUD'}
          </button>
        </div>
      </div>


      {/* =========================================
          MAIN GAME AREA (Board + Sidebar)
          ========================================= */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        padding: '0 30px 30px 30px', 
        gap: '40px',
        justifyContent: showHud ? 'space-between' : 'center'
      }}>
        
        {/* LEFT/CENTER: The Board */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          maxWidth: showHud ? 'calc(100% - 360px)' : '100%' 
        }}>
          {/* Injecting CSS Animations for the Tumbling Dice */}
          <style>{`
            .board-wrap { max-width: 900px !important; width: 100%; aspect-ratio: 1; }
            .tile { font-size: 0.8rem; }
            .tile-icon { font-size: 2rem; }
            
            @keyframes diceTumble {
              0% { transform: rotate(0deg) scale(1); }
              25% { transform: rotate(15deg) scale(1.1); }
              50% { transform: rotate(0deg) scale(1); }
              75% { transform: rotate(-15deg) scale(1.1); }
              100% { transform: rotate(0deg) scale(1); }
            }
            @keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          `}</style>
          
          <Board players={players} highlightTile={highlightTile} movingPlayer={movingPlayer} />
        </div>


        {/* RIGHT: The HUD Sidebar */}
        {showHud && (
          <div style={{ 
            width: '320px', 
            flexShrink: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px',
            animation: 'fadeInRight 0.3s ease-out'
          }}>

            {/* 1. Player Panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {players.map((p, i) => (
                <PlayerPanel key={p.id} player={p} isActive={currentPlayer === i} isAI={isAI && i === 1} />
              ))}
            </div>

            {/* 2. BIG YELLOW ROLL BUTTON */}
            <button
              onClick={onRoll}
              disabled={gameLocked || (isAI && currentPlayer === 1)}
              style={{
                background: (gameLocked || (isAI && currentPlayer === 1)) ? '#555' : 'linear-gradient(180deg, #ffe066, #fca311)',
                borderRadius: '20px',
                padding: '25px 20px',
                textAlign: 'center',
                cursor: (gameLocked || (isAI && currentPlayer === 1)) ? 'not-allowed' : 'pointer',
                boxShadow: (gameLocked || (isAI && currentPlayer === 1)) ? 'none' : '0 0 30px rgba(252, 163, 17, 0.4)',
                border: '2px solid rgba(255,255,255,0.5)',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px'
              }}
            >
              {/* White inner dice box with animation */}
              <div style={{ 
                background: '#fff', borderRadius: '12px', width: '70px', height: '70px', 
                display: 'flex', justifyContent: 'center', alignItems: 'center', 
                fontSize: '4.5rem', color: '#000', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
                lineHeight: '70px',
                animation: diceRolling ? 'diceTumble 0.2s infinite linear' : 'none'
              }}>
                {diceVal ? DICE_FACES[diceVal] : '🎲'}
              </div>
              
              <div style={{ color: '#000', fontSize: '1.5rem', fontFamily: "'Cinzel', serif", fontWeight: '900', letterSpacing: '2px' }}>
                {aiThinking ? "THINKING..." : diceRolling ? "ROLLING..." : "ROLL DICE!"}
              </div>
            </button>

            {/* 3. TILE LEGEND */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '15px 0' }}>
              <div style={{ color: '#a89060', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '15px', fontWeight: 'bold' }}>TILE LEGEND</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', color: '#ccc', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}><span style={{color:'#ffd700'}}>🪜</span> Ladder</div>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}><span style={{color:'#ff4444'}}>🐍</span> Snake</div>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}><span style={{color:'#fca311'}}>⚡</span> Power</div>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}><span>💀</span> Trap</div>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}><span>🃏</span> Wild</div>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}><span style={{color:'#48bb78'}}>×2</span> Double</div>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}><span style={{color:'#0ac8f0'}}>💉</span> Steal</div>
              </div>
            </div>

            {/* 4. EVENT LOG */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '150px' }}>
              <div style={{ color: '#a89060', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '10px', fontWeight: 'bold' }}>EVENT LOG</div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
                {log.map((entry, idx) => (
                  <div key={idx} style={{ fontSize: '0.85rem', color: '#ddd', fontStyle: 'italic', display: 'flex', gap: '8px', fontFamily: "'Segoe UI', serif" }}>
                    <span style={{ color: '#a89060' }}>{'>'}</span> {entry}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* =========================================
          GAME MODALS
          ========================================= */}
      {modal && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-box" style={{ width: '90%', maxWidth: '500px' }}>
            {modal.type === "question" ? (
              <QuestionModal
                question={modal.question}
                onAnswer={onAnswer}
                onSkip={onSkip}
                doublePoints={modal.doublePoints}
                isAI={modal.playerIdx === 1 && isAI}
              />
            ) : (
              <div>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{modal.event.icon}</div>
                <h2 style={{ color: '#fca311', fontFamily: "'Cinzel', serif" }}>{modal.event.title}</h2>
                <p style={{ color: '#fff', fontSize: '1rem', margin: '20px 0', fontFamily: "'Segoe UI', sans-serif" }}>{modal.event.desc}</p>
                <button className="btn" onClick={modal.onClose} style={{ background: '#fca311', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>CONTINUE</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}