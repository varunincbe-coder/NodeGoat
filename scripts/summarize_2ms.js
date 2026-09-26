// Renders a markdown summary from a 2ms JSON report.
// Usage: node summarize_2ms.js <path-to-2ms.json>
// Writes to $GITHUB_STEP_SUMMARY when running inside GitHub Actions.
const fs = require('fs');

const reportPath = process.argv[2] || 'artifacts/2ms.json';

const sanitize = (s) => String(s == null ? '' : s)
  .replace(/[\r\n]+/g, ' ')
  .replace(/\|/g, '\\|')
  .replace(/`/g, "'");

// Splits a 2ms "source" like "git show <commit>:<path>" into its parts.
const parseSource = (src) => {
  const s = String(src || '');
  const m = /^git show ([0-9a-f]+):(.+)$/.exec(s);
  if (m) return { commit: m[1], path: m[2] };
  const idx = s.indexOf(':');
  return idx >= 0 ? { commit: '', path: s.slice(idx + 1) } : { commit: '', path: s };
};

// Formats a finding's location as "startLine:startColumn-endLine:endColumn".
const formatLocation = (f) => {
  if (f.startLine == null) return '';
  let loc = `${f.startLine}:${f.startColumn != null ? f.startColumn : 0}`;
  if (f.endLine != null && (f.endLine !== f.startLine || f.endColumn !== f.startColumn)) {
    loc += `-${f.endLine}:${f.endColumn != null ? f.endColumn : 0}`;
  }
  return loc;
};

const shortHash = (s) => String(s == null ? '' : s).slice(0, 7);

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
    const rule = f.ruleName || '?';
    if (!grouped.has(rule)) grouped.set(rule, []);
    grouped.get(rule).push(f);
  }
  const ruleOrder = [...grouped.keys()].sort((a, b) => {
    const d = grouped.get(b).length - grouped.get(a).length;
    return d !== 0 ? d : a.localeCompare(b);
  });

  lines.push('## Detailed findings');
  lines.push('');
  let n = 0;
  for (const rule of ruleOrder) {
    const list = grouped.get(rule);
    const desc = (list[0] && list[0].ruleDescription) ? sanitize(list[0].ruleDescription) : '';
    lines.push(`### ${sanitize(rule)} (${list.length})`);
    if (desc) lines.push(`_${desc}_`);
    lines.push('| # | File | Commit | Line:Col | Secret value | Severity | CVSS |');
    lines.push('| --- | --- | --- | --- | --- | --- | ---: |');
    list.sort((a, b) => {
      const pa = parseSource(a.source).path;
      const pb = parseSource(b.source).path;
      if (pa !== pb) return pa.localeCompare(pb);
      return (a.startLine || 0) - (b.startLine || 0);
    });
    for (const f of list) {
      n += 1;
      const { commit, path } = parseSource(f.source);
      let val = sanitize(f.value || '');
      if (val.length > 60) val = `${val.slice(0, 60)}...`;
      const sev = sanitize(f.severity || '?');
      const cvss = f.cvssScore != null ? f.cvssScore : '';
      lines.push(`| ${n} | \`${sanitize(path)}\` | \`${shortHash(commit)}\` | ${formatLocation(f)} | \`${val}\` | ${sev} | ${cvss} |`);
    }
    lines.push('');
  }
}

const text = `${lines.join('\n')}\n`;

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
}
process.stdout.write(text);
