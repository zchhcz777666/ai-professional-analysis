/**
 * 分析爬取结果质量
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, 'crawled-data', 'all-records.json');
const MAP = path.join(__dirname, 'crawled-data', 'uni-article-map-full.json');
const PROGRESS = path.join(__dirname, 'crawled-data', 'crawl-progress.json');

const records = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
const progress = JSON.parse(fs.readFileSync(PROGRESS, 'utf-8'));
const map = JSON.parse(fs.readFileSync(MAP, 'utf-8'));

console.log('=== 整体统计 ===');
console.log(`总记录数: ${records.length}`);

// 按格式统计
const formats = { table: 0, text: 0, none: 0, error: 0 };
for (const [k, v] of Object.entries(progress)) {
  formats[v.format]++;
}
console.log(`\n格式分布:`);
console.log(`  Table: ${formats.table}`);
console.log(`  Text: ${formats.text}`);
console.log(`  Empty: ${formats.none}`);
console.log(`  Error: ${formats.error}`);

// 按记录数统计学校
const perSchool = {};
for (const r of records) {
  if (!perSchool[r.universityId]) perSchool[r.universityId] = 0;
  perSchool[r.universityId]++;
}

const counts = Object.values(perSchool);
console.log(`\n记录/学校分布:`);
console.log(`  平均: ${Math.round(counts.reduce((a,b)=>a+b,0)/counts.length)}`);
console.log(`  最少: ${Math.min(...counts)}`);
console.log(`  最多: ${Math.max(...counts)}`);

// 列出记录数最少的学校
console.log(`\n记录数 < 5 的学校 (共${counts.filter(c=>c<5).length}所):`);
for (const [id, cnt] of Object.entries(perSchool).sort((a,b)=>a[1]-b[1]).filter(([_,c])=>c<5)) {
  const p = progress[id];
  const name = p?.uniName || id;
  console.log(`  ${name}: ${cnt}条 [${p?.format}]`);
}

// 年份覆盖
const years = {};
for (const r of records) {
  years[r.year] = (years[r.year]||0)+1;
}
console.log(`\n年份分布:`);
for (const [y, c] of Object.entries(years).sort()) console.log(`  ${y}: ${c}条`);

// 省份覆盖
const provs = {};
for (const r of records) {
  provs[r.province] = (provs[r.province]||0)+1;
}
console.log(`\n省份分布:`);
for (const [p, c] of Object.entries(provs).sort((a,b)=>b[1]-a[1])) console.log(`  ${p}: ${c}条`);

// 主要专业
const majors = {};
for (const r of records) {
  if (!r.major) continue;
  const m = r.major.substring(0, 8);
  if (m.includes('人工智能')||m.includes('计算机')||m.includes('智能')) {
    majors[m] = (majors[m]||0)+1;
  }
}
console.log(`\nAI相关专业记录:`);
for (const [m, c] of Object.entries(majors).sort((a,b)=>b[1]-a[1]).slice(0,20)) {
  console.log(`  ${m}: ${c}条`);
}

// 样本数据（Table格式）
console.log(`\n=== 样本数据（Table格式 - 武汉大学）===`);
const whu = records.filter(r => r.universityId === 'whu').slice(0, 10);
whu.forEach(r => console.log(`  ${r.year} ${r.province} ${r.major}: ${r.minScore}分/${r.minRank}`));

// 样本数据（Text格式 - 浙江大学）
console.log(`\n=== 样本数据（Text格式 - 浙江大学）===`);
const zju = records.filter(r => r.universityId === 'zju').slice(0, 10);
zju.forEach(r => console.log(`  ${r.year} ${r.province}: ${r.minScore}分`));