import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/api.js';
import { httpLogger, logger } from './services/logger.js';
import { initSentry } from './services/sentry.js';
import quotaManager from './services/quota.js';
import envConfig from './config/env.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware: Helmet with configured CSP for Google Maps and fonts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          "https://unpkg.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://unpkg.com"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          "https://*.googleusercontent.com",
          "https://*.openstreetmap.org"
        ],
        connectSrc: [
          "'self'",
          "https://maps.googleapis.com",
          "https://api.open-meteo.com"
        ]
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// CORS for mobile app and cross-origin access
app.use(cors());

// Body Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Sentry Request Handler (if enabled via feature flag & DSN)
const sentry = initSentry(app);
app.use(sentry.requestHandler());

// Structured HTTP Request Logging with Request IDs (pino)
app.use(httpLogger);

// Rate Limiting: 120 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: envConfig.rateLimit?.windowMs || 15 * 60 * 1000,
  max: envConfig.rateLimit?.max || 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', limiter);
app.use('/api/v1', limiter);

// Mobile client deterrent authentication token check middleware
const authCheckMiddleware = (req, res, next) => {
  // Public metadata & health endpoints
  if (
    req.path === '/health' ||
    req.path === '/ready' ||
    req.path === '/config' ||
    req.path === '/places/photo'
  ) {
    return next();
  }

  const appToken = process.env.APP_CLIENT_TOKEN;
  if (appToken) {
    const clientToken = req.headers['x-app-token'];
    const isMobileClient =
      req.headers['user-agent']?.includes('Expo') ||
      req.headers['x-requested-with'] === 'com.khabokothay.app' ||
      req.headers['x-requested-with'] === 'com.example.cafefinder' ||
      req.headers['x-client-platform'] === 'mobile';

    if (isMobileClient && clientToken !== appToken) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or missing X-App-Token header.'
      });
    }
  }

  next();
};

app.use('/api', authCheckMiddleware);
app.use('/api/v1', authCheckMiddleware);

// Root Liveness & Readiness Probes (for orchestrators, load balancers, and monitoring)
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'ok',
    app: 'Khabo Kothay?',
    version: '1.1.0',
    commit: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || '6e196bf',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', (req, res) => {
  const memory = process.memoryUsage();
  const isHealthy = memory.heapUsed < 1.5 * 1024 * 1024 * 1024;
  const budget = quotaManager.checkGlobalMonthlyBudget();
  const ready = isHealthy && !budget.killSwitchActive;

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'degraded',
    ok: ready,
    app: 'Khabo Kothay?',
    version: '1.1.0',
    checks: {
      cache: 'ok',
      engine: 'ok',
      budget: budget.isExceeded ? 'budget_exceeded' : 'ok'
    },
    uptime: process.uptime()
  });
});

// Serve frontend static assets
app.use(express.static(publicDir));

// Mount Versioned API Routes (/api/v1 and backwards-compatible /api)
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// Fallback for SPA routing to index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Sentry Error Handler (if active)
app.use(sentry.errorHandler());

// Centralized error handling middleware
app.use((err, req, res, next) => {
  logger.error({ err, reqId: req.id }, 'Unhandled server error');
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    status,
    requestId: req.id
  });
});

let server = null;

// Only listen if executed directly (not when imported in supertest)
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`Khabo Kothay? running on http://localhost:${PORT}`);
    logger.info(`Environment: ${envConfig.env} | Mock mode: ${process.env.USE_MOCK_DATA === 'true' ? 'ENABLED' : 'DISABLED'}`);
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    logger.info({ signal }, 'Received termination signal. Closing HTTP server gracefully...');
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed cleanly. Process exiting.');
        process.exit(0);
      });
      // Force exit if hanging requests exceed 10 seconds
      setTimeout(() => {
        logger.error('Graceful shutdown timeout exceeded. Forcing exit.');
        process.exit(1);
      }, 10000).unref();
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
