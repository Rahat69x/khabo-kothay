import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/api.js';

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

// Rate Limiting: 120 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', limiter);

// Mobile client basic deterrent authentication token check
app.use('/api', (req, res, next) => {
  // Public metadata endpoints
  if (req.path === '/health' || req.path === '/config' || req.path === '/places/photo') {
    return next();
  }

  const appToken = process.env.APP_CLIENT_TOKEN;
  // If token is configured and the caller is an external mobile client (or sends header)
  if (appToken) {
    const clientToken = req.headers['x-app-token'];
    const isMobileClient = req.headers['user-agent']?.includes('Expo') || 
                           req.headers['x-requested-with'] === 'com.example.cafefinder' ||
                           req.headers['x-client-platform'] === 'mobile';
    
    if (isMobileClient && clientToken !== appToken) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or missing X-App-Token header.'
      });
    }
  }

  next();
});

// Serve frontend static assets
app.use(express.static(publicDir));

// Mount API routes
app.use('/api', apiRouter);

// Fallback for SPA routing to index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    status
  });
});

// Only listen if executed directly (not when imported in supertest)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Khabo Kothay? running on http://localhost:${PORT}`);
    console.log(`Mock mode: ${process.env.USE_MOCK_DATA === 'true' ? 'ENABLED' : 'DISABLED'}`);
  });
}

export default app;
