import type { Model, ModelStep, Turn } from './types.ts';

type Rule = {
  when: (turns: readonly Turn[]) => boolean;
  then: ModelStep | ((turns: readonly Turn[]) => ModelStep);
};

/**
 * A scripted model. Same input, same output, every run, no network, no key.
 *
 * A real model would make this benchmark measure model variance instead of
 * runtime behaviour, and the numbers would move every time anyone reran it.
 * The rules below encode one fixed policy so the only variable left is the
 * runtime under test.
 */
export function scriptedModel(name: string, rules: Rule[], fallback: ModelStep): Model {
  let chars = 0;

  return {
    name,
    async next(turns) {
      chars += turns.reduce((sum, turn) => sum + JSON.stringify(turn).length, 0);
      const hit = rules.find((rule) => rule.when(turns));
      if (!hit) return fallback;
      return typeof hit.then === 'function' ? hit.then(turns) : hit.then;
    },
    charsIn: () => chars,
    reset() {
      chars = 0;
    },
  };
}

export function lastToolResult(turns: readonly Turn[], name: string) {
  for (let i = turns.length - 1; i >= 0; i -= 1) {
    const turn = turns[i];
    if (turn && turn.role === 'tool' && turn.name === name) return turn.result;
  }
  return undefined;
}

export function toolAttempts(turns: readonly Turn[], name: string) {
  return turns.filter((turn) => turn.role === 'tool' && turn.name === name).length;
}
