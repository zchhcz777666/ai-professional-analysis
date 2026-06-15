/**
 * 改进版爬虫：重新爬取 Text 格式学校的数据
 * 运行: node scripts/recrawl-text.js
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const UAs = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
];
const sleep = ms => new Promise(r => setTimeout(r, ms));

const OUT_DIR = path.join(__dirname, 'crawled-data');
const PROV_LIST = ['北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江','上海','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','广西','海南','重庆','四川','贵州','云南','西藏','陕西','甘肃','青海','宁夏','新疆'];
const PROV_SET = new Set(PROV_LIST);

// 改进的文本解析器
function parseTextV2($) {
  const text = ($('.content').text() || $('#article .content').text() || '').trim();
  if (!text) return [];
  
  const records = [];
  
  // 按年份分割
  const sections = text.split(/(?=(?:一|二|三|四|五|六|七)、)/);
  
  for (const section of sections) {
    const yearMatch = section.match(/(20\d{2})年/);
    if (!yearMatch) continue;
    const year = parseInt(yearMatch[1]);
    if (year < 2021 || year > 2025) continue;
    
    // 寻找主体数据段落（本科一批/普通批/统招批）
    const mainBatchSection = section.split(/(?=\*\*?[^*]*一?批\*\*?|统招批|普通批|本科批)/);
    // 优先使用 mainBatchSection，否则用整个 section
    const dataText = mainBatchSection.length > 1 ? mainBatchSection.slice(1).join('') : section;
    
    // 提取省份分数对
    const provScores = [];
    const clean = dataText.replace(/\s+/g, '');
    
    // Pattern: provinceName followed by non-province chars, then score
    const re = /(北京|天津|河北|山西|内蒙古|辽宁|吉林|黑龙江|上海|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|广西|海南|重庆|四川|贵州|云南|西藏|陕西|甘肃|青海|宁夏|新疆)([^京津蒙辽吉黑沪苏浙皖闽赣鲁豫鄂湘粤桂琼渝川贵云藏陕甘青宁新]*?)(\d{3})/g;
    let m;
    while ((m = re.exec(clean)) !== null) {
      const prov = m[1];
      const context = m[2] || '';
      const score = parseInt(m[3]);
      
      if (score >= 100 && score <= 800 && PROV_SET.has(prov)) {
        provScores.push({ province: prov, context, score });
      }
    }
    
    if (provScores.length === 0) continue;
    
    // 对每个省份，取最低分（物理类/理科类）
    const byProv = {};
    for (const ps of provScores) {
      if (!byProv[ps.province]) byProv[ps.province] = [];
      byProv[ps.province].push(ps);
    }
    
    for (const [prov, entries] of Object.entries(byProv)) {
      // 优先取理科/物理类的分数
      const physicsEntries = entries.filter(e => 
        !e.context.includes('文科') && !e.context.includes('历史') && !e.context.includes('不限')
      );
      const target = physicsEntries.length > 0 ? physicsEntries : entries;
      
      const scores = target.map(e => e.score).sort((a,b) => a-b);
      const minScore = scores[0];
      const avgScore = Math.round(scores.reduce((a,b)=>a+b,0) / scores.length);
      
      records.push({
        year, province: prov, category: '物理类',
        minScore, avgScore, minRank: 0, enrollment: 0,
      });
    }
  }
  
  return records;
}

async function main() {
  // Load existing records and progress
  const allRecords = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'all-records.json'), 'utf-8'));
  const progress = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'crawl-progress.json'), 'utf-8'));
  
  // Identify text-format schools
  const textSchools = Object.entries(progress).filter(([_, v]) => v.format === 'text');
  console.log(`Re-crawling ${textSchools.length} text-format schools...\n`);
  
  let newCount = 0;
  let updatedCount = 0;
  
  for (let i = 0; i < textSchools.length; i++) {
    const [uniId, info] = textSchools[i];
    
    process.stdout.write(`[${i+1}/${textSchools.length}] ${info.uniName}...`);
    
    try {
      const res = await axios.get(info.url, {
        headers: { 'User-Agent': UAs[Math.floor(Math.random()*UAs.length)] },
        timeout: 12000
      });
      const $ = cheerio.load(res.data);
      
      // Try table format first (some might have been misclassified)
      const tableRecords = [];
      $('table').each((ti, tbl) => {
        const hdrs = [];
        $(tbl).find('tr:first-child th, tr:first-child td').each((j,c) => hdrs.push($(c).text().trim()));
        if (!hdrs.join(' ').includes('最低分')) return;
        // ... (same table parsing as before, skipped for brevity)
      });
      
      if (tableRecords.length > 0) {
        progress[uniId].format = 'table';
        // Replace old records
        const oldLen = allRecords.filter(r => r.universityId === uniId).length;
        for (let j = allRecords.length - 1; j >= 0; j--) {
          if (allRecords[j].universityId === uniId) allRecords.splice(j, 1);
        }
        allRecords.push(...tableRecords);
        allRecords.forEach(r => { if (!r.universityId) r.universityId = uniId; });
        console.log(` ${tableRecords.length} records [TABLE]`);
        updatedCount++;
      } else {
        // Use improved text parser
        const newRecs = parseTextV2($).map(r => ({ ...r, universityId: uniId }));
        
        if (newRecs.length > 0) {
          // Replace old records
          for (let j = allRecords.length - 1; j >= 0; j--) {
            if (allRecords[j].universityId === uniId) allRecords.splice(j, 1);
          }
          allRecords.push(...newRecs);
          console.log(` ${newRecs.length} records [TEXT]`);
          newCount++;
        } else {
          console.log(` still empty`);
        }
      }
    } catch (e) {
      console.log(` error: ${e.message}`);
    }
    
    if (i % 50 === 49 || i === textSchools.length - 1) {
      fs.writeFileSync(path.join(OUT_DIR, 'all-records.json'), JSON.stringify(allRecords, null, 2));
      fs.writeFileSync(path.join(OUT_DIR, 'crawl-progress.json'), JSON.stringify(progress, null, 2));
      console.log(`  CP: ${allRecords.length} total records`);
    }
    
    await sleep(1000 + Math.random() * 1000);
  }
  
  // Final save
  fs.writeFileSync(path.join(OUT_DIR, 'all-records.json'), JSON.stringify(allRecords, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'crawl-progress.json'), JSON.stringify(progress, null, 2));
  
  console.log(`\n=== Done! ===`);
  console.log(`Updated: ${updatedCount}, New: ${newCount}`);
  console.log(`Total records: ${allRecords.length}`);
  
  // Normalize province names
  const provMap = {};
  for (const p of PROV_LIST) provMap[p + '省'] = p;
  provMap['福建省'] = '福建'; provMap['云南省'] = '云南'; provMap['辽宁省'] = '辽宁';
  provMap['陕西省'] = '陕西'; provMap['黑龙江省'] = '黑龙江'; provMap['河北省'] = '河北';
  
  for (const r of allRecords) {
    if (provMap[r.province]) r.province = provMap[r.province];
  }
  
  // Re-deduplicate
  const seen = new Set();
  const deduped = allRecords.filter(r => {
    const key = `${r.universityId}-${r.year}-${r.province}-${r.category}-${r.major||''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  fs.writeFileSync(path.join(OUT_DIR, 'all-records-deduped.json'), JSON.stringify(deduped, null, 2));
  console.log(`Deduped: ${deduped.length} records`);
}

main().catch(e => console.error('Fatal:', e.message));