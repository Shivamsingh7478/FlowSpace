// api/emails.js — Email read-state persistence
// GET  /api/emails?session=xxx     — get list of read email IDs
// POST /api/emails                 — mark one or more emails as read

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

  const key = `user:${session.userId}:readEmails`;

  // ── GET read IDs ────────────────────────────────────────────
  if (req.method === 'GET') {
    const raw = await redis('GET', key);
    return res.status(200).json({ readIds: raw ? JSON.parse(raw) : [] });
  }

  // ── MARK AS READ ────────────────────────────────────────────
  if (req.method === 'POST') {
    const { emailId, emailIds } = req.body || {};
    // Accept single ID or array
    const newIds = emailIds || (emailId ? [emailId] : null);
    if (!newIds?.length) return res.status(400).json({ error: 'Missing emailId or emailIds' });

    const raw = await redis('GET', key);
    const readIds = raw ? JSON.parse(raw) : [];

    let changed = false;
    for (const id of newIds) {
      if (!readIds.includes(id)) { readIds.push(id); changed = true; }
    }

    if (changed) await redis('SET', key, JSON.stringify(readIds));
    return res.status(200).json({ ok: true, readIds });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
