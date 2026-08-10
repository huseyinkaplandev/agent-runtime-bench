import { ArrowUpRight, GithubLogo, GraphIcon, Repeat } from '@phosphor-icons/react/dist/ssr';
import { Reveal } from '@/components/reveal';
import { Runner } from '@/components/runner';
import { TaglineReveal } from '@/components/tagline-reveal';

const REPO = 'https://github.com/huseyinkaplandev/agent-runtime-bench';

const BENEFITS = [
  {
    title: 'Identical behaviour, proven not asserted',
    body: 'Across three scenarios both runtimes reach the same outcome with the same number of model calls and tool calls. A test asserts it, so any future divergence is a real finding.',
  },
  {
    title: 'The graph costs 97 lines against 50',
    body: 'Same policy, same model, same evaluation. The only thing that changed is how control flow is expressed, and that is where the whole difference sits.',
  },
  {
    title: 'Deterministic by construction',
    body: 'The model is scripted, so the benchmark measures the runtime rather than model variance. No API key, no network, and the same numbers on every run.',
  },
];

const STEPS = [
  {
    title: 'One policy',
    body: 'Look up the order, check it against a 30 day refund window, refund or hand off to a human, and retry exactly once when the payment gateway times out.',
  },
  {
    title: 'Two runtimes',
    body: 'A loop written by hand with one switch statement, and a LangGraph state graph where every edge is declared up front as data.',
  },
  {
    title: 'One measurement',
    body: 'Model calls, tool calls, tool failures, characters sent and source size, collected per scenario and enforced in CI as a gate.',
  },
];

const FAQ = [
  {
    q: 'Why is the model scripted instead of live?',
    a: 'With a live model the numbers move on every run and the benchmark quietly turns into a measurement of model variance. The scripted model encodes one fixed policy, so the runtime is the only variable left.',
  },
  {
    q: 'Does this prove LangGraph is slower?',
    a: 'No. It measures architecture at one size, not throughput. Streaming, token cost under a real model, checkpointing and concurrency are all outside the scope of these three scenarios.',
  },
  {
    q: 'So when is a graph worth the extra code?',
    a: 'When branching becomes real: several terminal states, parallel branches, or a human in the loop pause that has to survive a process restart. At that point the implicit control flow of a loop is what breaks first.',
  },
  {
    q: 'What runs when I press the button?',
    a: 'A request hits a Node route that executes both runtimes, the real LangGraph graph included, and returns the transcripts. The page then walks through them step by step.',
  },
  {
    q: 'Can I reproduce these numbers?',
    a: 'Clone the repository and run npm test and npm run bench. The benchmark prints the same table you see here, and CI fails the build if any runtime stops reaching the expected outcome.',
  },
  {
    q: 'Who built this?',
    a: 'Huseyin Kaplan, a full stack and AI engineer in Istanbul who builds production LLM systems in TypeScript and Python.',
  },
];

