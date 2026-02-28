// src/components/Board.jsx
import React from "react";
import { BOARD_SIZE, TILE_SIZE, LADDERS, SNAKES } from "../constants/gameData";
import { getTileType, tileIcon, tileCenter } from "../utils/helpers";

export default function Board({ players, highlightTile, movingPlayer }) {
  // Generate the 10x10 grid (100 to 1)
  const orderedRows = [];
  for (let row = BOARD_SIZE - 1; row >= 0; row--) {
    const rowTiles = [];
    for (let colIdx = 0; colIdx < BOARD_SIZE; colIdx++) {
      rowTiles.push(row * BOARD_SIZE + colIdx + 1);
    }
    orderedRows.push(rowTiles);
  }

  // ==========================================
  // MAGIC SVG GENERATOR (REAL LADDERS & SNAKES)
  // ==========================================
  const svgLines = [];
  
  // 1. Draw Golden/Yellow Ladders
  Object.entries(LADDERS).forEach(([from, to]) => {
    const f = tileCenter(Number(from));
    const t = tileCenter(Number(to));
    const dx = t.x - f.x;
    const dy = t.y - f.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Generate the rungs mathematically so they fit perfectly no matter the length
    const rungs = [];
    for (let i = 15; i < length - 10; i += 20) {
      rungs.push(<line key={i} x1={i} y1="-10" x2={i} y2="10" stroke="#ffd700" strokeWidth="4" />);
    }

    svgLines.push(
      <g key={`l${from}`} transform={`translate(${f.x}, ${f.y}) rotate(${angle})`} opacity="0.85">
        {/* The Side Rails (Dark Gold) */}
        <line x1="0" y1="-12" x2={length} y2="-12" stroke="#b8860b" strokeWidth="5" strokeLinecap="round" />
        <line x1="0" y1="12" x2={length} y2="12" stroke="#b8860b" strokeWidth="5" strokeLinecap="round" />
        {/* The Steps (Bright Yellow) */}
        {rungs}
      </g>
    );
  });

  // 2. Draw Crimson Red Snakes
  Object.entries(SNAKES).forEach(([from, to]) => {
    const f  = tileCenter(Number(from));
    const t  = tileCenter(Number(to));
    const dx = t.x - f.x;
    const dy = t.y - f.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Math for a perfect wavy slithering body
    const segments = Math.max(2, Math.floor(length / 30));
    const segLen = length / segments;
    let pathData = `M 0 0`;
    for (let i = 1; i <= segments; i++) {
      const x = i * segLen;
      const midX = x - segLen / 2;
      const amp = (i % 2 === 0) ? 20 : -20;
      pathData += ` Q ${midX} ${amp} ${x} 0`;
    }

    svgLines.push(
      <g key={`s${from}`} transform={`translate(${f.x}, ${f.y}) rotate(${angle})`} opacity="0.85">
        {/* Thick Dark Red Base Body */}
        <path d={pathData} stroke="#7a0000" strokeWidth="16" fill="none" strokeLinecap="round" />
        {/* Bright Red Slithering Pattern */}
        <path d={pathData} stroke="#ff4444" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray="10 15" />
        
        {/* Snake Tail (Rattle) */}
        <circle cx={length} cy="0" r="6" fill="#ffaa00" />
        <circle cx={length + 6} cy="0" r="4" fill="#ffaa00" />

        {/* Snake Head */}
        <circle cx="0" cy="0" r="14" fill="#7a0000" />
        {/* White Eyes & Pupils */}
        <circle cx="-4" cy="-6" r="4" fill="#fff" />
        <circle cx="-4" cy="6" r="4" fill="#fff" />
        <circle cx="-5" cy="-6" r="1.5" fill="#000" />
        <circle cx="-5" cy="6" r="1.5" fill="#000" />
        {/* Forked Tongue */}
        <path d="M -14 0 L -24 -4 M -14 0 L -24 4" stroke="#ff4444" strokeWidth="2" fill="none" />
      </g>
    );
  });

  // ==========================================
  // TILE STYLES
  // ==========================================
  const getTileStyle = (tileNum, type, isHighlight) => {
    let baseStyle = {
      border: '1px solid rgba(255, 255, 255, 0.05)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tileNum % 2 === 0 ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
      transition: 'all 0.3s ease'
    };

    switch (type) {
        case 'power-up': baseStyle.backgroundColor = 'rgba(74, 20, 140, 0.5)'; break; 
        case 'trap':     baseStyle.backgroundColor = 'rgba(160, 82, 45, 0.6)'; break; 
        case 'wild':     baseStyle.backgroundColor = 'rgba(136, 14, 79, 0.6)'; break; 
        case 'double':   baseStyle.backgroundColor = 'rgba(27, 94, 32, 0.6)'; break;  
        case 'steal':    baseStyle.backgroundColor = 'rgba(183, 28, 28, 0.6)'; break; 
        default: break;
    }

    if (tileNum === 1) {
        baseStyle.border = '2px solid #fff';
        baseStyle.boxShadow = 'inset 0 0 15px rgba(255,255,255,0.3), 0 0 10px rgba(255,255,255,0.6)';
        baseStyle.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        baseStyle.zIndex = 5;
    } else if (tileNum === 100) {
        baseStyle.border = '2px solid #ffd700';
        baseStyle.boxShadow = 'inset 0 0 20px rgba(255,215,0,0.4), 0 0 15px #ffd700';
        baseStyle.backgroundColor = 'rgba(255, 215, 0, 0.15)';
        baseStyle.zIndex = 5;
    }

    if (isHighlight) {
        baseStyle.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        baseStyle.boxShadow = 'inset 0 0 20px #fff';
    }

    return baseStyle;
  };

  return (
    <div className="board-wrap" style={{ position: 'relative' }}>
      
      <style>{`
        @keyframes floatToken {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      <div className="board-grid">
        {orderedRows.map((row) =>
          row.map(tileNum => {
            const type = getTileType(tileNum);
            let { icon, label } = tileIcon(tileNum);

            if (tileNum === 1) { icon = "🏠"; label = "START"; }
            if (tileNum === 100) { icon = "🏆"; label = "FINISH"; }

            const isHighlight = highlightTile === tileNum;
            const style = getTileStyle(tileNum, type, isHighlight);
            const playersHere = players.filter(p => p.pos === tileNum);

            return (
              <div key={tileNum} style={style}>
                {/* Tile Number */}
                <span style={{ position: 'absolute', top: 4, left: 6, fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
                  {tileNum}
                </span>
                
                {/* Icon */}
                {icon && (
                  <span style={{ fontSize: tileNum === 1 || tileNum === 100 ? '1.8rem' : '1.5rem', zIndex: 2, dropShadow: '2px 2px 2px rgba(0,0,0,0.8)' }}>
                    {icon}
                  </span>
                )}
                
                {/* Label */}
                {label && (
                  <span style={{ 
                    fontSize: '0.5rem', 
                    fontFamily: "'Cinzel', serif", 
                    color: tileNum === 100 ? '#ffd700' : 'rgba(255,255,255,0.7)', 
                    marginTop: '2px', 
                    letterSpacing: '1px',
                    fontWeight: 'bold',
                    zIndex: 2 
                  }}>
                    {label.toUpperCase()}
                  </span>
                )}

                {/* Player Tokens */}
                {playersHere.length > 0 && (
                  <div className="tile-tokens" style={{ position: 'absolute', display: 'flex', gap: '5px', zIndex: 20, bottom: '5px' }}>
                    {playersHere.map(p => {
                      const isMoving = p.id === movingPlayer;
                      const currentImage = isMoving ? p.char.runImg : p.char.idleImg;

                      return (
                        <img
                          key={p.id}
                          src={currentImage}
                          alt={p.char.name}
                          style={{ 
                            width: "48px", 
                            height: "48px", 
                            objectFit: "contain", 
                            filter: `drop-shadow(0px 8px 4px rgba(0,0,0,0.6)) drop-shadow(0px 0px 6px ${p.char.color})`, 
                            animation: isMoving ? 'none' : 'floatToken 2s ease-in-out infinite', 
                            position: 'relative',
                            zIndex: 30
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SVG Container strictly forced over the grid */}
      <svg 
        className="board-svg" 
        viewBox={`0 0 ${BOARD_SIZE * TILE_SIZE} ${BOARD_SIZE * TILE_SIZE}`}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}
      >
        {svgLines}
      </svg>
    </div>
  );
}