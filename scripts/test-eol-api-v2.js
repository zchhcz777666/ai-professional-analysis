const axios = require('axios');

async function testEolApi() {
  console.log('=== 测试 eol.cn 不同 API 版本 ===\n');

  // Try different API paths/versions
  const tests = [
    // Version 2 API
    { name: 'v2 school list', url: 'https://api.eol.cn/gkcx/api?v=2&uri=apidata/api/gk/school/schoolList&page=1&size=5' },
    { name: 'v2 score', url: 'https://api.eol.cn/gkcx/api?v=2&uri=apidata/api/gk/school/special/scoreline&school_id=1&province_id=11&year=2025' },
    { name: 'no version', url: 'https://api.eol.cn/gkcx/api?uri=apidata/api/gk/school/schoolList&page=1&size=5' },
    
    // Try gkcx.eol.cn directly (the web interface)
    { name: 'gkcx school page', url: 'https://gkcx.eol.cn/school/1/special' },
    { name: 'gkcx provinceline', url: 'https://gkcx.eol.cn/school/1/provinceline/' },
    
    // Try the new eol.cn API pattern (可能已迁移)
    { name: 'new api school', url: 'https://api.eol.cn/rest/search/school?keyword=清华&page=1&size=5' },
    { name: 'new api score', url: 'https://api.eol.cn/rest/score/school/1/11/2025' },
    
    // Try mobile API
    { name: 'mobile school detail', url: 'https://m.eol.cn/api/school/detail?id=1' },
    { name: 'mobile score', url: 'https://m.eol.cn/api/score/school/1/11/2025' },
    
    // 试试其他 eol 子域名
    { name: 'data.eol school list', url: 'https://data.eol.cn/api/school/list?page=1&size=5' },
  ];

  for (const test of tests) {
    try {
      const r = await axios.get(test.url, { 
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json, text/html, */*' },
        timeout: 10000 
      });
      const data = typeof r.data === 'object' ? JSON.stringify(r.data).substring(0, 300) : (r.data || '').substring(0, 300);
      console.log(`${test.name}: status=${r.status}, ${data}`);
    } catch (e) {
      const status = e.response?.status || e.message;
      const body = e.response?.data ? JSON.stringify(e.response.data).substring(0, 100) : '';
      console.log(`${test.name}: ${status} ${body}`);
    }
  }

  // Try fetching the gkcx.eol.cn page and extracting API endpoints from it
  console.log('\n=== gkcx.eol.cn school page analysis ===');
  try {
    const r = await axios.get('https://gkcx.eol.cn/school/1/special', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    const html = r.data;
    // Look for __NUXT__ or __INITIAL_STATE__ data
    const nuxt = html.match(/window\.__NUXT__\s*=\s*({[\s\S]*?});/);
    if (nuxt) console.log('__NUXT__ found:', nuxt[1].substring(0, 500));
    else console.log('No __NUXT__ found');
    
    // Look for API URLs in scripts
    const apiUrls = html.match(/["']https?:\/\/[^"']*(?:api|score|admission)[^"']*["']/gi);
    if (apiUrls) {
      console.log('\nAPI URLs found:');
      [...new Set(apiUrls)].slice(0, 10).forEach(u => console.log(`  ${u}`));
    }
    
    // Try to find school_id list from page
    const schoolIds = html.match(/school_id[=:]\d+/g);
    if (schoolIds) console.log('\nSchool IDs:', [...new Set(schoolIds)].slice(0, 10));
    
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // Try the web scraping approach - get school list from gkcx.eol.cn
  console.log('\n=== 尝试从 gkcx.eol.cn 获取学校列表 ===');
  try {
    const r = await axios.get('https://gkcx.eol.cn/school', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    const html = r.data;
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    console.log(`Title: ${$('title').text()}`);
    console.log(`Links: ${$('a').length}`);
    
    // Find school links
    const schoolLinks = [];
    $('a[href*="/school/"]').each((i, a) => {
      const href = $(a).attr('href');
      const text = $(a).text().trim();
      if (href && text && href.match(/\/school\/\d+/)) {
        schoolLinks.push({ text: text.substring(0, 20), href });
      }
    });
    console.log(`School links: ${schoolLinks.length}`);
    schoolLinks.slice(0, 10).forEach(s => console.log(`  ${s.text}: ${s.href}`));
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

testEolApi().catch(console.error);
