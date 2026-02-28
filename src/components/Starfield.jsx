// src/components/Starfield.jsx
// Animated starfield + aurora background rendered behind all screens.

const STAR_COUNT = 80;

const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id:    i,
  top:   Math.random() * 100,
  left:  Math.random() * 100,
  size:  Math.random() * 2.5 + 0.5,
  dur:   (Math.random() * 3 + 2).toFixed(1),
  delay: (Math.random() * 4).toFixed(1),
}));

export default function Starfield() {
  return (
    <div className="starfield">
      {/* Main aurora */}
      <div
        className="aurora"
        style={{ width: "80%", height: "80%", top: "10%", left: "10%" }}
      />
      {/* Secondary aurora */}
      <div
        className="aurora"
        style={{
          width: "60%", height: "60%", top: "40%", left: "30%",
          background: "radial-gradient(ellipse, #0e2e3444 0%, transparent 70%)",
          animationDelay: "4s",
        }}
      />
      {/* Stars */}
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            top:    s.top  + "%",
            left:   s.left + "%",
            width:  s.size + "px",
            height: s.size + "px",
            "--dur":   s.dur   + "s",
            "--delay": s.delay + "s",
          }}
        />
      ))}
    </div>
  );
}
