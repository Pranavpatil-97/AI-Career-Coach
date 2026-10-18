import { Router } from 'express';
import axios from 'axios';
import { buildGaps, toEvidenceCitation } from '../lib/gaps.js';
import { extractJobSkills } from '../lib/llm.js';

const JOB_SKILLS = {
  Python: /\bpython\b/i, JavaScript: /\bjavascript\b|\becmascript\b/i, TypeScript: /\btypescript\b/i,
  Java: /\bjava\b(?!script)/i, 'C++': /c\+\+/i, 'C#': /c#|\.net\b/i, Go: /\bgolang\b|\bgo (?:lang|programming)\b/i,
  SQL: /\bsql\b|postgres(?:ql)?|\bmysql\b|sqlite|mariadb/i, MongoDB: /mongo ?db|mongoose/i,
  React: /\breact(?:\.js|js)?\b/i, 'Node.js': /\bnode(?:\.js|js)?\b/i, Express: /\bexpress(?:\.js)?\b/i,
  'REST APIs': /\brest(?:ful)?\b|\bapi(?:s)?\b/i, GraphQL: /graphql/i, Docker: /docker|container/i,
  Kubernetes: /kubernetes|\bk8s\b/i, Git: /\bgit\b|github|gitlab/i, AWS: /\baws\b|amazon web services/i,
  Azure: /\bazure\b/i, GCP: /\bgcp\b|google cloud/i, 'CI/CD': /ci\/cd|github actions|jenkins|continuous integration/i,
  Testing: /\bunit test|jest\b|pytest|testing\b|\bQA\b/i, Linux: /\blinux\b|\bbash\b/i,
  'Machine Learning': /machine learning|\bml\b|tensorflow|pytorch|scikit/i, HTML: /\bhtml5?\b/i, CSS: /\bcss3?\b|tailwind|sass/i,
  'Data Structures': /data structures|algorithms/i, Agile: /\bagile\b|\bscrum\b/i,
};

const remotiveCache = new Map();
const REMOTIVE_CACHE_MS = 60 * 60 * 1000;

async function fetchRemotiveJobs(search) {
  const key = search.toLowerCase();
  const cached = remotiveCache.get(key);
  if (cached && Date.now() - cached.at < REMOTIVE_CACHE_MS) return cached.jobs;
  const { data } = await axios.get('https://remotive.com/api/remote-jobs', {
    params: { search, limit: 20 },
    timeout: 15000,
  });
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  remotiveCache.set(key, { at: Date.now(), jobs });
  return jobs;
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50000);
}

