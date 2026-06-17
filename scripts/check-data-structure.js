const fs = require('fs');
const d = JSON.parse(fs.readFileSync('./src/data/scores.json', 'utf-8'));
const s25 = d.filter(r => r.year === 2025);

// 按来源分类统计
const bySource = {};
s25.forEach(r => {
  const src = r.source || 'unknown';
  if (!bySource[src]) bySource[src] = { count: 0, unis: new Set(), provs: new Set() };
  bySource[src].count++;
  bySource[src].unis.add(r.universityId);
  bySource[src].provs.add(r.province);
});
console.log('=== 2025年数据按来源分布 ===');
Object.entries(bySource).sort((a, b) => b[1].count - a[1].count).forEach(([src, info]) => {
  console.log(src + ': ' + info.count + '条, ' + info.unis.size + '校, ' + info.provs.size + '省');
});

// 数据样例对比
const withSource = d.filter(r => r.source);
console.log('\n有source字段的记录:', withSource.length);
const withoutSource = d.filter(r => !r.source);
console.log('无source字段的记录:', withoutSource.length);
if (withSource.length > 0) {
  console.log('有source样例:', JSON.stringify(withSource[0]));
  console.log('source字段值:', withSource[0].source);
}
if (withoutSource.length > 0) {
  console.log('无source样例:', JSON.stringify(withoutSource[0]));
}

// 看看来自eol的数据格式
const eolData = d.filter(r => r.source && r.source.includes('eol'));
if (eolData.length > 0) {
  console.log('\neol来源数据样例:', JSON.stringify(eolData.slice(0, 3)));
}

// 2025年按省份统计
const byProv = {};
s25.forEach(r => {
  byProv[r.province] = (byProv[r.province] || 0) + 1;
});
console.log('\n=== 2025年各省记录数 ===');
Object.entries(byProv).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([p, c]) => {
  console.log(p + ': ' + c);
});
