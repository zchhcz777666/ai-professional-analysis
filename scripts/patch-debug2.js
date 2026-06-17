const fs = require('fs');
let code = fs.readFileSync('scripts/fetch-eol-api.js', 'utf-8');
// Add debug logging at key points
code = code.replace(
  "async function main() {",
  `async function main() {
  console.log('DEBUG: main start');
  try {`
);
code = code.replace(
  "main().catch(err => { console.error('\\n错误:', err); process.exit(1); });",
  `
main().then(() => console.log('DEBUG: main resolved')).catch(err => { console.error('\\n错误:', err.message); process.exit(1); });
setTimeout(() => { console.log('DEBUG: timeout - process still alive'); }, 5000);
`
);
// Close the try block
code = code.replace(
  "async function fetchScoreWithRetry(eolId, provId, year, retries = 5) {",
  `} catch(e) { console.error('DEBUG: main error:', e.message); throw e; }
}
async function fetchScoreWithRetry(eolId, provId, year, retries = 5) {`
);
fs.writeFileSync('scripts/fetch-eol-api-debug2.js', code, 'utf-8');
console.log('patched');
