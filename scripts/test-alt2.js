const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  };

  // Test 1: Check if dxsbb.com has simple HTML tables
  console.log('=== Test 1: dxsbb.com 清华大学 录取分数线 ===');
  try {
    const res = await axios.get('https://www.dxsbb.com/news/10003.html', { 
      headers, timeout: 15000 
    });
    console.log(`Status: ${res.status}, HTML length: ${res.data.length}`);
    const $ = cheerio.load(res.data);
    
    // Check for tables
    const tables = [];
    $('table').each((i, tbl) => {
      const html = $(tbl).html().substring(0, 200);
      const headers = [];
      $(tbl).find('tr:first-child th, tr:first-child td').each((j, c) => headers.push($(c).text().trim()));
      if (headers.length > 0) {
        tables.push({ i, headers: headers.join(' | '), rows: $(tbl).find('tr').length, html });
      }
    });
    console.log(`Tables: ${tables.length}`);
    tables.forEach(t => console.log(`  Table ${t.i}: [${t.headers}] rows=${t.rows}`));

    // Check title
    console.log(`Title: ${$('title').text()}`);
    
    // Check for score-related content
    const body = $('body').text();
    if (body.includes('最低分') || body.includes('平均分')) {
      console.log('Page contains score data!');
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // Test 2: Check the list page for admission scores
  console.log('\n=== Test 2: dxsbb.com 录取分数线 list ===');
  try {
    const res = await axios.get('https://www.dxsbb.com/news/list_458.html', {
      headers, timeout: 15000
    });
    console.log(`Status: ${res.status}, HTML length: ${res.data.length}`);
    const $ = cheerio.load(res.data);
    
    // Find article links
    const links = [];
    $('a[href*="/news/"]').each((i, a) => {
      const href = $(a).attr('href');
      const text = $(a).text().trim();
      if (text.includes('录取分数线') || text.includes('录取分数')) {
        links.push({ text: text.substring(0, 60), href });
      }
    });
    console.log(`Matching links: ${links.length}`);
    links.slice(0, 10).forEach(l => console.log(`  ${l.text}: ${l.href}`));
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // Test 3: Try the chsi wap API with more parameters
  console.log('\n=== Test 3: Try chsi wap API ===');
  const apiTests = [
    'https://gaokao.chsi.com.cn/wap/sch/score/3/11/2024',
    'https://gaokao.chsi.com.cn/wap/sch/score?schId=3&provinceId=11&year=2024',
    'https://gaokao.chsi.com.cn/wap/sch/admission/3/11/2024',
    'https://gaokao.chsi.com.cn/wap/sch/lqfs/3/11/2024',
    'https://gaokao.chsi.com.cn/wap/sch/fenshu/3/11/2024',
  ];
  
  for (const url of apiTests) {
    try {
      const res = await axios.get(url, { 
        headers: { ...headers, 'Accept': 'application/json, text/plain, */*' },
        timeout: 8000 
      });
      const data = res.data;
      const type = typeof data;
      console.log(`${url}: status=${res.status}, type=${type}, len=${type === 'string' ? data.length : JSON.stringify(data).length}`);
      if (type === 'object') {
        console.log(`  Keys: ${Object.keys(data).join(', ')}`);
      } else if (type === 'string') {
        // Check if it contains JSON-like data
        if (data.startsWith('{') || data.startsWith('[')) {
          console.log(`  JSON-like: ${data.substring(0, 300)}`);
        }
      }
    } catch (e) {
      if (e.response) {
        console.log(`${url}: status=${e.response.status}`);
      }
    }
  }

  // Test 4: Try the score page with different categoryId
  console.log('\n=== Test 4: Try different categoryId URLs ===');
  const catUrls = [
    'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3,categoryId-36650,mindex-1.dhtml',
    'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3,categoryId-36655,mindex-2.dhtml',
  ];
  for (const url of catUrls) {
    try {
      const res = await axios.get(url, { headers, timeout: 10000 });
      const $ = cheerio.load(res.data);
      const title = $('title').text();
      const tables = $('table').length;
      console.log(`${url.substring(0, 80)}...: status=${res.status}, title=${title}, tables=${tables}`);
    } catch (e) {
      console.log(`${url.substring(0, 80)}...: ${e.message}`);
    }
  }
}

test();