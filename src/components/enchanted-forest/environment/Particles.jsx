export default function Particles({ type, color }) {
  const count = type === 'golden' ? 28 : type === 'embers' ? 22 : 15
  const pts = Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    dur:  (Math.random() * 7 + 5).toFixed(1),
    del:  (Math.random() * 8).toFixed(1),
    dx:   ((Math.random() - 0.5) * 90).toFixed(0),
    sz:   Math.random() * 7 + 3,
  }))
  const isRound  = type === 'embers' || type === 'golden'
  const hasGlow  = type === 'embers' || type === 'golden' || type === 'wisps'
  const shape    = isRound ? '50%' : '50% 0 50% 0'

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', overflow: 'hidden' }}>
      {pts.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-12px',
            width: p.sz,
            height: p.sz,
            borderRadius: shape,
            background: type === 'shadows' ? 'transparent' : color,
            boxShadow: hasGlow ? `0 0 5px 2px ${color}` : 'none',
            opacity: 0,
            animation: `particleFall ${p.dur}s ${p.del}s infinite ease-in`,
            '--dx': `${p.dx}px`,
          }}
        />
      ))}
    </div>
  )
}
