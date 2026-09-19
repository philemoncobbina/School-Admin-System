/**
 * In-memory frontend cache for the attendance module.
 *
 * This cache:
 * - exists only for the current browser tab
 * - is cleared when the page reloads
 * - does not use localStorage or sessionStorage
 * - supports TTL expiration
 * - deduplicates simultaneous requests for the same resource
 *
 * Redis remains the shared backend cache and the database remains the
 * source of truth.
 */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type InFlightRequest = Promise<unknown>;

class TTLCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, InFlightRequest>();
  private readonly maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new Error("Cache TTL must be a positive number.");
    }

    this.removeExpiredEntries();

    if (!this.store.has(key) && this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value as
        | string
        | undefined;

      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);

    /*
     * Removing the Promise from this map prevents future callers from
     * joining it. It cannot cancel an HTTP request that has already started.
     */
    this.inFlight.delete(key);
  }

  clearPrefix(prefix: string): void {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }

    for (const key of Array.from(this.inFlight.keys())) {
      if (key.startsWith(prefix)) {
        this.inFlight.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
    this.inFlight.clear();
  }

  async getOrLoad<T>(
    key: string,
    loader: () => Promise<T>,
    ttlMs: number
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    const existingRequest = this.inFlight.get(key);

    if (existingRequest) {
      return existingRequest as Promise<T>;
    }

    const request = loader()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, request);

    return request;
  }

  removeExpiredEntries(): void {
    const now = Date.now();

    for (const [key, entry] of Array.from(this.store.entries())) {
      if (now >= entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  get size(): number {
    this.removeExpiredEntries();
    return this.store.size;
  }
}

export const attendanceCache = new TTLCache();

export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,
  MEDIUM: 30 * 60 * 1000,
  LONG: 24 * 60 * 60 * 1000,
} as const;

export const cacheKeys = {
  termCalendar: (termId: number): string =>
    `term-calendar:${termId}`,

  roster: (
    className: string,
    termId: number,
    date: string
  ): string =>
    `roster:${className}:${termId}:${date}`,

  summary: (
    studentId: number,
    termId: number
  ): string =>
    `summary:${studentId}:${termId}`,

  selfSummary: (termId: number): string =>
    `self-summary:${termId}`,

  classes: (): string =>
    "classes",

  studentsByClass: (className: string): string =>
    `students-by-class:${className}`,
} as const;

export const cachePrefixes = {
  termCalendars: "term-calendar:",
  rosters: "roster:",
  summaries: "summary:",
  selfSummaries: "self-summary:",
  studentsByClass: "students-by-class:",
} as const;