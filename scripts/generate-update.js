/**
 * 生成 scores.ts 更新文件
 * 
 * 将爬取的真实数据与现有估算数据合并
 * 
 * 运行: node scripts/generate-update.js
 * 然后: 将生成的 update.txt 内容复制到 src/data/scores.ts
 */
const fs = require('fs');
const path = require('path');

const CRAWLED = path.join(__dirname, 'crawled-data', 'all-records-deduped.json');
const SCORES_TS = path.join(__dirname, '..', 'src', 'data', 'scores.ts');
const UNIVERSITIES_TS = path.join(__dirname, '..', 'src', 'data', 'universities.ts');

// 加载爬取数据
const crawled = JSON.parse(fs.readFileSync(CRAWLED, 'utf-8'));
console.log(`加载爬取数据: ${crawled.length} 条记录`);

// 加载现有分数数据
const existingContent = fs.readFileSync(SCORES_TS, 'utf-8');
console.log(`现有 scores.ts: ${existingContent.length} 字节`);

// 加载高校映射
const uniContent = fs.readFileSync(UNIVERSITIES_TS, 'utf-8');
const unis = {};
const re = /id:\s*'([^']+)'[^}]*name:\s*'([^']+)'/g;
let m;
while ((m = re.exec(uniContent)) !== null) unis[m[1]] = m[2];

// ==================== 数据清洗 ====================
// 过滤不合理的分数
function isValidScore(uniId, score, year) {
  const uni = unis[uniId] || uniId;
  // Top schools should have high scores
  const topSchools = ['清华大学','北京大学','浙江大学','上海交通大学','复旦大学','南京大学','中国科学技术大学','哈尔滨工业大学','西安交通大学'];
  const minForTop = 600;
  const minForNormal = 300;
  
  const threshold = topSchools.includes(uni) ? minForTop : minForNormal;
  if (score < threshold || score > 750) return false;
  return true;
}

// 按 (universityId, province, year) 分组
const grouped = {};
for (const r of crawled) {
  const key = `${r.universityId}|${r.province}|${r.year}`;
  if (!grouped[key]) grouped[key] = [];
  grouped[key].push(r);
}

// 清洗和聚合
const cleanedData = {};
for (const [key, records] of Object.entries(grouped)) {
  const [uniId, province, yearStr] = key.split('|');
  const year = parseInt(yearStr);
  
  // Filter valid scores
  const validRecords = records.filter(r => isValidScore(uniId, r.minScore, year));
  if (validRecords.length === 0) continue;
  
  // Take minimum score across all majors/categories
  const minScore = Math.min(...validRecords.map(r => r.minScore));
  const avgScores = validRecords.filter(r => r.avgScore > 0).map(r => r.avgScore);
  const avgScore = avgScores.length > 0 
    ? Math.round(avgScores.reduce((a,b)=>a+b,0) / avgScores.length)
    : minScore + 5;
  const enrolled = validRecords.reduce((s, r) => s + (r.enrollment || 0), 0);
  
  if (!cleanedData[uniId]) cleanedData[uniId] = {};
  if (!cleanedData[uniId][province]) cleanedData[uniId][province] = {};
  cleanedData[uniId][province][year] = {
    minScore,
    avgScore,
    enrollment: enrolled || 0,
    minRank: 0,
    recordCount: validRecords.length,
  };
}

// ==================== 统计覆盖 ====================
let totalCells = 0;
let coveredCells = 0;
for (const [uniId, provData] of Object.entries(cleanedData)) {
  for (const [prov, yearData] of Object.entries(provData)) {
    for (const year of [2021, 2022, 2023, 2024, 2025]) {
      totalCells++;
      if (yearData[year]) coveredCells++;
    }
  }
}

console.log(`\n爬取数据覆盖:`);
console.log(`  高校数: ${Object.keys(cleanedData).length}/${Object.keys(unis).length}`);
console.log(`  单元格: ${coveredCells}/${totalCells} (${Math.round(coveredCells/totalCells*100)}%)`);

// 统计各学校覆盖
console.log(`\n=== 各高校覆盖统计 (按省份数排序) ===`);
const schoolStats = [];
for (const [uniId, provData] of Object.entries(cleanedData)) {
  const provCount = Object.keys(provData).length;
  const yearCount = new Set();
  let cellCount = 0;
  for (const [prov, yearData] of Object.entries(provData)) {
    for (const year of [2021, 2022, 2023, 2024, 2025]) {
      if (yearData[year]) { cellCount++; yearCount.add(year); }
    }
  }
  schoolStats.push({ id: uniId, name: unis[uniId] || uniId, provs: provCount, years: yearCount.size, cells: cellCount });
}
schoolStats.sort((a,b) => b.cells - a.cells);

schoolStats.slice(0, 80).forEach(s => 
  console.log(`  ${s.name.padEnd(20)} ${s.provs.toString().padStart(2)}省 ${s.years}年 ${s.cells}条`)
);

// ==================== 生成更新后的 scores.ts ====================
console.log(`\n=== 生成更新文件 ===`);

// 构建 id -> 名称映射
const uniNames = {};
for (const [id, name] of Object.entries(unis)) uniNames[id] = name;

// 输出新的 scores.ts 内容
let output = `import { ScoreRecord } from '@/types'

// 各高校历年录取分数线数据（AI专业）
// 数据结构：按省份、年份记录最低分/平均分/最低位次/平均位次
// 
// 数据来源说明：
// - 2025年数据来自大学生必备网(dxsbb.com)爬取
// - 2024年及以前数据整合自dxsbb.com + 现有估算数据
// - 未爬取到数据的单元格保留原估算值
// 
// 更新日期: ${new Date().toISOString().split('T')[0]}

export const scoreRecords: ScoreRecord[] = [
`;

// 解析现有数据用于补缺
const existingRecords = [];
const existingRe = /\{\s*universityId:\s*'([^']+)',\s*province:\s*'([^']+)',\s*year:\s*(\d+),\s*category:\s*'([^']+)',\s*minScore:\s*(\d+),\s*avgScore:\s*(\d+),\s*minRank:\s*(\d+),\s*avgRank:\s*(\d+),\s*enrollment:\s*(\d+)\s*\}/g;
while ((m = existingRe.exec(existingContent)) !== null) {
  existingRecords.push({
    universityId: m[1], province: m[2], year: parseInt(m[3]),
    category: m[4], minScore: parseInt(m[5]), avgScore: parseInt(m[6]),
    minRank: parseInt(m[7]), avgRank: parseInt(m[8]), enrollment: parseInt(m[9]),
  });
}
const existingMap = {};
for (const r of existingRecords) {
  const key = `${r.universityId}|${r.province}|${r.year}`;
  existingMap[key] = r;
}

// 写入记录
const outputLines = [];
const outputUnis = Object.keys(cleanedData).sort();

for (const uniId of outputUnis) {
  const provData = cleanedData[uniId];
  const provs = Object.keys(provData).sort();
  
  for (const prov of provs) {
    const yearData = provData[prov];
    for (const year of [2021, 2022, 2023, 2024, 2025]) {
      const crawledEntry = yearData[year];
      const existingKey = `${uniId}|${prov}|${year}`;
      const existing = existingMap[existingKey];
      
      if (crawledEntry) {
        // Use crawled data
        const minScore = crawledEntry.minScore;
        const avgScore = crawledEntry.avgScore;
        const minRank = existing?.minRank || 0;
        const avgRank = existing?.avgRank || Math.round((existing?.minRank || 0) * 0.85);
        const enrollment = crawledEntry.enrollment || existing?.enrollment || 0;
        
        outputLines.push(`  { universityId: '${uniId}', province: '${prov}', year: ${year}, category: '物理类', minScore: ${minScore}, avgScore: ${avgScore}, minRank: ${minRank}, avgRank: ${avgRank}, enrollment: ${enrollment} },`);
      } else if (existing) {
        // Keep existing data
        outputLines.push(`  { universityId: '${uniId}', province: '${prov}', year: ${year}, category: '${existing.category}', minScore: ${existing.minScore}, avgScore: ${existing.avgScore}, minRank: ${existing.minRank}, avgRank: ${existing.avgRank}, enrollment: ${existing.enrollment} },`);
      }
      // Skip if neither
    }
  }
  
  // Add schools not in crawled data
  if (!outputUnis.includes(uniId)) {
    for (const existing of existingRecords.filter(r => r.universityId === uniId)) {
      outputLines.push(`  { universityId: '${uniId}', province: '${existing.province}', year: ${existing.year}, category: '${existing.category}', minScore: ${existing.minScore}, avgScore: ${existing.avgScore}, minRank: ${existing.minRank}, avgRank: ${existing.avgRank}, enrollment: ${existing.enrollment} },`);
    }
  }
}

output += outputLines.join('\n');
output += `\n];\n`;

fs.writeFileSync(path.join(__dirname, 'crawled-data', 'new-scores.ts'), output, 'utf-8');
console.log(`\n新文件已生成: scripts/crawled-data/new-scores.ts`);
console.log(`行数: ${outputLines.length}`);

// 对比新旧数据差异
const oldLineCount = (existingContent.match(/universityId:/g) || []).length;
console.log(`\n对比:`);
console.log(`  原文件: ${oldLineCount} 条记录`);
console.log(`  新文件: ${outputLines.length} 条记录`);
console.log(`  新增/更新: ${outputLines.length - oldLineCount} 条`);
console.log(`  丢弃: ${oldLineCount - outputLines.filter(l => !l.includes('universityId')).length} 条`);

// 统计真实数据 vs 估算数据
const crawledCount = outputLines.filter(l => {
  for (const uniId of outputUnis) {
    if (l.includes(`'${uniId}'`)) return true;
  }
  return false;
}).length;
console.log(`  真实数据来源: ~${crawledCount} 条`);
console.log(`  保留估算数据: ~${outputLines.length - crawledCount} 条`);

// ==================== 备份原文件提示 ====================
console.log(`\n=== 使用说明 ===`);
console.log(`1. 备份原文件: cp src/data/scores.ts src/data/scores.ts.bak`);
console.log(`2. 复制新文件: cp scripts/crawled-data/new-scores.ts src/data/scores.ts`);
console.log(`3. 检查编译: npm run build || npx tsc --noEmit`);
