// Generates every SVG (dark + light) and README.md from the content block below.
// Run: node scripts/build.mjs
import { mkdirSync, writeFileSync, readdirSync, statSync } from "node:fs";

const W = 830;
const FONT = `ui-monospace, "SF Mono", "Cascadia Code", Consolas, Menlo, monospace`;
const PALETTE = {
  dark: { ink: "#e6edf3", dim: "#8b949e", line: "#30363d", card: "#0d1117", accent: "#ffb454" },
  light: { ink: "#1f2328", dim: "#59636e", line: "#d0d7de", card: "#f6f8fa", accent: "#b35900" },
};

// ---- content (edit here, then rebuild) ----
const C = {
  name: "TRISTAN MORTON",
  tagline: "systems · security · data",
  sub: "CIS @ James Madison University · class of 2027",
  whoami: [
    ["role", "CIS student, building and breaking things in that order"],
    ["school", "James Madison University, B.B.A. Computer Information Systems"],
    ["grad", "December 2027"],
    ["day job", "QA at Matter: 100+ tickets, MCP agent integration"],
    ["focus", "data pipelines, ML you can audit, secure cloud design"],
  ],
  now: [
    "Recruiting for 2027 internships",
    "Tripwire: tuning spike detection against a 28-day baseline",
    "Secure AWS architecture write-ups (private for now)",
  ],
  projects: [
    {
      id: "tripwire",
      title: "tripwire",
      line: "GDELT feed in every 15 min, conflict events grouped, country spikes flagged on a map.",
      stack: "Python · PostgreSQL · Docker · CI",
      url: "https://github.com/trism-dev/tripwire-awareness-dashboard",
    },
    {
      id: "heart",
      title: "heart-disease",
      line: "Recall-first classifier. The simpler model won, and it was tested on 3 other hospitals.",
      stack: "scikit-learn · XGBoost · Streamlit",
      url: "https://github.com/trism-dev/heart-disease-prediction",
    },
    {
      id: "portfolio",
      title: "portfolio-site",
      line: "Static Next.js site with MDX content, light/dark themes and CI link checks.",
      stack: "Next.js · MDX · Tailwind · Vercel",
      url: "https://github.com/trism-dev/portfolio-site",
    },
  ],
  stack: [
    ["languages", "Python  SQL  TypeScript  JavaScript  Java"],
    ["data/ml", "PostgreSQL  pandas  scikit-learn  XGBoost"],
    ["web", "React  Next.js  Tailwind  Streamlit"],
    ["ops", "Docker  Git  GitHub Actions  pytest  Vercel"],
  ],
  links: [
    ["portfolio", "https://portfolio-site-trism2.vercel.app"],
    ["discord", "https://discord.com/users/543220135260061720"],
  ],
};

