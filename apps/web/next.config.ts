import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@bench/core', '@bench/bench', '@bench/native-agent', '@bench/graph-agent'],
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
};

export default config;
