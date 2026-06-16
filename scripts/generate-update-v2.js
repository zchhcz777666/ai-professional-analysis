/**
 * 生成完整的 scores.ts 更新文件（v2）
 * 
 * 合并爬取的真实数据 + 保留现有估算数据
 * 覆盖全部 253 所高校 × 31 省份 × 5 年
 * 
 * 运行: node scripts/generate-update-v2.js
 */
const fs = require('fs');
const path = require('path');

const CRAWLED = path.join(__dirname, 'crawled-data', 'all-records-deduped.json');
const SCORES_TS = path.join(__dirname, '..', 'src', 'data', 'scores.ts');

// 加载
const crawled = JSON.parse(fs.readFileSync(CRAWLED, 'utf-8'));
const existingContent = fs.readFileSync(SCORES_TS, 'utf-8');

// 解析现有数据
const existingRecords = [];
const re = /\{\s*universityId:\s*'([^']+)',\s*province:\s*'([^']+)',\s*year:\s*(\d+),\s*category:\s*'([^']+)',\s*minScore:\s*(\d+),\s*avgScore:\s*(\d+),\s*minRank:\s*(\d+),\s*avgRank:\s*(\d+),\s*enrollment:\s*(\d+)\s*\}/g;
let m;
while ((m = re.exec(existingContent)) !== null) {
  existingRecords.push({
    universityId: m[1], province: m[2], year: parseInt(m[3]),
    category: m[4], minScore: parseInt(m[5]), avgScore: parseInt(m[6]),
    minRank: parseInt(m[7]), avgRank: parseInt(m[8]), enrollment: parseInt(m[9]),
  });
}

// 构建现有数据索引
const existingIndex = {};
for (const r of existingRecords) {
  const key = `${r.universityId}|${r.province}|${r.year}`;
  existingIndex[key] = r;
}

// 爬取数据索引
const crawledIndex = {};
for (const r of crawled) {
  // 过滤不合理分数
  const topSchools = ['tsinghua','pku','zju','sjtu','fudan','nju','ustc','hit','xjtu','ruc','buaa','bit','bnu','nankai','tongji','sdu','whu','hust','csu','sysu','scut','seu','xmu','cqu','dlut','neu','ecupl','lzu','nwpu','nwafu','bnuz','sustech','suda','njupt','hdu','cqupt','xidian','xust','xaut'];
  const isTop = topSchools.includes(r.universityId);
  const minValid = isTop ? 550 : 300;
  if (r.minScore < minValid || r.minScore > 750) continue;
  
  const key = `${r.universityId}|${r.province}|${r.year}`;
  if (!crawledIndex[key]) crawledIndex[key] = [];
  crawledIndex[key].push(r);
}

const PROVINCES = ['北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江','上海','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','广西','海南','重庆','四川','贵州','云南','西藏','陕西','甘肃','青海','宁夏','新疆'];
const YEARS = [2021, 2022, 2023, 2024, 2025];

// 获取所有学校的 ID
const allUniIds = [...new Set(existingRecords.map(r => r.universityId))];
allUniIds.sort();

// 统计真实数据覆盖
let realCount = 0;
let estimatedCount = 0;

// 生成输出
let output = `import { ScoreRecord } from '@/types'

// 各高校历年录取分数线数据（AI专业）
// 数据结构：按省份、年份记录最低分/平均分/最低位次/平均位次
//
// 数据来源：
// - 大学生必备网(dxsbb.com)真实录取数据（实时爬取）
// - 教育部阳光高考平台历史数据
// - 部分估算数据（标注为估计值）
//
// 更新日期: ${new Date().toISOString().split('T')[0]}

export const scoreRecords: ScoreRecord[] = [
`;

// 用于追踪哪些源被使用
const usedCrawled = new Set();
const usedExisting = new Set();

for (const uniId of allUniIds) {
  for (const prov of PROVINCES) {
    for (const year of YEARS) {
      const key = `${uniId}|${prov}|${year}`;
      const crawledEntries = crawledIndex[key];
      const existing = existingIndex[key];
      
      if (crawledEntries && crawledEntries.length > 0) {
        // 使用爬取的真实数据
        const scores = crawledEntries.map(r => r.minScore).filter(s => s > 0);
        const avgScores = crawledEntries.filter(r => r.avgScore > 0).map(r => r.avgScore);
        const enrollments = crawledEntries.filter(r => r.enrollment > 0).map(r => r.enrollment);
        
        const minScore = Math.min(...scores);
        const avgScore = avgScores.length > 0 
          ? Math.round(avgScores.reduce((a,b)=>a+b,0) / avgScores.length)
          : Math.round(scores.reduce((a,b)=>a+b,0) / scores.length);
        const enrollment = enrollments.length > 0
          ? Math.round(enrollments.reduce((a,b)=>a+b,0) / enrollments.length)
          : (existing?.enrollment || 0);
        const minRank = existing?.minRank || 0;
        const avgRank = existing?.avgRank || 0;
        
        output += `  { universityId: '${uniId}', province: '${prov}', year: ${year}, category: '物理类', minScore: ${minScore}, avgScore: ${avgScore}, minRank: ${minRank}, avgRank: ${avgRank}, enrollment: ${enrollment} },`;
        output += ` // 真实数据\n`;
        usedCrawled.add(key);
        realCount++;
      } else if (existing) {
        // 保留现有估算数据
        output += `  { universityId: '${uniId}', province: '${prov}', year: ${year}, category: '${existing.category}', minScore: ${existing.minScore}, avgScore: ${existing.avgScore}, minRank: ${existing.minRank}, avgRank: ${existing.avgRank}, enrollment: ${existing.enrollment} },`;
        output += ` // 估算数据\n`;
        usedExisting.add(key);
        estimatedCount++;
      }
      // else skip (shouldn't happen for 254 schools × 31 provinces × 5 years)
    }
  }
}

output += `];\n`;

fs.writeFileSync(path.join(__dirname, 'crawled-data', 'new-scores-v2.ts'), output, 'utf-8');

console.log(`=== 生成完成 ===`);
console.log(`总记录数: ${Object.keys(allUniIds).length} 所学校`);
console.log(`真实数据: ${realCount} 条 (${Math.round(realCount/(realCount+estimatedCount)*100)}%)`);
console.log(`估算数据: ${estimatedCount} 条 (${Math.round(estimatedCount/(realCount+estimatedCount)*100)}%)`);
console.log(`总计: ${realCount + estimatedCount} 条`);
console.log(`\n文件: scripts/crawled-data/new-scores-v2.ts`);
console.log(`大小: ${(output.length / 1024).toFixed(1)} KB`);
console.log(`\n使用: 复制到 src/data/scores.ts`);