import pino from 'pino';
import pinoHttp from 'pino-http';
import crypto from 'crypto';
import envConfig from '../config/env.js';

export const logger = pino({
  level: process.env.LOG_LEVEL || envConfig.logLevel || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-app-token"]',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.email',
      'req.body.phone',
      'req.body.nationalPhoneNumber',
      'req.body.internationalPhoneNumber'
    ],
    censor: '[REDACTED]'
  },
  serializers: {
    req(req) {
      // Coarse GPS privacy protection: truncate lat/lng to 2 decimals if logged
      let coarseBody = undefined;
      if (req.raw?.body) {
        coarseBody = { ...req.raw.body };
        if (typeof coarseBody.lat === 'number') {
          coarseBody.lat = Number(coarseBody.lat.toFixed(2));
        }
        if (typeof coarseBody.lng === 'number') {
          coarseBody.lng = Number(coarseBody.lng.toFixed(2));
        }
      }
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        coarseBody
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode
      };
    }
  }
});

/**
 * Express middleware for request IDs and structured HTTP logging
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const existingId = req.headers['x-request-id'];
    const id = existingId || crypto.randomUUID();
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
