export default function Mist() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: '-10%',
        width: '120%',
        height: '38%',
        background: 'linear-gradient(to top, rgba(100,180,130,0.09) 0%, transparent 100%)',
        animation: 'mistDrift 14s ease-in-out infinite alternate',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    />
  )
}
