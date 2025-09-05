import { Request, Response, NextFunction, RequestHandler } from "express";
import { sendError } from "../utils/response";
import { HttpStatus } from "../types/httpStatus";
import "colors";
// Rate Limiting
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default: 15 minutes)
  maxRequests?: number; // Max requests per window (default: 100)
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

function createRateLimitMiddleware(
  options: RateLimitOptions = {}
): RequestHandler {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const maxRequests = options.maxRequests || 100;
  const keyGenerator =
    options.keyGenerator || ((req: Request) => req.ip || "unknown");

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    if (rateLimitStore[key] && rateLimitStore[key].resetTime < windowStart) {
      delete rateLimitStore[key];
    }

    // Initialize or update counter
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      rateLimitStore[key].count++;
    }

    const current = rateLimitStore[key];

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - current.count)
    );
    res.setHeader("X-RateLimit-Reset", Math.ceil(current.resetTime / 1000));

    if (current.count > maxRequests) {
      return sendError(res, "Too many requests", HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  };
}

export function RateLimit(options: RateLimitOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const middleware = createRateLimitMiddleware(options);

    if (Array.isArray(originalMethod)) {
      const lastHandler = originalMethod[originalMethod.length - 1];
      descriptor.value = [
        ...originalMethod.slice(0, -1),
        middleware,
        lastHandler,
      ];
    } else {
      descriptor.value = [middleware, originalMethod];
    }

    return descriptor;
  };
}

// Caching
interface CacheEntry {
  data: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  keyGenerator?: (req: Request) => string; // Custom cache key generator
  condition?: (req: Request, res: Response) => boolean; // When to cache
}

function createCacheMiddleware(options: CacheOptions = {}): RequestHandler {
  const ttl = options.ttl || 5 * 60 * 1000; // 5 minutes
  const keyGenerator =
    options.keyGenerator ||
    ((req: Request) => `${req.method}:${req.originalUrl}`);

  return (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = keyGenerator(req);
    const now = Date.now();

    // Check if cached entry exists and is not expired
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && cachedEntry.expiresAt > now) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cachedEntry.data);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache the response
    res.json = function (data: any) {
      // Check if we should cache this response
      if (!options.condition || options.condition(req, res)) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, {
            data,
            expiresAt: now + ttl,
          });
        }
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(data);
    };

    next();
  };
}

export function Cache(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const middleware = createCacheMiddleware(options);

    if (Array.isArray(originalMethod)) {
      const lastHandler = originalMethod[originalMethod.length - 1];
      descriptor.value = [
        ...originalMethod.slice(0, -1),
        middleware,
        lastHandler,
      ];
    } else {
      descriptor.value = [middleware, originalMethod];
    }

    return descriptor;
  };
}

// Clear cache utility
export function clearCache(pattern?: string): number {
  if (!pattern) {
    const size = cache.size;
    cache.clear();
    return size;
  }

  const regex = new RegExp(pattern);
  let cleared = 0;
  for (const [key] of cache) {
    if (regex.test(key)) {
      cache.delete(key);
      cleared++;
    }
  }
  return cleared;
}

// Logging
export interface LogRequestOptions {
  includeBody?: boolean; // Log request body (default: false)
  includeResponse?: boolean; // Log response body (default: false)
  includeHeaders?: boolean; // Log headers (default: false)
  level?: "info" | "debug" | "warn" | "error"; // Log level (default: 'info')
  customLogger?: (data: any) => void; // Custom logger function
}

function createLogMiddleware(options: LogRequestOptions = {}): RequestHandler {
  const level = options.level || "info";
  const logger =
    options.customLogger ||
    ((data: any) => {
      console.log(
        `[${level.toUpperCase()}]`.green,
        JSON.stringify(data, null, 2).yellow
      );
    });

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const logData: any = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };

    if (options.includeHeaders) {
      logData.headers = req.headers;
    }

    if (options.includeBody && req.body) {
      logData.body = req.body;
    }

    if (options.includeResponse) {
      // Store original json and send methods
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      res.json = function (data: any) {
        logData.response = data;
        logData.responseTime = Date.now() - startTime;
        logData.statusCode = res.statusCode;
        logger(logData);
        return originalJson(data);
      };

      res.send = function (data: any) {
        logData.response = data;
        logData.responseTime = Date.now() - startTime;
        logData.statusCode = res.statusCode;
        logger(logData);
        return originalSend(data);
      };
    } else {
      // Log when response finishes
      res.on("finish", () => {
        logData.responseTime = Date.now() - startTime;
        logData.statusCode = res.statusCode;
        logger(logData);
      });
    }

    next();
  };
}

export function LogRequest(options: LogRequestOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const middleware = createLogMiddleware(options);

    if (Array.isArray(originalMethod)) {
      const lastHandler = originalMethod[originalMethod.length - 1];
      descriptor.value = [
        ...originalMethod.slice(0, -1),
        middleware,
        lastHandler,
      ];
    } else {
      descriptor.value = [middleware, originalMethod];
    }

    return descriptor;
  };
}

// Performance monitoring
export function Monitor() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    const monitorMiddleware: RequestHandler = (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();

      res.on("finish", () => {
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        console.log(`[MONITOR] ${req.method} ${req.originalUrl}`, {
          duration: `${duration.toFixed(2)}ms`,
          memoryDelta: {
            rss: `${((endMemory.rss - startMemory.rss) / 1024 / 1024).toFixed(
              2
            )}MB`,
            heapUsed: `${(
              (endMemory.heapUsed - startMemory.heapUsed) /
              1024 /
              1024
            ).toFixed(2)}MB`,
          },
          statusCode: res.statusCode,
        });
      });

      next();
    };

    if (Array.isArray(originalMethod)) {
      const lastHandler = originalMethod[originalMethod.length - 1];
      descriptor.value = [
        ...originalMethod.slice(0, -1),
        monitorMiddleware,
        lastHandler,
      ];
    } else {
      descriptor.value = [monitorMiddleware, originalMethod];
    }

    return descriptor;
  };
}
