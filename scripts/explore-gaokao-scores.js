const axios = require('axios');
const fs = require('fs');

async function main() {
  console.log('=== 探索更多 gaokao.cn 学校分数 API ===\n');

  // 1. Try static-data for school-specific score data
  console.log('1. School-specific score APIs:');
  const patterns = [
    // School main data
    { name: 'school main', url: 'https://static-data.gaokao.cn/www/2.0/school/140/main.json' },
    { name: 'school base', url: 'https://static-data.gaokao.cn/www/2.0/school/140/base.json' },
    // Score patterns
    { name: 'school/score', url: 'https://static-data.gaokao.cn/www/2.0/school/140/score.json' },
    { name: 'school/score/2025', url: 'https://static-data.gaokao.cn/www/2.0/school/140/score/2025.json' },
    { name: 'schoolscore/140', url: 'https://static-data.gaokao.cn/www/2.0/schoolscore/140.json' },
    { name: 'schoolscore/140/2025', url: 'https://static-data.gaokao.cn/www/2.0/schoolscore/140/2025.json' },
    { name: 'scoreline/140', url: 'https://static-data.gaokao.cn/www/2.0/scoreline/140.json' },
    // School special score (major-level)
    { name: 'schoolspecialscore/140', url: 'https://static-data.gaokao.cn/www/2.0/schoolspecialscore/140.json' },
    { name: 'schoolspecialscore/140/2025', url: 'https://static-data.gaokao.cn/www/2.0/schoolspecialscore/140/2025.json' },
    { name: 'schoolspecialscore/140/2025/11', url: 'https://static-data.gaokao.cn/www/2.0/schoolspecialscore/140/2025/11.json' },
    // Another pattern - score by province
    { name: 'pcscore/140/2025', url: 'https://static-data.gaokao.cn/www/2.0/pcscore/140/2025.json' },
    { name: 'schoolprovince/140', url: 'https://static-data.gaokao.cn/www/2.0/schoolprovince/140.json' },
    // Try gkcx subdomain
    { name: 'gkcx school score', url: 'https://static-gkcx.gaokao.cn/www/2.0/json/school/140/score.json' },
    { name: 'gkcx scoreline', url: 'https://static-gkcx.gaokao.cn/www/2.0/json/scoreline/140.json' },
    // Province score lines
    { name: 'province/11/2025', url: 'https://static-data.gaokao.cn/www/2.0/province/11/2025.json' },
    { name: 'province/11', url: 'https://static-data.gaokao.cn/www/2.0/province/11.json' },
    // Try different year format
    { name: 'school/140/2025', url: 'https://static-data.gaokao.cn/www/2.0/school/140/2025.json' },
  ];

  for (const p of patterns) {
    try {
      const r = await axios.get(p.url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const s = JSON.stringify(r.data).substring(0, 400);
      console.log(`  ${p.name}: status=${r.status}, ${s.substring(0, 250)}`);
    } catch (e) {
      // skip 404s
    }
  }

  // 2. Try the zjzw API with different auth approaches
  console.log('\n2. zjzw API - try different auth:');
  const bodyVariants = [
    { uri: 'v1/maven/school/special/scoreline', school_id: 140, province_id: 11, year: 2025, page: 1, size: 50, platform: 2, autosign: '' },
    { uri: 'v1/maven/school/provinceline', school_id: 140, province_id: 11, year: 2025, platform: 2, autosign: '' },
  ];
  
  for (const params of bodyVariants) {
    try {
      const r = await axios({
        method: 'POST',
        url: `https://api-gaokao.zjzw.cn/apidata/web`,
        params: { ...params },
        headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      });
      console.log(`  ${params.uri}: code=${r.data.code}, ${JSON.stringify(r.data).substring(0, 400)}`);
    } catch (e) {
      console.log(`  ${params.uri}: ${e.response?.status || e.message}`);
    }
  }

  // 3. Try samescore API to understand data structure better
  console.log('\n3. samescore3 data structure:');
  try {
    const r = await axios.get('https://static-data.gaokao.cn/www/2.0/samescore3/2025/650.json', { 
      timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } 
    });
    const data = r.data.data;
    // Print structure
    const provs = Object.keys(data);
    console.log(`  Provinces: ${provs.length}`);
    // Print Beijing data (province 11)
    if (data['11']) {
      const types = Object.keys(data['11']);
      console.log(`  Beijing types: ${types.join(', ')}`);
      console.log(`  Beijing total records: ${Object.values(data['11']).reduce((sum, arr) => sum + arr.length, 0)}`);
      // Print sample
      Object.entries(data['11']).forEach(([type, items]) => {
        console.log(`  Type "${type}": ${items.length} schools`);
        items.slice(0, 3).forEach(item => console.log(`    ${item.name}: min=${item.min}, batch=${item.batch}, zslx=${item.zslx}`));
      });
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
}

main().catch(console.error);
