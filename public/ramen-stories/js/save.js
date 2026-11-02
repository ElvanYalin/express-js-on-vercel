// Minimal versioned save stub for the mockup. The Unity SaveManager (Phase 4)
// will use the same versioned envelope: { version, data } with migrations.
const KEY = 'ramen-stories:mockup';
export const SAVE_VERSION = 1;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const env = JSON.parse(raw);
    if (env.version !== SAVE_VERSION) return {}; // migrations would run here
    return env.data || {};
  } catch { return {}; }
}

export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify({ version: SAVE_VERSION, data: { ...load(), ...data } })); } catch { /* storage unavailable */ }
}

export function reset() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
