import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Maps input enabled only in preview or local development', async () => {
  const previous = process.env.VERCEL_ENV;
  try {
    for (const environment of ['production','preview']) {
      process.env.VERCEL_ENV = environment;
      const {default: config} = await import(`../next.config.ts?environment=${environment}`);
      assert.equal(config.env.NEXT_PUBLIC_MAPS_INPUT_ENABLED, environment === 'preview' ? 'true' : 'false');
    }
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});

test('creation and editing gate only Maps inputs; saved links stay intact', () => {
  const source=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
  assert(source.includes('{MAPS_INPUT_ENABLED && <><div className="maps-input">'));
  assert(source.includes('{MAPS_INPUT_ENABLED && <label className="field full"><span>Lien Google Maps'));
  assert(source.includes('mapsUrl: place.mapsUrl.trim()'));
});
