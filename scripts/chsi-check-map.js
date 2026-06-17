const u = require('fs').readFileSync('src/data/universities.ts', 'utf-8');
const names = [...u.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
const map = JSON.parse(require('fs').readFileSync('scripts/crawled-data/chsi-school-map.json', 'utf-8'));
let found = 0, missing = [];
for (const n of names) {
  if (map[n]) found++;
  else missing.push(n);
}
console.log('Found:', found, '/', names.length);
console.log('Missing (' + missing.length + '):', missing.slice(0, 30));
