# agent-runtime-bench

**[Run it live →](https://agent-runtime-bench.vercel.app)** — press one button and both runtimes
execute on the server, step by step, in front of you. Nothing on that page is a recording.

**Follow-up:** [decision-bench](https://github.com/huseyinkaplandev/decision-bench) takes this agent's
refund decision to real models: a chat model answering in JSON, the same model with a strict schema,
and a decision model that returns a probability. [Move the threshold yourself](https://huseyinkaplan.dev/lab/decision-bench/).

Two agent runtimes, one policy, one deterministic model, three scenarios. Same task, measured
side by side: a hand-written tool-calling loop versus an explicit LangGraph state graph.

This exists because "we use LangGraph" and "we use native tool calling" are both answers you
can give in an interview, and only one of them is worth anything without a number behind it.

## The question

I build production agents with native tool calling. That is a defensible position only if I
can say what the alternative costs. So I implemented the same support-refund policy twice and
measured the difference instead of arguing about it.

## Setup

The task is deliberately boring and neutral: a customer asks for a refund, and the agent must

1. look up the order,
2. check it against a 30-day refund policy,
3. issue the refund, or hand off to a human,
4. and when the payment gateway fails, retry exactly once before handing off.

Three scenarios cover the happy path, the policy rejection and the transient tool failure.

**The model is scripted, not live.** A real model would make this benchmark measure model
variance rather than runtime behaviour, and the numbers would move on every rerun. The
scripted model in `packages/core/src/model.ts` encodes one fixed policy, so the only variable
left is the runtime under test. No API key, no network, runs in CI.

## Results

Reproduce with `npm run bench`.

| scenario | runtime | outcome | expected | correct | model calls | tool calls | tool failures | chars in |
|---|---|---|---|---|---|---|---|---|
| happy-path-refund | native-loop | resolved | resolved | yes | 4 | 3 | 0 | 967 |
| happy-path-refund | langgraph | resolved | resolved | yes | 4 | 3 | 0 | 967 |
| outside-policy-window | native-loop | handoff | handoff | yes | 3 | 2 | 0 | 567 |
| outside-policy-window | langgraph | handoff | handoff | yes | 3 | 2 | 0 | 567 |
| tool-fails-once | native-loop | resolved | resolved | yes | 5 | 4 | 1 | 1454 |
| tool-fails-once | langgraph | resolved | resolved | yes | 5 | 4 | 1 | 1454 |

Runtime source size, excluding comments and blank lines:

| runtime | lines |
|---|---|
| native-loop | 50 |
| langgraph | 97 |

## What the numbers say

**Behaviourally the two are identical.** Same outcome, same model calls, same tool calls, same
characters sent, on all three scenarios. There is a test that asserts this
(`both runtimes agree on outcome, tool calls and model calls`) and it is the most useful test
in the repo: it means any future difference is a real difference, not noise.

**The graph costs 94% more code** for this task — 97 lines against 50. At three steps and one
retry, the loop wins on every axis a reviewer can see.

**The graph buys something the table cannot show.** In the loop, control flow is implicit in
statement order; you learn what the agent can do by reading the body. In the graph, the edges
are declared data — `decide -> act -> decide`, plus every terminal edge — so the topology can
be inspected, drawn and replayed without reading any node body. That is worth nothing at three
steps and quite a lot at thirty, or when someone else has to own it.

## The trade-off, stated plainly

For a linear tool-calling flow with a single retry, the loop is the right call: half the code,
identical behaviour, and everything the agent does is visible in one file. I would reach for
the graph when branching becomes real — several terminal states, parallel branches,
human-in-the-loop pauses that need to survive a process restart — because at that point the
loop's implicit control flow becomes the thing that breaks, and durable state and inspectable
topology stop being ceremony.

This benchmark measures architecture, not throughput. It does not test streaming, token cost
under a real model, checkpointing or concurrency, and it should not be read as a general
"LangGraph is slower" claim. It is a controlled comparison of one policy at one size.

## Layout

Turborepo workspace, TypeScript, no build step — Node's native type stripping runs the
sources directly.

```
apps/
  web/           Next.js demo: runs both runtimes on request and replays the transcripts
packages/
  core/          types, scripted model, tools, the three scenarios
  native-agent/  the loop
  graph-agent/   the LangGraph state graph
  bench/         runner, markdown/JSON report, tests
```

The demo is not a static page with the numbers pasted in. `GET /api/bench` executes both
runtimes on a Node runtime, LangGraph included, and returns the transcripts the page walks
through.

## Run it

```bash
npm install
npm test          # 3 tests, including the runtime-agreement assertion
npm run bench     # prints the table above; --json writes bench-report.json
npm run typecheck
```

CI runs typecheck, tests and the benchmark on every push. The benchmark is a gate, not a
report: if a runtime stops reaching the expected outcome, the build fails.
