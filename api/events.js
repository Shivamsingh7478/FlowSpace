// api/events.js — Calendar events CRUD (per user, synced across devices)
// GET  /api/events?session=xxx  — fetch user's events
// POST /api/events              — save/overwrite user's events

const { redis } = require('./_redis');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function getSession(sessionId) {
  if (!sessionId) return null;
  const raw = await redis('GET', `session:${sessionId}`);
  if (!raw) return null;
  return JSON.parse(raw);
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sessionId = req.query.session || req.body?.session;
  const session = await getSession(sessionId);
  if (!session) return res.status(401).json({ error: 'Invalid or expired session' });

  const key = `user:${session.userId}:events`;

  // ── GET events ──────────────────────────────────────────────
  if (req.method === 'GET') {
    const raw = await redis('GET', key);
    return res.status(200).json({ events: raw ? JSON.parse(raw) : null });
  }

  // ── SAVE events ─────────────────────────────────────────────
  if (req.method === 'POST') {
    const { events } = req.body || {};
    if (!events) return res.status(400).json({ error: 'Missing events field' });
    await redis('SET', key, JSON.stringify(events));
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
