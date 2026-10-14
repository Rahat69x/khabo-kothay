import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIT_FILE = path.join(__dirname, '..', 'data', 'audit-log.jsonl');

// Ensure parent data directory exists
const dataDir = path.dirname(AUDIT_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Record an administrative action into the audit trail
 * @param {Object} entry
 * @param {string} entry.who - Admin identifier or token fingerprint
 * @param {string} entry.action - Action name (e.g., "FLAG_UPDATE", "RELEASE_PUBLISH")
 * @param {string} entry.target - Target key or entity ID
 * @param {Object} [entry.before] - State before change
 * @param {Object} [entry.after] - State after change
 * @param {string} [entry.ip] - Request IP
 * @param {string} [entry.requestId] - Associated X-Request-Id
 * @param {Object} [entry.metadata] - Optional additional details
 */
export function recordAuditLog({ who = 'admin', action, target, before = null, after = null, ip = 'unknown', requestId = null, metadata = null }) {
  try {
    const record = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      who,
      action,
      target,
      before,
      after,
      ip,
      requestId,
      metadata
    };

    const line = JSON.stringify(record) + '\n';
    fs.appendFileSync(AUDIT_FILE, line, 'utf8');
    return record;
  } catch (err) {
    logger.error({ err, action, target }, 'Failed to record audit log entry');
    return null;
  }
}

/**
 * Retrieve recent audit log entries
 * @param {Object} options
 * @param {number} [options.limit=50]
 * @param {string} [options.action]
 * @param {string} [options.target]
 * @returns {Array<Object>}
 */
export function getAuditLogs({ limit = 50, action = null, target = null } = {}) {
  try {
    if (!fs.existsSync(AUDIT_FILE)) {
      return [];
    }

    const content = fs.readFileSync(AUDIT_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    const records = [];

    // Parse in reverse chronological order
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const item = JSON.parse(lines[i]);
        if (action && item.action !== action) continue;
        if (target && item.target !== target) continue;
        records.push(item);
        if (records.length >= limit) break;
      } catch {
        // Skip malformed lines
      }
    }

    return records;
  } catch (err) {
    logger.error({ err }, 'Failed to read audit log entries');
    return [];
  }
}

export default {
  recordAuditLog,
  getAuditLogs
};
