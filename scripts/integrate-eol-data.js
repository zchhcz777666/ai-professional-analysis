const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const EOL_DATA_FILE = path.join(__dirname, 'crawled-data', 'eol-2025-records.json');
const SCORES_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json');
const BACKUP_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json.bak');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json');

// ==================== 主流程 ====================
async function main() {
  console.log('=== 整合 eol.cn 2025 数据到 scores.json ===\n');
  
  // 1. 加载数据
  const eolData = JSON.parse(fs.readFileSync(EOL_DATA_FILE, 'utf-8'));
  const existingScores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf-8'));
  
  console.log('EOL data records:', eolData.length);
  console.log('Existing scores records:', existingScores.length);
  
  // 2. 分析现有2025年数据
  const s25 = existingScores.filter(r => r.year === 2025);
  const s25BySource = {};
  s25.forEach(r => {
    const src = r.source || 'unknown';
    if (!s25BySource[src]) s25BySource[src] = { count: 0, unis: new Set() };
    s25BySource[src].count++;
    s25BySource[src].unis.add(r.universityId);
  });
  console.log('\n现有2025年数据分布:');
  Object.entries(s25BySource).sort((a,b)=>b[1].count-a[1].count).forEach(([s, info]) => {
    console.log('  ' + s + ': ' + info.count + '条, ' + info.unis.size + '校');
  });
  
  // 3. 构建 eol 数据的 key (universityId+province+category)
  const eolKeyMap = {};
  eolData.forEach(r => {
    const key = r.universityId + '|' + r.province + '|' + r.category;
    if (!eolKeyMap[key] || eolKeyMap[key].minScore === 0) {
      eolKeyMap[key] = { minScore: r.minScore, minRank: r.minRank };
    }
  });
  console.log('\nEOL数据去重后 (universityId+province+category):', Object.keys(eolKeyMap).length);
  
  // 4. 处理现有数据：替换 unknown 来源的记录
  let replaced = 0;
  let added = 0;
  let kept = 0;
  
  const newScores = existingScores.map(record => {
    if (record.year !== 2025) return record;
    
    const key = record.universityId + '|' + record.province + '|' + record.category;
    const eolMatch = eolKeyMap[key];
    
    if (record.source && record.source.startsWith('eol')) {
      // 已有 eol 数据，保留
      kept++;
      return record;
    }
    
    if (eolMatch && eolMatch.minScore > 0) {
      // 替换 unknown 记录
      replaced++;
      return {
        ...record,
        minScore: eolMatch.minScore,
        minRank: eolMatch.minRank > 0 ? eolMatch.minRank : record.minRank,
        source: 'eol:samescore3'
      };
    }
    return record;
  });
  
  console.log('\n=== 整合结果 ===');
  console.log('保留(已有eol):', kept);
  console.log('替换(unknown->eol):', replaced);
  
  // 5. 统计整合后2025年数据
  const newS25 = newScores.filter(r => r.year === 2025);
  const newSources = {};
  newS25.forEach(r => {
    const src = r.source || 'unknown';
    newSources[src] = (newSources[src] || 0) + 1;
  });
  console.log('\n整合后2025年数据分布:');
  Object.entries(newSources).sort((a,b)=>b[1]-a[1]).forEach(([s, c]) => {
    console.log('  ' + s + ': ' + c + '条');
  });
  console.log('2025年总记录:', newS25.length);
  
  // 6. 备份并保存
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(existingScores, null, 2), 'utf-8');
  console.log('\n备份到:', BACKUP_FILE);
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(newScores, null, 2), 'utf-8');
  console.log('保存到:', OUTPUT_FILE);
  
  // 7. 列出未匹配的学校
  const eolUnis = new Set(eolData.map(r => r.universityId));
  const allUnis = new Set(existingScores.map(r => r.universityId));
  const missingUnis = [...allUnis].filter(id => !eolUnis.has(id));
  console.log('\n未在eol中找到的学校(' + missingUnis.length + '所):');
  console.log(missingUnis.join(', '));
}

main().catch(console.error);
