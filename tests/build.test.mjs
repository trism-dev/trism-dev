import test from 'node:test';
import assert from 'node:assert/strict';
import { renderReadme, featured, root, latestSection, plaque } from '../scripts/build.mjs';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('native README keeps readable content and supported motion fallback', () => {
  const readme = readFileSync(root + 'README.md', 'utf8').replaceAll('\r\n', '\n');
  const output = renderReadme(latestSection(readme));
  assert(output.includes('alt="Tristan Morton.'));
  assert(!output.includes('# Tristan Morton'));
  assert(!output.includes('[trism-dev]'));
  assert(output.indexOf('## Latest projects') < output.indexOf('## Featured projects'));
  assert(output.includes('(prefers-reduced-motion: reduce)'));
  assert.equal((output.match(/<details/g) || []).length, 3);
  for (const p of featured) {
    assert(output.includes(p.text));
    assert(output.includes(`https://github.com/trism-dev/${p.repo}`));
  }
  assert(!/<script|<style|<canvas|2027|internship availability|Matter:/.test(output));
  assert.equal(output, readme);
});

test('navigation uses portfolio/repositories and every featured project has a plaque', () => {
  const output = renderReadme();
  assert(output.includes('href="https://portfolio-site-trism2.vercel.app"'));
  assert(output.includes('alt="Portfolio Website"'));
  assert(output.includes('alt="Repositories"'));
  for (const project of featured) {
    assert(output.includes(`assets/featured-${project.repo}.svg`));
    assert(readFileSync(root + `assets/featured-${project.repo}.svg`, 'utf8').includes(project.name));
  }
});

test('shared prism plaques retain accessible names, safe labels and fixed geometry', () => {
  const svg = plaque('a<&"repo');
  assert(svg.includes('width="400" height="58"'));
  assert(svg.includes('aria-label="a&lt;&amp;&quot;repo"'));
  assert(svg.includes('url(#prism)'));
  for (const color of ['#66dedb', '#b49ae9', '#f1c580']) assert(svg.includes(color));
  assert(!svg.includes('<&"repo'));
  assert(plaque('x'.repeat(60)).includes('x'.repeat(34) + '…'));
  assert(renderReadme().includes('Prism Spellblade rests with a steaming mug'));
});

test('project plaques align outside native disclosure markers and navigation fills its row', () => {
  const output = renderReadme();
  assert.equal((output.match(/width="50%"/g) || []).length, 2);
  assert(!output.includes('</a>\n  <a'));
  assert([...output.matchAll(/<summary>(.*?)<\/summary>/gs)].every(match => !match[1].includes('<img')));
  for (const project of featured) {
    assert(output.includes(`<a href="https://github.com/trism-dev/${project.repo}"><img src="assets/featured-${project.repo}.svg" width="330"`));
  }
});

test('exported images have valid headers, dimensions and bounded size', () => {
  const png = readFileSync(root + 'assets/scene.png');
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1660);
  assert.equal(png.readUInt32BE(20), 722);
  const gif = readFileSync(root + 'assets/scene.gif');
  assert.equal(gif.subarray(0, 6).toString(), 'GIF89a');
  assert.equal(gif.readUInt16LE(6), 1660);
  assert.equal(gif.readUInt16LE(8), 722);
  assert(statSync(root + 'assets/scene.gif').size < 8_000_000);
});

test('scene uses separate reusable sprites with an explicit integer pixel grid', () => {
  const layout = JSON.parse(readFileSync(root + 'art/layers.json', 'utf8'));
  assert.deepEqual(layout.canvas, [1920, 819]);
  assert.equal(layout.sprites.length, 2);
  assert.equal(layout.background, 'art/layers/background.png');
  for (const sprite of layout.sprites) {
    assert(readFileSync(root + sprite.file).subarray(1, 4).toString() === 'PNG');
    assert(sprite.crop.every(Number.isInteger));
    assert.equal(sprite.pixelScale, 4);
    assert(Number.isInteger(sprite.nativeHeight) && sprite.nativeHeight >= 72);
    assert.equal(sprite.y + sprite.nativeHeight * sprite.pixelScale, 744, 'Both sprites contact the floor');
  }
});

test('scene keeps the approved v2 benchmark sprites without resampling', () => {
  const layout = JSON.parse(readFileSync(root + 'art/layers.json', 'utf8'));
  const approved = [
    [28, 74, '2c82eb6630a0ea472b64a34b6c39bb46765c1b8782adb41fa1903ccae8e447f4'],
    [88, 100, '8df979a86f62086961c9f8153224c794c24837c4c477235ee1946bddbf237476'],
  ];
  layout.sprites.forEach((sprite, i) => {
    const [width, height, hash] = approved[i], png = readFileSync(root + sprite.file);
    assert.equal(createHash('sha256').update(png).digest('hex'), hash);
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
    assert.deepEqual(sprite.crop, [0, 0, width, height]);
    assert.equal(sprite.nativeHeight, height);
  });
});

test('GIF contains 100 evenly timed 40ms frames', () => {
  const gif = readFileSync(root + 'assets/scene.gif');
  let offset = 13 + (gif[10] & 128 ? 3 * 2 ** ((gif[10] & 7) + 1) : 0);
  const delays = [];
  let frames = 0;
  while (gif[offset] !== 0x3b) {
    assert(offset < gif.length, 'GIF terminator missing');
    const block = gif[offset++];
    if (block === 0x21) {
      if (gif[offset++] === 0xf9) delays.push(gif.readUInt16LE(offset + 2));
    } else {
      assert.equal(block, 0x2c, 'unknown GIF block');
      const packed = gif[offset + 8];
      offset += 9 + (packed & 128 ? 3 * 2 ** ((packed & 7) + 1) : 0);
      offset++;
      frames++;
    }
    while (gif[offset]) offset += gif[offset] + 1;
    offset++;
  }
  assert.equal(frames, 100);
  assert.equal(delays.length, frames);
  assert(delays.every(delay => delay === 4));
});
