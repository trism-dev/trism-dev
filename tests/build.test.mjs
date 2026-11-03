import test from 'node:test';
import assert from 'node:assert/strict';
import { renderReadme, featured, root, latestSection } from '../scripts/build.mjs';
import { readFileSync, statSync } from 'node:fs';

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
