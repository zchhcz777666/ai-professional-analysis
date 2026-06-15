const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  };

  console.log('=== Test 1: dxsbb.com ===');
  try {
    const res = await axios.get('https://www.dxsbb.com/news/list_458.html', { headers, timeout: 10000 });
    const $ = cheerio.load(res.data);
    const links = [];
    $('a[href*="/news/"]').each((i, a) => {
      const href = $(a).attr('href');
      const text = $(a).text().trim();
      if (text.includes('录取分数线') || text.includes('录取分数')) {
        links.push({ text: text.substring(0, 60), href });
      }
    });
    console.log(`Matching links: ${links.length}`);
    links.slice(0, 5).forEach(l => console.log(`  ${l.text}: ${l.href}`));
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  console.log('\n=== Test 2: chsi wap API ===');
  const endpoints = [
    '/wap/sch/score/3/11/2024',
    '/wap/sch/lqfs/3/11/2024',
    '/wap/sch/admission/3/11/2024',
  ];
  for (const ep of endpoints) {
    try {
      const res = await axios.get(`https://gaokao.chsi.com.cn${ep}`, { 
        headers: { ...headers, 'Accept': 'application/json, text/plain, */*' },
        timeout: 5000 
      });
      console.log(`${ep}: ${res.status}, type=${typeof res.data}, len=${JSON.stringify(res.data).length}`);
    } catch (e) {
      console.log(`${ep}: ${e.response ? e.response.status : e.message}`);
    }
  }

  console.log('\n=== Test 3: chsi score page (static check) ===');
  try {
    const res = await axios.get('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score', { 
      headers, timeout: 10000 
    });
    console.log(`Status: ${res.status}, HTML: ${res.data.length}`);
    console.log(`Contains score: ${res.data.includes('最低分')}`);
    
    // Look for JSON data in scripts
    const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let found = 0;
    while ((match = scriptPattern.exec(res.data)) !== null && found < 5) {
      const script = match[1];
      if (script.includes('score') || script.includes('全国') || script.includes('fenshu') || script.includes('admission')) {
        console.log(`Script with data: ${script.substring(0, 300)}`);
        found++;
      }
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  console.log('\nDone');
}

test().catch(e => console.error('Fatal:', e.message));