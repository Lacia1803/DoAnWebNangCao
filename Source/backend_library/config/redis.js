const Redis = require('ioredis');
const logger = require('./logger');

// Allow turning Redis caching on/off via env (default: disabled to avoid dev noise)
const REDIS_ENABLED = String(process.env.REDIS_ENABLED || 'false').toLowerCase() === 'true';

// Create Redis client only when enabled
const redis = REDIS_ENABLED
  ? new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      lazyConnect: true, // do not connect until first command
      retryStrategy: (times) => {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    })
  : null;

// Redis event handlers
if (REDIS_ENABLED && redis) {
  redis.on('connect', () => {
    logger.info('Redis client connected');
  });

  redis.on('error', (err) => {
    // Log concise error to avoid noisy stack traces in dev
    logger.error(`Redis connection error: ${err.code || err.message}`);
  });

  redis.on('ready', () => {
    logger.info('Redis client ready to use');
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });
} else {
  logger.info('Redis caching is disabled (set REDIS_ENABLED=true to enable).');
}

/**
 * Cache utility functions
 */
class CacheService {
  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {Promise<any>} Parsed cached data or null
   */
  static async get(key) {
    if (!REDIS_ENABLED || !redis) return null;
    try {
      // Ensure connection attempt happens lazily
      if (!redis.status || redis.status === 'wait' || redis.status === 'end') {
        await redis.connect().catch(() => {});
      }
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // Swallow cache errors in runtime to avoid breaking app
      logger.logError(error, { context: 'CacheService.get', key });
      return null;
    }
  }

  /**
   * Set cache data with expiration
   * @param {string} key - Cache key
   * @param {any} value - Data to cache
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   * @returns {Promise<boolean>} Success status
   */
  static async set(key, value, ttl = 3600) {
    if (!REDIS_ENABLED || !redis) return false;
    try {
      if (!redis.status || redis.status === 'wait' || redis.status === 'end') {
        await redis.connect().catch(() => {});
      }
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.logError(error, { context: 'CacheService.set', key });
      return false;
    }
  }

  /**
   * Delete cached data
   * @param {string} key - Cache key or pattern
   * @returns {Promise<boolean>} Success status
   */
  static async del(key) {
    if (!REDIS_ENABLED || !redis) return true;
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.logError(error, { context: 'CacheService.del', key });
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param {string} pattern - Redis key pattern (e.g., 'books:*')
   * @returns {Promise<boolean>} Success status
   */
  static async delPattern(pattern) {
    if (!REDIS_ENABLED || !redis) return true;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
      return true;
    } catch (error) {
      logger.logError(error, { context: 'CacheService.delPattern', pattern });
      return false;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Existence status
   */
  static async exists(key) {
    if (!REDIS_ENABLED || !redis) return false;
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.logError(error, { context: 'CacheService.exists', key });
      return false;
    }
  }

  /**
   * Set cache with automatic key generation
   * @param {string} prefix - Key prefix (e.g., 'books', 'users')
   * @param {string} id - Resource ID
   * @param {any} value - Data to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  static async setResource(prefix, id, value, ttl = 3600) {
    const key = `${prefix}:${id}`;
    return this.set(key, value, ttl);
  }

  /**
   * Get cached resource
   * @param {string} prefix - Key prefix
   * @param {string} id - Resource ID
   * @returns {Promise<any>} Cached data or null
   */
  static async getResource(prefix, id) {
    const key = `${prefix}:${id}`;
    return this.get(key);
  }

  /**
   * Delete all cached resources with prefix
   * @param {string} prefix - Key prefix
   * @returns {Promise<boolean>} Success status
   */
  static async clearResourceCache(prefix) {
    return this.delPattern(`${prefix}:*`);
  }

  /**
   * Cache wrapper function with automatic get/set
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if cache miss
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} Cached or fetched data
   */
  static async remember(key, fetchFn, ttl = 3600) {
    // If disabled, just fetch and return
    if (!REDIS_ENABLED || !redis) {
      return fetchFn();
    }
    try {
      // Try to get from cache
      let data = await this.get(key);
      
      if (data !== null) {
        logger.info(`Cache hit: ${key}`);
        return data;
      }

      // Cache miss - fetch data
      logger.info(`Cache miss: ${key}`);
      data = await fetchFn();
      
      // Store in cache
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl);
      }
      
      return data;
    } catch (error) {
      logger.logError(error, { context: 'CacheService.remember', key });
      // Fallback to fetch function on error
      return fetchFn();
    }
  }
}

module.exports = {
  redis,
  CacheService,
  REDIS_ENABLED,
};
