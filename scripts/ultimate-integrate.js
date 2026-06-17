/**
 * 终极整合脚本：用所有可用数据源，以最大力度替换假数据
 *
 * 策略：
 *   1. 构建所有数据源的统一索引 (uniId|province|year) → { category → { minScore, minRank } }
 *   2. 对每条 unknown 记录：
 *      a. 精确匹配 (uni|prov|cat|year) → 最佳
 *      b. 大类匹配 (uni|prov|cat_group|year) → 好
 *      c. 忽略类别匹配 (uni|prov|year) 取最低分 → 备用
 *   3. 数据源优先级：eol-api > samescore3 > school-info > dxsbb
 */
const fs = require('fs');
const path = require('path');

const SCORES_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json');
const BACKUP_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json.bak-ultimate');
const SAMESCORE_FILE = path.join(__dirname, 'crawled-data', 'samescore3-all-years-records.json');
const SCHOOL_INFO_FILE = path.join(__dirname, 'crawled-data', 'school-info-scores.json');
const DXSBB_FILE = path.join(__dirname, 'crawled-data', 'all-records-deduped.json');

// ==================== 类别归一化映射 ====================
const CATEGORY_NORMALIZE = {
  // 物理类及其变种 → 物理类
  '物理类': '物理类', '物理类/理工类': '物理类', '物理类105组': '物理类', '物理类106组': '物理类',
  '物理类107组': '物理类', '物理类108组': '物理类', '物理类109组': '物理类', '物理类210组': '物理类',
  '物理类110组': '物理类', '物理类111组': '物理类', '物理类112组': '物理类', '物理类213组': '物理类',
  '物理类312组': '物理类', '物理类313组': '物理类', '物理类314组': '物理类', '物理类315组': '物理类',
  '物理类416组': '物理类', '物理类417组': '物理类', '物理类（再选不限）': '物理类', '物理类（再选化学）': '物理类',
  '物理学科类': '物理类', '物理学科类(体育类)': '物理类', '物理学科类(艺术类)': '物理类',
  '物理': '物理类', '理工/物理类': '物理类', '理工/物理': '物理类', '物化': '物理类',
  '综合改革(物理类)': '物理类', '综合改革(物理)': '物理类',
  '物理_体育': '物理类', '物理_艺术': '物理类', '体育物理': '物理类', '艺术物理': '物理类',
  // 历史类及其变种 → 历史类
  '历史类': '历史类', '历史类/文史类': '历史类', '历史类102组': '历史类', '历史类103组': '历史类',
  '历史类104组': '历史类', '历史类305组': '历史类', '历史类311组': '历史类', '历史类406组': '历史类',
  '历史类407组': '历史类', '历史类414组': '历史类', '历史类415组': '历史类',
  '历史类（再选不限）': '历史类', '历史类（再选政治）': '历史类',
  '历史学科类': '历史类', '历史学科类(体育类)': '历史类', '历史学科类(艺术类)': '历史类',
  '历史': '历史类', '文史/历史类': '历史类', '文史/历史': '历史类',
  '综合改革(历史类)': '历史类', '综合改革(历史)': '历史类',
  '历史_体育': '历史类', '历史_艺术': '历史类', '体育历史': '历史类', '艺术历史': '历史类',
  // 综合类
  '综合': '综合', '综合改革': '综合', '不分文理': '综合', '不分科目类': '综合', '不分科类101组': '综合',
  '普通类': '综合', '普通类平行': '综合', '普通类提前': '综合', '普通': '综合',
  '地方专项计划': '综合', '体育本科特招生': '综合', '艺术类统考': '综合',
  '单独考试': '综合', '预科': '综合', '三校生': '综合',
  // 理科类
  '理科': '理科', '理工类': '理科', '一本理': '理科', '一本理(地方专项计划)': '理科', '一本理(国家专项计划)': '理科',
  // 文科类
  '文科': '文科', '文史类': '文科', '一本文': '文科',
  // 艺术类
  '艺术': '艺术类', '艺术类': '艺术类', '艺术历史': '艺术类', '艺术物理': '艺术类',
  '艺术(历史类)': '艺术类', '艺术(物理类)': '艺术类', '艺术(历史)': '艺术类', '艺术(物理)': '艺术类',
  '艺术(文)': '艺术类', '艺术(理)': '艺术类', '艺术文': '艺术类', '艺术理': '艺术类',
  '艺术类(历史)': '艺术类', '艺术类(物理)': '艺术类',
  '艺术(不分科目类)': '艺术类', '艺术类(不分科类)1': '艺术类',
  '艺术类统考': '艺术类',
  // 体育类
  '体育': '体育类', '体育类': '体育类', '体育历史': '体育类', '体育物理': '体育类',
  '体育(历史)': '体育类', '体育(物理)': '体育类', '体育(历史类)': '体育类', '体育(物理类)': '体育类',
  '体育（理）/体育（物理类）': '体育类', '体育（文）/体育（历史类）': '体育类',
  '体育本科特招生': '体育类',
};

