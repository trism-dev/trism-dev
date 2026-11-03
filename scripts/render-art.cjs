// Re-export the approved scene and weather without altering the original artwork.
const { readFileSync, writeFileSync, mkdirSync, mkdtempSync, statSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const root = resolve(__dirname, '..');
  const frames = mkdtempSync(join(tmpdir(), 'profile-frames-'));
  const source = readFileSync(join(root, 'art/scene.png')).toString('base64');
  const weather = readFileSync(join(root, 'art/weather.js'), 'utf8');
  mkdirSync(join(root, 'assets'), { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 830, height: 361 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setContent(`<style>html,body{margin:0;width:830px;height:361px;overflow:hidden}img,canvas{position:absolute;inset:0;width:830px;height:361px}img{image-rendering:pixelated}h1{position:absolute;left:5%;top:9%;margin:0;font:500 40px/1.3 Georgia,serif;letter-spacing:.055em;color:#f2eddd;text-shadow:2px 2px #142637,0 0 14px #142637}small{display:block;font:12px monospace;letter-spacing:.12em;margin-top:8px}</style><img src="data:image/png;base64,${source}"><canvas></canvas><h1>Tristan Morton<small>trism-dev</small></h1><script>${weather}</script>`);
    await page.locator('img').evaluate(img => img.decode());
    await page.screenshot({ path: join(root, 'assets/scene.png') });
    for (let i = 0; i < 48; i++) {
      await page.evaluate(t => window.drawWeather(t), i / 12);
      await page.screenshot({ path: join(frames, `${String(i).padStart(3, '0')}.png`) });
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '12', '-i', join(frames, '%03d.png'), '-filter_complex', '[0:v]split[a][b];[a]palettegen=stats_mode=diff:reserve_transparent=0[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle', '-loop', '0', join(root, 'assets/scene.gif')], { stdio: 'inherit' });
  assert(statSync(join(root, 'assets/scene.gif')).size < 8_000_000, 'Animation exceeds 8 MB budget');
  writeFileSync(join(root, 'art/export.json'), JSON.stringify({ width: 830, height: 361, frames: 48, fps: 12, loopSeconds: 4 }, null, 2) + '\n');
  console.log(`Exported static fallback and 48-frame GIF (${statSync(join(root, 'assets/scene.gif')).size} bytes). Temporary frames: ${frames}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
