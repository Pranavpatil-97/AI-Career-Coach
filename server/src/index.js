import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import axios from 'axios';
import * as cheerio from 'cheerio';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import dns from 'node:dns';
import { createJobsRouter } from './routes/jobs.js';
import aiRoutes from './routes/ai.js';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import net from 'node:net';
import rateLimit from 'express-rate-limit';
import requireAuth from '../middleware/auth.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const API_VERSION = process.env.GITHUB_API_VERSION || '2022-11-28';
function tokenKey() { const raw = process.env.TOKEN_ENCRYPTION_KEY || ''; if (!/^[a-fA-F0-9]{64}$/.test(raw)) throw new Error('TOKEN_ENCRYPTION_KEY must be a 32-byte key encoded as 64 hex characters.'); return Buffer.from(raw, 'hex'); }
function encryptToken(token) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', tokenKey(), iv); const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]); return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), encrypted.toString('hex')].join(':'); }
function decryptToken(value) { const [ivHex, tagHex, dataHex] = String(value || '').split(':'); if (!ivHex || !tagHex || !dataHex) throw new Error('Stored GitHub token is not encrypted with the expected format. Reconnect GitHub.'); const decipher = crypto.createDecipheriv('aes-256-gcm', tokenKey(), Buffer.from(ivHex, 'hex')); decipher.setAuthTag(Buffer.from(tagHex, 'hex')); return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8'); }
const MAX_REPO_FILES = Math.min(Number(process.env.MAX_REPO_FILES || 200), 500);
const SKILLS = [
  { key: 'sql', label: 'SQL', re: /\b(SELECT\s+.{0,120}?\bFROM\b|INSERT\s+INTO|CREATE\s+TABLE|UPDATE\s+\w+\s+SET|ALTER\s+TABLE)\b/i, exts: /\.(sql|py|js|jsx|ts|tsx)$/i },
  { key: 'python', label: 'Python', re: /\b(def\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import|if\s+__name__\s*==)/, exts: /\.py$/i },
  { key: 'javascript', label: 'JavaScript', re: /\b(const|let|var)\s+\w+|function\s+\w+\s*\(|=>/, exts: /\.(js|jsx|mjs|cjs)$/i },
  { key: 'typescript', label: 'TypeScript', re: /\binterface\s+\w+|:\s*(string|number|boolean)\b|type\s+\w+\s*=/, exts: /\.(ts|tsx)$/i },
  { key: 'react', label: 'React', re: /\b(useState|useEffect|createRoot|ReactDOM|useMemo)\b|from\s+['"]react['"]/, exts: /\.(jsx|tsx|js|ts|json)$/i },
  { key: 'nodejs', label: 'Node.js', re: /\b(process\.env|require\(|module\.exports|node:|__dirname)\b/, exts: /\.(js|mjs|cjs|json)$/i },
  { key: 'express', label: 'Express', re: /\b(express\(|app\.(get|post|put|patch|delete)\s*\()/, exts: /\.(js|mjs|cjs)$/i },
  { key: 'mongodb', label: 'MongoDB', re: /\b(mongoose\.|MongoClient|mongodb\+srv|Schema\()/i, exts: /\.(js|mjs|cjs|json|example)$/i },
  { key: 'docker', label: 'Docker', re: /\b(FROM\s+\w+|docker-compose|container_name:)\b/i, exts: /Dockerfile|docker-compose.*\.ya?ml$/i },
  { key: 'testing', label: 'Testing', re: /\b(describe\(|it\(|test\(|expect\(|assert\.)/, exts: /\.(test|spec)\.(js|jsx|ts|tsx)$/i }
];
const schemaOpts = { timestamps: true, versionKey: false };
const User = mongoose.model('User', new mongoose.Schema({ githubId: { type: String, unique: true, sparse: true }, login: String, name: String, email: { type: String, unique: true, sparse: true, lowercase: true, trim: true }, passwordHash: { type: String, select: false }, avatarUrl: String, githubAccessToken: { type: String, select: false }, selectedRepos: [{ id: Number, owner: String, name: String, fullName: String, defaultBranch: String, lastAnalyzedSha: String, monitoring: { type: Boolean, default: true } }] }, schemaOpts));
const Source = mongoose.model('Source', new mongoose.Schema({ title: String, company: String, location: String, type: String, source: String, url: { type: String, required: true }, canonicalUrl: String, retrievedAt: Date, postingText: String, userId: { type: mongoose.Schema.Types.ObjectId, index: true } }, schemaOpts));
const Requirement = mongoose.model('Requirement', new mongoose.Schema({ sourceId: mongoose.Schema.Types.ObjectId, skillKey: String, label: String, level: { type: String, enum: ['required', 'preferred', 'mentioned'] }, quote: String, quoteStart: Number, quoteEnd: Number }, schemaOpts));
const Evidence = mongoose.model('Evidence', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, repository: String, skillKey: String, status: String, confidence: Number, filePath: String, startLine: Number, endLine: Number, commitSha: String, excerpt: String, url: String, explanation: String, assessedAt: Date, detector: String, scope: Object }, schemaOpts));
const Assessment = mongoose.model('Assessment', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, sourceId: mongoose.Schema.Types.ObjectId, repository: String, commitSha: String, version: Number, scope: Object, skills: [{ skillKey: String, skill: String, status: String, confidence: Number, evidenceIds: [mongoose.Schema.Types.ObjectId], explanation: String }], createdBy: String }, schemaOpts));
const ChangeEvent = mongoose.model('ChangeEvent', new mongoose.Schema({ deliveryId: { type: String, unique: true, sparse: true }, userId: mongoose.Schema.Types.ObjectId, repository: String, beforeSha: String, commitSha: String, files: [String], affectedSkills: [String], beforeAssessmentId: mongoose.Schema.Types.ObjectId, afterAssessmentId: mongoose.Schema.Types.ObjectId, status: String, detectedBy: String, at: Date, error: String }, schemaOpts));
const Reassessment = mongoose.model('Reassessment', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, repository: String, fromSha: String, toSha: String, changedPaths: [String], affectedSkills: [String], assessmentId: mongoose.Schema.Types.ObjectId, status: String, startedAt: Date, completedAt: Date, error: String }, schemaOpts));

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(morgan('tiny'));
app.use('/api/github/webhook', express.raw({ type: 'application/json', limit: '2mb' }));
app.use(express.json({ limit: '1mb' }));
const sessionOptions = { name: 'careerpilot.sid', secret: process.env.SESSION_SECRET || 'dev-only-change-this-session-secret', resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 24 * 7 } };
let sessionMiddleware = session(sessionOptions);
app.use((req, res, next) => sessionMiddleware(req, res, next));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/ai', aiRoutes);

const requireUser = requireAuth;
const github = (token) => axios.create({ baseURL: 'https://api.github.com', timeout: 20000, headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': API_VERSION, Authorization: `Bearer ${token}` } });
async function getToken(userId) { const user = await User.findById(userId).select('+githubAccessToken'); if (!user?.githubAccessToken) throw new Error('GitHub is not connected.'); return { user, token: decryptToken(user.githubAccessToken) }; }
function toPublicUser(user) { return { login: user.login, name: user.name, avatarUrl: user.avatarUrl, selectedRepos: user.selectedRepos }; }
function normalizeSkillStatus(status) { return status === 'not-demonstrated-in-scope' ? 'none' : status; }
function getAffected(paths = []) { if (!paths.length) return SKILLS.map(s => s.key); const keys = new Set(); for (const p of paths) for (const s of SKILLS) if (s.exts.test(p) || (s.key === 'docker' && /docker/i.test(p))) keys.add(s.key); return [...keys]; }

async function scanRepo(userId, repo, sourceId = null, createdBy = 'manual', changedPaths = [], deliveryId = null) {
  const { user, token } = await getToken(userId); const gh = github(token);
  const { data: repoData } = await gh.get(`/repos/${repo.owner}/${repo.name}`);
  const branch = repo.branch || repoData.default_branch;
  const { data: branchData } = await gh.get(`/repos/${repo.owner}/${repo.name}/branches/${encodeURIComponent(branch)}`);
  const commitSha = branchData.commit.sha;
  const { data: treeData } = await gh.get(`/repos/${repo.owner}/${repo.name}/git/trees/${commitSha}?recursive=1`);
  const candidates = (treeData.tree || []).filter(x => x.type === 'blob' && x.size <= 180000 && !/(^|\/)(node_modules|vendor|dist|build|\.git|coverage)\//i.test(x.path));
  const selected = candidates.slice(0, MAX_REPO_FILES); const files = [];
  for (const f of selected) {
    if (!/\.(js|jsx|ts|tsx|py|sql|json|ya?ml|toml|md|sh)$/i.test(f.path) && !/(^|\/)(Dockerfile|Makefile)$/i.test(f.path)) continue;
    try { const { data } = await gh.get(`/repos/${repo.owner}/${repo.name}/contents/${f.path.split('/').map(encodeURIComponent).join('/')}?ref=${commitSha}`); if (data.encoding === 'base64' && data.content) files.push({ path: f.path, text: Buffer.from(data.content, 'base64').toString('utf8') }); } catch { /* inaccessible file does not prove skill absence */ }
  }
  const prior = await Assessment.findOne({ userId, repository: repoData.full_name }).sort({ version: -1 });
  const version = (prior?.version || 0) + 1; const affected = new Set(getAffected(changedPaths));
  const skillResults = []; const evidenceIdsBySkill = new Map();
  for (const detector of SKILLS) {
    if (prior && changedPaths.length && !affected.has(detector.key)) {
      const old = prior.skills.find(x => x.skillKey === detector.key);
      if (old) { skillResults.push({ ...old.toObject(), evidenceIds: old.evidenceIds }); evidenceIdsBySkill.set(detector.key, old.evidenceIds); continue; }
    }
    const matches = [];
    for (const file of files) {
      if (!detector.exts.test(file.path) && !(detector.key === 'docker' && /docker/i.test(file.path))) continue;
      const lines = file.text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) if (detector.re.test(lines[i])) { matches.push({ filePath: file.path, startLine: i + 1, endLine: i + 1, excerpt: lines[i].trim().slice(0, 260) }); if (matches.length >= 8) break; }
      if (matches.length >= 8) break;
    }
    const status = matches.length >= 2 ? 'demonstrated' : matches.length === 1 ? 'partial' : 'not-demonstrated-in-scope';
    const confidence = matches.length >= 2 ? 0.82 : matches.length === 1 ? 0.58 : 0.25;
    const ids = [];
    for (const m of matches) {
      const url = `https://github.com/${repoData.full_name}/blob/${commitSha}/${m.filePath}#L${m.startLine}-L${m.endLine}`;
      const ev = await Evidence.create({ userId, repository: repoData.full_name, skillKey: detector.key, status, confidence, ...m, commitSha, url, detector: detector.key, explanation: status === 'demonstrated' ? 'Multiple matching code lines were found in the analyzed scope.' : status === 'partial' ? 'Limited matching evidence was found in the analyzed scope.' : 'No matching evidence was found in the scanned files. This does not mean the skill is absent.', assessedAt: new Date(), scope: { branch, scannedFiles: files.length, truncated: candidates.length > MAX_REPO_FILES || Boolean(treeData.truncated) } }); ids.push(ev._id);
    }
    evidenceIdsBySkill.set(detector.key, ids);
    skillResults.push({ skillKey: detector.key, skill: detector.label, status, confidence, evidenceIds: ids, explanation: status === 'demonstrated' ? 'Multiple matching code evidence lines were found.' : status === 'partial' ? 'Only limited matching evidence was found.' : 'Not demonstrated in this scanned scope; this is not a claim that the student lacks this skill.' });
  }
  const assessment = await Assessment.create({ userId, sourceId, repository: repoData.full_name, commitSha, version, scope: { repositories: [repoData.full_name], branch, scannedFiles: files.length, truncated: candidates.length > MAX_REPO_FILES || Boolean(treeData.truncated) }, skills: skillResults, createdBy });
  const sel = user.selectedRepos.find(r => r.fullName === repoData.full_name); if (sel) { sel.lastAnalyzedSha = commitSha; await user.save(); }
  if (deliveryId) await ChangeEvent.updateOne({ deliveryId }, { $set: { status: 'completed', afterAssessmentId: assessment._id, affectedSkills: [...affected] } });
  return { assessment, prior, repo: repoData, filesScanned: files.length };
}

async function safeFetchJob(inputUrl) {
  const u = new URL(inputUrl); if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw new Error('Enter a public HTTP or HTTPS job posting URL.');
  if (u.hostname === 'localhost' || u.hostname.endsWith('.local')) throw new Error('Local URLs are not allowed.');
  const addresses = await dns.lookup(u.hostname, { all: true }).catch(() => []);
  if (!addresses.length || addresses.some(a => { const ip=a.address; if (net.isIPv4(ip)) return ip.startsWith('10.') || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('169.254.') || ip.startsWith('172.') && Number(ip.split('.')[1]) >= 16 && Number(ip.split('.')[1]) <= 31; return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:'); })) throw new Error('The URL must resolve to a public host.');
  const response = await axios.get(u.href, { timeout: 15000, maxRedirects: 2, maxContentLength: 2_000_000, headers: { 'User-Agent': 'CareerPilotAI-HackathonPrototype/1.0' }, responseType: 'text' });
  const type = response.headers['content-type'] || ''; if (!type.includes('text/html') && !type.includes('text/plain')) throw new Error('The URL did not return HTML or plain text.');
  const $ = cheerio.load(response.data); $('script,style,noscript,svg,nav,footer,header').remove();
  const title = $('meta[property="og:title"]').attr('content') || $('title').text().trim() || 'Job posting';
  const company = $('meta[property="og:site_name"]').attr('content') || '';
  const text = ($('main').text() || $('[role="main"]').text() || $('body').text()).replace(/\s+/g, ' ').trim().slice(0, 50000);
  if (text.length < 120) throw new Error('Could not extract readable job text. Try a public posting URL that permits automated retrieval.');
  return { title: title.slice(0, 250), company: company.slice(0, 150), url: u.href, canonicalUrl: $('link[rel="canonical"]').attr('href') || u.href, text };
}
function extractJobRequirements(text, sourceId) {
  return SKILLS.flatMap((skill) => {
    const escapedLabel = skill.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`\\b${escapedLabel}\\b`, 'i').exec(text);
    if (!match) return [];
    const start = Math.max(0, match.index - 90);
    const end = Math.min(text.length, match.index + match[0].length + 110);
    const context = text.slice(Math.max(0, match.index - 140), Math.min(text.length, match.index + 140));
    const level = /\b(required|must have|minimum|mandatory)\b/i.test(context) ? 'required'
      : /\b(preferred|nice to have|bonus|desirable)\b/i.test(context) ? 'preferred'
        : 'mentioned';
    return [{
      sourceId,
      skillKey: skill.key,
      label: skill.label,
      level,
      quote: text.slice(start, end).trim(),
      quoteStart: start,
      quoteEnd: end,
    }];
  });
}
async function ingestJob(url, userId) {
  const parsed = await safeFetchJob(url);
  const source = await Source.create({ ...parsed, postingText: parsed.text, retrievedAt: new Date(), userId, type: /intern/i.test(parsed.title + ' ' + parsed.text.slice(0, 3000)) ? 'internship' : 'full-time' });
  const reqs = extractJobRequirements(parsed.text, source._id);
  if (reqs.length) await Requirement.insertMany(reqs);
  return { source, requirements: reqs };
}

app.get('/api/health', (req,res) => res.json({ ok: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', timestamp: new Date().toISOString() }));
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many sign-in attempts. Please try again later.' } });
const emailOk = (value) => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const normalizeEmail = (value) => value.trim().toLowerCase();
const authUser = (user) => ({ id: user._id, name: user.name, email: user.email });
async function establishSession(req, userId) {
  await new Promise((resolve, reject) => req.session.regenerate((err) => err ? reject(err) : resolve()));
  req.session.userId = String(userId);
  await new Promise((resolve, reject) => req.session.save((err) => err ? reject(err) : resolve()));
}
app.post('/api/auth/signup', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120) return res.status(400).json({ message: 'Enter your name (2 to 120 characters).' });
    if (!emailOk(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) return res.status(400).json({ message: 'Use a password between 8 and 72 bytes.' });

    const normalizedEmail = normalizeEmail(email);
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) });
    await establishSession(req, user._id);
    res.status(201).json({ user: authUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
    next(err);
  }
});
app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!emailOk(email) || typeof password !== 'string' || !password) return res.status(400).json({ message: 'Enter a valid email and password.' });
    const user = await User.findOne({ email: normalizeEmail(email) }).select('+passwordHash');
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Incorrect email or password.' });
    await establishSession(req, user._id);
    res.json({ user: authUser(user) });
  } catch (err) {
    next(err);
  }
});
app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ message: 'Your account could not be found. Please sign in again.' });
    res.json({ user: authUser(user) });
  } catch (err) {
    next(err);
  }
});
app.post('/api/auth/logout', requireAuth, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('careerpilot.sid', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({ ok: true });
  });
});
app.get('/api/auth/github', (req,res) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) return res.status(503).json({ error: 'Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in server/.env first.' });
  const state = crypto.randomBytes(24).toString('hex'); req.session.oauthState = state;
  const p = new URLSearchParams({ client_id: process.env.GITHUB_CLIENT_ID, redirect_uri: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback', scope: 'read:user repo', state }); res.redirect(`https://github.com/login/oauth/authorize?${p}`);
});
app.get('/api/auth/github/callback', async (req,res,next) => { try {
  if (!req.query.code || req.query.state !== req.session.oauthState) return res.status(400).send('Invalid GitHub OAuth state. Return to the app and try connecting again.');
  const tokenRes = await axios.post('https://github.com/login/oauth/access_token', { client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code: req.query.code, redirect_uri: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback' }, { headers: { Accept: 'application/json' }, timeout: 15000 });
  const token = tokenRes.data.access_token;
  if (!token) {
    console.error('GitHub token response:', { error: tokenRes.data.error, description: tokenRes.data.error_description });
    return res.status(400).send('GitHub did not return an access token.');
  }
  const { data: profile } = await github(token).get('/user');
  const githubId = String(profile.id);
  const linkedUser = await User.findOne({ githubId });
  let user = req.session.userId ? await User.findById(req.session.userId) : null;
  if (user) {
    if (linkedUser && String(linkedUser._id) !== String(user._id)) return res.status(409).send('This GitHub account is already connected to a different CareerPilot account.');
    user.githubId = githubId;
    user.login = profile.login;
    user.name = profile.name || profile.login;
    user.avatarUrl = profile.avatar_url;
    user.githubAccessToken = encryptToken(token);
    await user.save();
  } else {
    user = await User.findOneAndUpdate({ githubId }, { $set: { login: profile.login, name: profile.name || profile.login, avatarUrl: profile.avatar_url, githubAccessToken: encryptToken(token) } }, { new: true, upsert: true, setDefaultsOnInsert: true }).select('+githubAccessToken');
    req.session.userId = String(user._id);
  }
  delete req.session.oauthState; res.redirect(`${CLIENT_ORIGIN}/settings?connected=1`);
} catch(e) { next(e); } });
app.get('/api/github/status', async (req,res,next) => {
  try {
    if (!req.session?.userId) return res.json({ connected: false });
    const user = await User.findById(req.session.userId).select('+githubAccessToken');
    if (!user || !user.githubAccessToken) return res.json({ connected: false });
    res.json({ connected: true, ...toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});
app.post('/api/github/disconnect', requireUser, async (req,res,next) => { try { await User.findByIdAndUpdate(req.userId, { $unset: { githubAccessToken: 1 }, $set: { selectedRepos: [] } }); res.json({ ok: true }); } catch(e) { next(e); } });
app.get('/api/github/repositories', requireUser, async (req,res,next) => { try { const { token,user } = await getToken(req.userId); const { data, headers } = await github(token).get('/user/repos', { params: { per_page: 100, sort: 'updated', affiliation: 'owner,collaborator,organization_member' } }); const selectedIds = new Set(user.selectedRepos.map(r => String(r.id))); res.json({ repositories: data.map(r => ({ id: r.id, name: r.name, fullName: r.full_name, owner: r.owner.login, private: r.private, defaultBranch: r.default_branch, htmlUrl: r.html_url, description: r.description, language: r.language, updatedAt: r.updated_at, selected: selectedIds.has(String(r.id)), lastAnalyzedSha: user.selectedRepos.find(s => String(s.id) === String(r.id))?.lastAnalyzedSha, monitoring: user.selectedRepos.find(s => String(s.id) === String(r.id))?.monitoring ?? true })), rateLimit: { remaining: Number(headers['x-ratelimit-remaining'] || 0) } }); } catch(e) { next(e); } });
app.post('/api/github/repositories/select', requireUser, async (req,res,next) => { try { const ids = Array.isArray(req.body.repositoryIds) ? req.body.repositoryIds.slice(0,30).map(Number) : []; const { token } = await getToken(req.userId); const { data } = await github(token).get('/user/repos', { params: { per_page: 100, sort: 'updated', affiliation: 'owner,collaborator,organization_member' } }); const selected = data.filter(r => ids.includes(r.id)).map(r => ({ id: r.id, owner: r.owner.login, name: r.name, fullName: r.full_name, defaultBranch: r.default_branch, monitoring: true, lastAnalyzedSha: '' })); await User.findByIdAndUpdate(req.userId, { selectedRepos: selected }); res.json({ selectedRepos: selected }); } catch(e) { next(e); } });
app.post('/api/analysis/run', requireUser, async (req,res,next) => { try { const ids = Array.isArray(req.body.repositoryIds) ? req.body.repositoryIds.map(String) : []; const user = await User.findById(req.userId); const repos = user.selectedRepos.filter(r => ids.length ? ids.includes(String(r.id)) || ids.includes(r.fullName) : true); if (!repos.length) return res.status(400).json({ error: 'Select at least one repository first.' }); const results = []; for (const r of repos) results.push(await scanRepo(req.userId, r, null, 'manual')); res.json({ ok: true, count: results.length, assessments: results.map(x => ({ id: x.assessment._id, repository: x.assessment.repository, commitSha: x.assessment.commitSha, version: x.assessment.version, scannedFiles: x.filesScanned })) }); } catch(e) { next(e); } });
app.get('/api/skills/evidence', requireUser, async (req,res,next) => { try { const latest = await Assessment.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(req.userId) } }, { $sort: { createdAt: -1 } }, { $group: { _id: '$repository', latest: { $first: '$$ROOT' } } }, { $replaceRoot: { newRoot: '$latest' } }]); const ids = latest.flatMap(a => a.skills.flatMap(s => s.evidenceIds || [])); const evs = await Evidence.find({ _id: { $in: ids }, userId: req.userId }).lean(); const byId = new Map(evs.map(e => [String(e._id), e])); const rows = []; for (const a of latest) for (const s of a.skills) { const evidence = (s.evidenceIds || []).map(id => byId.get(String(id))).filter(Boolean).map(e => ({ ...e, repository: e.repository, filePath: e.filePath, url: e.url, startLine: e.startLine, endLine: e.endLine, commitSha: e.commitSha })); rows.push({ skill: s.skill, skillKey: s.skillKey, status: normalizeSkillStatus(s.status), confidence: s.confidence, repository: a.repository, assessedAt: a.createdAt, evidence, explanation: s.explanation }); } res.json(rows); } catch(e) { next(e); } });
app.get('/api/skills/gaps', requireUser, async (req,res,next) => { try { const sources = await Source.find({ userId: req.userId }).sort({ retrievedAt: -1 }).limit(10).lean(); const out = []; const latest = await Assessment.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(req.userId) } }, { $sort: { createdAt: -1 } }, { $group: { _id: '$repository', latest: { $first: '$$ROOT' } } }, { $replaceRoot: { newRoot: '$latest' } }]); const evidence = await Evidence.find({ userId: req.userId }).sort({ assessedAt: -1 }).lean(); for (const source of sources) { const reqs = await Requirement.find({ sourceId: source._id }).lean(); for (const reqi of reqs) { const skill = latest.flatMap(a => a.skills.map(s => ({ ...s.toObject?.() ?? s, repository: a.repository }))).find(s => s.skillKey === reqi.skillKey); const ev = evidence.filter(e => e.skillKey === reqi.skillKey && latest.some(a => a.repository === e.repository && String(a.commitSha) === String(e.commitSha))).slice(0,3).map(e => ({ ...e, filePath: e.filePath, url: e.url })); out.push({ skill: reqi.label, category: reqi.level, status: normalizeSkillStatus(skill?.status || 'not-demonstrated-in-scope'), quote: reqi.quote, jobUrl: source.url, explanation: skill?.explanation || 'No matching evidence was found in the selected and scanned repositories. This is not a claim that you lack the skill.', nextStep: skill?.status === 'demonstrated' ? 'Keep this evidence current and consider adding tests or documentation.' : `Consider adding a small project example that demonstrates ${reqi.label}.`, evidence: ev }); } } res.json(out); } catch(e) { next(e); } });
app.get('/api/changes', requireUser, async (req,res,next) => { try { const rows = await ChangeEvent.find({ userId: req.userId }).sort({ at: -1 }).limit(50).lean(); const out = await Promise.all(rows.map(async e => { const [before, after] = await Promise.all([e.beforeAssessmentId ? Assessment.findById(e.beforeAssessmentId).lean() : null, e.afterAssessmentId ? Assessment.findById(e.afterAssessmentId).lean() : null]); const changes = []; if (before && after) for (const s of after.skills) { const old = before.skills.find(x => x.skillKey === s.skillKey); if (old && old.status !== s.status) changes.push({ skill: s.skill, before: normalizeSkillStatus(old.status), after: normalizeSkillStatus(s.status) }); } const ev = after ? await Evidence.find({ userId: req.userId, repository: e.repository, commitSha: e.commitSha }).lean() : []; return { id: String(e._id), repository: e.repository, commitSha: e.commitSha, previousSha: e.beforeSha, files: e.files || [], status: e.status === 'completed' ? 'completed' : e.status === 'failed' ? 'failed' : 'running', at: e.at, changes, citations: ev.map(x => ({ ...x, filePath: x.filePath, url: x.url })) }; })); res.json(out); } catch(e) { next(e); } });
app.get('/api/summary', requireUser, async (req,res,next) => { try { const user = await User.findById(req.userId); const jobs = await Source.find({ userId: req.userId }).sort({ retrievedAt: -1 }).limit(5).lean(); const latest = await Assessment.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(req.userId) } }, { $sort: { createdAt: -1 } }, { $group: { _id: '$repository', latest: { $first: '$$ROOT' } } }, { $replaceRoot: { newRoot: '$latest' } }]); const skills = latest.flatMap(a => a.skills); const gaps = await (async () => { const arr=[]; for (const j of jobs) { const rs=await Requirement.find({sourceId:j._id}).lean(); for (const r of rs) { const s=skills.find(x=>x.skillKey===r.skillKey); if (!s || s.status !== 'demonstrated') arr.push({skill:r.label,nextStep:`Build or update a project that demonstrates ${r.label}.`}); } } return arr.slice(0,6); })(); const changes = await ChangeEvent.find({userId:req.userId}).sort({at:-1}).limit(5).lean(); res.json({ repositories: latest.length, jobs: jobs.length, skills: { demonstrated: skills.filter(s=>s.status==='demonstrated').length, partial: skills.filter(s=>s.status==='partial').length, none: skills.filter(s=>s.status==='not-demonstrated-in-scope').length }, activity: [...latest.slice(0,3).map(a=>({id:String(a._id),title:`Analyzed ${a.repository} (v${a.version})`,at:a.createdAt})),...changes.map(c=>({id:String(c._id),title:`${c.status==='completed'?'Reassessed':'Detected change in'} ${c.repository}`,at:c.at}))].sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,6), opportunities:jobs.map(j=>({id:String(j._id),title:j.title,company:j.company,url:j.url})), gaps, repoHealth:user.selectedRepos.map(r=>({name:r.fullName,lastCommit:r.lastAnalyzedSha,monitoring:r.monitoring})) }); } catch(e) { next(e); } });
app.get('/api/demo', requireUser, async (req,res,next) => { try { const change=await ChangeEvent.findOne({userId:req.userId,status:'completed'}).sort({at:-1}).lean(); if(!change) return res.json(null); const after=change.afterAssessmentId?await Assessment.findById(change.afterAssessmentId).lean():null; const before=change.beforeAssessmentId?await Assessment.findById(change.beforeAssessmentId).lean():null; const source=after?.sourceId?await Source.findById(after.sourceId).lean():await Source.findOne({userId:req.userId}).sort({retrievedAt:-1}).lean(); const changes=[]; if(before&&after) for(const s of after.skills){const old=before.skills.find(x=>x.skillKey===s.skillKey);if(old&&old.status!==s.status)changes.push({skill:s.skill,before:normalizeSkillStatus(old.status),after:normalizeSkillStatus(s.status)});} const citations=after?await Evidence.find({userId:req.userId,repository:after.repository,commitSha:after.commitSha}).lean():[]; res.json({step:6,jobUrl:source?.url,jobTitle:source?.title,repository:change.repository,commitSha:change.commitSha,changes,citations}); } catch(e){next(e);} });

