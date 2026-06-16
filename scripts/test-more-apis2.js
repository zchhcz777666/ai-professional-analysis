const axios = require('axios');
const cheerio = require('cheerio');

async function main() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://gaokao.chsi.com.cn/',
    'Origin': 'https://gaokao.chsi.com.cn',
  };

  // Try finding the API endpoint by looking at various possible patterns
  const tests = [
    // Possible API patterns based on Vue.js apps
    { name: 'chsi api score', url: 'https://api.chsi.com.cn/sch/score?schId=3&provinceId=11&year=2024' },
    { name: 'data chsi score', url: 'https://data.chsi.com.cn/sch/score/3/11/2024' },
    
    // Try the gaokao subdomain  
    { name: 'gaokao api', url: 'https://gaokao.chsi.com.cn/api/sch/score?schId=3&provinceId=11&year=2024' },
    { name: 'gaokao api2', url: 'https://gaokao.chsi.com.cn/api/score/3/11/2024' },
    
    // Try the axvert subdomain (where showchsi_m.js is hosted)
    { name: 'axvert api', url: 'https://axvert.chsi.com.cn/sch/score/3/11/2024' },
    
    // Try different paths on gaokao.chsi.com.cn
    { name: 'sch/score', url: 'https://gaokao.chsi.com.cn/sch/score/3/11/2024' },
    { name: 'sch/score2', url: 'https://gaokao.chsi.com.cn/sch/score?schId=3&provinceId=11&year=2024' },
    { name: 'sch/lqfs', url: 'https://gaokao.chsi.com.cn/sch/lqfs/3/11/2024' },
    { name: 'sch/fenshu', url: 'https://gaokao.chsi.com.cn/sch/fenshu/3/11/2024' },
    { name: 'sch/admission', url: 'https://gaokao.chsi.com.cn/sch/admission/3/11/2024' },
    
    // Try the zyk subdomain (for majors)
    { name: 'zyk/sch', url: 'https://gaokao.chsi.com.cn/zyk/sch/score/3/11/2024' },
    
    // Try POST instead of GET
    { name: 'post', method: 'post', url: 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml', data: 'provinceId=11&year=2024&tab=score' },
  ];

  for (const test of tests) {
    try {
      const config = {
        headers: test.data ? { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' } : headers,
        timeout: 5000,
        maxRedirects: 0,
        validateStatus: status => true,
      };
      
      let res;
      if (test.method === 'post') {
        res = await axios.post(test.url, test.data, config);
      } else {
        res = await axios.get(test.url, config);
      }
      
      const ct = res.headers['content-type'] || '';
      const loc = res.headers['location'] || '';
      
      console.log(`${test.name}: status=${res.status}, type=${ct.substring(0, 30)}`);
      if (loc) console.log(`  -> ${loc.substring(0, 100)}`);
      
      // Check if it returned JSON with data
      if (typeof res.data === 'object') {
        console.log(`  JSON keys: ${Object.keys(res.data).join(', ').substring(0, 100)}`);
        // Look for arrays of data
        for (const key of Object.keys(res.data)) {
          const val = res.data[key];
          if (Array.isArray(val)) {
            console.log(`  ${key}: Array[${val.length}]`);
            if (val.length > 0) console.log(`  First: ${JSON.stringify(val[0]).substring(0, 200)}`);
          }
        }
      } else if (typeof res.data === 'string' && res.data.length < 5000) {
        if (res.data.startsWith('{') || res.data.startsWith('[')) {
          console.log(`  JSON-like: ${res.data.substring(0, 300)}`);
        }
      }
    } catch (e) {
      if (e.code === 'ECONNABORTED') {
        console.log(`${test.name}: timeout`);
      } else if (e.response) {
        console.log(`${test.name}: ${e.response.status}`);
      } else {
        console.log(`${test.name}: ${e.message.substring(0, 50)}`);
      }
    }
  }
}

main().catch(e => console.error('Fatal:', e.message));