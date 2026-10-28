#!/usr/bin/env node
'use strict';

const fs = require('fs');

const [baselinePath, currentPath] = process.argv.slice(2);

if (!baselinePath || !currentPath) {
  console.error('Usage: check-frontend-coverage.js <baseline.json> <current.json>');
  process.exit(1);
}

if (!fs.existsSync(baselinePath)) {
  console.log(`No baseline found at ${baselinePath} — skipping regression check.`);
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')).total;
const current = JSON.parse(fs.readFileSync(currentPath, 'utf8')).total;

const metrics = ['statements', 'branches', 'functions', 'lines'];
const regressions = [];

for (const metric of metrics) {
  const base = baseline[metric].pct;
  const cur = current[metric].pct;
  const delta = +(cur - base).toFixed(2);
  const sign = delta >= 0 ? '+' : '';
  console.log(`${metric.padEnd(12)} baseline=${base}%  current=${cur}%  delta=${sign}${delta}%`);
  if (cur < base) {
    regressions.push({ metric, base, cur, delta });
  }
}

if (regressions.length > 0) {
  console.error('\nCoverage regression detected:');
  for (const r of regressions) {
    console.error(`  ${r.metric}: ${r.base}% → ${r.cur}% (${r.delta}%)`);
  }
  process.exit(1);
}

console.log('\nNo coverage regression.');
