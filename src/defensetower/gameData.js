// ─────────────────────────────────────────────────────────────────────────────
//  gameData.js  –  Questions, wave config, enemies, bosses, maps, abilities
//                  Enhanced for 4-Wave Matching-Type Tower Defense
// ─────────────────────────────────────────────────────────────────────────────

export const GAME_CONSTANTS = {
  BASE_ENEMY_SPEED : 0.18,
  SPEED_INCREMENT  : 0.02,
  TICK_MS          : 50,
  LIVES_START      : 5,
  SPAWN_INTERVAL_MS: 3500,
  COMBO_THRESHOLDS : [3, 6, 10],
  POINTS_CORRECT_BASE      : 100,
  POINTS_SPEED_BONUS       : 50,
  POINTS_COMBO_MULTIPLIER  : 0.5,
  MISFIRE_PENALTY          : 0,       
  DECOYS_PER_WAVE          : 2,       
  ANSWER_TIMER_MS          : 0,       
  TOWER_SLOTS              : 4,       
  BASE_SPEED               : 0.16,    
};

export const CATEGORY_META = {
  definition: { label: "Definition", icon: "📖", color: "#a78bfa", bgColor: "rgba(167,139,250,0.08)", projectile: "bolt", desc: "Match word to meaning" },
  synonym: { label: "Synonym", icon: "🔗", color: "#38bdf8", bgColor: "rgba(56,189,248,0.08)", projectile: "arrow", desc: "Match to closest synonym" },
  antonym: { label: "Antonym", icon: "↔️", color: "#34d399", bgColor: "rgba(52,211,153,0.08)", projectile: "lightning", desc: "Match to opposite word" },
  grammar: { label: "Grammar", icon: "✏️", color: "#fb923c", bgColor: "rgba(251,146,60,0.08)", projectile: "fireball", desc: "Complete the sentence" },
  idiom: { label: "Idiom", icon: "💬", color: "#f472b6", bgColor: "rgba(244,114,182,0.08)", projectile: "fireball", desc: "Match phrase to meaning" },
  filipino: { label: "Filipino", icon: "🇵🇭", color: "#fbbf24", bgColor: "rgba(251,191,36,0.08)", projectile: "bolt", desc: "Salitang Filipino" },
};

export const MAP_CONFIGS = [
  { id: "grasslands", name: "Greenfield Plains", icon: "🌿", desc: "Defend the emerald keep across rolling hills", sky: ["#87ceeb", "#b0e0e6", "#e0f7fa"], ground: ["#4a7c30", "#3d6b25"], path: "#c8a96e", hillColors: ["#4a7c30", "#3d6b25", "#2d5218"], accent: "#ffd700", cloudColor: "rgba(255,255,255,0.85)", fogColor: "rgba(100,180,60,0.08)" },
  { id: "desert", name: "Scorched Dunes", icon: "🏜️", desc: "Hold the fortress against the searing sands", sky: ["#ff7b35", "#ff9f5b", "#ffd08a"], ground: ["#c8941a", "#b07a10"], path: "#e8c97a", hillColors: ["#c8941a", "#d4a832", "#e0c060"], accent: "#ff6b00", cloudColor: "rgba(255,220,150,0.6)", fogColor: "rgba(220,150,0,0.06)" },
  { id: "frozen", name: "Frostbitten Keep", icon: "❄️", desc: "Stand firm in the frozen north — walls of ice", sky: ["#a8d8f0", "#c8e8f8", "#dff2fc"], ground: ["#7ec8e3", "#a8dadc"], path: "#d0e8f0", hillColors: ["#5b9ec9", "#7ec8e3", "#a8dadc"], accent: "#00cfff", cloudColor: "rgba(200,230,255,0.7)", fogColor: "rgba(100,180,220,0.1)" },
];

export const ABILITIES = [
  { id: "freeze", name: "Ice Freeze", icon: "❄️", desc: "Freeze all enemies for 3 seconds", cooldownMs: 25000, unlockWave: 1, color: "#60a5fa", glowColor: "#3b82f6", effect: "freeze", duration: 3000 },
  { id: "storm", name: "Arrow Storm", icon: "🏹", desc: "Deal 1 damage to all enemies", cooldownMs: 40000, unlockWave: 3, color: "#f97316", glowColor: "#ea580c", effect: "storm", duration: 0 },
  { id: "shield", name: "Shield Wall", icon: "🛡️", desc: "Block the next castle hit", cooldownMs: 55000, unlockWave: 5, color: "#a78bfa", glowColor: "#7c3aed", effect: "shield", duration: 10000 },
];

