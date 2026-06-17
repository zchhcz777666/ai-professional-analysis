/**
 * 整合 school/info.json 的 pro_type_min 数据到 scores.json
 *
 * 注意：school-info 数据只有 minScore，没有 minRank
 * 优先级：低于 samescore3 和 eol-api 数据
 */
const fs = require('fs');
const path = require('path');

const SCORES_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json');
const BACKUP_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json.bak3');
const SCHOOL_INFO_FILE = path.join(__dirname, 'crawled-data', 'school-info-scores.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json');

// ==================== 日志 ====================
function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

// ==================== 类别匹配 ====================
// 将 school-info 的 category 映射到 scores.json 中的变体
const CATEGORY_GROUPS = {
  '物理类': ['物理类', '物理类/理工类', '物理类105组', '物理类106组', '物理类107组', '物理类108组', '物理类109组', '物理类210组', '物理类110组', '物理类111组', '物理类112组', '物理类213组', '物理类312组', '物理类313组', '物理类314组', '物理类315组', '物理类416组', '物理类417组', '物理', '理工/物理类', '理工/物理', '物理学科类', '物理学科类(体育类)', '物理学科类(艺术类)', '物理类（再选不限）', '物理类（再选化学）'],
  '历史类': ['历史类', '历史类/文史类', '历史类102组', '历史类103组', '历史类104组', '历史类305组', '历史类311组', '历史类406组', '历史类407组', '历史类414组', '历史类415组', '历史', '文史/历史类', '文史/历史', '历史学科类', '历史学科类(体育类)', '历史学科类(艺术类)', '历史类（再选不限）', '历史类（再选政治）'],
  '综合': ['综合', '综合改革', '不分文理', '不分科目类', '不分科类101组', '普通类', '普通类平行', '普通类提前', '普通'],
  '理科': ['理科', '理工类', '一本理', '一本理(地方专项计划)', '一本理(国家专项计划)'],
  '文科': ['文科', '文史类'],
};

function findCategoryMatch(infoCat, scoreCats) {
  // 首先精确匹配
  if (scoreCats.includes(infoCat)) return infoCat;
  
  // 然后按大类组匹配
  for (const [group, aliases] of Object.entries(CATEGORY_GROUPS)) {
    if (aliases.includes(infoCat)) {
      // 找到这个组里在 scoreCats 中存在的第一个类别
      for (const alias of aliases) {
        if (scoreCats.includes(alias)) return alias;
      }
      // 如果组内没有匹配，返回组名（即标准名称）
      if (scoreCats.includes(group)) return group;
      break;
    }
  }
  
  return null;
}

// ==================== 主流程 ====================
async function main() {
  log('=== 整合 school-info 分数线数据到 scores.json ===\n');
  
  // 1. 加载数据
  if (!fs.existsSync(SCHOOL_INFO_FILE)) {
    log(`错误: ${SCHOOL_INFO_FILE} 不存在`);
    process.exit(1);
  }
  
  const schoolInfoScores = JSON.parse(fs.readFileSync(SCHOOL_INFO_FILE, 'utf-8'));
  const existingScores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf-8'));
  
  log(`school-info 数据: ${schoolInfoScores.length} 条`);
  log(`scores.json 现有: ${existingScores.length} 条`);
  
  // 2. 构建 school-info 索引 (uniId|province|category|year -> minScore)
  // 注意: 有 category 匹配问题，需要构建灵活的索引
  const infoIndex = {};
  schoolInfoScores.forEach(r => {
    const key = `${r.universityId}|${r.province}|${r.year}`;
    if (!infoIndex[key]) infoIndex[key] = {};
    if (!infoIndex[key][r.category]) {
      infoIndex[key][r.category] = r.minScore;
    } else if (r.minScore < infoIndex[key][r.category]) {
      infoIndex[key][r.category] = r.minScore;  // 保留更低分
    }
  });
  log(`索引项数 (uni|prov|year): ${Object.keys(infoIndex).length}`);
  
  // 3. 统计整合前的 unknown
  const beforeUnknown = existingScores.filter(r => !r.source || r.source === 'unknown').length;
  log(`\n整合前 unknown: ${beforeUnknown}`);
  
  // 4. 处理每条记录
  let replaced = 0;
  let skippedHasData = 0;
  let notFound = 0;
  let categoryMismatch = 0;
  
  const newScores = existingScores.map(record => {
    const year = record.year;
    
    // 只处理 2023-2025
    if (year < 2023 || year > 2025) return record;
    
    // 如果已有有效数据，跳过
    if (record.source && record.source !== 'unknown') {
      skippedHasData++;
      return record;
    }
    
    // 在 school-info 索引中查找
    const key = `${record.universityId}|${record.province}|${year}`;
    const infoEntry = infoIndex[key];
    if (!infoEntry) {
      notFound++;
      return record;
    }
    
    // 尝试匹配 category
    const infoCats = Object.keys(infoEntry);
    const matchedCat = findCategoryMatch(record.category, infoCats);
    
    if (matchedCat && infoEntry[matchedCat] > 0) {
      replaced++;
      return {
        ...record,
        minScore: infoEntry[matchedCat],
        source: `school-info:${year}`
      };
    }
    
    // 类别不匹配 - 尝试找一个大类组的匹配
    for (const [group, aliases] of Object.entries(CATEGORY_GROUPS)) {
      if (aliases.includes(record.category)) {
        // 这个大类下，有 info 数据吗？
        for (const alias of infoCats) {
          if (aliases.includes(alias)) {
            categoryMismatch++;
            return {
              ...record,
              minScore: infoEntry[alias],
              source: `school-info:${year}:fuzzy`
            };
          }
        }
        break;
      }
    }
    
    notFound++;
    return record;
  });
  
  // 5. 统计结果
  const afterUnknown = newScores.filter(r => !r.source || r.source === 'unknown').length;
  
  log('\n=== 整合结果 ===');
  log(`已填充: ${replaced}`);
  log(`模糊匹配填充: ${categoryMismatch}`);
  log(`已有数据跳过: ${skippedHasData}`);
  log(`未匹配: ${notFound}`);
  log(`整合前 unknown: ${beforeUnknown}`);
  log(`整合后 unknown: ${afterUnknown}`);
  log(`减少: ${beforeUnknown - afterUnknown}`);
  
  // 6. 按年份统计
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
  
  // 7. 保存
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(existingScores, null, 2), 'utf-8');
  log(`\n备份到: ${BACKUP_FILE}`);
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(newScores, null, 2), 'utf-8');
  log(`保存到: ${OUTPUT_FILE}`);
  
  // 8. 剩余 unknown 分析
  const remaining = newScores.filter(r => !r.source || r.source === 'unknown');
  log(`\n剩余 unknown 总数: ${remaining.length}`);
  
  const remByYear = {};
  remaining.forEach(r => {
    remByYear[r.year] = (remByYear[r.year] || 0) + 1;
  });
  log('按年份:');
  Object.entries(remByYear).sort().forEach(([y, c]) => log(`  ${y}: ${c}`));
}

main().catch(e => {
  log(`错误: ${e.message}`);
  console.error(e);
});
