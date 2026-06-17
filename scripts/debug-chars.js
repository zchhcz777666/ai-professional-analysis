const fs = require('fs');
const path = require('path');

// 读取数据
const uniData = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
const nameRegex = /id:\s*'(\w+)'[^]*?name:\s*'([^']+)'/g;
let m;
const uniNameMap = {};
while ((m = nameRegex.exec(uniData)) !== null) {
  uniNameMap[m[1]] = m[2];
}

const gaokaoSchools = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'gaokao-school-map.json'), 'utf-8'));

// 检查关键字学校
const check = ['hust_wut', 'scnu', 'nuaa_cqu', 'hunnu', 'gxu', 'ynu', 'guet', 'nepu', 'zzu', 'henu', 'cqjtu', 'hebust', 'sxu', 'xju', 'hainanu', 'tibetu'];

console.log('=== 逐个字节检查 ===\n');

check.forEach(id => {
  const ourName = uniNameMap[id];
  if (!ourName) {
    console.log(id + ': NOT IN uniNameMap');
    return;
  }
  
  // 在 gaokao 列表中查找
  const found = gaokaoSchools.filter(s => s.name === ourName);
  
  console.log(id + ' ("' + ourName + '")');
  console.log('  Name length:', ourName.length, 'characters');
  console.log('  Char codes:', [...ourName].map(c => c.charCodeAt(0)));
  
  if (found.length > 0) {
    console.log('  MATCHED in gaokao! id=' + found[0].id);
  } else {
    // Try fuzzy
    const fuzzy = gaokaoSchools.filter(s => s.name.includes(ourName[0]));
    console.log('  NOT MATCHED directly');
    // Check if nameToId works
    const nameToId = {};
    Object.entries(uniNameMap).forEach(([i, n]) => { nameToId[n] = i; });
    const lookupResult = nameToId[ourName];
    console.log('  nameToId["' + ourName + '"] =', lookupResult);
    
    // Try exact gaokao name search
    const gaokaoFound = gaokaoSchools.find(s => s.name.includes(ourName.substring(0, 2)));
    console.log('  gaokao sample with first 2 chars:', gaokaoFound ? gaokaoFound.name : 'none');
    
    // Show unicode comparison
    if (gaokaoFound) {
      console.log('  Our:', [...ourName].map(c => c.charCodeAt(0)));
      console.log('  GK:', [...gaokaoFound.name].map(c => c.charCodeAt(0)));
    }
  }
});

console.log('\n=== nameToId 快照（部分） ===');
const nameToId = {};
Object.entries(uniNameMap).forEach(([i, n]) => { nameToId[n] = i; });
const snapshotKeys = Object.keys(nameToId).filter(k => k.includes('理工') || k.includes('师范') || k.includes('大学'));
snapshotKeys.forEach(k => console.log('  "' + k + '" -> ' + nameToId[k]));
