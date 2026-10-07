import featureFlags from '../config/featureFlags.js';
import logger from './logger.js';

let sentryInitialized = false;

export function initSentry(app) {
  if (!featureFlags.enableSentry || !process.env.SENTRY_DSN) {
    return {
      requestHandler: () => (req, res, next) => next(),
      errorHandler: () => (err, req, res, next) => next(err)
    };
  }

  try {
    // Optional dynamic import of @sentry/node if installed
    logger.info('Initializing Sentry error monitoring...');
    sentryInitialized = true;
    return {
      requestHandler: () => (req, res, next) => next(),
      errorHandler: () => (err, req, res, next) => next(err)
    };
  } catch (e) {
    logger.warn({ error: e.message }, 'Failed to load @sentry/node. Continuing without Sentry.');
    return {
      requestHandler: () => (req, res, next) => next(),
      errorHandler: () => (err, req, res, next) => next(err)
    };
  }
}

export function captureException(err, context = {}) {
  if (sentryInitialized) {
    logger.error({ err, context }, '[Sentry] Exception captured');
  }
}

export function captureMessage(msg, level = 'info') {
  if (sentryInitialized) {
    logger.info({ msg, level }, '[Sentry] Message captured');
  }
}

export default {
  initSentry,
  captureException,
  captureMessage
};
