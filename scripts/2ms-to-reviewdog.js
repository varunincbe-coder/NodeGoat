// Converts a 2ms JSON report into reviewdog errorformat lines.
// Usage: node 2ms-to-reviewdog.js <path-to-2ms-report.json>
// Output (one per finding): file:line:column:message
const fs = require('fs');

const reportPath = process.argv[2] || 'artifacts/2ms.json';

if (!fs.existsSync(reportPath)) {
  process.exit(0); // no report -> no findings
}

const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const raw = data.results || {};
const findings = [];
if (Array.isArray(raw)) {
  findings.push(...raw);
} else {
  for (const arr of Object.values(raw)) {
    if (Array.isArray(arr)) findings.push(...arr);
    else findings.push(arr);
  }
}

// Strips the "git show <commit>:" prefix used by the git plugin.
const fileOf = (src) => {
  const s = String(src || '');
  const m = /^git show [0-9a-f]+:(.+)$/.exec(s);
  if (m) return m[1];
  const idx = s.indexOf(':');
  return idx >= 0 ? s.slice(idx + 1) : s;
};

for (const f of findings) {
  const file = fileOf(f.source);
  const line = f.startLine != null ? f.startLine : 0;
  const col = f.startColumn != null ? f.startColumn : 0;
  const value = String(f.value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 80);
  const desc = String(f.ruleDescription || '').replace(/[\r\n]+/g, ' ').trim();
  const message = `${f.ruleName || 'Secret'}: ${value}${desc ? ' — ' + desc : ''}`;
  process.stdout.write(`${file}:${line}:${col}:${message}\n`);
}