export function createJobsRouter({
  requireAuth,
  Source,
  Requirement,
  User,
  Assessment,
  Evidence,
  skills,
  ingestJob,
  scanRepo,
  extractJobRequirements,
  extractSkills = extractJobSkills,
}) {
  const router = Router();
  router.use(requireAuth);

  async function ensureRequirements(source) {
    if (source.requirementsAnalyzedAt) {
      return Requirement.find({ sourceId: source._id }).lean();
    }

    let extracted;
    try {
      extracted = await extractSkills(source.postingText || '');
    } catch (error) {
      console.error('LLM extraction failed, falling back:', error.message);
      extracted = extractJobRequirements(source.postingText || '', source._id);
    }

    const knownSkills = new Map(skills.map((skill) => [skill.label.toLowerCase(), skill]));
    const bySkill = new Map();
    for (const item of extracted) {
      const itemLabel = item?.name || item?.label;
      if (typeof itemLabel !== 'string' || typeof item.quote !== 'string' || !item.quote.trim()) continue;
      const label = itemLabel.trim();
      const skill = knownSkills.get(label.toLowerCase());
      const skillKey = skill?.key || label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!skillKey) continue;
      bySkill.set(skillKey, {
        sourceId: source._id,
        skillKey,
        label: skill?.label || label,
        level: (item.importance || item.level) === 'required' ? 'required' : 'preferred',
        category: typeof item.category === 'string' ? item.category.trim() : undefined,
        quote: item.quote,
      });
    }

    const requirements = [...bySkill.values()];
    await Requirement.deleteMany({ sourceId: source._id });
    if (requirements.length) await Requirement.insertMany(requirements);
    source.requirementsAnalyzedAt = new Date();
    await source.save();
    return requirements;
  }

  router.post('/fetch', async (req, res, next) => {
    try {
      const search = String(req.body?.search || '').trim().slice(0, 60);
      if (!search) return res.status(400).json({ error: 'Enter a role or skill to search for.' });
      const items = await fetchRemotiveJobs(search);
      let added = 0;
      for (const item of items) {
        if (!item.url) continue;
        const exists = await Source.exists({
          userId: req.userId,
          $or: [{ url: item.url }, { canonicalUrl: item.url }],
        });
        if (exists) continue;
        const tags = Array.isArray(item.tags) ? item.tags.join(' ') : '';
        const text = `${item.title || ''} ${tags} ${htmlToText(item.description)}`.trim();
        const source = await Source.create({
          title: String(item.title || 'Job posting').slice(0, 250),
          company: String(item.company_name || '').slice(0, 150),
          location: item.candidate_required_location || 'Remote',
          type: item.job_type === 'internship' || /intern/i.test(item.title || '') ? 'internship' : 'full-time',
          source: 'Remotive',
          url: item.url,
          canonicalUrl: item.url,
          retrievedAt: new Date(),
          postingText: text,
          userId: req.userId,
        });
        const requirements = extractJobRequirements(text, source._id);
        if (requirements.length) await Requirement.insertMany(requirements);
        added += 1;
      }
      res.json({ found: items.length, added });
    } catch (error) {
      next(error);
    }
  });

  router.get('/gaps', async (req, res, next) => {
    try {
      const sources = await Source.find({ userId: req.userId }).sort({ retrievedAt: -1 }).lean();
      const sourceIds = sources.map((source) => source._id);
      const assessments = await Assessment.find({
        userId: req.userId,
        sourceId: { $in: sourceIds },
      }).sort({ createdAt: -1 }).select('sourceId repository commitSha scope createdAt').lean();

      const latestBySourceAndRepo = new Map();
      for (const assessment of assessments) {
        const key = `${assessment.sourceId}:${assessment.repository}`;
        if (!latestBySourceAndRepo.has(key)) latestBySourceAndRepo.set(key, assessment);
      }
      const analyzedSourceIds = new Set(
        [...latestBySourceAndRepo.values()].map((assessment) => String(assessment.sourceId))
      );
      const jobs = [];
      for (const source of sources) {
        if (!analyzedSourceIds.has(String(source._id))) continue;
        const requirements = await Requirement.find({ sourceId: source._id }).lean();
        jobs.push({
          ...source,
          description: source.postingText || '',
          required: requirements.filter((requirement) => requirement.level === 'required'),
          preferred: requirements.filter((requirement) => requirement.level !== 'required'),
        });
      }

      const latestAssessments = [...latestBySourceAndRepo.values()];
      const evidenceQuery = latestAssessments.map(({ repository, commitSha }) => ({ repository, commitSha }));
      const evidenceRows = evidenceQuery.length
        ? await Evidence.find({ userId: req.userId, $or: evidenceQuery }).lean()
        : [];
      const skillLabels = new Map(skills.map((skill) => [skill.key, skill.label]));
      const evidence = evidenceRows.map((item) => ({
        skill: skillLabels.get(item.skillKey) || item.skillKey,
        ...toEvidenceCitation(item),
      }));
      const repos = [...new Set(latestAssessments.map((assessment) => assessment.repository))];
      res.json(buildGaps({ jobs, evidence, scope: { repos }, skillPatterns: JOB_SKILLS }));
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const sources = await Source.find({ userId: req.userId }).sort({ retrievedAt: -1 }).lean();
      const jobs = await Promise.all(sources.map(async (source) => {
        const requirements = await Requirement.find({ sourceId: source._id }).lean();
        return {
          id: String(source._id),
          title: source.title,
          company: source.company || 'Company not detected',
          location: source.location || 'Location not detected',
          type: source.type || 'full-time',
          source: source.source,
          url: source.url,
          retrievedAt: source.retrievedAt,
          required: requirements.filter((requirement) => requirement.level === 'required').map((requirement) => requirement.label),
          preferred: requirements.filter((requirement) => requirement.level !== 'required').map((requirement) => requirement.label),
          requirements,
        };
      }));
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      if (!req.body?.url) return res.status(400).json({ error: 'Provide a real job posting URL.' });
      const result = await ingestJob(req.body.url, req.userId);
      res.status(201).json({
        id: String(result.source._id),
        title: result.source.title,
        company: result.source.company,
        url: result.source.url,
        retrievedAt: result.source.retrievedAt,
        requirements: result.requirements,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/analyze', async (req, res, next) => {
    try {
      const source = await Source.findOne({ _id: req.params.id, userId: req.userId });
      if (!source) return res.status(404).json({ error: 'Job source not found.' });
      const user = await User.findById(req.userId);
      if (!user?.selectedRepos?.length) {
        return res.status(400).json({ error: 'Select at least one GitHub repository before analyzing a job.' });
      }
      await ensureRequirements(source);
      const results = [];
      for (const repo of user.selectedRepos) {
        results.push(await scanRepo(req.userId, repo, source._id, 'manual'));
      }
      res.json({
        ok: true,
        jobId: String(source._id),
        assessments: results.map(({ assessment }) => ({
          id: assessment._id,
          repository: assessment.repository,
          version: assessment.version,
        })),
      });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const source = await Source.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!source) return res.status(404).json({ error: 'Job source not found.' });
      await Requirement.deleteMany({ sourceId: source._id });
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
