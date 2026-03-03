// ─────────────────────────────────────────────────────────────────────────────
//  SpecialAbilityBar.jsx  –  3 special ability buttons (Freeze, Storm, Shield)
//                            with cooldown rings and unlock gates.
// ─────────────────────────────────────────────────────────────────────────────
import { ABILITIES } from "../defensetower/gameData";

const FONT = "'Cinzel', 'Palatino Linotype', serif";

/* ── Cooldown Ring SVG ────────────────────────────────────────────────────── */
function CooldownRing({ pct, color, size = 48 }) {
  const r    = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * (1 - pct);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="5"
      />
      {/* Progress — shows how much cooldown remains */}
      {pct > 0 && (
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={filled}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.3s linear" }}
        />
      )}
    </svg>
  );
}

/* ── Single Ability Button ────────────────────────────────────────────────── */
function AbilityBtn({ ability, cooldownPct, onActivate, wave, shieldActive }) {
  const unlocked = wave >= ability.unlockWave;
  const onCooldown = cooldownPct > 0;
  const disabled = !unlocked || onCooldown;

  const isShield = ability.id === "shield";
  const shieldOn = isShield && shieldActive;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div
        onClick={() => !disabled && onActivate(ability)}
        title={
          !unlocked
            ? `Unlocks on wave ${ability.unlockWave}`
            : onCooldown
            ? `Cooling down…`
            : ability.desc
        }
        style={{
          position: "relative",
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: disabled
            ? "rgba(0,0,0,0.4)"
            : shieldOn
            ? `radial-gradient(circle, ${ability.color}44, ${ability.color}22)`
            : `radial-gradient(circle, rgba(0,0,0,0.5), rgba(0,0,0,0.7))`,
          border: `2px solid ${
            disabled ? "rgba(255,255,255,0.1)"
            : shieldOn ? ability.color
            : `${ability.color}88`
          }`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "transform 0.15s, box-shadow 0.2s, border-color 0.2s",
          boxShadow: shieldOn
            ? `0 0 16px ${ability.glowColor}, 0 0 32px ${ability.glowColor}55`
            : disabled
            ? "none"
            : `0 0 8px ${ability.color}44`,
          transform: !disabled ? "scale(1)" : "scale(0.95)",
          filter: !unlocked ? "grayscale(0.8) brightness(0.5)" : "none",
        }}
      >
        {/* Cooldown overlay */}
        {onCooldown && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontSize: "0.7rem",
            color: "#9ca3af",
            zIndex: 2,
          }}>
            {Math.ceil(cooldownPct * (ability.cooldownMs / 1000))}s
          </div>
        )}

        {/* Cooldown ring */}
        {onCooldown && (
          <CooldownRing pct={cooldownPct} color={ability.color} size={48} />
        )}

        {/* Icon */}
        <span style={{
          fontSize: "1.4rem",
          filter: onCooldown ? "grayscale(0.8) brightness(0.5)" : "none",
          position: "relative",
          zIndex: 1,
        }}>
          {ability.icon}
        </span>

        {/* Lock icon */}
        {!unlocked && (
          <div style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            background: "#374151",
            borderRadius: "50%",
            width: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.55rem",
          }}>
            🔒
          </div>
        )}
      </div>

      {/* Label */}
      <div style={{
        fontFamily: FONT,
        fontSize: "0.5rem",
        letterSpacing: "0.08em",
        color: disabled ? "#374151" : ability.color,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        textAlign: "center",
        maxWidth: 56,
        lineHeight: 1.2,
      }}>
        {!unlocked ? `Wave ${ability.unlockWave}` : ability.name}
      </div>
    </div>
  );
}

/* ── Ability Bar ──────────────────────────────────────────────────────────── */
export default function SpecialAbilityBar({ cooldowns, onActivate, wave, shieldActive }) {
  return (
    <div style={styles.bar}>
      <div style={styles.barLabel}>ABILITIES</div>
      <div style={styles.btnRow}>
        {ABILITIES.map(ability => {
          const cd   = cooldowns[ability.id] ?? 0;
          const pct  = Math.max(0, cd / ability.cooldownMs);
          return (
            <AbilityBtn
              key={ability.id}
              ability={ability}
              cooldownPct={pct}
              onActivate={onActivate}
              wave={wave}
              shieldActive={ability.id === "shield" && shieldActive}
            />
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  bar: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  barLabel: {
    fontFamily: FONT,
    fontSize: "0.52rem",
    letterSpacing: "0.18em",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  btnRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
};