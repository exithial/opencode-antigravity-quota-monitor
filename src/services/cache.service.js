import { ConfigService } from "./config.service.js";

export class CacheService {
  static #cache = new Map();
  static #enabled = true;

  static initialize() {
    const config = ConfigService.getAll();
    this.#enabled = config.enableMemoryCache;
  }

  static get(key) {
    if (!this.#enabled) {
      return null;
    }

    const entry = this.#cache.get(key);
    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() > entry.expiresAt) {
      this.#cache.delete(key);
      return null;
    }

    return entry.value;
  }

  static set(key, value, ttl = null) {
    if (!this.#enabled) {
      return;
    }

    const config = ConfigService.getAll();
    const cacheTtl = ttl || config.cacheTtl;

    this.#cache.set(key, {
      value,
      expiresAt: Date.now() + cacheTtl,
      timestamp: new Date().toISOString()
    });

    // Limpiar entradas expiradas periódicamente
    this.cleanup();
  }

  static delete(key) {
    this.#cache.delete(key);
  }

  static clear() {
    this.#cache.clear();
  }

  static disable() {
    this.#enabled = false;
    this.clear();
  }

  static enable() {
    this.#enabled = true;
  }

  static isEnabled() {
    return this.#enabled;
  }

  static cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.#cache.entries()) {
      if (now > entry.expiresAt) {
        this.#cache.delete(key);
      }
    }
  }

  static getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;
    let totalSize = 0;

    for (const entry of this.#cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
      // Estimación simple del tamaño
      totalSize += JSON.stringify(entry.value).length;
    }

    return {
      total: this.#cache.size,
      active,
      expired,
      enabled: this.#enabled,
      memoryUsage: `${Math.round(totalSize / 1024)} KB`
    };
  }

  static generateCacheKey(accountIndex, projectId) {
    return `account_${accountIndex}_${projectId}_${new Date().toISOString().slice(0, 10)}`;
  }

  static generateModelsCacheKey(accessToken, projectId) {
    // Usar hash simple para no almacenar tokens en la key
    const tokenHash = this.simpleHash(accessToken.slice(-10));
    return `models_${tokenHash}_${projectId}`;
  }

  static simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

export default CacheService;