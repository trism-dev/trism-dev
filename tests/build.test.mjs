import test from 'node:test';
import assert from 'node:assert/strict';
import { renderReadme, featured, root } from '../scripts/build.mjs';
import { readFileSync, statSync } from 'node:fs';

test('native README keeps readable content and supported motion fallback', () => {
  const output = renderReadme();
  assert(output.includes('# Tristan Morton'));
  assert(output.indexOf('## Latest projects') < output.indexOf('## Featured projects'));
  assert(output.includes('(prefers-reduced-motion: reduce)'));
  assert.equal((output.match(/<details/g) || []).length, 3);
  for (const p of featured) {
    assert(output.includes(p.text));
    assert(output.includes(`https://github.com/trism-dev/${p.repo}`));
  }
  assert(!/<script|<style|<canvas|2027|internship availability|Matter:/.test(output));
  assert.equal(output, readFileSync(root + 'README.md', 'utf8'));
});

test('exported images have valid headers, dimensions and bounded size', () => {
  const png = readFileSync(root + 'assets/scene.png');
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 830);
  assert.equal(png.readUInt32BE(20), 361);
  const gif = readFileSync(root + 'assets/scene.gif');
  assert.equal(gif.subarray(0, 6).toString(), 'GIF89a');
  assert.equal(gif.readUInt16LE(6), 830);
  assert.equal(gif.readUInt16LE(8), 361);
  assert(statSync(root + 'assets/scene.gif').size < 8_000_000);
});
