const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://gkcx.eol.cn/',
  };

  // 掌上高考 (gaokao.eol.cn / gkcx.eol.cn)
  console.log('=== 掌上高考 / gkcx.eol.cn ===');
  
  const tests = [
    // School search
    { name: 'school search', url: 'https://api.eol.cn/gkcx/api?access_token=&keyword=清华大学&page=1&size=10&type=&school_type=&uri=apidata/api/gk/school/provinces' },
    // School detail
    { name: 'school detail', url: 'https://api.eol.cn/gkcx/api?access_token=&uri=apidata/api/gk/school/detail&school_id=1' },
    // Score line
    { name: 'score line', url: 'https://api.eol.cn/gkcx/api?access_token=&uri=apidata/api/gk/school/provinfo&school_id=1&province_id=11' },
    // Major admission
    { name: 'major admission', url: 'https://api.eol.cn/gkcx/api?access_token=&uri=apidata/api/gk/school/special/scoreline&school_id=1&province_id=11&year=2024' },
    // School list
    { name: 'school list', url: 'https://api.eol.cn/gkcx/api?access_token=&uri=apidata/api/gk/school/schoolList&page=1&size=50' },
  ];

  for (const test of tests) {
    try {
      const res = await axios.get(test.url, { 
        headers: { ...headers, 'Accept': 'application/json, text/plain, */*' },
        timeout: 10000 
      });
      console.log(`\n${test.name}:`);
      console.log(`  Status: ${res.status}`);
      const data = res.data;
      if (typeof data === 'object') {
        console.log(`  Code: ${data.code}, Message: ${data.message}`);
        console.log(`  Data type: ${typeof data.data}, isArray: ${Array.isArray(data.data)}`);
        if (data.data && typeof data.data === 'object') {
          if (Array.isArray(data.data)) {
            console.log(`  Array length: ${data.data.length}`);
            if (data.data.length > 0) console.log(`  First item: ${JSON.stringify(data.data[0]).substring(0, 300)}`);
          } else {
            console.log(`  Keys: ${Object.keys(data.data).join(', ')}`);
            console.log(`  Data preview: ${JSON.stringify(data.data).substring(0, 500)}`);
          }
        }
      } else {
        console.log(`  Text: ${data.substring(0, 300)}`);
      }
    } catch (e) {
      console.log(`\n${test.name}: Error - ${e.message}`);
      if (e.response) console.log(`  Status: ${e.response.status}, Body: ${JSON.stringify(e.response.data).substring(0, 200)}`);
    }
  }
}

test();