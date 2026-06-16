const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const out = [];

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  out.push('=== Test 1: dxsbb.com list ===');
  try {
    const res = await axios.get('https://www.dxsbb.com/news/list_458.html', { headers, timeout: 8000 });
    const $ = cheerio.load(res.data);
    const links = [];
    $('a[href*="/news/"]').each((i, a) => {
      const href = $(a).attr('href');
      const text = $(a).text().trim();
      if (text.includes('录取分数线') || text.includes('录取分数')) {
        links.push({ text: text.substring(0, 60), href });
      }
    });
    out.push(`Matching links: ${links.length}`);
    links.slice(0, 5).forEach(l => out.push(`  ${l.text}: ${l.href}`));
  } catch (e) {
    out.push(`Error: ${e.message}`);
  }

  out.push('\n=== Test 2: chsi wap API ===');
  const endpoints = [
    '/wap/sch/score/3/11/2024',
    '/wap/sch/lqfs/3/11/2024',
    '/wap/sch/admission/3/11/2024',
  ];
  for (const ep of endpoints) {
    try {
      const res = await axios.get(`https://gaokao.chsi.com.cn${ep}`, { 
        headers: { ...headers, 'Accept': 'application/json' },
        timeout: 5000 
      });
      out.push(`${ep}: ${res.status}, len=${JSON.stringify(res.data).length}`);
    } catch (e) {
      out.push(`${ep}: ${e.response ? e.response.status : 'ERR_' + e.message.substring(0, 30)}`);
    }
  }

  out.push('\n=== Test 3: chsi score page ===');
  try {
    const res = await axios.get('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score', { 
      headers, timeout: 8000 
    });
    out.push(`HTML length: ${res.data.length}`);
    out.push(`Contains '最低分': ${res.data.includes('最低分')}`);
    out.push(`Contains 'table': ${res.data.includes('<table')}`);
    
    // Check for API URL patterns in the page
    const urls = res.data.match(/['"](\/[a-z]+\/[a-z0-9\/]+)['"]/g);
    if (urls) {
      const uniqueUrls = [...new Set(urls)].filter(u => u.includes('score') || u.includes('admission'));
      out.push(`Score/admission URLs found: ${uniqueUrls.length}`);
      uniqueUrls.slice(0, 5).forEach(u => out.push(`  ${u}`));
    }
  } catch (e) {
    out.push(`Error: ${e.message}`);
  }

  out.push('\n=== Test 4: Simple axios GET test ===');
  try {
    const r = await axios.get('https://httpbin.org/get', { timeout: 5000 });
    out.push(`httpbin: ${r.status}`);
  } catch (e) {
    out.push(`httpbin: ${e.message}`);
  }

  out.push('\nDone');
  
  fs.writeFileSync('c:\\Users\\Administrator\\.trae-cn\\aizhuanyefengxi\\scripts\\test-output.txt', out.join('\n'), 'utf-8');
  console.log('Output written to test-output.txt');
}

test().catch(e => console.error('Fatal:', e.message));