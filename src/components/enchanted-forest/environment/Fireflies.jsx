const FLIES = Array.from({ length: 14 }, () => ({
  l:   10 + Math.random() * 80,
  t:   20 + Math.random() * 55,
  dur: (Math.random() * 5 + 4).toFixed(1),
  del: (Math.random() * 5).toFixed(1),
  dx:  ((Math.random() - 0.5) * 110).toFixed(0),
  dy:  ((Math.random() - 0.5) * 70).toFixed(0),
  dx2: ((Math.random() - 0.5) * 60).toFixed(0),
  dy2: ((Math.random() - 0.5) * 40).toFixed(0),
}))

export default function Fireflies({ color }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none', overflow: 'hidden' }}>
      {FLIES.map((f, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${f.l}%`,
            top: `${f.t}%`,
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px 4px ${color}90`,
            animation: `fireflyPulse ${f.dur}s ${f.del}s infinite ease-in-out`,
            '--dx':  `${f.dx}px`,
            '--dy':  `${f.dy}px`,
            '--dx2': `${f.dx2}px`,
            '--dy2': `${f.dy2}px`,
          }}
        />
      ))}
    </div>
  )
}
