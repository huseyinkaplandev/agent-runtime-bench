import { SCENARIOS } from '@bench/core';
import type { RunMetrics, Runtime } from '@bench/core';
import { graphRuntime } from '@bench/graph-agent';
import { nativeRuntime } from '@bench/native-agent';

export const RUNTIMES: Runtime[] = [nativeRuntime, graphRuntime];
const MAX_STEPS = 8;

export type BenchRow = RunMetrics & { expected: string; correct: boolean };

export async function runBench(): Promise<BenchRow[]> {
  const rows: BenchRow[] = [];

  for (const scenario of SCENARIOS) {
    for (const runtime of RUNTIMES) {
      const model = scenario.model();
      model.reset();

      const result = await runtime.run({
        scenario: scenario.name,
        prompt: scenario.prompt,
        model,
        tools: scenario.tools(),
        maxSteps: MAX_STEPS,
      });

      rows.push({
        ...result.metrics,
        expected: scenario.expect,
        correct: result.outcome.resolution === scenario.expect,
      });
    }
  }

  return rows;
}

export type DetailedRun = {
  scenario: string;
  prompt: string;
  expected: string;
  runtime: string;
  outcome: string;
  correct: boolean;
  metrics: RunMetrics;
  transcript: unknown[];
};

/** Same execution as runBench, but keeps the transcripts for the UI. */
export async function runDetailed(): Promise<DetailedRun[]> {
  const runs: DetailedRun[] = [];

  for (const scenario of SCENARIOS) {
    for (const runtime of RUNTIMES) {
      const model = scenario.model();
      model.reset();

      const result = await runtime.run({
        scenario: scenario.name,
        prompt: scenario.prompt,
        model,
        tools: scenario.tools(),
        maxSteps: MAX_STEPS,
      });

      runs.push({
        scenario: scenario.name,
        prompt: scenario.prompt,
        expected: scenario.expect,
        runtime: runtime.name,
        outcome: result.outcome.resolution,
        correct: result.outcome.resolution === scenario.expect,
        metrics: result.metrics,
        transcript: result.transcript,
      });
    }
  }

  return runs;
}

export function toMarkdown(rows: BenchRow[]): string {
  const header =
    '| scenario | runtime | outcome | expected | correct | model calls | tool calls | tool failures | chars in |';
  const divider = '|---|---|---|---|---|---|---|---|---|';
  const body = rows.map(
    (row) =>
      `| ${row.scenario} | ${row.runtime} | ${row.outcome} | ${row.expected} | ${
        row.correct ? 'yes' : 'NO'
      } | ${row.modelCalls} | ${row.toolCalls} | ${row.toolFailures} | ${row.charsIn} |`,
  );
  return [header, divider, ...body].join('\n');
}
