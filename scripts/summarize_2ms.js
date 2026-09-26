// Renders a markdown summary from a 2ms JSON report.
// Usage: node summarize_2ms.js <path-to-2ms.json>
// Writes to $GITHUB_STEP_SUMMARY when running inside GitHub Actions.
const fs = require('fs');

const reportPath = process.argv[2] || 'artifacts/2ms.json';

const sanitize = (s) => String(s == null ? '' : s)
  .replace(/[\r\n]+/g, ' ')
  .replace(/\|/g, '\\|')
  .replace(/`/g, "'");

// Reads a field using the first available key (JSON uses camelCase; console YAML uses lowercase).
const pick = (f, keys) => {
  if (!f) return '';
  for (const k of keys) {
    if (f[k] != null && f[k] !== '') return f[k];
  }
  return '';
};

// Like sanitize, but does not escape '|' (used for values inside inline code spans).
const cleanCode = (s) => String(s == null ? '' : s)
  .replace(/[\r\n]+/g, ' ')
  .replace(/`/g, "'");

const lines = [];

if (!fs.existsSync(reportPath)) {
  lines.push('## 2ms Secrets Scan Results');
  lines.push('');
  lines.push(':warning: No 2ms report was produced. Check the scan step logs.');
} else {
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

  const total = data.totalSecretsFound != null ? data.totalSecretsFound : findings.length;
  const scanned = data.totalItemsScanned != null ? data.totalItemsScanned : 0;

  const byRule = new Map();
  const bySev = new Map();
  const byFile = new Map();
  const byVal = new Map();

  for (const f of findings) {
    const rule = f.ruleName || '?';
    byRule.set(rule, (byRule.get(rule) || 0) + 1);

    const sev = f.severity || '?';
    bySev.set(sev, (bySev.get(sev) || 0) + 1);

    const src = f.source || '';
    const path = src.includes(':') ? src.slice(src.indexOf(':') + 1) : src;
    byFile.set(path, (byFile.get(path) || 0) + 1);

    let v = sanitize(f.value || '');
    if (v.length > 60) v = `${v.slice(0, 60)}...`;
    byVal.set(v, (byVal.get(v) || 0) + 1);
  }

  const sortDesc = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);

  lines.push('## 2ms Secrets Scan Results');
  lines.push('');
  if (total === 0) {
    lines.push(':white_check_mark: No secrets found.');
  } else {
    lines.push(`:warning: **${total} secret(s)** found across **${scanned}** scanned item(s).`);
  }
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Items scanned | ${scanned} |`);
  lines.push(`| Secrets found | ${total} |`);
  lines.push('');
  lines.push('### Findings by rule');
  lines.push('| Rule | Count |');
  lines.push('| --- | ---: |');
  for (const [k, c] of sortDesc(byRule)) lines.push(`| ${sanitize(k)} | ${c} |`);
  lines.push('');
  lines.push('### Findings by severity');
  lines.push('| Severity | Count |');
  lines.push('| --- | ---: |');
  for (const [k, c] of sortDesc(bySev)) lines.push(`| ${sanitize(k)} | ${c} |`);
  lines.push('');
  lines.push('### Findings by file');
  lines.push('| File | Count |');
  lines.push('| --- | ---: |');
  for (const [k, c] of sortDesc(byFile)) lines.push(`| \`${sanitize(k)}\` | ${c} |`);
  lines.push('');
  lines.push('### Detected secret values');
  lines.push('| Value | Count |');
  lines.push('| --- | ---: |');
  for (const [k, c] of sortDesc(byVal)) lines.push(`| \`${sanitize(k)}\` | ${c} |`);
  lines.push('');

  // Group findings by rule for the detailed listing.
  const grouped = new Map();
  for (const f of findings) {
    const ruleId = pick(f, ['ruleId', 'ruleid']) || pick(f, ['ruleName', 'rulename']) || '?';
    if (!grouped.has(ruleId)) grouped.set(ruleId, []);
    grouped.get(ruleId).push(f);
  }
  const ruleOrder = [...grouped.keys()].sort((a, b) => {
    const d = grouped.get(b).length - grouped.get(a).length;
    return d !== 0 ? d : a.localeCompare(b);
  });

  lines.push('## Detailed findings');
  lines.push('');
  let n = 0;
  for (const ruleId of ruleOrder) {
    const list = grouped.get(ruleId);
    const desc = list.length ? pick(list[0], ['ruleDescription', 'ruledescription']) : '';
    const heading = desc ? `${sanitize(ruleId)} — ${sanitize(desc)}` : sanitize(ruleId);
    lines.push(`### ${heading}`);
    list.sort((a, b) => {
      const sa = pick(a, ['source']);
      const sb = pick(b, ['source']);
      if (sa !== sb) return sa.localeCompare(sb);
      return (Number(pick(a, ['startLine', 'startline'])) || 0) - (Number(pick(b, ['startLine', 'startline'])) || 0);
    });
    for (const f of list) {
      n += 1;
      const id = pick(f, ['id']);
      const source = pick(f, ['source']);
      const sl = pick(f, ['startLine', 'startline']);
      const el = pick(f, ['endLine', 'endline']);
      let lc = cleanCode(pick(f, ['lineContent', 'linecontent']));
      if (lc.length > 160) lc = `${lc.slice(0, 160)}...`;
      lines.push(`${n}. **id:** \`${id}\``);
      lines.push(`   - **source:** \`${cleanCode(source)}\``);
      lines.push(`   - **startLine / endLine:** \`${sl}\` / \`${el}\``);
      lines.push(`   - **lineContent:** \`${lc}\``);
    }
    lines.push('');
  }
}

const text = `${lines.join('\n')}\n`;

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
}
process.stdout.write(text);
