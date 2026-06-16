/**
 * 改进版文本解析器：从 dxsbb 文本格式文章中提取录取数据
 * 测试北京大学文章
 */
const axios = require('axios');
const cheerio = require('cheerio');

const PROVINCES = /(北京|天津|河北|山西|内蒙古|辽宁|吉林|黑龙江|上海|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|广西|海南|重庆|四川|贵州|云南|西藏|陕西|甘肃|青海|宁夏|新疆)/g;

async function main() {
  const url = 'https://www.dxsbb.com/news/31641.html'; // 清华大学
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' },
    timeout: 10000
  });
  const $ = cheerio.load(res.data);
  const text = ($('.content').text() || $('#article .content').text() || '').trim();
  
  // Split into year sections
  const yearSections = text.split(/(?=(?:二|三|四|五)、)/);
  console.log(`Year sections: ${yearSections.length}\n`);
  
  for (const section of yearSections) {
    if (!section.trim()) continue;
    
    // Extract year from section header
    const yearMatch = section.match(/(20\d{2})年/);
    if (!yearMatch) continue;
    const year = parseInt(yearMatch[1]);
    if (year < 2021 || year > 2025) continue;
    
    console.log(`\n=== ${year}年 ===`);
    
    // Find batch sections (本科一批, 提前批, etc.)
    const batchSections = section.split(/(?=\*\*?[^*]+\*\*?)/);
    
    for (const batch of batchSections) {
      const isMainBatch = batch.includes('一批') || batch.includes('普通批') || batch.includes('统招') || batch.includes('本科批');
      if (!isMainBatch) continue; // Only care about main batch
      
      // Extract province-score pairs
      const provScores = extractProvinceScores(batch);
      console.log(`  Main batch: ${provScores.length} provinces`);
      provScores.slice(0, 5).forEach(r => console.log(`    ${r.province}: ${r.scores.join(', ')}`));
      if (provScores.length > 5) console.log(`    ... and ${provScores.length - 5} more`);
    }
  }
}

function extractProvinceScores(text) {
  // Strategy: find province names and the numbers that follow them
  const results = [];
  const clean = text.replace(/\s+/g, '');
  
  // Find all matches: Province followed by category/group and numbers
  let match;
  const provPattern = /(北京|天津|河北|山西|内蒙古|辽宁|吉林|黑龙江|上海|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|广西|海南|重庆|四川|贵州|云南|西藏|陕西|甘肃|青海|宁夏|新疆)([^北京天津河北山西内蒙古辽宁吉林黑龙江上海江苏浙江安徽福建江西山东河南湖北湖南广东广西海南重庆四川贵州云南西藏陕西甘肃青海宁夏新疆]*?)(\d{3})/g;
  
  while ((match = provPattern.exec(clean)) !== null) {
    const prov = match[1];
    const context = match[2] || '';
    const score = parseInt(match[3]);
    
    // Skip if score is out of range
    if (score < 100 || score > 800) continue;
    
    results.push({ province: prov, context, score });
  }
  
  return results;
}

main().catch(e => console.error(e.message));