// Compose reusable pixel-grid sprites, then export the scene and weather.
const { readFileSync, writeFileSync, mkdirSync, mkdtempSync, statSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const root = resolve(__dirname, '..');
  const frames = mkdtempSync(join(tmpdir(), 'profile-frames-'));
  const layout = JSON.parse(readFileSync(join(root, 'art/layers.json'), 'utf8'));
  const encode = file => 'data:image/png;base64,' + readFileSync(join(root, file)).toString('base64');
  const source = readFileSync(join(root, layout.background)).toString('base64');
  const composition = { ...layout, background: encode(layout.background), sprites: layout.sprites.map(s => ({ ...s, source: encode(s.file) })) };
  const weather = readFileSync(join(root, 'art/weather.js'), 'utf8');
  mkdirSync(join(root, 'assets'), { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 830, height: 361 }, deviceScaleFactor: 2 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setContent(`<style>html,body{margin:0;width:830px;height:361px;overflow:hidden}img,canvas{position:absolute;inset:0;width:830px;height:361px}img{image-rendering:pixelated}h1{position:absolute;left:5%;top:9%;margin:0;font:500 40px/1.3 Georgia,serif;letter-spacing:.055em;color:#f2eddd;text-shadow:2px 2px #142637}</style><img src="data:image/png;base64,${source}"><canvas></canvas><h1>Tristan Morton</h1><script>${weather}</script>`);
    await page.locator('img').evaluate(img => img.decode());
    const composed = await page.evaluate(async layout => {
      const load = async source => { const img = new Image(); img.src = source; await img.decode(); return img; };
      const canvas = Object.assign(document.createElement('canvas'), { width: layout.canvas[0], height: layout.canvas[1] });
      const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(await load(layout.background), 0, 0, canvas.width, canvas.height);
      for (const sprite of layout.sprites) {
        const img = await load(sprite.source), [x, y, w, h] = sprite.crop;
        if (x < 0 || y < 0 || x + w > img.width || y + h > img.height) throw Error('Sprite crop outside image');
        const grid = Object.assign(document.createElement('canvas'), { width: Math.round(w / h * sprite.nativeHeight), height: sprite.nativeHeight });
        const pixels = grid.getContext('2d'); pixels.imageSmoothingEnabled = false;
        pixels.drawImage(img, x, y, w, h, 0, 0, grid.width, grid.height);
        ctx.drawImage(grid, sprite.x, sprite.y, grid.width * sprite.pixelScale, grid.height * sprite.pixelScale);
      }
      return canvas.toDataURL('image/png');
    }, composition);
    writeFileSync(join(root, 'art/scene.png'), Buffer.from(composed.split(',')[1], 'base64'));
    await page.locator('img').evaluate(async (img, source) => { img.src = source; await img.decode(); }, composed);
    assert(await page.evaluate(() => {
      const context = document.querySelector('canvas').getContext('2d');
      window.drawWeather(0);
      const start = context.getImageData(0, 0, 1660, 722).data;
      window.drawWeather(4);
      const end = context.getImageData(0, 0, 1660, 722).data;
      let difference = 0;
      for (let i = 0; i < end.length; i++) difference += Math.abs(end[i] - start[i]);
      return difference / end.length < .01;
    }), 'Weather must repeat within canvas rounding at the four-second boundary');
    await page.evaluate(() => document.querySelector('canvas').getContext('2d').clearRect(0, 0, 1660, 722));
    await page.screenshot({ path: join(root, 'assets/scene.png') });
    assert.equal(await page.locator('h1').innerText(), 'Tristan Morton');
    await page.locator('h1').evaluate(e => e.style.visibility = 'hidden');
    const backdrop = await page.screenshot();
    await page.locator('img').evaluate(e => e.style.visibility = 'hidden');
    await page.locator('canvas').evaluate(e => e.style.visibility = 'hidden');
    await page.locator('h1').evaluate(e => e.style.visibility = 'visible');
    const title = await page.screenshot({ omitBackground: true });
    await page.evaluate(async ([backdrop, title]) => {
      window.exportLayers = await Promise.all([backdrop, title].map(src => new Promise(resolve => {
        const image = new Image(); image.onload = () => resolve(image); image.src = 'data:image/png;base64,' + src;
      })));
      window.exportCanvas = Object.assign(document.createElement('canvas'), { width: 1660, height: 722 });
    }, [backdrop.toString('base64'), title.toString('base64')]);
    for (let i = 0; i < 100; i++) {
      const frame = await page.evaluate(t => {
        window.drawWeather(t);
        const context = window.exportCanvas.getContext('2d');
        context.drawImage(window.exportLayers[0], 0, 0);
        context.drawImage(document.querySelector('canvas'), 0, 0);
        context.drawImage(window.exportLayers[1], 0, 0);
        return window.exportCanvas.toDataURL('image/png').split(',')[1];
      }, i / 25);
      writeFileSync(join(frames, `${String(i).padStart(3, '0')}.png`), Buffer.from(frame, 'base64'));
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '25', '-i', join(frames, '%03d.png'), '-filter_complex', '[0:v]split[a][b];[a]palettegen=stats_mode=diff:reserve_transparent=0[p];[b][p]paletteuse=dither=none:diff_mode=rectangle', '-loop', '0', join(root, 'assets/scene.gif')], { stdio: 'inherit' });
  assert(statSync(join(root, 'assets/scene.gif')).size < 8_000_000, 'Animation exceeds 8 MB budget');
  writeFileSync(join(root, 'art/export.json'), JSON.stringify({ width: 1660, height: 722, frames: 100, fps: 25, loopSeconds: 4 }, null, 2) + '\n');
  console.log(`Exported static fallback and 100-frame GIF (${statSync(join(root, 'assets/scene.gif')).size} bytes). Temporary frames: ${frames}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
