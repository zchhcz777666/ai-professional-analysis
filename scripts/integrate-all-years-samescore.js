/**
 * 整合 samescore3 全年份爬虫数据到 scores.json
 *
 * 策略：
 *   1. 对 2025 年：优先替换 unknown 记录，已有 eol 来源的保留
 *   2. 对其他年份（2021-2024）：全部填充
 *   3. 智能匹配：如果 exact match 找不到，尝试放宽 category 匹配
 */
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const SCORES_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json');
const BACKUP_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json.bak2');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json');
const ALL_RECORDS_FILE = path.join(__dirname, 'crawled-data', 'samescore3-all-years-records.json');

// 类别映射：将 samescore3 的 category 映射到 scores.json 中可能使用的变体
const CATEGORY_ALIASES = {
  '物理类': ['物理类', '物理类/理工类', '物理'],
  '历史类': ['历史类', '历史类/文史类', '历史'],
  '理科': ['理科', '理工类'],
  '文科': ['文科', '文史类'],
  '综合': ['综合', '综合改革', '不分文理', '不分科目类'],
};

// 省份映射（反向）
const PROV_NAME_TO_ID = {
  '北京': '11', '天津': '12', '河北': '13', '山西': '14', '内蒙古': '15',
  '辽宁': '21', '吉林': '22', '黑龙江': '23',
  '上海': '31', '江苏': '32', '浙江': '33', '安徽': '34', '福建': '35', '江西': '36', '山东': '37',
  '河南': '41', '湖北': '42', '湖南': '43', '广东': '44', '广西': '45', '海南': '46',
  '重庆': '50', '四川': '51', '贵州': '52', '云南': '53', '西藏': '54',
  '陕西': '61', '甘肃': '62', '青海': '63', '宁夏': '64', '新疆': '65',
};

// ==================== 日志 ====================
function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

// ==================== 加载学校映射 ====================
function loadUniNameMap() {
  const uniData = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const nameRegex = /id:\s*'(\w+)'[^]*?name:\s*'([^']+)'/g;
  let m;
  const map = {};
  while ((m = nameRegex.exec(uniData)) !== null) {
    map[m[1]] = m[2];
  }
  return map;
}

// ==================== 构建反向索引 ====================
function buildEolIndex(records) {
  // 按年份+universityId+province+category 索引
  const index = {};
  records.forEach(r => {
    const key = `${r.year}|${r.universityId}|${r.province}|${r.category}`;
    // 保留最低分（分数越低，覆盖范围越广）
    if (!index[key] || r.minScore < index[key].minScore || (r.minScore === index[key].minScore && r.minRank > index[key].minRank)) {
      index[key] = { minScore: r.minScore, minRank: r.minRank };
    }
  });
  return index;
}

// ==================== 尝试匹配 ====================
function findExactMatch(index, year, universityId, province, category) {
  const key = `${year}|${universityId}|${province}|${category}`;
  return index[key] || null;
}

function findFuzzyMatch(index, year, universityId, province, category) {
  // 尝试类别别名
  const aliases = CATEGORY_ALIASES[category] || [category];
  for (const alias of aliases) {
    const key = `${year}|${universityId}|${province}|${alias}`;
    if (index[key]) return index[key];
  }
  
  // 尝试反过来：scores.json中物理类/理工类 找 eol中物理类
  for (const [eolCat, scoreCats] of Object.entries(CATEGORY_ALIASES)) {
    if (scoreCats.includes(category)) {
      const key = `${year}|${universityId}|${province}|${eolCat}`;
      if (index[key]) return index[key];
    }
  }
  
  return null;
}

