/**
 * 最终分析：数据质量检查
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, 'crawled-data', 'all-records-deduped.json');
const records = JSON.parse(fs.readFileSync(DATA, 'utf-8'));

console.log('=== 数据质量分析 ===\n');

// 省份名称规范化检查
const provNames = [...new Set(records.map(r => r.province))].sort();
console.log(`省份名称: ${provNames.join(', ')}\n`);

// 记录 > 10 的学校
const perSchool = {};
for (const r of records) {
  if (!perSchool[r.universityId]) perSchool[r.universityId] = { count: 0, name: r.universityId, years: new Set(), provs: new Set() };
  perSchool[r.universityId].count++;
  perSchool[r.universityId].years.add(r.year);
  perSchool[r.universityId].provs.add(r.province);
}

console.log('高质量学校 (>=30条记录):');
let highQ = 0;
for (const [id, info] of Object.entries(perSchool).sort((a,b) => b[1].count - a[1].count)) {
  if (info.count >= 30) {
    console.log(`  ${id.padEnd(25)} ${info.count}条  ${info.years.size}年 ${info.provs.size}省`);
    highQ++;
  }
}
console.log(`共 ${highQ} 所\n`);

// 中度质量 (10-29条)
console.log('中等质量 (10-29条记录):');
let midQ = 0;
for (const [id, info] of Object.entries(perSchool).sort((a,b) => b[1].count - a[1].count)) {
  if (info.count >= 10 && info.count < 30) {
    console.log(`  ${id.padEnd(25)} ${info.count}条  ${info.years.size}年 ${info.provs.size}省`);
    midQ++;
  }
}
console.log(`共 ${midQ} 所\n`);

// 低质量 (<10条)
console.log(`低质量: ${Object.keys(perSchool).filter(id => perSchool[id].count < 10).length} 所学校\n`);

// 年份分布
console.log('年份分布:');
const years = {};
for (const r of records) { years[r.year] = (years[r.year]||0) + 1; }
Object.entries(years).sort().forEach(([y,c]) => console.log(`  ${y}: ${c}条`));

// 检查浙江大学数据
console.log('\n浙江大学数据样本:');
const zju = records.filter(r => r.universityId === 'zju').sort((a,b) => a.year - b.year || a.province.localeCompare(b.province));
zju.slice(0, 10).forEach(r => console.log(`  ${r.year} ${r.province}: ${r.minScore}分`));
console.log(`  共 ${zju.length} 条`);

// 检查华中科技大学
console.log('\n华中科技大学数据样本:');
const hust = records.filter(r => r.universityId === 'hust').sort((a,b) => a.year - b.year || a.province.localeCompare(b.province));
hust.slice(0, 10).forEach(r => console.log(`  ${r.year} ${r.province}: ${r.minScore}分`));
console.log(`  共 ${hust.length} 条`);