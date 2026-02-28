export default function Player({ x, walking }) {
  const bodyAnim = walking
    ? 'playerBob 0.38s ease-in-out infinite'
    : 'npcFloat 2.5s ease-in-out infinite'

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '22%',
        left: x,
        transition: walking
          ? 'left 2.2s cubic-bezier(0.45,0,0.55,1)'
          : 'left 0.4s ease',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: bodyAnim,
      }}
    >
      {/* Head */}
      <div
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg,#f5d0a0 0%,#d89060 100%)',
          border: '2px solid #8b5a30',
          position: 'relative',
          marginBottom: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {/* Eyes */}
        <div style={{ position:'absolute', top:11, left:7,  width:5, height:5, borderRadius:'50%', background:'#1a1008', animation:'blinkAnim 5s 1s infinite' }} />
        <div style={{ position:'absolute', top:11, right:7, width:5, height:5, borderRadius:'50%', background:'#1a1008', animation:'blinkAnim 5s 2.5s infinite' }} />
        {/* Mouth */}
        <div style={{ position:'absolute', bottom:6, left:'50%', transform:'translateX(-50%)', width:10, height:3, borderRadius:'0 0 4px 4px', border:'1.5px solid #8b5a30', borderTop:'none' }} />
        {/* Hood */}
        <div style={{ position:'absolute', top:-4, left:0, right:0, height:14, borderRadius:'50% 50% 0 0', background:'#3a4870' }} />
      </div>

      {/* Cloak body */}
      <div
        style={{
          width: 40, height: 34,
          background: 'linear-gradient(180deg,#3a5090 0%,#2a3d6a 100%)',
          borderRadius: '5px 5px 10px 10px',
          border: '1px solid #4a6aaa60',
          boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
        }}
      />

      {/* Legs */}
      <div style={{ display: 'flex', gap: 6, marginTop: 1 }}>
        <div
          style={{
            width: 13, height: 20,
            background: '#2a3d6a',
            borderRadius: '0 0 5px 5px',
            transformOrigin: 'top center',
            animation: walking ? 'legL 0.38s ease-in-out infinite' : 'none',
          }}
        />
        <div
          style={{
            width: 13, height: 20,
            background: '#2a3d6a',
            borderRadius: '0 0 5px 5px',
            transformOrigin: 'top center',
            animation: walking ? 'legR 0.38s ease-in-out infinite' : 'none',
          }}
        />
      </div>
    </div>
  )
}
