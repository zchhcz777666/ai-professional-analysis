const fs = require('fs');
const path = require('path');

const uniData = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
const nameRegex = /id:\s*'(\w+)'[^]*?name:\s*'([^']+)'/g;
let m;
const uniNameMap = {};
while ((m = nameRegex.exec(uniData)) !== null) {
  uniNameMap[m[1]] = m[2];
}

const gaokaoSchools = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'gaokao-school-map.json'), 'utf-8'));

// Build nameToId exactly as in the crawler
const nameToId = {};
Object.entries(uniNameMap).forEach(([id, name]) => {
  if (nameToId[name] && !id.endsWith('2')) {
    nameToId[name] = id;
  } else if (!nameToId[name]) {
    nameToId[name] = id;
  }
});

// For renamed schools
const extraMappings = {
  '福建理工大学': 'fjut',
  '湖州师范大学': 'hztc',
  '天水师范大学': 'tsnc',
  '绍兴大学': 'usx',
  '华北电力大学（北京）': 'ncepu',
  '华北电力大学（保定）': 'ncepubd',
  '哈尔滨工业大学（深圳）': 'hit_sz',
  '哈尔滨工业大学（威海）': 'hit_wh',
  '电子科技大学（沙河校区）': 'uestc_us',
  '中国矿业大学（北京）': 'cumtb',
  '中国石油大学（华东）': 'upc',
  '中国石油大学（北京）': 'cup',
};
Object.entries(extraMappings).forEach(([gkName, uniId]) => { nameToId[gkName] = uniId; });

// Verify key names
const tests = ['hust_wut', 'nuaa_cqu', 'scnu', 'hunnu'];
console.log('=== nameToId verification ===');
tests.forEach(id => {
  const name = uniNameMap[id];
  console.log(id + ' ("' + name + '") -> nameToId["' + name + '"] = "' + nameToId[name] + '"');
});

// Now build mapping
const gaokaoToUni = {};
let matched = 0;
gaokaoSchools.forEach(gs => {
  let uniId = nameToId[gs.name];
  if (!uniId) {
    const simple = gs.name.replace(/[（(].*?[）)]/g, '').trim();
    uniId = nameToId[simple];
  }
  if (uniId) {
    gaokaoToUni[String(gs.id)] = { uniId, name: gs.name };
    matched++;
  }
});

// Check specific schools
const specific = ['hust_wut', 'nuaa_cqu', 'scnu', 'hunnu', 'gxu', 'guet'];
console.log('\n=== Mapping check for specific IDs ===');
specific.forEach(id => {
  const found = Object.values(gaokaoToUni).find(v => v.uniId === id);
  console.log(id + ': ' + (found ? 'OK -> school_id=' + Object.keys(gaokaoToUni).find(k => gaokaoToUni[k] === found) : 'MISSING'));
});

// Direct lookup
console.log('\n=== Direct school_id lookup ===');
[128, 76, 98, 58, 96, 532].forEach(sid => {
  const entry = gaokaoToUni[String(sid)];
  console.log('school_id=' + sid + ': ' + (entry ? JSON.stringify(entry) : 'MISSING'));
});

// Manual fix: ensure all gaokao schools for our universities are in the map
console.log('\n=== Manual check ===');
const ourNames = Object.values(uniNameMap).filter(n => !n.endsWith('）'));
const unmatchedInGK = [];
gaokaoSchools.forEach(gs => {
  if (!nameToId[gs.name]) {
    // Check if any of our school names match
    const candidate = ourNames.find(n => gs.name === n || gs.name.replace(/[（(].*?[）)]/g, '').trim() === n);
    if (candidate) {
      unmatchedInGK.push({ gkId: gs.id, gkName: gs.name, matchedName: candidate });
    }
  }
});

if (unmatchedInGK.length > 0) {
  console.log('Schools in GK list but nameToId miss:');
  unmatchedInGK.forEach(x => console.log('  ' + x.gkId + ':' + x.gkName + ' (should match ' + x.matchedName + ')'));
}

// Save the mapping
const outFile = path.join(__dirname, 'crawled-data', 'gaokao-to-uni-mapping.json');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(gaokaoToUni, null, 2), 'utf-8');
console.log('\nSaved mapping (' + Object.keys(gaokaoToUni).length + ' entries)');
