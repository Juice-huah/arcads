// ─────────────────────────────────────────────────────────────────────────────
//  HitEffect.jsx  –  Particle / explosion effects for hits, kills, abilities
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useRef } from "react";

/* ── Particle types ───────────────────────────────────────────────────────── */
const EFFECT_CONFIGS = {
  hit: {
    particles: 6,
    colors: ["#fbbf24", "#f97316", "#ef4444"],
    size: [4, 8],
    spread: 40,
    duration: 400,
    emoji: null,
  },
  kill: {
    particles: 12,
    colors: ["#fbbf24", "#ff6b00", "#ef4444", "#fff"],
    size: [6, 14],
    spread: 60,
    duration: 700,
    emoji: "💥",
  },
  boss_kill: {
    particles: 20,
    colors: ["#ffd700", "#ff4500", "#ef4444", "#fff", "#f97316"],
    size: [8, 20],
    spread: 100,
    duration: 1100,
    emoji: "💥",
  },
  freeze: {
    particles: 8,
    colors: ["#bfdbfe", "#93c5fd", "#60a5fa", "#fff"],
    size: [5, 10],
    spread: 50,
    duration: 600,
    emoji: "❄️",
  },
  storm: {
    particles: 5,
    colors: ["#fbbf24", "#f59e0b"],
    size: [4, 8],
    spread: 40,
    duration: 350,
    emoji: "🏹",
  },
  shield: {
    particles: 10,
    colors: ["#a78bfa", "#c4b5fd", "#ddd6fe"],
    size: [5, 12],
    spread: 70,
    duration: 600,
    emoji: "🛡️",
  },
  power_shot: {
    particles: 8,
    colors: ["#ffd700", "#ff8c00", "#fbbf24"],
    size: [5, 12],
    spread: 55,
    duration: 600,
    emoji: "⚡",
  },
};

/* ── Single effect instance ───────────────────────────────────────────────── */
function Effect({ x, y, type, onDone }) {
  const config = EFFECT_CONFIGS[type] ?? EFFECT_CONFIGS.hit;
  const particles = useRef(
    Array.from({ length: config.particles }, (_, i) => {
      const angle = (i / config.particles) * Math.PI * 2 + Math.random() * 0.5;
      const dist  = config.spread * (0.5 + Math.random() * 0.5);
      const size  = config.size[0] + Math.random() * (config.size[1] - config.size[0]);
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      return { angle, dist, size, color, delay: Math.random() * 100 };
    })
  ).current;

  useEffect(() => {
    const t = setTimeout(onDone, config.duration + 150);
    return () => clearTimeout(t);
  }, [onDone, config.duration]);

  return (
    <div
      style={{
        position: "fixed",
        left: x,
        top: y,
        pointerEvents: "none",
        zIndex: 200,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Central emoji */}
      {config.emoji && (
        <div style={{
          position: "absolute",
          fontSize: type === "boss_kill" ? "2.5rem" : "1.5rem",
          transform: "translate(-50%, -50%)",
          animation: `effectEmoji ${config.duration}ms ease-out forwards`,
        }}>
          {config.emoji}
        </div>
      )}

      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
            animation: `particle${i % 3} ${config.duration}ms ${p.delay}ms ease-out forwards`,
            transform: "translate(-50%, -50%)",
            "--dx": `${Math.cos(p.angle) * p.dist}px`,
            "--dy": `${Math.sin(p.angle) * p.dist}px`,
          }}
        />
      ))}

      <style>{`
        @keyframes particle0 {
          0%   { transform: translate(-50%,-50%) scale(1); opacity:1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0); opacity:0; }
        }
        @keyframes particle1 {
          0%   { transform: translate(-50%,-50%) scale(1.2); opacity:1; }
          60%  { opacity:0.8; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0); opacity:0; }
        }
        @keyframes particle2 {
          0%   { transform: translate(-50%,-50%) scale(0.8); opacity:1; }
          100% { transform: translate(calc(-50% + var(--dx) * 0.7), calc(-50% + var(--dy) * 1.3)) scale(0); opacity:0; }
        }
        @keyframes effectEmoji {
          0%   { transform: translate(-50%,-50%) scale(0.5); opacity:1; }
          40%  { transform: translate(-50%,-80%) scale(1.4); opacity:1; }
          100% { transform: translate(-50%,-120%) scale(0.8); opacity:0; }
        }
      `}</style>
    </div>
  );
}

/* ── Effect Manager ───────────────────────────────────────────────────────── */
let _effectId = 0;

export function useHitEffects() {
  const [effects, setEffects] = useState([]);

  const spawnEffect = (x, y, type = "hit") => {
    const id = ++_effectId;
    setEffects(prev => [...prev, { id, x, y, type }]);
  };

  const removeEffect = (id) => {
    setEffects(prev => prev.filter(e => e.id !== id));
  };

  const EffectsLayer = () => (
    <>
      {effects.map(e => (
        <Effect
          key={e.id}
          x={e.x}
          y={e.y}
          type={e.type}
          onDone={() => removeEffect(e.id)}
        />
      ))}
    </>
  );

  return { spawnEffect, EffectsLayer };
}