const fs = require('fs');
const path = require('path');

// 未匹配的33所学校
const unmatched = ['bjut', 'ccsu', 'cqjtu', 'fjut', 'fzu', 'gsu', 'guet', 'gxu', 'hainanu', 'hbut', 'hebust', 'henu', 'hunnu', 'hust_wut', 'hztc', 'jxnu', 'ncepu', 'nchu', 'nepu', 'nuaa_cqu', 'nudt', 'nxu', 'scnu', 'sxu', 'tibetu', 'tsnc', 'uestc_us', 'usx', 'xaut', 'xju', 'ynu', 'zhku', 'zzu'];

// 读取学校名称映射
const uniData = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
const nameRegex = /id:\s*'(\w+)'[^]*?name:\s*'([^']+)'/g;
let m;
const uniNameMap = {};
while ((m = nameRegex.exec(uniData)) !== null) {
  uniNameMap[m[1]] = m[2];
}

// 读取 gaokao 学校列表
const gaokaoSchools = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'gaokao-school-map.json'), 'utf-8'));

console.log('=== 未匹配学校的可能名称 ===\n');
unmatched.forEach(id => {
  const ourName = uniNameMap[id];
  if (!ourName) {
    console.log(id + ': 系统中未找到');
    return;
  }
  
  // 在 gaokao 学校列表中模糊搜索
  const candidates = gaokaoSchools.filter(s => {
    // 直接包含关系
    return s.name.includes(ourName) || ourName.includes(s.name) ||
           ourName.replace(/[大学学院]/g, '').includes(s.name.replace(/[大学学院]/g, ''));
  }).map(s => ({ id: s.school_id, name: s.name }));
  
  console.log(id + ' (系统中: ' + ourName + ')');
  if (candidates.length > 0) {
    console.log('  可能匹配: ' + candidates.map(c => c.id + ':' + c.name).join(', '));
  } else {
    console.log('  未找到匹配');
  }
});

// 再检查一下 eol 数据覆盖情况
console.log('\n=== EOL数据中已有记录但未被匹配的学校 ===');
const eolData = JSON.parse(fs.readFileSync(path.join(__dirname, 'crawled-data', 'eol-2025-records.json'), 'utf-8'));
const eolUnis = [...new Set(eolData.map(r => r.universityId))];

// 检查scores.json中2025年unknown记录的 (uni+province+category) 组合是否在eol中
const scores = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'scores.json'), 'utf-8'));
const unknown25 = scores.filter(r => r.year === 2025 && (!r.source || r.source === 'unknown'));

console.log('2025年unknown记录数:', unknown25.length);

// 按学校统计unknown记录
const uniUnknown = {};
unknown25.forEach(r => {
  if (!uniUnknown[r.universityId]) uniUnknown[r.universityId] = { count: 0, name: uniNameMap[r.universityId] || r.universityId, cats: new Set() };
  uniUnknown[r.universityId].count++;
  uniUnknown[r.universityId].cats.add(r.category);
});

// 按unknown记录数排序
const sorted = Object.entries(uniUnknown).sort((a,b)=>b[1].count-a[1].count);
console.log('unknown记录最多的15所学校:');
sorted.slice(0, 15).forEach(([id, info]) => {
  console.log('  ' + id + ' (' + info.name + '): ' + info.count + '条, 类别: ' + [...info.cats].join(','));
});
