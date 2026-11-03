import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discover, fetchPublicRepos, refresh, renderLatest } from '../scripts/refresh.mjs';
import { renderReadme, latestSection } from '../scripts/build.mjs';

const empty = () => ({ version: 1, seeded: false, repositories: {} });
const repo = (id, overrides = {}) => ({ id, name: `project-${id}`, html_url: `https://github.com/trism-dev/project-${id}`, owner: { login: 'trism-dev' }, private: false, visibility: 'public', fork: false, archived: false, created_at: '2025-01-01T00:00:00Z', description: 'A public project.', language: 'JavaScript', ...overrides });
const response = (repos, link = '') => new Response(JSON.stringify(repos), { headers: { link } });
const now = '2026-11-03T00:00:00.000Z';

test('initial seed uses creation dates with deterministic ties', () => {
  const { registry, latest } = discover([repo(1), repo(3), repo(2)], empty(), now);
  assert.equal(registry.repositories[1], '2025-01-01T00:00:00.000Z');
  assert.deepEqual(latest.map(r => r.id), [3, 2, 1]);
});

test('newly public older repository leads; pushes and renames keep original recency', () => {
  const first = discover([repo(1)], empty(), now);
  const next = discover([repo(1, { name: 'renamed', html_url: 'https://github.com/trism-dev/renamed', pushed_at: now }), repo(2, { created_at: '2020-01-01T00:00:00Z' })], first.registry, now);
  assert.deepEqual(next.latest.map(r => r.id), [2, 1]);
  assert.equal(next.registry.repositories[1], first.registry.repositories[1]);
  const toggled = discover([repo(1)], discover([], next.registry, now).registry, now);
  assert.equal(toggled.registry.repositories[1], first.registry.repositories[1]);
});

test('only public owned eligible repositories show, featured repositories remain eligible', () => {
  const sample = [repo(1, { private: true }), repo(2, { archived: true }), repo(3, { fork: true }), repo(4, { owner: { login: 'elsewhere' } }), repo(5, { name: 'trism-dev', html_url: 'https://github.com/trism-dev/trism-dev' }), repo(6, { name: 'lore-tool-pages', html_url: 'https://github.com/trism-dev/lore-tool-pages' }), repo(7, { name: 'docs-qa-copilot', html_url: 'https://github.com/trism-dev/docs-qa-copilot' })];
  const result = discover(sample, empty(), now);
  assert.deepEqual(result.latest.map(r => r.id), [7]);
  assert(!Object.hasOwn(result.registry.repositories, '1'));
  const removed = discover([], result.registry, now);
  assert.equal(removed.latest.length, 0);
  assert.equal(removed.registry.repositories[7], result.registry.repositories[7]);
});

test('public metadata is escaped, bounded and cannot inject HTML or Markdown', () => {
  const text = renderLatest([repo(1, { description: '<script>alert("x")</script> & [click](javascript:evil)\n' + 'a'.repeat(400), language: '<b>JS</b>' })]);
  assert(!text.includes('<script>'));
  assert(!text.includes('<b>JS'));
  assert(text.includes('&lt;script&gt;'));
  assert(!text.includes('a'.repeat(300)));
  assert(!renderLatest([repo(2, { description: null, language: null })]).includes('undefined'));
  assert(renderLatest([]).includes('No public projects'));
});

test('invalid registry and repository metadata fail closed', () => {
  assert.throws(() => discover([repo(1, { html_url: 'javascript:alert(1)' })], empty(), now));
  assert.throws(() => discover([repo(1, { created_at: 'bad' })], empty(), now));
  assert.throws(() => discover([repo(1), repo(1)], empty(), now));
  assert.throws(() => discover([], { version: 1, seeded: true, repositories: { bad: now } }));
  assert.throws(() => latestSection('<!-- latest:start -->\na\n<!-- latest:end -->\n<!-- latest:start -->'));
});

test('all pages are fetched, including a short page with a next link', async () => {
  let calls = 0;
  const repos = await fetchPublicRepos(async url => {
    calls++;
    assert(new URL(url).searchParams.get('page') === String(calls));
    return calls === 1 ? response(Array.from({ length: 100 }, (_, i) => repo(i))) : calls === 2 ? response([repo(100)], '<https://api.github.com/users/trism-dev/repos?page=3>; rel="next"') : response([repo(101)]);
  });
  assert.equal(calls, 3);
  assert.equal(repos.length, 102);
});

test('failed, malformed or repeated pages reject an incomplete scan', async () => {
  await assert.rejects(fetchPublicRepos(async () => new Response('', { status: 403 })), /HTTP 403/);
  await assert.rejects(fetchPublicRepos(async () => response({ message: 'bad' })), /array/);
  await assert.rejects(fetchPublicRepos(async () => response([repo(1)], '<next>; rel="next"')), /repeated/);
});

test('complete refresh is stable; failure leaves README and registry byte-for-byte intact', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'profile-test-'));
  mkdirSync(directory + '/data');
  writeFileSync(directory + '/README.md', renderReadme());
  writeFileSync(directory + '/data/discovery.json', JSON.stringify(empty()));
  const options = { directory, now, fetcher: async () => response([repo(1)]) };
  assert.equal(await refresh(options), true);
  const readme = readFileSync(directory + '/README.md', 'utf8');
  const registry = readFileSync(directory + '/data/discovery.json', 'utf8');
  assert.equal(await refresh({ ...options, now: '2026-11-04T00:00:00.000Z' }), false);
  let page = 0;
  await assert.rejects(refresh({ ...options, fetcher: async () => ++page === 1 ? response(Array.from({ length: 100 }, (_, i) => repo(i))) : new Response('', { status: 503 }) }), /HTTP 503/);
  assert.equal(readFileSync(directory + '/README.md', 'utf8'), readme);
  assert.equal(readFileSync(directory + '/data/discovery.json', 'utf8'), registry);
  assert.equal(readme, renderReadme(latestSection(readme)));
});
