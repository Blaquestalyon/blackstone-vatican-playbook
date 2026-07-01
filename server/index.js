/**
 * Blackstone Vatican Playbook — server
 *
 * Serves the static playbook + Gantt HTML and exposes a small JSON API that
 * proxies Airtable so the base PAT is never exposed to the browser. Every
 * status/notes change is written to Airtable (TaskState) and appended to
 * AuditLog, so the state of the project is a single global truth managed by
 * the team.
 *
 * Auth: single shared team passcode → signed HttpOnly session cookie.
 */

require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const airtable = require('./airtable');

const app = express();
const PORT = process.env.PORT || 3000;

const TEAM_PASSCODE   = process.env.TEAM_PASSCODE   || '';
const SESSION_SECRET  = process.env.SESSION_SECRET  || 'insecure-default-change-me';
const SESSION_COOKIE  = 'bvp_session';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

if (!TEAM_PASSCODE) {
  console.warn('[WARN] TEAM_PASSCODE is not set. Login will reject everyone until you set it.');
}
if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_BASE_ID) {
  console.warn('[WARN] AIRTABLE_TOKEN / AIRTABLE_BASE_ID not set. /api/state will fail until configured.');
}

app.set('trust proxy', 1);
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser(SESSION_SECRET));

// ---------- session helpers ----------
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig  = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function verify(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}
function requireAuth(req, res, next) {
  const token = req.cookies[SESSION_COOKIE];
  const session = verify(token);
  if (!session) return res.status(401).json({ error: 'not_authenticated' });
  req.session = session;
  next();
}

// ---------- rate limiter on login ----------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_attempts' }
});

// ---------- routes: auth ----------
app.post('/api/login', loginLimiter, (req, res) => {
  const { passcode, displayName } = req.body || {};
  if (!TEAM_PASSCODE) return res.status(500).json({ error: 'server_not_configured' });
  if (typeof passcode !== 'string' || typeof displayName !== 'string') {
    return res.status(400).json({ error: 'missing_fields' });
  }
  const name = displayName.trim().slice(0, 60);
  if (!name) return res.status(400).json({ error: 'display_name_required' });

  // constant-time compare
  const a = Buffer.from(passcode);
  const b = Buffer.from(TEAM_PASSCODE);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return res.status(401).json({ error: 'invalid_passcode' });

  const token = sign({ name, iat: Date.now(), exp: Date.now() + SESSION_MAX_AGE_MS });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_MS,
    path: '/'
  });
  res.json({ ok: true, name });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const s = verify(req.cookies[SESSION_COOKIE]);
  if (!s) return res.status(401).json({ error: 'not_authenticated' });
  res.json({ name: s.name });
});

// ---------- routes: playbook data ----------
// Serve the merged playbook_data.json so the browser doesn't need it embedded.
app.get('/api/playbook', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'scripts', 'playbook_data.json'));
});

// ---------- routes: task state (global, Airtable-backed) ----------
// GET all task states as { [wbs]: { status, notes, updatedBy, updatedAt } }
app.get('/api/state', requireAuth, async (req, res) => {
  try {
    const rows = await airtable.listTaskState();
    const out = {};
    for (const r of rows) {
      const f = r.fields || {};
      const wbs = f.WBS;
      if (!wbs) continue;
      out[wbs] = {
        status:    f.Status    || '',
        notes:     f.Notes     || '',
        updatedBy: f.UpdatedBy || '',
        updatedAt: f.UpdatedAt || ''
      };
    }
    res.json({ state: out });
  } catch (err) {
    console.error('[/api/state GET]', err);
    res.status(502).json({ error: 'airtable_read_failed', detail: String(err.message || err) });
  }
});

// PATCH one task's status and/or notes
app.patch('/api/state/:wbs', requireAuth, async (req, res) => {
  const wbs = String(req.params.wbs || '').trim();
  if (!wbs) return res.status(400).json({ error: 'wbs_required' });
  const { status, notes } = req.body || {};
  if (status !== undefined && !['', 'todo', 'prog', 'done'].includes(status)) {
    return res.status(400).json({ error: 'invalid_status' });
  }
  const patch = {};
  if (status !== undefined) patch.Status = status;
  if (notes  !== undefined) patch.Notes  = String(notes).slice(0, 20000);
  patch.UpdatedBy = req.session.name;
  patch.UpdatedAt = new Date().toISOString();

  try {
    const record = await airtable.upsertTaskState(wbs, patch);
    // audit-log (best-effort — do not fail the write if audit fails)
    airtable.appendAudit({
      WBS: wbs,
      Field: status !== undefined && notes !== undefined ? 'status+notes'
            : status !== undefined ? 'status' : 'notes',
      NewStatus: status !== undefined ? (status || '(cleared)') : '',
      NotesChanged: notes !== undefined,
      ChangedBy: req.session.name,
      ChangedAt: patch.UpdatedAt
    }).catch(e => console.warn('[audit-log]', e.message));

    res.json({
      ok: true,
      wbs,
      status:    record.fields.Status    || '',
      notes:     record.fields.Notes     || '',
      updatedBy: record.fields.UpdatedBy || '',
      updatedAt: record.fields.UpdatedAt || ''
    });
  } catch (err) {
    console.error('[/api/state PATCH]', err);
    res.status(502).json({ error: 'airtable_write_failed', detail: String(err.message || err) });
  }
});

// ---------- static ----------
app.use(express.static(path.join(__dirname, '..', 'public'), {
  extensions: ['html'],
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-store');
  }
}));

// Health check for Railway
app.get('/healthz', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Root — serve login gate, which then redirects to playbook.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.listen(PORT, () => {
  console.log(`Blackstone Vatican Playbook listening on :${PORT}`);
});