export const ENEMY_TYPES = [
  { id: "goblin", emoji: "👺", label: "Goblin", hp: 1, maxHp: 1, speed: 1.0, color: "#4ade80", size: 1.0, isBoss: false, deathStyle: "burst", walkStyle: "hop", points: 50 },
  { id: "skeleton", emoji: "💀", label: "Skeleton", hp: 1, maxHp: 1, speed: 1.3, color: "#e2e8f0", size: 1.0, isBoss: false, deathStyle: "collapse", walkStyle: "shuffle", points: 70 },
  { id: "troll", emoji: "👹", label: "Troll", hp: 2, maxHp: 2, speed: 0.7, color: "#f97316", size: 1.2, isBoss: false, deathStyle: "fade", walkStyle: "stomp", points: 120 },
  { id: "dragon", emoji: "🐉", label: "Dragon", hp: 3, maxHp: 3, speed: 0.5, color: "#ef4444", size: 1.3, isBoss: false, deathStyle: "explode", walkStyle: "crawl", points: 200 },
  { id: "witch", emoji: "🧙", label: "Witch", hp: 2, maxHp: 2, speed: 1.1, color: "#a855f7", size: 1.0, isBoss: false, deathStyle: "fade", walkStyle: "glide", points: 150 },
  { id: "orc", emoji: "👾", label: "Orc Warrior", hp: 2, maxHp: 2, speed: 0.9, color: "#65a30d", size: 1.1, isBoss: false, deathStyle: "burst", walkStyle: "stomp", points: 130 },
  { id: "banshee", emoji: "👻", label: "Banshee", hp: 1, maxHp: 1, speed: 1.5, color: "#c4b5fd", size: 0.9, isBoss: false, deathStyle: "fade", walkStyle: "float", points: 90 },
  { id: "werewolf", emoji: "🐺", label: "Werewolf", hp: 3, maxHp: 3, speed: 1.2, color: "#78716c", size: 1.15, isBoss: false, deathStyle: "burst", walkStyle: "stomp", points: 180 },
  { id: "vampire", emoji: "🧛", label: "Vampire", hp: 2, maxHp: 2, speed: 0.8, color: "#dc2626", size: 1.05, isBoss: false, deathStyle: "fade", walkStyle: "glide", points: 160 },
];

export const BOSS_TYPES = [
  { id: "goblin_king", emoji: "👑", label: "Goblin King", hp: 5, maxHp: 5, speed: 0.65, color: "#fbbf24", size: 1.8, isBoss: true, deathStyle: "explode", walkStyle: "stomp", points: 600, bossWave: 4, ability: "Summons extra goblins" },
  { id: "lich_lord", emoji: "☠️", label: "Lich Lord", hp: 7, maxHp: 7, speed: 0.5, color: "#818cf8", size: 1.9, isBoss: true, deathStyle: "implode", walkStyle: "float", points: 900, bossWave: 8, ability: "Regenerates HP over time" },
  { id: "dark_dragon", emoji: "🔥", label: "Dark Dragon", hp: 10, maxHp: 10, speed: 0.4, color: "#ef4444", size: 2.2, isBoss: true, deathStyle: "explode", walkStyle: "crawl", points: 1500, bossWave: 10, ability: "Immune to first hit" },
];

// ─── 🟢 EXACT 4-WAVE CONFIGURATION (Fixes Announcer Sync) ───────────────────
export function getWaveConfig(waveNum) {
  if (waveNum === 1) return { label: "Easy",   speedMultiplier: 0.8, enemyCount: 6,  isBossWave: false, hasBonusRound: false, difficulty: "Easy" }; 
  if (waveNum === 2) return { label: "Medium", speedMultiplier: 1.0, enemyCount: 6,  isBossWave: false, hasBonusRound: false, difficulty: "Medium" };
  if (waveNum === 3) return { label: "Hard",   speedMultiplier: 1.4, enemyCount: 8,  isBossWave: false, hasBonusRound: false, difficulty: "Hard" };
  return { label: "Boss", speedMultiplier: 1.2, enemyCount: 10, isBossWave: true, hasBonusRound: false, difficulty: "Expert" };
}

export function pickEnemy(waveNumber, forceBoss = false) {
  const isBossWave = waveNumber >= 4;
  if (forceBoss && isBossWave) {
    return BOSS_TYPES[0];
  }
  const pool = waveNumber <= 2  ? [ENEMY_TYPES[0], ENEMY_TYPES[1]]
    : waveNumber === 3  ? ENEMY_TYPES.slice(0, 4)
    : ENEMY_TYPES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const TOWER_LEVELS = [
  { level: 1, emoji: "🗼", label: "Wooden Tower", color: "#92400e", unlockStreak: 0, projectile: "arrow", projectileColor: "#d97706", damage: 1, attackDesc: "Fires arrows", icon: "🏹" },
  { level: 2, emoji: "🏯", label: "Stone Ballista", color: "#6b7280", unlockStreak: 3, projectile: "bolt", projectileColor: "#9ca3af", damage: 1, attackDesc: "Launches bolts", icon: "⚡" },
  { level: 3, emoji: "⚡", label: "Storm Tower", color: "#fbbf24", unlockStreak: 6, projectile: "lightning", projectileColor: "#fbbf24", damage: 2, attackDesc: "Chains lightning", icon: "🌩️" },
  { level: 4, emoji: "🔥", label: "Inferno Spire", color: "#ef4444", unlockStreak: 10, projectile: "fireball", projectileColor: "#f97316", damage: 2, attackDesc: "Hurls fireballs", icon: "🔥" },
];

export function getTowerLevel(streak) {
  let level = TOWER_LEVELS[0];
  for (const t of TOWER_LEVELS) {
    if (streak >= t.unlockStreak) level = t;
  }
  return level;
}

export const defaultQuestions = [
  { id:"d1",  type:"definition", difficulty:0, language:"English", question:"What is the meaning of 'Benevolent'?", choices:["Kind and generous","Angry and violent","Shy and timid","Loud and boisterous"], answer:0 },
];

export function buildSlots(correctAnswer, slotCount = 4) {
  return [correctAnswer, "---", "---", "---"];
}