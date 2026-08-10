import { runDetailed } from '@bench/bench';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Runs the real benchmark on request. Both runtimes execute here, including
 * the actual LangGraph state graph, so what the page shows is an execution
 * and not a recording.
 */
export async function GET() {
  const started = performance.now();
  const runs = await runDetailed();

  return Response.json({
    runs,
    serverMs: Math.round(performance.now() - started),
  });
}
