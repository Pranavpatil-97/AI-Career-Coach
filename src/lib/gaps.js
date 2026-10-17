const CATEGORY = {
  Python: 'Language', JavaScript: 'Language', TypeScript: 'Language', Java: 'Language', 'C++': 'Language',
  'C#': 'Language', Go: 'Language', SQL: 'Database', MongoDB: 'Database', React: 'Frontend', HTML: 'Frontend',
  CSS: 'Frontend', 'Node.js': 'Backend', Express: 'Backend', 'REST APIs': 'Backend', GraphQL: 'Backend',
  Docker: 'DevOps', Kubernetes: 'DevOps', 'CI/CD': 'DevOps', Linux: 'DevOps', Git: 'Tooling', Testing: 'Practice',
  AWS: 'Cloud', Azure: 'Cloud', GCP: 'Cloud', 'Machine Learning': 'AI/ML', 'Data Structures': 'Fundamentals',
  Agile: 'Practice',
};

// the sentence in the posting that mentions the skill, so the quote is real text from the source
function findQuote(description = '', pattern) {
  const sentences = description.split(/(?<=[.!?])\s+|\s{2,}/);
  const hit = sentences.find((s) => s.length >= 15 && pattern.test(s));
  return hit ? hit.trim().slice(0, 240) : null;
}

function classify(items) {
  const usage = items.filter((e) => e.kind !== 'dependency');
  const files = new Set(usage.map((e) => `${e.repo}/${e.path}`));
  if (files.size >= 2) return { status: 'demonstrated', confidence: 'High' };
  if (files.size === 1) return { status: 'demonstrated', confidence: 'Medium' };
  if (items.length) return { status: 'partial', confidence: 'Low' };
  return { status: 'not_demonstrated', confidence: null };
}

export function buildGaps({ jobs, evidence, scope = {}, skillPatterns }) {
  const bySkill = new Map();
  for (const job of jobs) {
    for (const [list, level] of [[job.required, 'required'], [job.preferred, 'preferred']]) {
      for (const skill of list || []) {
        const row = bySkill.get(skill) || { skill, required: 0, preferred: 0, jobs: [] };
        row[level] += 1;
        row.jobs.push(job);
        bySkill.set(skill, row);
      }
    }
  }

  const repoCount = scope.repos?.length ?? 0;
  const gaps = [...bySkill.values()].map((row) => {
    const items = evidence.filter((e) => e.skill === row.skill);
    const { status, confidence } = classify(items);
    const first = row.jobs[0];
    const total = row.jobs.length;
    return {
      skill: row.skill,
      category: CATEGORY[row.skill] || 'Skill',
      status,
      confidence,
      quote: findQuote(first.description, skillPatterns[row.skill]) || `${first.title} lists ${row.skill}.`,
      jobUrl: first.url,
      demand: { required: row.required, preferred: row.preferred, jobs: row.jobs.map((j) => ({ id: String(j._id), title: j.title, url: j.url })) },
      evidence: items,
      explanation: status === 'not_demonstrated'
        ? `Not demonstrated in this scope: nothing for ${row.skill} was found in ${repoCount} scanned repositories. This does not mean you lack the skill, only that the scanned repos do not show it.`
        : status === 'partial'
          ? `Only a dependency or import was found, which is weak evidence of real use.`
          : `Found in ${new Set(items.map((e) => e.path)).size} file(s).`,
      nextStep: status === 'demonstrated'
        ? `Keep it visible: mention ${row.skill} in the README of the repo that uses it.`
        : `Add a small commit that really uses ${row.skill} (needed by ${total} tracked job${total > 1 ? 's' : ''}). The next scan will pick it up and the Timeline will record the change.`,
      _weight: row.required * 2 + row.preferred,
    };
  });

  const order = { not_demonstrated: 0, partial: 1, demonstrated: 2 };
  return gaps
    .sort((a, b) => order[a.status] - order[b.status] || b._weight - a._weight)
    .map(({ _weight, ...g }) => g);
}