// ---- svg helpers ----
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const svg = (p, w, h, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<style>
text{font-family:${FONT}}
.blink{animation:b 1.1s steps(1) infinite}
@keyframes b{50%{opacity:0}}
.scan{animation:s 6s linear infinite}
@keyframes s{from{transform:translateX(-120px)}to{transform:translateX(${w}px)}}
@media (prefers-reduced-motion:reduce){.blink,.scan{animation:none}}
</style>
${body}
</svg>
`;
const t = (x, y, s, fill, size = 14, extra = "") =>
  `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" ${extra}>${esc(s)}</text>`;

function wrap(text, max) {
  const out = [];
  let cur = "";
  for (const w of text.split(" ")) {
    if ((cur + " " + w).trim().length > max) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim();
  }
  return out.concat(cur);
}

const files = {
  header: (p) =>
    svg(p, W, 230, `
<rect x="0.5" y="0.5" width="${W - 1}" height="229" rx="10" fill="${p.card}" stroke="${p.line}"/>
${t(32, 44, "trism@github:~$ whoami", p.dim, 13)}
${t(32, 118, C.name, p.ink, 52, 'font-weight="700" letter-spacing="3"')}
<rect x="32" y="136" width="64" height="3" fill="${p.accent}"/>
<rect class="scan" x="0" y="136" width="40" height="3" fill="${p.accent}" opacity="0.35"/>
${t(32, 178, C.tagline, p.accent, 20)}
${t(32, 206, C.sub, p.dim, 14)}<rect class="blink" x="${32 + C.sub.length * 8.45 + 6}" y="193" width="9" height="16" fill="${p.accent}"/>`,
      "Tristan Morton, systems, security, data"),

  ...Object.fromEntries(
    [["s01", "01", "whoami"], ["s02", "02", "now"], ["s03", "03", "projects"], ["s04", "04", "stack"]].map(
      ([k, n, label]) => [
        k,
        (p) => svg(p, W, 56, `
${t(0, 36, n, p.accent, 22, 'font-weight="700"')}
${t(40, 36, label, p.ink, 22, 'font-weight="700"')}
<line x1="${40 + label.length * 13.5 + 16}" y1="29" x2="${W}" y2="29" stroke="${p.line}" stroke-width="1.5"/>`, `${n} ${label}`),
      ],
    ),
  ),

  whoami: (p) => {
    const h = 28 + C.whoami.length * 30 + 14;
    const rows = C.whoami.map(([k, v], i) => t(24, 40 + i * 30, k.padEnd(8), p.accent, 14) + t(24 + 9 * 8.4, 40 + i * 30, v, p.ink, 14));
    return svg(p, W, h, `<rect x="0.5" y="0.5" width="${W - 1}" height="${h - 1}" rx="8" fill="${p.card}" stroke="${p.line}"/>${rows.join("")}`, "About Tristan");
  },

  now: (p) => {
    const h = 24 + C.now.length * 30 + 10;
    const rows = C.now.map((s, i) => t(24, 38 + i * 30, "›", p.accent, 15) + t(46, 38 + i * 30, s, p.ink, 14));
    return svg(p, W, h, `<rect x="0.5" y="0.5" width="${W - 1}" height="${h - 1}" rx="8" fill="${p.card}" stroke="${p.line}"/>${rows.join("")}`, "Currently working on");
  },

  stack: (p) => {
    const h = 24 + C.stack.length * 30 + 10;
    const rows = C.stack.map(([k, v], i) => t(24, 38 + i * 30, k.padEnd(10), p.accent, 14) + t(24 + 11 * 8.4, 38 + i * 30, v, p.ink, 14));
    return svg(p, W, h, `<rect x="0.5" y="0.5" width="${W - 1}" height="${h - 1}" rx="8" fill="${p.card}" stroke="${p.line}"/>${rows.join("")}`, "Tech stack");
  },

  footer: (p) =>
    svg(p, W, 70, `
<line x1="0" y1="10" x2="${W}" y2="10" stroke="${p.line}"/>
${t(0, 44, "status", p.dim, 13)}${t(60, 44, "open to 2027 internships", p.accent, 13, 'font-weight="700"')}
<rect class="blink" x="${60 + 24 * 7.9}" y="33" width="8" height="13" fill="${p.accent}"/>`, "Open to 2027 internships"),
};

for (const pr of C.projects)
  files[`p-${pr.id}`] = (p) => {
    const w = 260, h = 190;
    const lines = wrap(pr.line, 29).map((l, i) => t(20, 78 + i * 20, l, p.ink, 12.5)).join("");
    return svg(p, w, h, `
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="8" fill="${p.card}" stroke="${p.line}"/>
<rect x="20" y="22" width="28" height="3" fill="${p.accent}"/>
${t(20, 52, pr.title, p.ink, 17, 'font-weight="700"')}${lines}
${t(20, h - 20, pr.stack, p.dim, 11)}`, pr.title);
  };

// ---- write ----
for (const mode of ["dark", "light"]) {
  mkdirSync(`assets/${mode}`, { recursive: true });
  for (const [name, fn] of Object.entries(files)) writeFileSync(`assets/${mode}/${name}.svg`, fn(PALETTE[mode]));
}

const pic = (name, alt, attrs = "") =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/${name}.svg"><img src="assets/light/${name}.svg" alt="${esc(alt)}" ${attrs}></picture>`;

const readme = `<!-- Generated by scripts/build.mjs. Edit the content block there, not this file. -->
<div align="center">

${pic("header", "Tristan Morton: systems, security, data", 'width="100%"')}

${C.links.map(([k, u]) => `[\`${k}\`](${u})`).join(" · ")}

</div>

${pic("s01", "01 whoami", 'width="100%"')}

${pic("whoami", C.whoami.map(([k, v]) => `${k}: ${v}`).join(". "), 'width="100%"')}

${pic("s02", "02 now", 'width="100%"')}

${pic("now", "Now: " + C.now.join("; "), 'width="100%"')}

${pic("s03", "03 projects", 'width="100%"')}

<p align="center">
${C.projects.map((pr) => `<a href="${pr.url}">${pic(`p-${pr.id}`, `${pr.title}: ${pr.line}`, 'width="32%"')}</a>`).join("\n")}
</p>

${pic("s04", "04 stack", 'width="100%"')}

${pic("stack", C.stack.map(([k, v]) => `${k}: ${v.replace(/ +/g, ", ")}`).join(". "), 'width="100%"')}

<!-- telemetry section: add once the metrics workflow has produced assets (see .github/workflows/metrics.yml) -->

${pic("footer", "Open to 2027 internships", 'width="100%"')}
`;
writeFileSync("README.md", readme);

// ---- self-check ----
let n = 0;
for (const mode of ["dark", "light"])
  for (const f of readdirSync(`assets/${mode}`)) {
    const path = `assets/${mode}/${f}`;
    const s = (await import("node:fs")).readFileSync(path, "utf8");
    if (!s.startsWith("<svg") || !s.trimEnd().endsWith("</svg>")) throw new Error(`malformed ${path}`);
    if (statSync(path).size > 50_000) throw new Error(`too big ${path}`);
    n++;
  }
if (n !== Object.keys(files).length * 2) throw new Error("file count mismatch");
console.log(`ok: ${n} svgs + README.md`);
