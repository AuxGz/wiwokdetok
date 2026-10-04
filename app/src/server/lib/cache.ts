interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();
let hits = 0;
let misses = 0;

/**
 * Mengambil nilai dari in-memory cache berdasarkan key.
 * Mengembalikan undefined jika key tidak ditemukan atau sudah kadaluarsa (TTL habis).
 */
export function getCache<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) {
    misses++;
    return undefined;
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    misses++;
    return undefined;
  }

  hits++;
  return entry.value as T;
}

/**
 * Menyimpan nilai ke in-memory cache dengan durasi TTL (default 60 detik).
 */
export function setCache<T>(key: string, value: T, ttlSeconds: number = 60): void {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  store.set(key, { value, expiresAt });
}

/**
 * Menghapus cache berdasarkan prefix, pattern, atau seluruh isi cache jika tanpa parameter.
 */
export function invalidateCache(patternOrPrefix?: string): void {
  if (!patternOrPrefix || patternOrPrefix === "*") {
    store.clear();
    return;
  }

  let regex: RegExp | null = null;
  try {
    if (patternOrPrefix.includes("*")) {
      const escaped = patternOrPrefix.replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\\$&").replace(/\\\*/g, ".*");
      regex = new RegExp(`^${escaped}`);
    }
  } catch {
    regex = null;
  }

  for (const key of Array.from(store.keys())) {
    if (regex ? regex.test(key) : (key.startsWith(patternOrPrefix) || key.includes(patternOrPrefix))) {
      store.delete(key);
    }
  }
}

/**
 * Mengambil metrik performa in-memory cache (hits, misses, current size).
 */
export function getCacheMetrics(): { hits: number; misses: number; size: number } {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }

  return {
    hits,
    misses,
    size: store.size,
  };
}

/**
 * Mereset seluruh cache dan metrik (untuk kebutuhan testing).
 */
export function resetCache(): void {
  store.clear();
  hits = 0;
  misses = 0;
}
