'use client';

import { ArrowClockwise, CheckCircle, Play, UserSwitch, Warning } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Turn =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }
  | { role: 'tool'; name: string; result: { ok: boolean; error?: string } };

type Run = {
  scenario: string;
  prompt: string;
  expected: string;
  runtime: string;
  outcome: string;
  correct: boolean;
  metrics: {
    modelCalls: number;
    toolCalls: number;
    toolFailures: number;
    charsIn: number;
    wallMs: number;
  };
  transcript: Turn[];
};

const SCENARIO_LABELS: Record<string, string> = {
  'happy-path-refund': 'Refund inside the policy window',
  'outside-policy-window': 'Refund outside the policy window',
  'tool-fails-once': 'Payment gateway times out once',
};

const RUNTIME_LABELS: Record<string, string> = {
  'native-loop': 'Native loop',
  langgraph: 'LangGraph',
};

function TurnRow({ turn }: { turn: Turn }) {
  if (turn.role === 'tool') {
    const failed = !turn.result.ok;
    return (
      <li className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2">
        {failed ? (
          <Warning size={16} weight="fill" className="mt-1 shrink-0 text-amber-400" />
        ) : (
          <CheckCircle size={16} weight="fill" className="mt-1 shrink-0 text-emerald-400" />
        )}
        <span className="font-[family-name:var(--font-geist-mono)] text-sm">
          {turn.name}
          {failed ? (
            <span className="text-amber-400"> failed: {turn.result.error}</span>
          ) : (
            <span className="text-ink-muted"> ok</span>
          )}
        </span>
      </li>
    );
  }

  const handoff = turn.role === 'assistant' && turn.content.startsWith('handoff');
  return (
    <li className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2">
      {handoff ? (
        <UserSwitch size={16} weight="fill" className="mt-1 shrink-0 text-sky-400" />
      ) : (
        <CheckCircle size={16} weight="fill" className="mt-1 shrink-0 text-emerald-400" />
      )}
      <span className="text-sm text-ink-muted text-pretty">{turn.content}</span>
    </li>
  );
}

function RuntimeColumn({ run, shown }: { run: Run; shown: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-1 p-3">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h4 className="text-base font-semibold">{RUNTIME_LABELS[run.runtime] ?? run.runtime}</h4>
        <span
          className={
            run.correct
              ? 'font-[family-name:var(--font-geist-mono)] text-xs text-emerald-400'
              : 'font-[family-name:var(--font-geist-mono)] text-xs text-amber-400'
          }
        >
          {run.outcome}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {run.transcript.slice(0, shown).map((turn, index) => (
          <TurnRow key={index} turn={turn} />
        ))}
      </ul>

      {shown >= run.transcript.length ? (
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
          <div>
            <dt className="text-xs text-ink-muted">model calls</dt>
            <dd className="font-[family-name:var(--font-geist-mono)] text-lg">
              {run.metrics.modelCalls}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">tool calls</dt>
            <dd className="font-[family-name:var(--font-geist-mono)] text-lg">
              {run.metrics.toolCalls}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">chars in</dt>
            <dd className="font-[family-name:var(--font-geist-mono)] text-lg">
              {run.metrics.charsIn}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

export function Runner() {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [shown, setShown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const longest = runs
    ? Math.max(...runs.map((run) => run.transcript.length))
    : 0;

  useEffect(() => {
    if (status !== 'running' || !runs) return;

    timer.current = setInterval(() => {
      setShown((current) => {
        if (current >= longest) {
          setStatus('done');
          return current;
        }
        return current + 1;
      });
    }, 420);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [status, runs, longest]);

  const run = useCallback(async () => {
    setStatus('running');
    setShown(0);
    setRuns(null);

    try {
      const response = await fetch('/api/bench', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      const data = (await response.json()) as { runs: Run[] };
      setRuns(data.runs);
    } catch {
      setStatus('error');
    }
  }, []);

  const scenarios = runs ? [...new Set(runs.map((item) => item.scenario))] : [];
  const agree =
    runs &&
    scenarios.every((scenario) => {
      const pair = runs.filter((item) => item.scenario === scenario);
      return (
        pair.length === 2 &&
        pair[0]!.outcome === pair[1]!.outcome &&
        pair[0]!.metrics.toolCalls === pair[1]!.metrics.toolCalls &&
        pair[0]!.metrics.modelCalls === pair[1]!.metrics.modelCalls
      );
    });

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={status === 'running' && !runs}
          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-base font-semibold text-black transition-all duration-700 ease-fluid hover:bg-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98] disabled:opacity-60"
        >
          {status === 'running' && !runs ? (
            <ArrowClockwise size={18} weight="bold" className="animate-spin" />
          ) : (
            <Play size={18} weight="fill" />
          )}
          {status === 'idle' ? 'Run the benchmark' : 'Run it again'}
        </button>

        <p className="text-sm text-ink-muted text-pretty">
          Both runtimes execute on the server when you press this. Nothing here is a recording.
        </p>
      </div>

      {status === 'error' ? (
        <p className="mt-4 rounded-xl border border-line bg-surface-1 px-3 py-2 text-sm text-amber-400">
          The benchmark did not run. Please try again.
        </p>
      ) : null}

      {!runs && status === 'idle' ? (
        <div className="mt-6 rounded-2xl border border-line bg-surface-1 p-6">
          <p className="text-base text-ink-muted text-pretty">
            Three scenarios are waiting: a refund inside the policy window, one outside it, and one
            where the payment gateway times out on the first attempt. Press run and both runtimes
            work through them step by step.
          </p>
        </div>
      ) : null}

      {runs ? (
        <div className="mt-6 flex flex-col gap-6">
          {scenarios.map((scenario) => {
            const pair = runs.filter((item) => item.scenario === scenario);
            const first = pair[0];
            if (!first) return null;

            return (
              <section key={scenario} className="rounded-3xl border border-line bg-surface-0 p-4">
                <header className="mb-3">
                  <h3 className="text-xl font-semibold text-balance">
                    {SCENARIO_LABELS[scenario] ?? scenario}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted text-pretty">
                    {first.prompt} Expected outcome: {first.expected}.
                  </p>
                </header>

                <div className="grid gap-3 md:grid-cols-2">
                  {pair.map((item) => (
                    <RuntimeColumn key={item.runtime} run={item} shown={shown} />
                  ))}
                </div>
              </section>
            );
          })}

          {status === 'done' && agree ? (
            <p className="rounded-2xl border border-line bg-surface-1 px-4 py-3 text-base text-pretty">
              Both runtimes reached the same outcome, with the same number of model calls and tool
              calls, in all three scenarios. The difference between them is not behaviour. It is 97
              lines against 50.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
