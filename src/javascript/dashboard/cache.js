const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 180000);

const store = new Map(); // key -> { value, expiresAt }

function get(key) {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

function set(key, value, ttlMs = CACHE_TTL_MS) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function del(key) {
  store.delete(key);
}

function keys() {
  return [...store.keys()];
}

module.exports = { get, set, del, keys };
