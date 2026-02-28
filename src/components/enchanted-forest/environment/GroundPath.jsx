export default function GroundPath({ accent }) {
  return (
    <svg
      style={{
        position: 'absolute',
        bottom: '18%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '55%',
        height: '40px',
        zIndex: 6,
        pointerEvents: 'none',
      }}
      viewBox="0 0 400 30"
    >
      <ellipse
        cx="200" cy="15" rx="195" ry="10"
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        strokeDasharray="8 6"
        style={{ animation: 'pathGlow 3s ease-in-out infinite', opacity: 0.35 }}
      />
    </svg>
  )
}