// Signed GitHub push webhook. Configure this URL on the GitHub repo and subscribe to push events.
app.post('/api/github/webhook', async (req,res,next) => { try {
  const raw = req.body; const secret = process.env.GITHUB_WEBHOOK_SECRET; const sig = req.get('x-hub-signature-256');
  if (!secret || !sig?.startsWith('sha256=') || !Buffer.isBuffer(raw)) return res.status(401).json({error:'Webhook secret or signature is missing.'});
  const expected='sha256='+crypto.createHmac('sha256',secret).update(raw).digest('hex'); const a=Buffer.from(expected),b=Buffer.from(sig); if(a.length!==b.length||!crypto.timingSafeEqual(a,b)) return res.status(401).json({error:'Invalid webhook signature.'});
  if(req.get('x-github-event')!=='push') return res.status(202).json({ignored:true}); const payload=JSON.parse(raw.toString('utf8')); const deliveryId=req.get('x-github-delivery');
  if(await ChangeEvent.findOne({deliveryId})) return res.status(200).json({duplicate:true}); if(!payload.repository?.full_name||!payload.after||/^0+$/.test(payload.after)) return res.status(202).json({ignored:true});
  const user=await User.findOne({selectedRepos:{$elemMatch:{fullName:payload.repository.full_name,monitoring:true}}}).select('+githubAccessToken'); if(!user) return res.status(202).json({ignored:true,reason:'Repository not selected for monitoring.'});
  const files=[...new Set((payload.commits||[]).flatMap(c=>[...(c.added||[]),...(c.modified||[]),...(c.removed||[])]))].slice(0,500); const previous=await Assessment.findOne({userId:user._id,repository:payload.repository.full_name}).sort({version:-1});
  const event=await ChangeEvent.create({deliveryId,userId:user._id,repository:payload.repository.full_name,beforeSha:payload.before,commitSha:payload.after,files,affectedSkills:getAffected(files),beforeAssessmentId:previous?._id,status:'running',detectedBy:'webhook',at:new Date()});
  try { const repo={owner:payload.repository.owner.login,name:payload.repository.name}; const result=await scanRepo(user._id,repo,previous?.sourceId,'webhook',files,deliveryId); event.afterAssessmentId=result.assessment._id; event.status='completed'; await event.save(); await Reassessment.create({userId:user._id,repository:event.repository,fromSha:event.beforeSha,toSha:event.commitSha,changedPaths:files,affectedSkills:event.affectedSkills,assessmentId:result.assessment._id,status:'completed',startedAt:event.at,completedAt:new Date()}); res.status(202).json({accepted:true,eventId:event._id}); } catch(e){event.status='failed';event.error=e.message;await event.save();throw e;}
 } catch(e){next(e);} });

