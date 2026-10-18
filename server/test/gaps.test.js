import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGaps, toEvidenceCitation } from '../src/lib/gaps.js';

test('buildGaps preserves extracted requirement quotes and categories', () => {
  const gaps = buildGaps({
    jobs: [{
      _id: 'job-1',
      title: 'Backend Engineer',
      url: 'https://example.com/job',
      required: [{ label: 'MongoDB', quote: 'Build services with MongoDB.', category: 'Databases' }],
      preferred: [],
    }],
    evidence: [],
  });

  assert.equal(gaps[0].quote, 'Build services with MongoDB.');
  assert.equal(gaps[0].category, 'Databases');
});

test('buildGaps retains support for legacy string requirements', () => {
  const gaps = buildGaps({
    jobs: [{
      _id: 'job-1',
      title: 'Backend Engineer',
      url: 'https://example.com/job',
      description: 'Experience building services with MongoDB is required.',
      required: ['MongoDB'],
      preferred: [],
    }],
    evidence: [],
    skillPatterns: { MongoDB: /MongoDB/i },
  });

  assert.equal(gaps[0].category, 'Database');
  assert.equal(gaps[0].quote, 'Experience building services with MongoDB is required.');
});

test('evidence citations use the shared CodeCitation shape', () => {
  assert.deepEqual(toEvidenceCitation({
    repository: 'Pranavpatil-97/pranav_portfolio',
    filePath: 'src/App.jsx',
    startLine: 9,
    endLine: 9,
    commitSha: '15b14d6',
    excerpt: 'export default App;',
    explanation: 'Matched code.',
    url: 'https://github.com/Pranavpatil-97/pranav_portfolio/blob/15b14d6/src/App.jsx#L9-L9',
  }), {
    repository: 'Pranavpatil-97/pranav_portfolio',
    repoUrl: 'https://github.com/Pranavpatil-97/pranav_portfolio',
    filePath: 'src/App.jsx',
    startLine: 9,
    endLine: 9,
    commitSha: '15b14d6',
    excerpt: 'export default App;',
    explanation: 'Matched code.',
    url: 'https://github.com/Pranavpatil-97/pranav_portfolio/blob/15b14d6/src/App.jsx#L9-L9',
  });
});

test('buildGaps marks only valid unique evidence as demonstrated and caps it at five', () => {
  const evidence = Array.from({ length: 7 }, (_, index) => ({
    skill: 'Testing',
    repository: 'owner/repo',
    filePath: `src/file${index}.js`,
    startLine: index + 1,
    endLine: index + 1,
    commitSha: `sha-${index}`,
    excerpt: `test ${index}`,
  }));
  evidence.push(
    { ...evidence[0], repository: 'another/repo' },
    { skill: 'Testing', filePath: 'src/broken.js', startLine: 12, excerpt: '' },
    { skill: 'Testing', filePath: 'src/broken.js', startLine: '13', excerpt: 'not a numeric line' },
  );
  const [gap] = buildGaps({
    jobs: [{
      _id: 'job-1',
      title: 'QA Engineer',
      url: 'https://example.com/job',
      required: ['Testing'],
      preferred: [],
    }],
    evidence,
  });

  assert.equal(gap.status, 'demonstrated');
  assert.equal(gap.evidence.length, 5);
  assert.equal(new Set(gap.evidence.map((item) => `${item.filePath}:${item.startLine}`)).size, 5);
});

test('buildGaps does not demonstrate a skill from malformed evidence', () => {
  const [gap] = buildGaps({
    jobs: [{
      _id: 'job-1',
      title: 'QA Engineer',
      url: 'https://example.com/job',
      required: ['Testing'],
      preferred: [],
    }],
    evidence: [
      { skill: 'Testing', filePath: 'src/test.js', startLine: 1, excerpt: '' },
      { skill: 'Testing', filePath: '', startLine: 2, excerpt: 'test()' },
      { skill: 'Testing', filePath: 'src/test.js', startLine: '3', excerpt: 'test()' },
    ],
  });

  assert.equal(gap.status, 'not_demonstrated');
  assert.deepEqual(gap.evidence, []);
});
