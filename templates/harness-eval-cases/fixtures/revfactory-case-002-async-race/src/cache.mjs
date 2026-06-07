// AsyncCache memoizes async loader results by key.
export class AsyncCache {
  constructor() {
    this.values = new Map();
  }

  // Returns the cached value for key, or loads + caches it via loader(key).
  async get(key, loader) {
    if (this.values.has(key)) {
      return this.values.get(key);
    }
    const value = await loader(key);
    this.values.set(key, value);
    return value;
  }

  has(key) {
    return this.values.has(key);
  }

  clear() {
    this.values.clear();
  }
}
