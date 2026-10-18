const CATEGORY = {
  Python: 'Language', JavaScript: 'Language', TypeScript: 'Language', Java: 'Language', 'C++': 'Language',
  'C#': 'Language', Go: 'Language', SQL: 'Database', MongoDB: 'Database', React: 'Frontend', HTML: 'Frontend',
  CSS: 'Frontend', 'Node.js': 'Backend', Express: 'Backend', 'REST APIs': 'Backend', GraphQL: 'Backend',
  Docker: 'DevOps', Kubernetes: 'DevOps', 'CI/CD': 'DevOps', Linux: 'DevOps', Git: 'Tooling', Testing: 'Practice',
  AWS: 'Cloud', Azure: 'Cloud', GCP: 'Cloud', 'Machine Learning': 'AI/ML', 'Data Structures': 'Fundamentals',
  Agile: 'Practice',
};

function findQuote(description = '', pattern) {
  if (!pattern) return null;
  const sentences = description.split(/(?<=[.!?])\s+|\s{2,}/);
  const hit = sentences.find((sentence) => sentence.length >= 15 && pattern.test(sentence));
  return hit ? hit.trim().slice(0, 240) : null;
}

export function toEvidenceCitation(item) {
  const repository = item.repository;
  return {
    repository,
    repoUrl: item.repoUrl || (repository ? `https://github.com/${repository}` : undefined),
    filePath: item.filePath || item.path,
    startLine: item.startLine,
    endLine: item.endLine,
    commitSha: item.commitSha,
    excerpt: item.excerpt,
    explanation: item.explanation,
    url: item.url || item.commitUrl,
  };
}

export function buildGaps({ jobs, evidence, scope = {}, skillPatterns }) {
  const bySkill = new Map();
  for (const job of jobs) {
    for (const [skills, level] of [[job.required, 'required'], [job.preferred, 'preferred']]) {
      for (const requirement of skills || []) {
        const skill = typeof requirement === 'string' ? requirement : requirement.label;
        if (!skill) continue;
        const row = bySkill.get(skill) || { skill, required: 0, preferred: 0, jobs: [] };
        row[level] += 1;
        row.jobs.push({ job, requirement: typeof requirement === 'string' ? null : requirement });
        bySkill.set(skill, row);
      }
    }
  }

  const repoCount = scope.repos?.length ?? 0;
  const gaps = [...bySkill.values()].map((row) => {
    const matchingEvidence = evidence
      .filter((item) => item.skill === row.skill)
      .map(toEvidenceCitation);
    const validEvidence = matchingEvidence.filter(
      (item) => item.filePath && item.excerpt && Number.isFinite(item.startLine)
    );
    const uniqueEvidence = [...new Map(
      validEvidence.map((item) => [`${item.filePath}:${item.startLine}`, item])
    ).values()].slice(0, 5);
    const status = uniqueEvidence.length ? 'demonstrated' : 'not_demonstrated';
    const confidence = uniqueEvidence.length > 1 ? 'High' : uniqueEvidence.length ? 'Medium' : null;
    const first = row.jobs[0];
    const total = row.jobs.length;
    return {
      skill: row.skill,
      category: first.requirement?.category || CATEGORY[row.skill] || 'Skill',
      status,
      confidence,
      quote: first.requirement?.quote || findQuote(first.job.description, skillPatterns?.[row.skill]) || `${first.job.title} lists ${row.skill}.`,
      jobUrl: first.job.url,
      demand: { required: row.required, preferred: row.preferred, jobs: row.jobs.map(({ job }) => ({ id: String(job._id), title: job.title, url: job.url })) },
      evidence: uniqueEvidence,
      explanation: status === 'not_demonstrated'
        ? `Not demonstrated in this scope: nothing for ${row.skill} was found in ${repoCount} scanned repositories. This does not mean you lack the skill, only that the scanned repos do not show it.`
        : `Found in ${new Set(uniqueEvidence.map((item) => item.filePath)).size} file(s).`,
      nextStep: status === 'demonstrated'
        ? `Keep it visible: mention ${row.skill} in the README of the repo that uses it.`
        : `Add a small commit that really uses ${row.skill} (needed by ${total} tracked job${total > 1 ? 's' : ''}). The next scan will pick it up and the Timeline will record the change.`,
      _weight: row.required * 2 + row.preferred,
    };
  });

  const order = { not_demonstrated: 0, partial: 1, demonstrated: 2 };
  return gaps
    .sort((a, b) => order[a.status] - order[b.status] || b._weight - a._weight)
    .map(({ _weight, ...gap }) => gap);
}
