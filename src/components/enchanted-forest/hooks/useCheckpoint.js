const KEY = 'ef-checkpoint-v2'

export function saveCheckpoint({ unlockedCount, completedCount, inventory, score }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ unlockedCount, completedCount, inventory, score }))
  } catch (_) {}
}

export function loadCheckpoint() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return null
}

export function clearCheckpoint() {
  try { localStorage.removeItem(KEY) } catch (_) {}
}
