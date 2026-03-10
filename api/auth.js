// api/auth.js — Session management
// POST   /api/auth  — create session after Google login
// GET    /api/auth  — verify session & restore user (auto-login)
// DELETE /api/auth  — logout / destroy session

const { redis } = require('./_redis');
const { randomUUID } = require('crypto');

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── CREATE SESSION ──────────────────────────────────────────
  if (req.method === 'POST') {
    const { googleToken, user } = req.body || {};
    if (!googleToken || !user?.email) {
      return res.status(400).json({ error: 'Missing googleToken or user' });
    }

    const sessionId = randomUUID();
    // userId = base64 of email (stable, not guessable from outside)
    const userId = Buffer.from(user.email.toLowerCase()).toString('base64url');

    const sessionData = {
      userId,
      user,
      googleToken,
      createdAt: Date.now(),
    };

    // Store session in Redis with 7-day TTL
    await redis('SET', `session:${sessionId}`, JSON.stringify(sessionData), 'EX', SESSION_TTL);

    return res.status(200).json({ sessionId, userId, user });
  }

  // ── VERIFY SESSION (auto-login) ─────────────────────────────
  if (req.method === 'GET') {
    const sessionId = req.query.session;
    if (!sessionId) return res.status(400).json({ error: 'Missing session param' });

    const raw = await redis('GET', `session:${sessionId}`);
    if (!raw) return res.status(401).json({ error: 'Session expired or not found' });

    const session = JSON.parse(raw);

    // Refresh TTL on activity (sliding window)
    await redis('EXPIRE', `session:${sessionId}`, SESSION_TTL);

    return res.status(200).json({
      user: session.user,
      userId: session.userId,
      googleToken: session.googleToken,
    });
  }

  // ── LOGOUT ──────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const sessionId = req.query.session;
    if (sessionId) await redis('DEL', `session:${sessionId}`);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
