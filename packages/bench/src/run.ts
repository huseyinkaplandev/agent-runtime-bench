import { SCENARIOS } from '../../core/src/scenario.ts';
import type { RunMetrics, Runtime } from '../../core/src/types.ts';
import { graphRuntime } from '../../graph-agent/src/index.ts';
import { nativeRuntime } from '../../native-agent/src/index.ts';

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
