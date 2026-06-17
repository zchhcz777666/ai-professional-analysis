const axios = require('axios');
const fs = require('fs');

async function testGaokaoCN() {
  console.log('=== 探索 www.gaokao.cn API ===\n');

  // 1. First get school list from static-data
  console.log('1. School list (static-data):');
  try {
    const r = await axios.get('https://static-data.gaokao.cn/www/2.0/school/name.json', { timeout: 15000 });
    const schools = r.data.data;
    console.log(`   Total: ${schools.length} schools`);
    // Find some known schools
    const targets = ['清华大学', '北京大学', '浙江大学', '上海交通大学'];
    targets.forEach(name => {
      const s = schools.find(x => x.name === name);
      if (s) console.log(`   ${name}: school_id=${s.school_id}, proid=${s.proid}`);
    });
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }

  // 2. Try gaokao.cn API endpoints for score data
  console.log('\n2. gaokao.cn API endpoints for scores:');
  
  const endpoints = [
    // Main gaokao.cn API
    { name: 'school detail', url: 'https://www.gaokao.cn/school/1/detail' },
    { name: 'school special', url: 'https://www.gaokao.cn/school/1/special' },
    { name: 'school score', url: 'https://www.gaokao.cn/school/1/score/11/2025' },
    { name: 'school provinceline', url: 'https://www.gaokao.cn/school/1/provinceline/11' },
    
    // API subdomain
    { name: 'api school detail', url: 'https://api.gaokao.cn/school/detail/1' },
    
    // REST API patterns
    { name: 'rest score', url: 'https://www.gaokao.cn/rest/score/school/1/11/2025' },
    { name: 'rest special', url: 'https://www.gaokao.cn/rest/special/scoreline/1/11/2025' },
    { name: 'rest plan', url: 'https://www.gaokao.cn/rest/plan/school/1/2025/11' },
  ];

  for (const ep of endpoints) {
    try {
      const r = await axios.get(ep.url, { 
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json, text/html, */*' },
        timeout: 10000 
      });
      const data = typeof r.data === 'object' ? JSON.stringify(r.data).substring(0, 300) : (r.data || '').substring(0, 200);
      console.log(`   ${ep.name}: status=${r.status}, ${data}`);
    } catch (e) {
      console.log(`   ${ep.name}: ${e.response?.status || e.message}`);
    }
  }

  // 3. Find API by loading the gaokao.cn school page and checking JS
  console.log('\n3. 分析 www.gaokao.cn/school/1 页面:');
  try {
    const r = await axios.get('https://www.gaokao.cn/school/1', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    const html = r.data;
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    console.log(`   Title: ${$('title').text()}`);

    // Look for Next.js data
    const nextData = html.match(/__NEXT_DATA__\s*=\s*({[\s\S]*?});<\/script>/);
    if (nextData) {
      try {
        const parsed = JSON.parse(nextData[1]);
        console.log(`   __NEXT_DATA__ found, props keys: ${Object.keys(parsed.props || {}).join(', ')}`);
        const pageProps = JSON.stringify(parsed.props).substring(0, 500);
        console.log(`   Preview: ${pageProps}`);
      } catch(e) {
        console.log(`   __NEXT_DATA__ parse error: ${e.message}`);
      }
    } else {
      console.log('   No __NEXT_DATA__ found');
    }
    
    // Look for script src
    const scripts = [];
    $('script[src]').each((i, s) => scripts.push($(s).attr('src')));
    console.log(`   Scripts: ${scripts.length}`);
    scripts.filter(s => s.includes('chunk') || s.includes('api')).slice(0, 5).forEach(s => console.log(`   ${s}`));
    
    // Look for API calls in inline scripts
    const inlineScripts = [];
    $('script:not([src])').each((i, s) => {
      const txt = $(s).html() || '';
      if (txt.includes('fetch') || txt.includes('axios') || txt.includes('api/')) {
        inlineScripts.push(txt.substring(0, 500));
      }
    });
    console.log(`   Inline scripts with API calls: ${inlineScripts.length}`);
    inlineScripts.slice(0, 3).forEach((s, i) => console.log(`   [${i}] ${s}`));
    
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }

  // 4. Try static-data APIs for score data
  console.log('\n4. static-data.gaokao.cn score endpoints:');
  const staticEndpoints = [
    { name: 'school name index', url: 'https://static-data.gaokao.cn/www/2.0/school/name.json' },
    { name: 'province list', url: 'https://static-data.gaokao.cn/www/2.0/province.json' },
    { name: 'school/1/2025', url: 'https://static-data.gaokao.cn/www/2.0/school/1/2025.json' },
    { name: 'school/1/2025/11', url: 'https://static-data.gaokao.cn/www/2.0/school/1/2025/11.json' },
    // score related
    { name: 'score/1/2025', url: 'https://static-data.gaokao.cn/www/2.0/score/1/2025.json' },
    { name: 'score/1/2025/11', url: 'https://static-data.gaokao.cn/www/2.0/score/1/2025/11.json' },
    { name: 'special/1/2025', url: 'https://static-data.gaokao.cn/www/2.0/special/1/2025.json' },
    { name: 'special/1/2025/11', url: 'https://static-data.gaokao.cn/www/2.0/special/1/2025/11.json' },
    { name: 'scoreline/1/2025', url: 'https://static-data.gaokao.cn/www/2.0/scoreline/1/2025.json' },
    { name: 'scoreline/1/2025/11', url: 'https://static-data.gaokao.cn/www/2.0/scoreline/1/2025/11.json' },
    // school special scoreline
    { name: 'schoolspecialscore/1/2025', url: 'https://static-data.gaokao.cn/www/2.0/schoolspecialscore/1/2025.json' },
    { name: 'schoolspecialscore/1/2025/11', url: 'https://static-data.gaokao.cn/www/2.0/schoolspecialscore/1/2025/11.json' },
    // plan
    { name: 'schoolspecialplan/1/2025/11', url: 'https://static-data.gaokao.cn/www/2.0/schoolspecialplan/1/2025/11.json' },
    // keyword search
    { name: 'schoolspecial/1/2025', url: 'https://static-data.gaokao.cn/www/2.0/schoolspecial/1/2025.json' },
  ];

  for (const ep of staticEndpoints) {
    try {
      const r = await axios.get(ep.url, { timeout: 10000 });
      const data = typeof r.data === 'object' ? JSON.stringify(r.data).substring(0, 400) : (r.data || '').substring(0, 200);
      console.log(`   ${ep.name}: status=${r.status}, ${data}`);
    } catch (e) {
      const status = e.response?.status || e.message;
      if (status !== 404 && status !== 'timeout of 10000ms exceeded') {
        console.log(`   ${ep.name}: ${status}`);
      }
    }
  }
}

testGaokaoCN().catch(console.error);
