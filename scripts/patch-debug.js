const fs = require('fs');
let code = fs.readFileSync('scripts/fetch-eol-api.js', 'utf-8');
// Replace the main() call at the end
code = code.replace(
  "main().catch(err => { console.error('\\n错误:', err); process.exit(1); });",
  `
console.log('DEBUG: main() about to be called');
main().catch(err => { console.error('\\n错误:', err); process.exit(1); });
console.log('DEBUG: after main() call');
`
);
fs.writeFileSync('scripts/fetch-eol-api-debug.js', code, 'utf-8');
console.log('patched');