// ==================== 学校 ID 别名映射 (*2 → 主ID) ====================
const UNI_ALIAS = {
  'bjut2': 'bjut', 'scnu2': 'scnu', 'hunnu2': 'hunnu', 'gxu2': 'gxu',
  'ynu2': 'ynu', 'guet2': 'guet', 'nepu2': 'nepu', 'zzu2': 'zzu',
  'fzu2': 'fzu', 'jxnu2': 'jxnu', 'henu2': 'henu', 'xaut2': 'xaut',
  'nchu2': 'nchu', 'hbut2': 'hbut', 'cqjtu2': 'cqjtu', 'hebust2': 'hebust',
  'sxu2': 'sxu', 'xju2': 'xju', 'gzu2': 'gsu', 'nxu2': 'nxu',
  'hainanu2': 'hainanu', 'tibetu2': 'tibetu',
  // 其他同名多ID
  'whut': 'hust_wut', 'shu': 'nuaa_cqu',
};

function normalizeCat(cat) {
  return CATEGORY_NORMALIZE[cat] || cat;
}

// ==================== 日志 ====================
function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

// ==================== 构建数据源索引 ====================
function buildSourceIndex(records, sourceName, hasRank = true) {
  // 三级索引:
  // 1. 精确: (uni|prov|cat|year) → { minScore, minRank }
  // 2. 归一化: (uni|prov|normCat|year) → { minScore, minRank, origCat }
  // 3. 忽略类别: (uni|prov|year) → minScore (跨类别最低分)
  const exact = {};
  const normalized = {};
  const byCombo = {};
  
  records.forEach(r => {
    const year = r.year;
    const exactKey = `${r.universityId}|${r.province}|${r.category}|${year}`;
    const normCat = normalizeCat(r.category);
    const normKey = `${r.universityId}|${r.province}|${normCat}|${year}`;
    const comboKey = `${r.universityId}|${r.province}|${year}`;
    
    // 精确索引
    if (!exact[exactKey] || r.minScore < exact[exactKey].minScore) {
      exact[exactKey] = { minScore: r.minScore, minRank: r.minRank || 0, source: sourceName };
    }
    
    // 归一化索引（取该归一化类别的最低分）
    if (!normalized[normKey] || r.minScore < normalized[normKey].minScore) {
      normalized[normKey] = { minScore: r.minScore, minRank: r.minRank || 0, source: sourceName };
    }
    
    // 忽略类别索引（取该组合的最低分）
    if (!byCombo[comboKey] || r.minScore < byCombo[comboKey].minScore) {
      byCombo[comboKey] = { minScore: r.minScore, minRank: r.minRank || 0, source: sourceName };
    }
  });
  
  return { exact, normalized, byCombo };
}

