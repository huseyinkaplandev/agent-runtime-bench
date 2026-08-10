import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import type { ModelStep, RunResult, Runtime, Tool, Turn } from '../../core/src/types.ts';

/**
 * The same policy as native-loop, expressed as an explicit state graph.
 *
 * The extra ceremony buys one thing the loop cannot give you: the control
 * flow is data. `decide -> act -> decide` and every terminal edge is
 * declared up front and can be inspected, drawn or replayed without
 * reading the body of any node.
 */
const BenchState = Annotation.Root({
  transcript: Annotation<Turn[]>({
    reducer: (previous, next) => previous.concat(next),
    default: () => [],
  }),
  pending: Annotation<ModelStep | null>({
    reducer: (_previous, next) => next,
    default: () => null,
  }),
  resolution: Annotation<RunResult['outcome']['resolution'] | null>({
    reducer: (_previous, next) => next,
    default: () => null,
  }),
  text: Annotation<string>({
    reducer: (_previous, next) => next,
    default: () => '',
  }),
  steps: Annotation<number>({
    reducer: (previous, next) => previous + next,
    default: () => 0,
  }),
});

export const graphRuntime: Runtime = {
  name: 'langgraph',

  async run({ scenario, prompt, model, tools, maxSteps }) {
    const started = performance.now();
    const byName = new Map<string, Tool>(tools.map((tool) => [tool.name, tool]));

    let modelCalls = 0;
    let toolCalls = 0;
    let toolFailures = 0;

    const graph = new StateGraph(BenchState)
      .addNode('decide', async (state) => {
        modelCalls += 1;
        const decision = await model.next(state.transcript);
        return { pending: decision, steps: 1 };
      })
      .addNode('act', async (state) => {
        const decision = state.pending;
        if (decision?.kind !== 'tool_call') return {};

        const tool = byName.get(decision.call.name);
        if (!tool) {
          return { resolution: 'crashed' as const, text: `unknown tool: ${decision.call.name}` };
        }

        toolCalls += 1;
        const result = await tool.run(decision.call.args);
        if (!result.ok) toolFailures += 1;
        return { transcript: [{ role: 'tool' as const, name: tool.name, result }] };
      })
      .addNode('settle', async (state) => {
        const decision = state.pending;
        if (decision?.kind === 'final') {
          return {
            resolution: 'resolved' as const,
            text: decision.text,
            transcript: [{ role: 'assistant' as const, content: decision.text }],
          };
        }
        if (decision?.kind === 'handoff') {
          return {
            resolution: 'handoff' as const,
            text: decision.reason,
            transcript: [{ role: 'assistant' as const, content: `handoff: ${decision.reason}` }],
          };
        }
        return { resolution: 'exhausted' as const, text: `no resolution within ${maxSteps} steps` };
      })
      .addEdge(START, 'decide')
      .addConditionalEdges('decide', (state) => {
        if (state.steps > maxSteps) return 'settle';
        return state.pending?.kind === 'tool_call' ? 'act' : 'settle';
      })
      .addConditionalEdges('act', (state) => (state.resolution ? 'settle' : 'decide'))
      .addEdge('settle', END)
      .compile();

    const final = await graph.invoke(
      { transcript: [{ role: 'user', content: prompt }] },
      { recursionLimit: maxSteps * 4 },
    );

    const resolution = final.resolution ?? 'exhausted';
    return {
      outcome: { resolution, text: final.text },
      metrics: {
        runtime: 'langgraph',
        scenario,
        outcome: resolution,
        modelCalls,
        toolCalls,
        toolFailures,
        charsIn: model.charsIn(),
        wallMs: Math.round(performance.now() - started),
      },
      transcript: final.transcript,
    };
  },
};
