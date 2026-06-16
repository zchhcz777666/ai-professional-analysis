const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://gaokao.chsi.com.cn/sch/',
  };

  console.log('=== Looking for score-related API endpoints ===');
  try {
    // First, let's search for "历年录取分数" or "score" related JS files
    const url = 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score';
    const res = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(res.data);

    // Get all script src URLs
    const scriptSrcs = [];
    $('script[src]').each((i, script) => {
      scriptSrcs.push($(script).attr('src'));
    });
    
    // Check the chsi_m.js which is the main JS file for the site
    console.log('Main JS: showchsi_m.js');
    try {
      const jsRes = await axios.get('https://t1.chei.com.cn/common/axvert/js/showchsi_m.js', { 
        headers, timeout: 10000 
      });
      const js = jsRes.data;
      // Look for API patterns
      const patterns = [
        /province|score|admission|fenshu|fsx|录取|分数/gi,
        /\/sch\//g,
        /\.get\(|\.post\(|ajax\(|fetch\(/g,
      ];
      for (const p of patterns) {
        const matches = js.match(p);
        if (matches) {
          console.log(`  Pattern ${p}: ${matches.length} matches`);
        }
      }
      
      // Find all URLs in the JS
      const urlPattern = /['"](https?:\/\/[^'"]+)['"]/g;
      const urls = [];
      let m;
      while ((m = urlPattern.exec(js)) !== null) {
        urls.push(m[1]);
      }
      console.log(`\n  Found ${urls.length} URLs in JS`);
      urls.slice(0, 20).forEach(u => console.log(`    ${u}`));
      
    } catch (e) {
      console.log(`  Error loading JS: ${e.message}`);
    }

    // Try to find API by looking at common patterns
    console.log('\n=== Trying common API paths ===');
    const apiPaths = [
      '/api/sch/score',
      '/api/score/list',
      '/sch/score',
      '/sch/fenshuxian',
      '/sch/admissionScore',
      '/wap/sch/score/3',
      '/wap/sch/admission/3',
      '/sch/querySchoolScore',
    ];
    
    for (const apiPath of apiPaths) {
      try {
        const apiUrl = `https://gaokao.chsi.com.cn${apiPath}?schId=3&provinceId=11&year=2024`;
        const apiRes = await axios.get(apiUrl, { 
          headers: { ...headers, 'Accept': 'application/json, text/plain, */*' },
          timeout: 5000 
        });
        console.log(`  ${apiPath}: Status=${apiRes.status}, type=${apiRes.headers['content-type']}, len=${apiRes.data.length}`);
        if (typeof apiRes.data === 'object') {
          console.log(`    Keys: ${Object.keys(apiRes.data).join(', ')}`);
        }
      } catch (e) {
        // silently ignore
      }
    }

  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

test();