// ═══════════════════════════════════════════════
// BOARD TILE MAPS
// ═══════════════════════════════════════════════
export const LADDERS        = { 3: 22, 8: 30, 28: 55, 50: 75 };
// 🟢 FIXED: The snake now starts at 99!
export const SNAKES         = { 27: 5, 43: 18, 66: 45, 99: 70 }; 
export const POWER_UP_TILES = [12, 33, 48, 71];
export const TRAP_TILES     = [19, 40, 62, 84];
export const WILD_TILES     = [25, 60, 85];
export const DOUBLE_TILES   = [15, 45, 78];
export const STEAL_TILES    = [35, 65];

export const BOARD_SIZE = 10;
export const TILE_SIZE  = 76;

// ═══════════════════════════════════════════════
// SCREENS & MODES
// ═══════════════════════════════════════════════
export const SCREENS = { MENU: "menu", MODE: "mode", CHAR: "char", GAME: "game", WIN: "win" };
export const MODES   = { MULTIPLAYER: "multiplayer", VS_AI: "vs_ai" };

// ═══════════════════════════════════════════════
// AI DIFFICULTY
// ═══════════════════════════════════════════════
export const AI_DIFFICULTY = {
  EASY:   { label: "Easy",   emoji: "🌱", accuracy: 0.35, rollDelay: 2200, color: "#44ff88" },
  MEDIUM: { label: "Medium", emoji: "⚔️", accuracy: 0.65, rollDelay: 1600, color: "#ffd700" },
  HARD:   { label: "Hard",   emoji: "💀", accuracy: 0.88, rollDelay: 1000, color: "#ff4444" },
};

// ═══════════════════════════════════════════════
// CHARACTERS  (added stat flavour text)
// ═══════════════════════════════════════════════
export const CHARACTERS = [
  { id: "ninja",  name: "Ninja",  emoji: "🥷",  color: "#00e5ff", aura: "#00e5ff44", stat: "Speed +2",  lore: "Silent, swift, deadly." },
  { id: "pirate", name: "Pirate", emoji: "🏴‍☠️", color: "#ff9800", aura: "#ff980044", stat: "Luck +2",   lore: "Fortune favours the bold." },
  { id: "knight", name: "Knight", emoji: "⚔️",  color: "#e0e0e0", aura: "#e0e0e044", stat: "Defense +2", lore: "Honour above all else." },
  { id: "mage",   name: "Mage",   emoji: "🧙",  color: "#ce93d8", aura: "#ce93d844", stat: "Magic +2",  lore: "Knowledge is power." },
];

// ═══════════════════════════════════════════════
// TILE EFFECTS
// ═══════════════════════════════════════════════
export const WILD_EFFECTS = [
  { label: "🌟 Lucky Star!",  desc: "Move forward 5 tiles!",         effect: "forward5" },
  { label: "⚡ Power Surge!", desc: "Gain 20 HP!",                   effect: "heal20"   },
  { label: "🎁 Bonus Round!", desc: "Answer for double points!",     effect: "double"   },
  { label: "💨 Wind Back!",   desc: "Move back 3 tiles!",            effect: "back3"    },
  { label: "💔 Dark Curse!",  desc: "Lose 15 HP!",                   effect: "damage15" },
  { label: "🔄 Swap!",        desc: "Swap positions with opponent!", effect: "swap"     },
];
export const POWER_UP_EFFECTS = [
  "🛡️ Shield — Gain 15 HP!",
  "⚡ Energize — Move forward 3!",
  "💎 Treasure — Earn 20 points!",
  "🌿 Regen — Heal 10 HP!",
];
export const TRAP_EFFECTS = [
  "💀 Ambush — Lose 15 HP!",
  "⏪ Trap Door — Go back 3 tiles!",
  "🦇 Curse — Skip next turn!",
  "🩸 Drain — Lose 10 points!",
];

// ═══════════════════════════════════════════════
// MISC
// ═══════════════════════════════════════════════
export const DICE_FACES  = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
export const LEGEND_ITEMS = [
  ["#0d2e1a","🪜 Ladder"], ["#2e0d0d","🐍 Snake"],
  ["#1a1040","⚡ Power"],  ["#2e1a00","💀 Trap"],
  ["#1a0d2e","🃏 Wild"],   ["#1a2e0d","×2 Double"], ["#2e0d20","💉 Steal"],
];
export const ABOUT_TILES = [
  ["🪜","Ladder","Climb up!"],
  ["🐍","Snake","Slide down (-10 HP)"],
  ["⚡","Power-Up","Heal, move, or gain pts"],
  ["💀","Trap","Lose HP, pts, or skip turn"],
  ["🃏","Wild Card","Random effect!"],
  ["×2","Double","Next answer = 2× points!"],
  ["💉","Steal","Drain 5 HP from opponent"],
];