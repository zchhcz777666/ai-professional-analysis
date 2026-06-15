const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://gaokao.chsi.com.cn/',
  };

  // First, let's get the page and look for all API-related patterns
  console.log('=== Looking for API endpoints in page source ===');
  try {
    const url = 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score';
    const res = await axios.get(url, { headers, timeout: 15000 });
    const html = res.data;
    
    // Find all inline script content that has API calls
    const $ = cheerio.load(html);
    
    // Check the Vue app data initialization
    $('script').each((i, script) => {
      const content = $(script).html() || '';
      if (content.includes('Vue') || content.includes('data') || content.includes('schinfo') || content.includes('/sch/')) {
        console.log(`\n=== Script #${i} (${content.length} chars) ===`);
        // Print relevant sections
        const lines = content.split('\n');
        lines.forEach((line, j) => {
          const trimmed = line.trim();
          if (trimmed.includes('get') || trimmed.includes('ajax') || trimmed.includes('fetch') || 
              trimmed.includes('/sch/') || trimmed.includes('score') || trimmed.includes('data') ||
              trimmed.includes('province') || trimmed.includes('url') || trimmed.includes('load')) {
            console.log(`  L${j}: ${trimmed.substring(0, 200)}`);
          }
        });
      }
    });

    // Also look for hidden API patterns in all scripts
    console.log('\n=== Looking for AJAX/API calls in all scripts ===');
    const apiPatterns = [
      /url\s*[:=]\s*['"]([^'"]+)['"]/g,
      /ajax\s*\(\s*['"]([^'"]+)['"]/g,
      /\.get\s*\(\s*['"]([^'"]+)['"]/g,
      /\.post\s*\(\s*['"]([^'"]+)['"]/g,
      /fetch\s*\(\s*['"]([^'"]+)['"]/g,
    ];
    
    $('script').each((i, script) => {
      const content = $(script).html() || '';
      for (const pattern of apiPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const apiUrl = match[1];
          if (apiUrl.includes('sch') || apiUrl.includes('score') || apiUrl.includes('province') || apiUrl.includes('data')) {
            console.log(`Script #${i}: ${match[0].substring(0, 150)}`);
          }
        }
      }
    });

    // Try the wap school info API with more detail
    console.log('\n=== Getting more details from wap API ===');
    const res2 = await axios.get('https://gaokao.chsi.com.cn/wap/sch/schinfo/3', { headers, timeout: 15000 });
    const msg = res2.data.msg;
    for (const [key, val] of Object.entries(msg)) {
      if (typeof val === 'object' && val !== null) {
        console.log(`\n${key}:`, JSON.stringify(val).substring(0, 500));
      } else {
        console.log(`\n${key}: ${String(val).substring(0, 200)}`);
      }
    }

  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (err.response) {
      console.log(`Status: ${err.response.status}`);
    }
  }
}

test();