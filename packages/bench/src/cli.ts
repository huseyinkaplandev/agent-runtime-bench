import { writeFileSync } from 'node:fs';
import { runBench, toMarkdown } from './run.ts';

const rows = await runBench();
const table = toMarkdown(rows);

console.log(table);

const failures = rows.filter((row) => !row.correct);
if (process.argv.includes('--json')) {
  writeFileSync('bench-report.json', JSON.stringify(rows, null, 2));
}

if (failures.length > 0) {
  console.error(`\n${failures.length} run(s) did not reach the expected outcome.`);
  process.exit(1);
}
