const axios = require('axios');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  console.log('=== Fetching main JS files ===');
  const jsUrls = [
    'https://t1.chei.com.cn/common/axvert/js/showchsi_m.js',
    'https://t1.chei.com.cn/common/js/vue/2.6.10/vue.min.js',
  ];
  
  for (const jsUrl of jsUrls) {
    try {
      const res = await axios.get(jsUrl, { headers, timeout: 15000 });
      const js = res.data;
      console.log(`\n${jsUrl.split('/').pop()}: ${(js.length/1024).toFixed(1)} KB`);
      
      // Find all string URLs containing 'sch' or 'score'
      const patterns = [
        /['"]([^'"]*sch[^'"]*)['"]/gi,
        /['"]([^'"]*score[^'"]*)['"]/gi,
        /['"]([^'"]*admission[^'"]*)['"]/gi,
        /['"]([^'"]*province[^'"]*)['"]/gi,
        /['"]([^'"]*fenshu[^'"]*)['"]/gi,
        /['"]([^'"]*lqfs[^'"]*)['"]/gi,
        /['"]([^'"]*录取[^'"]*)['"]/gi,
        /['"]([^'"]*分数[^'"]*)['"]/gi,
      ];
      
      for (const pattern of patterns) {
        let match;
        const found = new Set();
        while ((match = pattern.exec(js)) !== null) {
          const url = match[1];
          if (url.length > 3 && url.length < 200 && !found.has(url)) {
            found.add(url);
          }
        }
        if (found.size > 0) {
          console.log(`  Pattern ${pattern}: ${found.size} unique matches`);
          found.forEach(u => console.log(`    ${u.substring(0, 150)}`));
        }
      }
      
      // Find all API-like URL patterns (relative paths)
      console.log('\n  API-like URL patterns:');
      const apiPattern = /['"](\/[a-z]+\/[a-z]+[^'"]*)['"]/gi;
      const apis = new Set();
      while ((match = apiPattern.exec(js)) !== null) {
        const url = match[1];
        if (url.length > 5 && url.length < 100) {
          apis.add(url);
        }
      }
      apis.forEach(u => {
        if (u.includes('sch') || u.includes('score') || u.includes('admission') || u.includes('fenshu') || u.includes('lq') || u.includes('fs')) {
          console.log(`    ${u}`);
        }
      });
      
    } catch (e) {
      console.log(`\n${jsUrl}: Error - ${e.message}`);
    }
  }
}

test();