// ==================== 加载 dxsbb 数据 ====================
function loadDxsbbData() {
  if (!fs.existsSync(DXSBB_FILE)) return [];
  const raw = JSON.parse(fs.readFileSync(DXSBB_FILE, 'utf-8'));
  log(`dxsbb 原始记录: ${raw.length}`);
  
  // 聚合到 (uni, prov, year, category) 级别
  const grouped = {};
  raw.forEach(r => {
    const cat = r.category || '物理类';
    const key = `${r.universityId}|${r.province}|${cat}|${r.year}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });
  
  const aggregated = [];
  Object.entries(grouped).forEach(([key, recs]) => {
    const scores = recs.map(r => r.minScore).filter(s => s > 0);
    if (scores.length === 0) return;
    const [uniId, prov, cat, yearStr] = key.split('|');
    aggregated.push({
      universityId: uniId,
      province: prov,
      category: cat,
      year: parseInt(yearStr),
      minScore: Math.min(...scores),
      minRank: 0,
    });
  });
  
  log(`dxsbb 聚合后: ${aggregated.length}`);
  return aggregated;
}

// ==================== 主流程 ====================
async function main() {
  log('=== 终极整合：最大化替换假数据 ===\n');
  
  // 1. 加载数据
  const existingScores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf-8'));
  log(`scores.json: ${existingScores.length} 条`);
  
  const samescore = JSON.parse(fs.readFileSync(SAMESCORE_FILE, 'utf-8'));
  log(`samescore3: ${samescore.length} 条`);
  
  const schoolInfo = JSON.parse(fs.readFileSync(SCHOOL_INFO_FILE, 'utf-8'));
  log(`school-info: ${schoolInfo.length} 条`);
  
  const dxsbb = loadDxsbbData();
  log(`dxsbb: ${dxsbb.length} 条\n`);
  
  // 2. 构建索引（优先级：eol-api > samescore3 > school-info > dxsbb）
  // school-info 中已有 minScore 但无 rank
  const scIndex = buildSourceIndex(samescore, 'eol:samescore3', true);
  const siIndex = buildSourceIndex(schoolInfo, 'school-info', false);
  const dxIndex = buildSourceIndex(dxsbb, 'dxsbb', false);
  
  // 3. 统计整合前
  const beforeUnknown = existingScores.filter(r => !r.source || r.source === 'unknown').length;
  log(`整合前 unknown: ${beforeUnknown}`);
  
  // 4. 处理每条记录
  let stats = { exact: 0, normCat: 0, anyCat: 0, skipped: 0, notFound: 0 };
  
  const newScores = existingScores.map(record => {
    const year = record.year;
    const cat = record.category;
    const normCat = normalizeCat(cat);
    
    // 已有来源则跳过
    if (record.source && record.source !== 'unknown') {
      stats.skipped++;
      return record;
    }
    
    // 获取主ID（处理 *2 别名和同名多ID）
    const primaryId = UNI_ALIAS[record.universityId] || record.universityId;
    
    // 构建 key（用主ID和原始ID都试）
    const idsToTry = [record.universityId];
    if (primaryId !== record.universityId) idsToTry.push(primaryId);
    
    let match = null;
    let matchType = null;
    
    for (const uid of idsToTry) {
      const exactKey = `${uid}|${record.province}|${cat}|${year}`;
      const normKey = `${uid}|${record.province}|${normCat}|${year}`;
      const comboKey = `${uid}|${record.province}|${year}`;
      
      // 匹配优先级：精确类别 > 归一化类别 > 忽略类别
      // 数据源优先级：samescore3(有rank) > school-info(无rank) > dxsbb
      
      // 尝试从 samescore3 精确匹配
      if (scIndex.exact[exactKey]) {
        match = scIndex.exact[exactKey];
        matchType = 'exact:sc';
      } else if (scIndex.normalized[normKey]) {
        match = scIndex.normalized[normKey];
        matchType = 'norm:sc';
      } else if (siIndex.exact[exactKey]) {
        match = siIndex.exact[exactKey];
        matchType = 'exact:si';
      } else if (siIndex.normalized[normKey]) {
        match = siIndex.normalized[normKey];
        matchType = 'norm:si';
      } else if (dxIndex.exact[exactKey]) {
        match = dxIndex.exact[exactKey];
        matchType = 'exact:dx';
      } else if (dxIndex.normalized[normKey]) {
        match = dxIndex.normalized[normKey];
        matchType = 'norm:dx';
      }
      
      // 还没找到：尝试忽略类别匹配（用 combo 最低分）
      if (!match) {
        if (scIndex.byCombo[comboKey]) {
          match = scIndex.byCombo[comboKey];
          matchType = 'any:sc';
        } else if (siIndex.byCombo[comboKey]) {
          match = siIndex.byCombo[comboKey];
          matchType = 'any:si';
        } else if (dxIndex.byCombo[comboKey]) {
          match = dxIndex.byCombo[comboKey];
          matchType = 'any:dx';
        }
      }
      
      if (match) break;
    }
    
    // 添加别名标记到 source
    if (match && primaryId !== record.universityId) {
      match = { ...match, source: match.source + ':alias' };
    }
    
    if (match && match.minScore > 0) {
      if (matchType.startsWith('exact') || matchType.startsWith('norm')) {
        // 有类别匹配的，可以用原始 rank
        stats[matchType.startsWith('exact') ? 'exact' : 'normCat']++;
      } else {
        stats.anyCat++;
      }
      
      return {
        ...record,
        minScore: Math.min(record.minScore > 0 ? record.minScore : Infinity, match.minScore),
        minRank: match.minRank > 0 ? match.minRank : record.minRank,
        source: match.source + (matchType.includes('any') ? ':anycat' : matchType.includes('norm') ? ':fuzzy' : '')
      };
    }
    
    stats.notFound++;
    return record;
  });
  
  // 5. 输出结果
  log('\n=== 整合结果 ===');
  log(`精确(相同类别)匹配: ${stats.exact}`);
  log(`归一化(同类不同名)匹配: ${stats.normCat}`);
  log(`忽略类别(学校最低分)匹配: ${stats.anyCat}`);
  log(`已有来源跳过: ${stats.skipped}`);
  log(`未匹配: ${stats.notFound}`);
  
  const afterUnknown = newScores.filter(r => !r.source || r.source === 'unknown').length;
  log(`\n整合前 unknown: ${beforeUnknown}`);
  log(`整合后 unknown: ${afterUnknown}`);
  log(`减少: ${beforeUnknown - afterUnknown}`);
  log(`总填充: ${newScores.length - afterUnknown}`);
  
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
    const unk = stats['unknown'] || 0;
    const pct = Math.round((stats.total || Object.values(stats).reduce((a,b)=>a+b,0) - unk) / (stats.total || Object.values(stats).reduce((a,b)=>a+b,0)) * 100) || 0;
    // 重新计算
    let total = 0, filled = 0;
    Object.entries(stats).forEach(([k,v]) => {
      total += v;
      if (k !== 'unknown') filled += v;
    });
    log(`  ${year}: ${total} 条, 已填充 ${filled} (${Math.round(filled/total*100)}%), unknown ${unk}`);
  });
  
  const totalFilled = newScores.length - afterUnknown;
  log(`\n总计已填充: ${totalFilled}/${newScores.length} (${Math.round(totalFilled/newScores.length*100)}%)`);
  
  // 7. 保存
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(existingScores, null, 2), 'utf-8');
  log(`\n备份到: ${BACKUP_FILE}`);
  
  fs.writeFileSync(SCORES_FILE, JSON.stringify(newScores, null, 2), 'utf-8');
  log(`保存到: ${SCORES_FILE}`);
}

main().catch(e => {
  log(`错误: ${e.message}`);
  console.error(e);
});
