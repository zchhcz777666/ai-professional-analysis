/**
 * 合并 eol.cn 真实数据到 scores.json（修正版）
 * 
 * 策略：
 * 1. 加载 api-records.json（2,191 条真实数据）
 * 2. 排除 scores.json 中与真实数据重复的 (universityId, province, year) 条目
 * 3. 添加所有新真实数据
 * 4. 保留所有未被替换的旧数据（包括生成数据）
 */
const fs = require('fs');
const path = require('path');

const API_RECORDS = path.join(__dirname, 'crawled-data', 'api-records.json');
const SCORES = path.join(__dirname, '..', 'src', 'data', 'scores.json');
const BACKUP = path.join(__dirname, '..', 'src', 'data', 'scores-backup.json');

function main() {
  // 1. 备份
  console.log('备份 scores.json...');
  fs.copyFileSync(SCORES, BACKUP);
  
  // 2. 加载
  const realData = JSON.parse(fs.readFileSync(API_RECORDS, 'utf-8'));
  const allData = JSON.parse(fs.readFileSync(SCORES, 'utf-8'));
  
  console.log(`新真实数据: ${realData.length} 条`);
  console.log(`现有数据: ${allData.length} 条`);

  // 3. 建立新数据 key 集合
  const newRealKeys = new Set(realData.map(r => `${r.universityId}|${r.province}|${r.year}|${r.category}`));
  
  // 4. 过滤：保留新数据中没有覆盖的旧数据
  const kept = allData.filter(r => {
    const key = `${r.universityId}|${r.province}|${r.year}|${r.category}`;
    return !newRealKeys.has(key);
  });

  console.log(`保留旧数据: ${kept.length} 条`);
  
  // 5. 合并
  const result = [...kept, ...realData];
  
  // 6. 统计
  const realCount = result.filter(r => r.source && (r.source.includes('eol') || r.source.includes('考试院'))).length;
  const unknownCount = result.filter(r => !r.source || r.source === 'unknown').length;
  
  console.log(`\n合并结果:`);
  console.log(`  总记录: ${result.length}`);
  console.log(`  真实(eol)数据: ${realCount}`);
  console.log(`  生成(unknown)数据: ${unknownCount}`);

  // 按省份统计真实数据
  const provDist = {};
  for (const r of result) {
    if (r.source && (r.source.includes('eol') || r.source.includes('考试院'))) {
      provDist[r.province] = (provDist[r.province] || 0) + 1;
    }
  }
  console.log('\n真实数据省份分布:');
  for (const [p, c] of Object.entries(provDist).sort((a,b) => b[1] - a[1])) {
    console.log(`  ${p}: ${c}`);
  }

  // 年份分布
  const yearDist = {};
  for (const r of result) {
    if (r.source && (r.source.includes('eol') || r.source.includes('考试院'))) {
      yearDist[r.year] = (yearDist[r.year] || 0) + 1;
    }
  }
  console.log('\n真实数据年份分布:', JSON.stringify(yearDist));

  // 7. 保存
  fs.writeFileSync(SCORES, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n✅ 已保存到 scores.json`);
}

main();
