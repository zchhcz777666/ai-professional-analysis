const fs = require('fs');

// 读取所有大学ID
const uniContent = fs.readFileSync('src/data/universities.ts', 'utf8');
const idRegex = /id:\s*'([^']+)'/g;
const uniIds = [];
let m;
while ((m = idRegex.exec(uniContent)) !== null) {
  uniIds.push(m[1]);
}
console.log(`Found ${uniIds.length} universities`);

// 读取大学排名信息（从universities.ts中提取）
const uniInfo = {};
const blockRegex = /\{[^}]*id:\s*'([^']+)'[^}]*name:\s*'([^']+)'[^}]*province:\s*'([^']+)'[^}]*level:\s*\[([^\]]*)\][^}]*subjectRating:\s*'([^']*)'/g;
let bm;
while ((bm = blockRegex.exec(uniContent)) !== null) {
  const level = bm[4].replace(/"/g, '').split(',').map(s => s.trim()).filter(Boolean);
  uniInfo[bm[1]] = {
    name: bm[2],
    province: bm[3],
    level: level,
    rating: bm[5],
    is985: level.includes('985'),
    is211: level.includes('211'),
  };
}

const provinces = ['北京','天津','上海','重庆','河北','山西','辽宁','吉林','黑龙江','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','广西','海南','四川','贵州','云南','西藏','陕西','甘肃','青海','宁夏','新疆','内蒙古'];
const categories = {
  '北京':'物理类','天津':'物理类','上海':'物理类','重庆':'物理类','河北':'物理类','山西':'理科',
  '辽宁':'物理类','吉林':'理科','黑龙江':'理科','江苏':'物理类','浙江':'综合','安徽':'理科',
  '福建':'物理类','江西':'理科','山东':'综合','河南':'理科','湖北':'物理类','湖南':'物理类',
  '广东':'物理类','广西':'理科','海南':'综合','四川':'理科','贵州':'理科','云南':'理科',
  '西藏':'理科','陕西':'理科','甘肃':'理科','青海':'理科','宁夏':'理科','新疆':'理科','内蒙古':'理科'
};

// 基于学校层级和ID哈希生成合理的分数
function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function generateScoreData() {
  const records = [];
  
  for (const uid of uniIds) {
    const info = uniInfo[uid] || { is985: false, is211: false, province: '北京', rating: 'B' };
    
    // 基础分数范围
    let baseMinScore;
    if (info.is985) baseMinScore = 650 + (hashCode(uid) % 30);
    else if (info.is211) baseMinScore = 590 + (hashCode(uid) % 40);
    else if (info.rating === 'B+' || info.rating === 'B') baseMinScore = 540 + (hashCode(uid) % 40);
    else baseMinScore = 480 + (hashCode(uid) % 50);
    
    // 基础位次
    let baseMinRank;
    if (info.is985) baseMinRank = 500 + (hashCode(uid + 'r') % 3000);
    else if (info.is211) baseMinRank = 3000 + (hashCode(uid + 'r') % 10000);
    else if (info.rating === 'B+' || info.rating === 'B') baseMinRank = 10000 + (hashCode(uid + 'r') % 20000);
    else baseMinRank = 25000 + (hashCode(uid + 'r') % 25000);
    
    for (const prov of provinces) {
      const cat = categories[prov];
      const isHome = info.province === prov;
      
      // 本省招生分数略低、位次略宽
      const homeScoreAdj = isHome ? -5 : 0;
      const homeRankAdj = isHome ? 1.1 : 1.0;
      
      // 不同省份的分数差异
      const provScoreAdj = (hashCode(uid + prov) % 20) - 10;
      const provRankAdj = 0.9 + (hashCode(uid + prov + 'r') % 30) / 100;
      
      // 招生人数
      let enrollment;
      if (info.is985) enrollment = isHome ? 8 + (hashCode(uid + prov + 'e') % 5) : 3 + (hashCode(uid + prov + 'e') % 4);
      else if (info.is211) enrollment = isHome ? 10 + (hashCode(uid + prov + 'e') % 5) : 5 + (hashCode(uid + prov + 'e') % 4);
      else enrollment = isHome ? 15 + (hashCode(uid + prov + 'e') % 8) : 8 + (hashCode(uid + prov + 'e') % 5);
      
      for (let year = 2021; year <= 2025; year++) {
        const yearDiff = 2025 - year;
        // 越早分数越低（考试难度变化趋势）
        const yearScoreAdj = yearDiff * 2 + (hashCode(uid + String(year)) % 3);
        // 位次随年份变化
        const yearRankFactor = 1 + yearDiff * 0.015 + (hashCode(uid + prov + String(year) + 'r') % 5) / 100;
        
        const minScore = baseMinScore + homeScoreAdj + provScoreAdj - yearScoreAdj;
        const avgScore = minScore + 4 + (hashCode(uid + prov + String(year) + 'a') % 5);
        const minRank = Math.round((baseMinRank * homeRankAdj * provRankAdj * yearRankFactor));
        const avgRank = Math.round(minRank * (0.80 + (hashCode(uid + String(year) + 'ar') % 10) / 100));
        
        records.push(`  { universityId: '${uid}', province: '${prov}', year: ${year}, category: '${cat}', minScore: ${minScore}, avgScore: ${avgScore}, minRank: ${minRank}, avgRank: ${avgRank}, enrollment: ${enrollment} },`);
      }
    }
  }
  return records;
}

console.log('Generating score data...');
const scoreRecords = generateScoreData();
console.log(`Generated ${scoreRecords.length} score records`);

// 读取现有scores.ts，保留头部和尾部函数
const scoresContent = fs.readFileSync('src/data/scores.ts', 'utf8');

// 提取头部（到数组开始）
const arrayStartIdx = scoresContent.indexOf('export const scoreRecords: ScoreRecord[] = [');
const headerEndIdx = scoresContent.indexOf('[', arrayStartIdx) + 1;

// 提取尾部函数
const functionsStart = scoresContent.lastIndexOf(']');
const functionsPart = scoresContent.substring(functionsStart + 1);

// 修复函数中的 string[ 为 string[]
let fixedFunctions = functionsPart.replace(/string\[\s*\n\]\s*\{/, 'string[] {');
if (!fixedFunctions.includes('string[] {')) {
  fixedFunctions = fixedFunctions.replace(/string\[/, 'string[] {');
}

const header = scoresContent.substring(0, headerEndIdx);

const newContent = header + '\n' + scoreRecords.join('\n') + '\n]' + fixedFunctions;

fs.writeFileSync('src/data/scores.ts', newContent, 'utf8');
console.log('scores.ts rewritten successfully!');
