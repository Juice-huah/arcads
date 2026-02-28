const STARS = Array.from({ length: 90 }, () => ({
  x:   Math.random() * 100,
  y:   Math.random() * 65,
  s:   Math.random() * 2 + 0.8,
  dur: (Math.random() * 3 + 2).toFixed(1),
  del: (Math.random() * 4).toFixed(1),
}))

export default function Stars() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
      {STARS.map((st, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            borderRadius: '50%',
            background: '#fff',
            animation: `twinkle ${st.dur}s ${st.del}s infinite alternate`,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  )
}
