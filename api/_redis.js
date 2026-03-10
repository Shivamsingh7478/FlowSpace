// api/_redis.js — Upstash Redis REST helper
// Underscore prefix = not treated as a Vercel endpoint, just a module

async function redis(...args) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN env vars');
  }

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });

  const data = await r.json();
  if (data.error) throw new Error('Redis error: ' + data.error);
  return data.result;
}

module.exports = { redis };
