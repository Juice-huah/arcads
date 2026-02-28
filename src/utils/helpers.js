import {
  BOARD_SIZE, TILE_SIZE,
  LADDERS, SNAKES,
  POWER_UP_TILES, TRAP_TILES, WILD_TILES, DOUBLE_TILES, STEAL_TILES,
} from "../constants/gameData";

// ─── Board geometry ────────────────────────────────────────────────

export function getTilePos(tile) {
  const idx = tile - 1;
  const row = Math.floor(idx / BOARD_SIZE);
  let col = idx % BOARD_SIZE;
  if (row % 2 === 1) col = BOARD_SIZE - 1 - col;
  return { col, row };
}

export function tileCenter(tile) {
  const { col, row } = getTilePos(tile);
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: (BOARD_SIZE - 1 - row) * TILE_SIZE + TILE_SIZE / 2,
  };
}

// ─── Tile classification ───────────────────────────────────────────

export function getTileType(tile) {
  if (tile === 1)   return "start";
  if (tile === 100) return "finish";
  if (LADDERS[tile])                 return "ladder-start";
  if (SNAKES[tile])                  return "snake-start";
  if (POWER_UP_TILES.includes(tile)) return "power-up";
  if (TRAP_TILES.includes(tile))     return "trap";
  if (WILD_TILES.includes(tile))     return "wild";
  if (DOUBLE_TILES.includes(tile))   return "double";
  if (STEAL_TILES.includes(tile))    return "steal";
  return tile % 2 === 0 ? "light" : "dark";
}

export function tileIcon(tile) {
  if (tile === 1)   return { icon: "🏠", label: "Start" };
  if (tile === 100) return { icon: "🏆", label: "Finish" };
  if (LADDERS[tile])                 return { icon: "🪜", label: `→${LADDERS[tile]}` };
  if (SNAKES[tile])                  return { icon: "🐍", label: `→${SNAKES[tile]}` };
  if (POWER_UP_TILES.includes(tile)) return { icon: "⚡", label: "Power" };
  if (TRAP_TILES.includes(tile))     return { icon: "💀", label: "Trap" };
  if (WILD_TILES.includes(tile))     return { icon: "🃏", label: "Wild" };
  if (DOUBLE_TILES.includes(tile))   return { icon: "×2", label: "Double" };
  if (STEAL_TILES.includes(tile))    return { icon: "💉", label: "Steal" };
  return { icon: "", label: "" };
}

// ─── Visual helpers ────────────────────────────────────────────────

export function hpColor(hp) {
  if (hp > 60) return "#44ff88";
  if (hp > 30) return "#ff9800";
  return "#ff4444";
}

export function diffColor(d) {
  if (d === "easy")   return { bg: "#0d2e1a", color: "#44ff88" };
  if (d === "medium") return { bg: "#2e2200", color: "#ffd700" };
  return { bg: "#2e0d0d", color: "#ff4444" };
}

// ─── Player factory ────────────────────────────────────────────────

export function initPlayers(chars) {
  return [
    { id: 0, name: "Player 1", char: chars[0], pos: 1, health: 100, score: 0, streak: 0, skipTurn: false },
    { id: 1, name: "Player 2", char: chars[1], pos: 1, health: 100, score: 0, streak: 0, skipTurn: false },
  ];
}
