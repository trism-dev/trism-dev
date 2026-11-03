import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { escapeHtml, latestSection, plaque, root } from './build.mjs';

const owner = 'trism-dev';
const excluded = new Set(['trism-dev', 'lore-tool-pages']);

export async function fetchPublicRepos(fetcher = fetch) {
  const repos = [];
  const ids = new Set();
  for (let page = 1; ; page++) {
    if (page > 100) throw new Error('Repository pagination exceeded safety bound');
    const response = await fetcher(`https://api.github.com/users/${owner}/repos?type=owner&sort=created&direction=asc&per_page=100&page=${page}`, {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Public repository scan failed: HTTP ${response.status} on page ${page}`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Expected a repository array');
    for (const repo of batch) {
      if (!Number.isSafeInteger(repo.id) || ids.has(repo.id)) throw new Error('Invalid or repeated repository ID; retry a complete scan');
      ids.add(repo.id);
      repos.push(repo);
    }
    if (batch.length < 100 && !response.headers.get('link')?.includes('rel="next"')) return repos;
  }
}

function date(value) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new Error('Invalid discovery timestamp');
  return new Date(value).toISOString();
}

export function discover(repos, previous, now = new Date().toISOString()) {
  if (previous.version !== 1 || typeof previous.seeded !== 'boolean' || !previous.repositories || Array.isArray(previous.repositories) || typeof previous.repositories !== 'object') throw new Error('Invalid discovery registry');
  const registry = structuredClone(previous);
  for (const [id, timestamp] of Object.entries(registry.repositories)) {
    if (!/^\d+$/.test(id)) throw new Error('Invalid registry ID');
    date(timestamp);
  }
  const current = [];
  const seen = new Set();
  for (const repo of repos) {
    if (repo.private !== false || repo.visibility !== 'public' || repo.owner?.login?.toLowerCase() !== owner || repo.fork) continue;
    if (!Number.isSafeInteger(repo.id) || seen.has(repo.id) || !/^[A-Za-z0-9_.-]+$/.test(repo.name) || repo.html_url !== `https://github.com/${owner}/${repo.name}` || typeof repo.archived !== 'boolean' || (repo.description !== null && typeof repo.description !== 'string') || (repo.language !== null && typeof repo.language !== 'string')) throw new Error('Invalid public repository metadata');
    seen.add(repo.id);
    const created = date(repo.created_at);
    registry.repositories[repo.id] ??= previous.seeded ? date(now) : created;
    if (!repo.archived && !excluded.has(repo.name.toLowerCase())) current.push({ ...repo, created_at: created, discovered: registry.repositories[repo.id] });
  }
  registry.seeded = true;
  current.sort((a, b) => b.discovered.localeCompare(a.discovered) || b.created_at.localeCompare(a.created_at) || b.id - a.id);
  return { registry, latest: current.slice(0, 3) };
}

const clean = (text, limit) => escapeHtml(text.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit));

export function renderLatest(repos) {
  if (!repos.length) return '<p>No public projects to show yet. <a href="https://github.com/trism-dev?tab=repositories">Browse repositories</a>.</p>';
  return repos.map((repo, index) => `<h3><a href="${repo.html_url}"><img src="assets/latest-${index + 1}.svg" width="330" alt="${escapeHtml(repo.name)}"></a></h3>\n${repo.language ? `<p><strong>${clean(repo.language, 80)}</strong></p>\n` : ''}${repo.description ? `<p>${clean(repo.description, 280)}</p>` : ''}`).join('\n\n');
}

export async function refresh({ directory = root, fetcher = fetch, now } = {}) {
  const registryPath = directory + '/data/discovery.json';
  const readmePath = directory + '/README.md';
  const previous = existsSync(registryPath) ? JSON.parse(readFileSync(registryPath, 'utf8')) : { version: 1, seeded: false, repositories: {} };
  const readme = readFileSync(readmePath, 'utf8').replaceAll('\r\n', '\n');
  const before = latestSection(readme);
  const repos = await fetchPublicRepos(fetcher);
  const { registry, latest } = discover(repos, previous, now);
  const output = readme.replace(`<!-- latest:start -->\n${before}\n<!-- latest:end -->`, `<!-- latest:start -->\n${renderLatest(latest)}\n<!-- latest:end -->`);
  const serialized = JSON.stringify(registry, null, 2) + '\n';
  const changes = [];
  // Finish the complete scan and validation before touching either tracked file.
  const plaques = Array.from({ length: 3 }, (_, i) => [directory + `/assets/latest-${i + 1}.svg`, plaque(latest[i]?.name ?? '')]);
  for (const [path, content] of [[readmePath, output], [registryPath, serialized], ...plaques]) {
    if (existsSync(path) && readFileSync(path, 'utf8').replaceAll('\r\n', '\n') === content) continue;
    mkdirSync(directory + '/data', { recursive: true });
    mkdirSync(directory + '/assets', { recursive: true });
    writeFileSync(path + '.tmp', content);
    changes.push([path, path + '.tmp']);
  }
  for (const [path, temporary] of changes) renameSync(temporary, path);
  return changes.length > 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  refresh().then(changed => console.log(changed ? 'Updated Latest projects and discovery registry.' : 'No public project changes.')).catch(error => { console.error(error.message); process.exitCode = 1; });
}
