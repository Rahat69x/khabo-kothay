import pino from 'pino';
import pinoHttp from 'pino-http';
import crypto from 'crypto';
import envConfig from '../config/env.js';

const serializers = {
  req(req) {
    // Privacy: bodies carry precise GPS (origin/destination/lat/lng), taste profiles and
    // saved places, so only their keys are logged. Query lat/lng are coarsened to ~1 km.
    const query = { ...(req.query || {}) };
    for (const k of ['lat', 'lng']) {
      if (query[k] !== undefined && Number.isFinite(Number(query[k]))) {
        query[k] = Number(Number(query[k]).toFixed(2));
      }
    }
    const body = req.raw?.body;
    return {
      id: req.id,
      method: req.method,
      url: (req.url || '').split('?')[0],
      query,
      params: req.params,
      bodyKeys: body && typeof body === 'object' ? Object.keys(body).slice(0, 30) : undefined
    };
  },
  res(res) {
    return {
      statusCode: res.statusCode
    };
  }
};

export const logger = pino({
  level: process.env.LOG_LEVEL || envConfig.logLevel || 'info',
  // Headers aren't serialized, but redact credentials in case any log call passes them.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-app-token"]',
      'req.headers["x-admin-token"]'
    ],
    censor: '[REDACTED]'
  },
  serializers
});

/**
 * Express middleware for request IDs and structured HTTP logging
 */
export const httpLogger = pinoHttp({
  logger,
  // pino-http applies its own default serializers (which include headers and client IP)
  // unless they're passed here explicitly.
  serializers,
  genReqId(req, res) {
    const existingId = req.headers['x-request-id'];
    const id = typeof existingId === 'string' && /^[\w-]{1,64}$/.test(existingId) ? existingId : crypto.randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  customLogLevel(req, res, err) {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: {
    ignore: (req) => {
      // Don't clutter logs with high-frequency health probes in non-debug mode
      if (req.url === '/health' || req.url === '/ready' || req.url === '/api/health' || req.url === '/api/ready') {
        return process.env.LOG_LEVEL !== 'debug';
      }
      return false;
    }
  }
});

export default logger;