let polling = false;
async function pollRepos() { if(polling || mongoose.connection.readyState!==1) return; polling=true; try { const users=await User.find({'selectedRepos.0':{$exists:true}}).select('+githubAccessToken'); for(const user of users){if(!user.githubAccessToken)continue;let accessToken;try{accessToken=decryptToken(user.githubAccessToken)}catch(e){console.warn('Could not decrypt GitHub token for',user.login,e.message);continue;}for(const r of user.selectedRepos){if(!r.monitoring)continue;try{const {data}=await github(accessToken).get(`/repos/${r.owner}/${r.name}/commits`,{params:{per_page:1}});const latest=data[0];if(!latest?.sha||latest.sha===r.lastAnalyzedSha)continue;const key=`poll:${user._id}:${r.fullName}:${latest.sha}`;if(await ChangeEvent.findOne({deliveryId:key})){r.lastAnalyzedSha=latest.sha;await user.save();continue;}const {data:commit}=await github(accessToken).get(`/repos/${r.owner}/${r.name}/commits/${latest.sha}`);const files=(commit.files||[]).map(f=>f.filename).slice(0,500);const prev=await Assessment.findOne({userId:user._id,repository:r.fullName}).sort({version:-1});const ev=await ChangeEvent.create({deliveryId:key,userId:user._id,repository:r.fullName,beforeSha:r.lastAnalyzedSha,commitSha:latest.sha,files,affectedSkills:getAffected(files),beforeAssessmentId:prev?._id,status:'running',detectedBy:'poller',at:new Date()});try{const result=await scanRepo(user._id,{owner:r.owner,name:r.name},prev?.sourceId,'poller',files,key);ev.afterAssessmentId=result.assessment._id;ev.status='completed';await ev.save();await Reassessment.create({userId:user._id,repository:r.fullName,fromSha:ev.beforeSha,toSha:latest.sha,changedPaths:files,affectedSkills:ev.affectedSkills,assessmentId:result.assessment._id,status:'completed',startedAt:ev.at,completedAt:new Date()});}catch(e){ev.status='failed';ev.error=e.message;await ev.save();} }catch(e){if(e.response?.status===401){console.warn('GitHub token rejected; reconnect GitHub.');}else console.warn('Polling failed for',r.fullName,e.message);}}await user.save();}}catch(e){console.error('Polling worker error:',e.message);}finally{polling=false;}}
app.post('/api/github/poll', requireUser, async (req,res,next)=>{try{await pollRepos();res.json({ok:true});}catch(e){next(e);}});
app.use('/api/jobs', createJobsRouter({
  requireAuth: requireUser,
  Source,
  Requirement,
  User,
  Assessment,
  Evidence,
  skills: SKILLS,
  ingestJob,
  scanRepo,
  extractJobRequirements,
}));
app.use((err,req,res,next)=>{const status=err.response?.status===403?429:err.response?.status||500; console.error(err.message); res.status(status).json({error:status===500?'Unexpected server error. Check server logs and environment configuration.':err.message,details:process.env.NODE_ENV==='production'?undefined:err.response?.data?.message||err.message});});
async function start(){ if(!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. Configure server/.env using server/.env.example.'); await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:12000}); sessionMiddleware = session({ ...sessionOptions, store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI, collectionName: 'sessions' }) }); app.listen(PORT,()=>console.log(`CareerPilot API listening on http://localhost:${PORT}`)); const pollMs=Math.max(30000,Number(process.env.POLL_INTERVAL_MS||60000)); setInterval(pollRepos,pollMs); }
export { app, getAffected, SKILLS, start };
