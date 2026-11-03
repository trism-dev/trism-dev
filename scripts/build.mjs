import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const featured = [
  { name: 'Internship Scout', repo: 'internship-scout-agent', stack: 'Python · FastAPI · PostgreSQL · Claude tool calling · GitHub Actions', text: 'A resume-matching agent with a FastAPI web app. A scheduled Python job gathers internship postings, uses tool calling to retrieve details and explain matches, and sends an email digest. PostgreSQL stores the postings and results so the app can show them later.' },
  { name: 'Tripwire', repo: 'tripwire-awareness-dashboard', stack: 'Python · Streamlit · PostgreSQL · Docker · GDELT', text: 'A situational awareness dashboard backed by a Dockerized ingestion worker. It reads the GDELT event feed, stores geolocated conflict and unrest reports in PostgreSQL, and detects unusual changes in activity by country. A Streamlit interface makes the events easier to explore on a map.' },
  { name: 'Docs QA Copilot', repo: 'docs-qa-copilot', stack: 'TypeScript · Next.js · React · PostgreSQL / pgvector · Local embeddings · Claude', text: 'A retrieval-augmented generation (RAG) application for asking questions about PDFs. Local embeddings and pgvector find relevant passages, and the app generates answers with page-level citations. An evaluation view shows how it handles test questions and where it falls short.' },
];

export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function plaque(label, width = 400) {
  const display = label.length > 35 ? label.slice(0, 34) + '…' : label;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="58" viewBox="0 0 ${width} 58" role="img" aria-label="${escapeHtml(label)}">
<defs><linearGradient id="stone" x2="0" y2="1"><stop stop-color="#2b3d49"/><stop offset="1" stop-color="#1a2c38"/></linearGradient></defs>
<path fill="url(#stone)" stroke="#728592" d="M.5.5h${width - 1}v57H.5z"/>
<path fill="none" stroke="#101e29" stroke-width="3" d="M3 3h${width - 6}v52H3z"/><path fill="none" stroke="#4a6172" d="M4.5 4.5h${width - 9}v49H4.5z"/>
<path fill="#a5b9c1" d="m14 26 3 3-3 3-3-3z m${width - 28} 0 3 3-3 3-3-3z"/>
<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Georgia,serif" font-size="17" letter-spacing=".6" fill="#f0dfb8">${escapeHtml(display)}</text>
</svg>\n`;
}

export function renderReadme(latest = '<p>Latest public projects will appear here after the first successful refresh.</p>') {
  return `<!-- Built by scripts/build.mjs. Edit the generator, then rebuild. -->
<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="assets/scene.png">
  <img src="assets/scene.gif" width="100%" alt="Tristan Morton. A faceless hooded traveler drinks tea on a sheltered bench beside a sword and warm lantern, overlooking a rainy blue city.">
</picture>

<p>
  <a href="https://portfolio-site-trism2.vercel.app"><img src="assets/profile.svg" width="48%" alt="Portfolio Website"></a>
  <a href="https://github.com/trism-dev?tab=repositories"><img src="assets/projects.svg" width="48%" alt="Repositories"></a>
</p>

<!-- Introduction — Tristan will write this. -->

## Latest projects

<!-- latest:start -->
${latest}
<!-- latest:end -->

## Featured projects

${featured.map((p, i) => `<details${i === 0 ? ' open' : ''}>
<summary><picture><img src="assets/featured-${p.repo}.svg" width="280" alt="${p.name}"></picture></summary>

**${p.stack}**

${p.text}

[View repository →](https://github.com/trism-dev/${p.repo})

</details>`).join('\n\n')}

<!-- Optional personal text — Tristan may write this or remove it. -->
`;
}

export function latestSection(readme) {
  const match = readme.match(/<!-- latest:start -->\n([\s\S]*?)\n<!-- latest:end -->/);
  if (!match || (readme.match(/<!-- latest:start -->/g) || []).length !== 1 || (readme.match(/<!-- latest:end -->/g) || []).length !== 1) throw new Error('Expected exactly one Latest projects section');
  return match[1];
}

export function build(latest = existsSync(root + 'README.md') ? latestSection(readFileSync(root + 'README.md', 'utf8').replaceAll('\r\n', '\n')) : undefined) {
  mkdirSync(root + 'assets', { recursive: true });
  writeFileSync(root + 'assets/profile.svg', plaque('Portfolio Website'));
  writeFileSync(root + 'assets/projects.svg', plaque('Repositories'));
  for (const project of featured) writeFileSync(root + `assets/featured-${project.repo}.svg`, plaque(project.name));
  writeFileSync(root + 'README.md', renderReadme(latest));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build();
  console.log('Built README and navigation plaques.');
}
