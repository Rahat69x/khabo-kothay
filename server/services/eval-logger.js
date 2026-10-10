import fs from 'fs';
import path from 'path';
import { dataFile } from '../config/paths.js';

const LOG_FILE = dataFile('eval-sessions.jsonl');

// Ensure directory exists
try {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (e) {}

/**
 * Anonymized session evaluation logger
 * Records interaction events: impressions, opens, directions, ratings
 * Redacts any personal identifiers
 */
export function logEvalEvent({
  sessionId,
  eventType, // 'impression', 'open', 'directions', 'rating'
  priority,
  chosenCandidateId,
  topRankedIds = [],
  metadata = {}
}) {
  const entry = {
    sessionId: sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    eventType,
    priority: priority || 'Best Overall',
    chosenCandidateId,
    topRankedIds: topRankedIds.slice(0, 10),
    metadata: {
      budget: metadata.budget,
      cuisine: metadata.cuisine,
      companion: metadata.companion,
      hasTimeBudget: Boolean(metadata.timeBudgetMinutes)
    },
    timestamp: new Date().toISOString()
  };

  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  } catch (err) {
    // Non-blocking fallback
  }

  return entry;
}

/**
 * Read logged eval sessions
 */
export function getLoggedSessions() {
  if (!fs.existsSync(LOG_FILE)) return [];
  try {
    const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
    return lines.filter(Boolean).map(l => JSON.parse(l));
  } catch (e) {
    return [];
  }
}

export default {
  logEvalEvent,
  getLoggedSessions
};