export default function Page() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-24">
      <nav className="mx-auto mt-6 flex w-max items-center gap-3 rounded-full border border-line bg-surface-1/80 px-4 py-2 backdrop-blur-3xl">
        <span className="font-[family-name:var(--font-geist-mono)] text-sm">
          agent runtime bench
        </span>
        <a
          href={REPO}
          className="flex items-center gap-1 rounded-full bg-surface-3 px-3 py-1 text-sm font-semibold transition-all duration-700 ease-fluid hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
        >
          <GithubLogo size={16} weight="fill" />
          Source
        </a>
      </nav>

      <header className="mt-24 flex flex-col items-center text-center">
        <h1 className="heading-fade max-w-[680px] text-5xl font-semibold text-balance md:text-7xl">
          The same agent,
          <br />
          written twice
        </h1>

        <p className="mt-6 max-w-[680px] text-lg text-ink-muted text-pretty">
          A tool calling loop and a LangGraph state graph, running one refund policy against a
          deterministic model. Press run and watch both work through the same three scenarios.
        </p>

        <div className="mt-8 w-full">
          <Runner />
        </div>

        <p className="mt-8 font-[family-name:var(--font-geist-mono)] text-sm text-ink-muted">
          identical behaviour · 97 lines against 50 · benchmark gated in CI
        </p>
      </header>

      <Reveal className="mt-32">
        <TaglineReveal text="A framework opinion without a number attached is a preference. Run it yourself and the argument is over." />
      </Reveal>

      <section className="mt-32">
        <Reveal>
          <h2 className="text-3xl font-semibold text-balance md:text-4xl">
            What the measurement actually shows
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {BENEFITS.map((item, index) => (
            <Reveal key={item.title} delay={index * 80}>
              <article className="h-full rounded-2xl border border-line bg-surface-1 p-4">
                <h3 className="text-lg font-semibold text-balance">{item.title}</h3>
                <p className="mt-2 text-base text-ink-muted text-pretty">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-32">
        <Reveal>
          <h2 className="text-3xl font-semibold text-balance md:text-4xl">How it works</h2>
        </Reveal>

        <ol className="mt-8 grid gap-3 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} delay={index * 80}>
              <li className="h-full rounded-2xl border border-line bg-surface-1 p-4">
                <span className="font-[family-name:var(--font-geist-mono)] text-sm text-ink-muted">
                  0{index + 1}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-base text-ink-muted text-pretty">{step.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mt-32">
        <Reveal>
          <h2 className="text-3xl font-semibold text-balance md:text-4xl">Source size</h2>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-line bg-surface-1 p-6">
            <div>
              <div className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2 font-semibold">
                  <Repeat size={18} weight="bold" />
                  Native loop
                </span>
                <span className="font-[family-name:var(--font-geist-mono)]">50 lines</span>
              </div>
              <div className="mt-2 h-3 w-full rounded-full bg-surface-3">
                <div className="h-3 w-[51.5%] rounded-full bg-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2 font-semibold">
                  <GraphIcon size={18} weight="bold" />
                  LangGraph state graph
                </span>
                <span className="font-[family-name:var(--font-geist-mono)]">97 lines</span>
              </div>
              <div className="mt-2 h-3 w-full rounded-full bg-surface-3">
                <div className="h-3 w-full rounded-full bg-ink-muted" />
              </div>
            </div>

            <p className="text-base text-ink-muted text-pretty">
              Comments and blank lines excluded. At this size the loop wins and it is not close.
              What the graph buys does not appear in this chart: its edges are data, so the topology
              can be inspected, drawn and replayed without reading any node body. That is worth
              nothing at three steps and quite a lot at thirty.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mt-32">
        <Reveal>
          <h2 className="text-3xl font-semibold text-balance md:text-4xl">Questions</h2>
        </Reveal>

        <dl className="mt-8 flex flex-col gap-3">
          {FAQ.map((item, index) => (
            <Reveal key={item.q} delay={Math.min(index, 4) * 60}>
              <div className="rounded-2xl border border-line bg-surface-1 p-4">
                <dt className="text-lg font-semibold text-balance">{item.q}</dt>
                <dd className="mt-2 text-base text-ink-muted text-pretty">{item.a}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      <footer className="mt-32 flex flex-col items-center gap-4 border-t border-line pt-8 text-center">
        <a
          href={REPO}
          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-base font-semibold text-black transition-all duration-700 ease-fluid hover:bg-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
        >
          <GithubLogo size={18} weight="fill" />
          Read the source
          <ArrowUpRight size={16} weight="bold" />
        </a>

        <p className="text-sm text-ink-muted">
          Built by{' '}
          <a
            href="https://huseyinkaplan.dev"
            className="text-ink underline underline-offset-4 transition-colors duration-700 ease-fluid hover:text-ink-muted"
          >
            Huseyin Kaplan
          </a>{' '}
          ·{' '}
          <a
            href="https://www.linkedin.com/in/huseyin-kaplan/"
            className="text-ink underline underline-offset-4 transition-colors duration-700 ease-fluid hover:text-ink-muted"
          >
            LinkedIn
          </a>
        </p>
      </footer>
    </main>
  );
}
