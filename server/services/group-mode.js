import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { PRESET_LOCATIONS } from './mock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GROUPS_FILE = path.join(__dirname, '..', 'data', 'group-sessions.json');

const SESSION_TTL_MS = 3 * 60 * 60 * 1000; // 3 Hours


// Active in-memory session cache to maintain object reference parity
const activeSessions = new Map();

export function loadSessions() {
  if (activeSessions.size > 0) {
    return Array.from(activeSessions.values());
  }
  try {
    if (fs.existsSync(GROUPS_FILE)) {
      const data = JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf8'));
      const now = Date.now();
      for (const s of data) {
        if (new Date(s.expiresAt).getTime() > now) {
          activeSessions.set(s.token, s);
        }
      }
      return Array.from(activeSessions.values());
    }
  } catch (err) {
    logger.error({ err }, 'Failed reading group-sessions.json');
  }
  return [];
}

export function saveSessions(sessions) {
  try {
    for (const s of sessions) {
      activeSessions.set(s.token, s);
    }
    const dir = path.dirname(GROUPS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(GROUPS_FILE, JSON.stringify(Array.from(activeSessions.values()), null, 2), 'utf8');
  } catch (err) {
    logger.error({ err }, 'Failed saving group sessions');
  }
}


/**
 * Create a new group dining session
 */
export function createGroupSession({ creatorName = 'Host', budget = 600, cuisinePreference = null } = {}) {
  const token = crypto.randomBytes(16).toString('hex'); // 128-bit unguessable token
  const creatorId = `user-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const session = {
    id: `grp-${token.substring(0, 8)}`,
    token,
    deepLink: `khabokothay://group/${token}`,
    creatorId,
    creatorName,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'open', // open, voting, closed
    participants: [
      {
        participantId: creatorId,
        name: creatorName,
        isCreator: true,
        startingArea: 'Gulshan 2',
        budget: Number(budget) || 600,
        dietaryPreferences: [],
        joinedAt: now.toISOString()
      }
    ],
    candidates: [],
    votes: {}, // participantId -> candidateId
    winner: null
  };

  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);

  return session;
}

/**
 * Join an existing session
 */
export function joinGroupSession(token, { name = 'Guest', startingArea = 'Banani', budget = 500, dietaryPreferences = [] } = {}) {
  const sessions = loadSessions();
  const session = sessions.find(s => s.token === token);
  if (!session) throw new Error('Session not found or expired');
  if (session.status === 'closed') throw new Error('Session is closed');

  if (session.participants.length >= 12) {
    throw new Error('Group session participant limit reached (maximum 12)');
  }

  const participantId = `user-${crypto.randomBytes(4).toString('hex')}`;
  const participant = {
    participantId,
    name: name.substring(0, 30),
    isCreator: false,
    startingArea: startingArea || 'Banani',
    budget: Number(budget) || 500,
    dietaryPreferences: Array.isArray(dietaryPreferences) ? dietaryPreferences : [],
    joinedAt: new Date().toISOString()
  };

  session.participants.push(participant);
  saveSessions(sessions);

  return { session, participantId };
}

/**
 * Multi-Origin Fair Ranking Algorithm
 * Computes fair scores based on travel times from each participant's start
 */
export function computeFairRanking(session, candidateRestaurants) {
  if (!session || !candidateRestaurants || candidateRestaurants.length === 0) return [];

  const participants = session.participants;
  const scored = [];

  for (const restaurant of candidateRestaurants) {
    const travelTimes = [];

    const rArea = (restaurant.neighborhood || '').toLowerCase();
    for (const p of participants) {
      const pArea = (p.startingArea || '').toLowerCase();
      let travelMins = 18;
      if (rArea && pArea && (rArea.includes(pArea) || pArea.includes(rArea))) {
        travelMins = 8;
      } else if (rArea.includes('uttara') || rArea.includes('mirpur') || pArea.includes('uttara') || pArea.includes('mirpur')) {
        travelMins = 45;
      }
      travelTimes.push(travelMins);
    }

    const avgTravel = travelTimes.reduce((a, b) => a + b, 0) / travelTimes.length;
    const maxTravel = Math.max(...travelTimes);
    const minTravel = Math.min(...travelTimes);
    const spread = maxTravel - minTravel;

    // Fair Ranking Formula: weighted blend of average, max, and spread
    // Lower travel and lower spread yields higher fair score
    const fairScore = Math.max(0, 100 - (0.45 * avgTravel + 0.35 * maxTravel + 0.20 * spread));

    scored.push({
      id: restaurant.id || restaurant.placeId,
      name: restaurant.name,
      neighborhood: restaurant.neighborhood || 'Dhaka',
      rating: restaurant.rating || 4.2,
      priceLevel: restaurant.priceLevel || 2,
      metrics: {
        averageTravelMinutes: Math.round(avgTravel),
        maximumTravelMinutes: maxTravel,
        travelTimeSpread: spread,
        fairScore: Math.round(fairScore)
      }
    });
  }

  // Sort descending by fair score
  return scored.sort((a, b) => b.metrics.fairScore - a.metrics.fairScore);
}

/**
 * Cast or change vote in group session
 */
export function castVote(token, { participantId, candidateId }) {
  const sessions = loadSessions();
  const session = sessions.find(s => s.token === token);
  if (!session) throw new Error('Session not found or expired');
  if (session.status === 'closed') throw new Error('Session is closed');

  const participant = session.participants.find(p => p.participantId === participantId);
  if (!participant) throw new Error('Participant not in this session');

  session.votes[participantId] = candidateId;
  saveSessions(sessions);

  return { success: true, votes: session.votes };
}

/**
 * Close session and determine winner
 */
export function closeGroupSession(token, { creatorId }) {
  const sessions = loadSessions();
  const session = sessions.find(s => s.token === token);
  if (!session) throw new Error('Session not found or expired');
  if (session.creatorId !== creatorId) throw new Error('Only the session creator can close the session');

  session.status = 'closed';

  // Count votes
  const counts = {};
  for (const candId of Object.values(session.votes)) {
    counts[candId] = (counts[candId] || 0) + 1;
  }

  let winnerId = null;
  let maxVotes = -1;
  for (const [candId, count] of Object.entries(counts)) {
    if (count > maxVotes) {
      maxVotes = count;
      winnerId = candId;
    }
  }

  session.winner = {
    candidateId: winnerId,
    votesReceived: maxVotes > 0 ? maxVotes : 0,
    totalVotesCast: Object.keys(session.votes).length
  };

  saveSessions(sessions);
  return session;
}

export function getGroupSession(token) {
  const sessions = loadSessions();
  const session = sessions.find(s => s.token === token);
  if (!session) return null;

  // Censor exact coordinates/personal metadata of participants for privacy (Section 7.3)
  const sanitizedParticipants = session.participants.map(p => ({
    name: p.name,
    isCreator: p.isCreator,
    startingArea: p.startingArea
  }));

  return {
    ...session,
    participants: sanitizedParticipants
  };
}

export default {
  createGroupSession,
  joinGroupSession,
  computeFairRanking,
  castVote,
  closeGroupSession,
  getGroupSession
};
