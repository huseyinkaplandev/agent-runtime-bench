export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export type ToolCall = {
  name: string;
  args: Record<string, unknown>;
};

export type Tool = {
  name: string;
  description: string;
  run: (args: Record<string, unknown>) => Promise<ToolResult>;
};

export type ModelStep =
  | { kind: 'tool_call'; call: ToolCall }
  | { kind: 'final'; text: string }
  | { kind: 'handoff'; reason: string };

export type Turn =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }
  | { role: 'tool'; name: string; result: ToolResult };

/**
 * The model contract both runtimes share. Keeping this narrow is the point:
 * if one runtime needs a wider contract to work, that is a finding, not an
 * implementation detail.
 */
export type Model = {
  name: string;
  next: (turns: readonly Turn[]) => Promise<ModelStep>;
  /** Characters sent to the model so far. Stands in for tokens; see README. */
  charsIn: () => number;
  reset: () => void;
};

export type RunOutcome = {
  resolution: 'resolved' | 'handoff' | 'exhausted' | 'crashed';
  text: string;
};

export type RunMetrics = {
  runtime: string;
  scenario: string;
  outcome: RunOutcome['resolution'];
  modelCalls: number;
  toolCalls: number;
  toolFailures: number;
  charsIn: number;
  wallMs: number;
};

export type RunResult = {
  outcome: RunOutcome;
  metrics: RunMetrics;
  transcript: Turn[];
};

export type Runtime = {
  name: string;
  run: (input: {
    scenario: string;
    prompt: string;
    model: Model;
    tools: Tool[];
    maxSteps: number;
  }) => Promise<RunResult>;
};
