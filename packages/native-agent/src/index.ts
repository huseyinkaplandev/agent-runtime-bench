import type { RunResult, Runtime, Turn } from '../../core/src/types.ts';

/**
 * The whole runtime: one loop, one switch. No graph, no framework.
 *
 * Everything the agent does is visible in this file, which is the argument
 * for this approach and also the reason it stops scaling once branching
 * gets real: the control flow is implicit in statement order.
 */
export const nativeRuntime: Runtime = {
  name: 'native-loop',

  async run({ scenario, prompt, model, tools, maxSteps }) {
    const started = performance.now();
    const byName = new Map(tools.map((tool) => [tool.name, tool]));
    const transcript: Turn[] = [{ role: 'user', content: prompt }];

    let modelCalls = 0;
    let toolCalls = 0;
    let toolFailures = 0;

    const finish = (
      resolution: RunResult['outcome']['resolution'],
      text: string,
    ): RunResult => ({
      outcome: { resolution, text },
      metrics: {
        runtime: 'native-loop',
        scenario,
        outcome: resolution,
        modelCalls,
        toolCalls,
        toolFailures,
        charsIn: model.charsIn(),
        wallMs: Math.round(performance.now() - started),
      },
      transcript,
    });

    for (let step = 0; step < maxSteps; step += 1) {
      modelCalls += 1;
      const decision = await model.next(transcript);

      if (decision.kind === 'final') {
        transcript.push({ role: 'assistant', content: decision.text });
        return finish('resolved', decision.text);
      }

      if (decision.kind === 'handoff') {
        transcript.push({ role: 'assistant', content: `handoff: ${decision.reason}` });
        return finish('handoff', decision.reason);
      }

      const tool = byName.get(decision.call.name);
      if (!tool) {
        return finish('crashed', `unknown tool: ${decision.call.name}`);
      }

      toolCalls += 1;
      const result = await tool.run(decision.call.args);
      if (!result.ok) toolFailures += 1;
      transcript.push({ role: 'tool', name: tool.name, result });
    }

    return finish('exhausted', `no resolution within ${maxSteps} steps`);
  },
};
