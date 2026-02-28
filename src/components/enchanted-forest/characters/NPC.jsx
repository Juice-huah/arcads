export default function NPC({ loc, talking, happy, shocked }) {
  const isTree = loc.id === 5

  // Choose animation based on state priority
  const anim = shocked ? 'npcShock 0.5s ease-in-out'
             : happy   ? 'npcHappy 0.7s ease-in-out'
             : talking ? 'npcTalk 0.45s ease-in-out infinite'
             : 'npcFloat 2.8s ease-in-out infinite'

  /* ── Ancient Tree (boss NPC) ─────────────────────────────── */
  if (isTree) {
    return (
      <div style={{
        position: 'absolute', bottom: '18%', right: '17%',
        width: 110, height: 175, zIndex: 9,
        animation: 'ancientPulse 3s ease-in-out infinite',
        filter: happy ? 'brightness(1.4) drop-shadow(0 0 20px #ffd700)' : undefined,
        transition: 'filter 0.3s',
      }}>
        <svg viewBox="0 0 110 175" width="110" height="175">
          <path d="M55,170 L38,108 Q18,65 38,35 Q55,5 72,35 Q92,65 72,108 Z" fill="#2a5030" />
          <path d="M55,170 L42,112 Q28,74 42,50 Q55,28 68,50 Q82,74 68,112 Z" fill="#3a6840" />
          <circle cx="55" cy="28" r="22" fill="#4a8050" />
          <circle cx="33" cy="45" r="17" fill="#3a7040" />
          <circle cx="77" cy="45" r="17" fill="#3a7040" />
          <circle cx="43" cy="65" r="20" fill="#4a8050" />
          <circle cx="67" cy="65" r="20" fill="#4a8050" />
          <circle cx="55" cy="50" r="18" fill="#5a9060" />
          <ellipse cx="55" cy="95" rx="17" ry="19" fill="#6a4828" />
          {/* Eyes — wide/shocked, squinting/happy, or normal */}
          <circle cx="48" cy="89" r={shocked ? 6 : happy ? 3 : 4} fill="#1a0a00"
            style={{ animation: shocked ? 'none' : 'blinkAnim 6s 2s infinite' }} />
          <circle cx="62" cy="89" r={shocked ? 6 : happy ? 3 : 4} fill="#1a0a00"
            style={{ animation: shocked ? 'none' : 'blinkAnim 6s 0.5s infinite' }} />
          {/* Mouth — open/surprised, big smile, or normal */}
          <path
            d={
              shocked ? 'M47,100 Q55,95 63,100' // surprised O shape
              : happy  ? 'M45,98 Q55,110 65,98'  // big smile
              : talking ? 'M47,98 Q55,107 63,98' // talking open
              : 'M47,100 Q55,107 63,100'          // resting
            }
            stroke="#1a0a00" fill={shocked ? '#1a0a00' : happy ? 'none' : 'none'}
            strokeWidth="2.5"
          />
          {shocked && <ellipse cx="55" cy="103" rx="5" ry="6" fill="#1a0a00" />}
          <circle cx="55" cy="95" r="27" fill="none" stroke="#ffd700" strokeWidth="1.5" opacity=".4"
            style={{ animation: 'ringPulse 2s ease-in-out infinite' }} />
          <circle cx="55" cy="95" r="36" fill="none" stroke="#ffd700" strokeWidth="0.8" opacity=".2"
            style={{ animation: 'ringPulse 2.5s 0.5s ease-in-out infinite' }} />
        </svg>
      </div>
    )
  }

  /* ── Regular NPCs ────────────────────────────────────────── */
  return (
    <div style={{
      position: 'absolute', bottom: '22%', right: '20%',
      zIndex: 9, display: 'flex', flexDirection: 'column', alignItems: 'center',
      animation: anim,
      filter: `drop-shadow(0 0 8px ${loc.glow})`,
      transition: 'filter 0.3s',
    }}>
      {/* Happy sparkles */}
      {happy && (
        <>
          <div style={{
            position: 'absolute', top: -24, left: -8, fontSize: '1rem',
            animation: 'victoryFloat 0.7s ease-in-out',
            pointerEvents: 'none',
          }}>✨</div>
          <div style={{
            position: 'absolute', top: -18, right: -10, fontSize: '0.8rem',
            animation: 'victoryFloat 0.7s 0.1s ease-in-out',
            pointerEvents: 'none',
          }}>⭐</div>
        </>
      )}

      {/* Shocked sweat drop */}
      {shocked && (
        <div style={{
          position: 'absolute', top: -14, right: -12, fontSize: '1rem',
          animation: 'popIn 0.3s ease',
          pointerEvents: 'none',
        }}>😰</div>
      )}

      {/* Head */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${loc.npc.clr} 0%, ${loc.npc.clr}99 100%)`,
        border: `2px solid ${loc.accent}`,
        position: 'relative', marginBottom: 3,
        boxShadow: `0 0 14px ${loc.glow}`,
        transform: shocked ? 'scale(1.15)' : happy ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 0.2s',
      }}>
        {/* Eyes */}
        <div style={{
          position: 'absolute', top: 12, left: 8,
          width: shocked ? 8 : 6, height: shocked ? 8 : 6,
          borderRadius: '50%', background: '#0a0a1a',
          animation: shocked ? 'none' : 'blinkAnim 5s 0.5s infinite',
          transition: 'width 0.15s, height 0.15s',
        }} />
        <div style={{
          position: 'absolute', top: 12, right: 8,
          width: shocked ? 8 : 6, height: shocked ? 8 : 6,
          borderRadius: '50%', background: '#0a0a1a',
          animation: shocked ? 'none' : 'blinkAnim 5s 2s infinite',
          transition: 'width 0.15s, height 0.15s',
        }} />
        {/* Mouth */}
        <div style={{
          position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)',
          width: shocked ? 10 : talking ? 14 : happy ? 16 : 12,
          height: shocked ? 10 : talking ? 7 : happy ? 6 : 3,
          background: (talking || shocked) ? '#0a0a1a' : 'none',
          borderRadius: shocked ? '50%' : talking ? '0 0 8px 8px' : happy ? '0 0 10px 10px' : '0 0 4px 4px',
          border: (talking || shocked) ? 'none' : '1.5px solid #0a0a1a',
          borderTop: 'none',
          transition: 'all 0.12s',
        }} />
      </div>

      {/* Body */}
      <div style={{
        width: 46, height: 38,
        background: `linear-gradient(180deg,${loc.npc.clr}cc 0%,${loc.npc.clr}88 100%)`,
        borderRadius: '6px 6px 10px 10px',
        border: `1px solid ${loc.accent}50`,
        transform: happy ? 'scaleX(1.05)' : 'scaleX(1)',
        transition: 'transform 0.2s',
      }} />

      {/* Legs */}
      <div style={{ display: 'flex', gap: 7, marginTop: 2 }}>
        <div style={{ width: 15, height: 20, background: `${loc.npc.clr}aa`, borderRadius: '0 0 5px 5px' }} />
        <div style={{ width: 15, height: 20, background: `${loc.npc.clr}aa`, borderRadius: '0 0 5px 5px' }} />
      </div>
    </div>
  )
}