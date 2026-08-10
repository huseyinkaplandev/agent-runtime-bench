import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runBench } from '../src/run.ts';

test('every runtime reaches the expected outcome on every scenario', async () => {
  const rows = await runBench();
  const wrong = rows.filter((row) => !row.correct);
  assert.deepEqual(
    wrong.map((row) => `${row.runtime}:${row.scenario}`),
    [],
  );
});

test('both runtimes agree on outcome, tool calls and model calls', async () => {
  const rows = await runBench();
  const byScenario = new Map<string, typeof rows>();
  for (const row of rows) {
    byScenario.set(row.scenario, [...(byScenario.get(row.scenario) ?? []), row]);
  }

  for (const [scenario, pair] of byScenario) {
    const [a, b] = pair;
    assert.ok(a && b, `${scenario}: expected one row per runtime`);
    assert.equal(a.outcome, b.outcome, `${scenario}: outcome diverged`);
    assert.equal(a.toolCalls, b.toolCalls, `${scenario}: tool calls diverged`);
    assert.equal(a.modelCalls, b.modelCalls, `${scenario}: model calls diverged`);
  }
});

test('a failing tool is retried once, then the run still resolves', async () => {
  const rows = (await runBench()).filter((row) => row.scenario === 'tool-fails-once');
  for (const row of rows) {
    assert.equal(row.toolFailures, 1, `${row.runtime}: expected exactly one tool failure`);
    assert.equal(row.outcome, 'resolved', `${row.runtime}: expected the retry to resolve`);
  }
});