// ==================== 主流程 ====================
async function main() {
  log('=== 整合 samescore3 全年份数据到 scores.json ===\n');
  
  // 1. 检查输入文件
  if (!fs.existsSync(ALL_RECORDS_FILE)) {
    log(`错误: ${ALL_RECORDS_FILE} 不存在，请先运行爬虫`);
    process.exit(1);
  }
  
  // 2. 加载数据
  const eolRecords = JSON.parse(fs.readFileSync(ALL_RECORDS_FILE, 'utf-8'));
  const existingScores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf-8'));
  const uniNameMap = loadUniNameMap();
  
  log(`samescore3 数据: ${eolRecords.length} 条`);
  log(`scores.json 现有: ${existingScores.length} 条`);
  
  // 3. 按年份统计 eol 数据
  const eolByYear = {};
  eolRecords.forEach(r => {
    if (!eolByYear[r.year]) eolByYear[r.year] = [];
    eolByYear[r.year].push(r);
  });
  Object.entries(eolByYear).sort().forEach(([y, recs]) => {
    log(`  ${y}: ${recs.length} 条`);
  });
  
  // 4. 构建 samescore3 数据的索引
  const eolIndex = buildEolIndex(eolRecords);
  log(`\n索引项数: ${Object.keys(eolIndex).length}`);
  
  // 5. 统计整合前数据
  const beforeStats = {};
  existingScores.forEach(r => {
    const year = r.year;
    if (!beforeStats[year]) beforeStats[year] = {};
    const src = r.source || 'unknown';
    beforeStats[year][src] = (beforeStats[year][src] || 0) + 1;
  });
  
  log('\n整合前数据分布:');
  Object.entries(beforeStats).sort().forEach(([year, stats]) => {
    log(`  ${year}: ${Object.entries(stats).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `${k}=${v}`).join(', ')}`);
  });
  
  // 6. 处理每条记录
  let replaced = 0;
  let kept = 0;
  let notFound = 0;
  let fuzzyMatched = 0;
  
  const newScores = existingScores.map(record => {
    const year = record.year;
    
    // 如果已有有效数据（非 unknown），跳过
    if (year === 2025) {
      if (record.source && record.source !== 'unknown') {
        kept++;
        return record;
      }
    } else {
      // 其他年份全部尝试填充
      // 先检查是否已有 non-unknown 数据
      if (record.source && record.source !== 'unknown') {
        kept++;
        return record;
      }
    }
    
    // 尝试精确匹配
    const exactMatch = findExactMatch(eolIndex, year, record.universityId, record.province, record.category);
    if (exactMatch && exactMatch.minScore > 0) {
      replaced++;
      return {
        ...record,
        minScore: exactMatch.minScore,
        minRank: exactMatch.minRank > 0 ? exactMatch.minRank : record.minRank,
        source: `eol:samescore3:${year}`
      };
    }
    
    // 尝试模糊匹配
    const fuzzyMatch = findFuzzyMatch(eolIndex, year, record.universityId, record.province, record.category);
    if (fuzzyMatch && fuzzyMatch.minScore > 0) {
      fuzzyMatched++;
      return {
        ...record,
        minScore: fuzzyMatch.minScore,
        minRank: fuzzyMatch.minRank > 0 ? fuzzyMatch.minRank : record.minRank,
        source: `eol:samescore3:${year}:fuzzy`
      };
    }
    
    notFound++;
    return record;
  });
  
  // 7. 输出结果
  log('\n=== 整合结果 ===');
  log(`精确匹配替换: ${replaced}`);
  log(`模糊匹配替换: ${fuzzyMatched}`);
  log(`保留已有: ${kept}`);
  log(`未匹配: ${notFound}`);
  
  // 8. 统计整合后数据
  const afterStats = {};
  newScores.forEach(r => {
    const year = r.year;
    if (!afterStats[year]) afterStats[year] = {};
    const src = r.source || 'unknown';
    afterStats[year][src] = (afterStats[year][src] || 0) + 1;
  });
  
  log('\n整合后数据分布:');
  Object.entries(afterStats).sort().forEach(([year, stats]) => {
    log(`  ${year}: ${Object.entries(stats).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `${k}=${v}`).join(', ')}`);
  });
  
  // 9. 分析未匹配的 2025 年记录
  const remainingUnknowns = newScores.filter(r => r.year === 2025 && (!r.source || r.source === 'unknown'));
  log(`\n2025年剩余 unknown: ${remainingUnknowns.length}`);
  
  if (remainingUnknowns.length > 0) {
    // 按学校统计
    const uniStats = {};
    remainingUnknowns.forEach(r => {
      if (!uniStats[r.universityId]) uniStats[r.universityId] = { count: 0, name: uniNameMap[r.universityId] || r.universityId };
      uniStats[r.universityId].count++;
    });
    const topUnis = Object.entries(uniStats).sort((a,b)=>b[1].count-a[1].count).slice(0, 10);
    log(`剩余 unknown 最多的10所学校:`);
    topUnis.forEach(([id, info]) => log(`  ${id} (${info.name}): ${info.count}条`));
    
    // 按省份+类别统计
    const provCatStats = {};
    remainingUnknowns.forEach(r => {
      const key = r.province + '|' + r.category;
      provCatStats[key] = (provCatStats[key] || 0) + 1;
    });
    log(`\n剩余 unknown 按省份|类别 (top 15):`);
    Object.entries(provCatStats).sort((a,b)=>b[1]-a[1]).slice(0, 15).forEach(([k,v]) => log(`  ${k}: ${v}`));
  }
  
  // 10. 保存
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(existingScores, null, 2), 'utf-8');
  log(`\n备份到: ${BACKUP_FILE}`);
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(newScores, null, 2), 'utf-8');
  log(`保存到: ${OUTPUT_FILE}`);
  
  // 11. 输出未匹配的学校列表（便于后续处理）
  const unmatchedReport = path.join(__dirname, 'crawled-data', 'unmatched-report.json');
  const unmatched = newScores.filter(r => !r.source || r.source === 'unknown');
  fs.writeFileSync(unmatchedReport, JSON.stringify({
    total: unmatched.length,
    byYear: {
      2025: unmatched.filter(r => r.year === 2025).length,
      2024: unmatched.filter(r => r.year === 2024).length,
      2023: unmatched.filter(r => r.year === 2023).length,
      2022: unmatched.filter(r => r.year === 2022).length,
      2021: unmatched.filter(r => r.year === 2021).length,
    },
    byCategory: Object.fromEntries(
      Object.entries(
        unmatched.reduce((acc, r) => { acc[r.category] = (acc[r.category] || 0) + 1; return acc; }, {})
      ).sort((a,b) => b[1] - a[1])
    ),
    byProvince: Object.fromEntries(
      Object.entries(
        unmatched.reduce((acc, r) => { acc[r.province] = (acc[r.province] || 0) + 1; return acc; }, {})
      ).sort((a,b) => b[1] - a[1])
    ),
  }, null, 2), 'utf-8');
  log(`未匹配报告: ${unmatchedReport}`);
}

main().catch(e => {
  log(`错误: ${e.message}`);
  console.error(e);
});
