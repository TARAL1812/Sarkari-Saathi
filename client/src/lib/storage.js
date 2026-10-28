export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* localStorage may be unavailable */ }
}

export function getChecklist(journeyId) { return readStorage(`jm_check_${journeyId}`, []); }
export function setChecklist(journeyId, value) { writeStorage(`jm_check_${journeyId}`, value); }
