import { lastToolResult, scriptedModel, toolAttempts } from './model.ts';
import type { Model, Tool, Turn } from './types.ts';

export type Scenario = {
  name: string;
  prompt: string;
  /** What a correct runtime must end with. */
  expect: 'resolved' | 'handoff';
  tools: () => Tool[];
  model: () => Model;
};

type OrderRecord = { id: string; total: number; daysSincePurchase: number };

const ORDERS: Record<string, OrderRecord> = {
  'A-1042': { id: 'A-1042', total: 240, daysSincePurchase: 9 },
  'A-2098': { id: 'A-2098', total: 240, daysSincePurchase: 61 },
};

/** Refunds are automatic under 30 days, and a human decision after that. */
function policyTools(failFirstRefund: boolean): Tool[] {
  let refundCalls = 0;

  return [
    {
      name: 'lookup_order',
      description: 'Fetch an order by id.',
      async run(args) {
        const order = ORDERS[String(args.orderId)];
        return order ? { ok: true, data: order } : { ok: false, error: 'order_not_found' };
      },
    },
    {
      name: 'check_refund_policy',
      description: 'Decide whether an order is auto-refundable.',
      async run(args) {
        const days = Number(args.daysSincePurchase);
        return { ok: true, data: { autoRefundable: days <= 30, windowDays: 30 } };
      },
    },
    {
      name: 'issue_refund',
      description: 'Issue a refund for an order.',
      async run(args) {
        refundCalls += 1;
        if (failFirstRefund && refundCalls === 1) {
          return { ok: false, error: 'payment_gateway_timeout' };
        }
        return { ok: true, data: { refunded: true, orderId: String(args.orderId) } };
      },
    },
  ];
}

function orderIdFrom(turns: readonly Turn[]) {
  const user = turns.find((turn) => turn.role === 'user');
  const match = user && 'content' in user ? user.content.match(/A-\d+/) : null;
  return match ? match[0] : '';
}

function orderFrom(turns: readonly Turn[]): OrderRecord | undefined {
  const result = lastToolResult(turns, 'lookup_order');
  return result?.ok === true ? (result.data as OrderRecord) : undefined;
}

/**
 * One policy, expressed once, shared by both runtimes:
 *   look up the order -> check the policy -> refund, or hand off to a human.
 *   a failed refund is retried exactly once, then handed off.
 */
function policyModel() {
  return scriptedModel(
    'scripted-support-v1',
    [
      {
        when: (turns) => lastToolResult(turns, 'lookup_order') === undefined,
        then: (turns) => ({
          kind: 'tool_call',
          call: { name: 'lookup_order', args: { orderId: orderIdFrom(turns) } },
        }),
      },
      {
        when: (turns) => {
          const order = lastToolResult(turns, 'lookup_order');
          return order?.ok === true && lastToolResult(turns, 'check_refund_policy') === undefined;
        },
        then: (turns) => ({
          kind: 'tool_call',
          call: {
            name: 'check_refund_policy',
            args: { daysSincePurchase: orderFrom(turns)?.daysSincePurchase },
          },
        }),
      },
      {
        when: (turns) => {
          const policy = lastToolResult(turns, 'check_refund_policy');
          return (
            policy?.ok === true &&
            (policy.data as { autoRefundable: boolean }).autoRefundable === false
          );
        },
        then: { kind: 'handoff', reason: 'outside_refund_window' },
      },
      {
        when: (turns) =>
          toolAttempts(turns, 'issue_refund') >= 2 &&
          lastToolResult(turns, 'issue_refund')?.ok !== true,
        then: { kind: 'handoff', reason: 'refund_failed_twice' },
      },
      {
        when: (turns) => {
          const policy = lastToolResult(turns, 'check_refund_policy');
          const refund = lastToolResult(turns, 'issue_refund');
          return policy?.ok === true && refund?.ok !== true;
        },
        then: (turns) => ({
          kind: 'tool_call',
          call: { name: 'issue_refund', args: { orderId: orderFrom(turns)?.id } },
        }),
      },
      {
        when: (turns) => lastToolResult(turns, 'issue_refund')?.ok === true,
        then: { kind: 'final', text: 'Refund issued.' },
      },
    ],
    { kind: 'handoff', reason: 'no_rule_matched' },
  );
}

export const SCENARIOS: Scenario[] = [
  {
    name: 'happy-path-refund',
    prompt: 'Order A-1042 arrived damaged. I want a refund.',
    expect: 'resolved',
    tools: () => policyTools(false),
    model: policyModel,
  },
  {
    name: 'outside-policy-window',
    prompt: 'Order A-2098 arrived damaged. I want a refund.',
    expect: 'handoff',
    tools: () => policyTools(false),
    model: policyModel,
  },
  {
    name: 'tool-fails-once',
    prompt: 'Order A-1042 arrived damaged. I want a refund.',
    expect: 'resolved',
    tools: () => policyTools(true),
    model: policyModel,
  },
];
