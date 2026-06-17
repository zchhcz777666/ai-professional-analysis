const axios = require('axios');
const cheerio = require('cheerio');

async function main() {
  // Get the school page for Tsinghua (school_id=140 on gaokao.cn)
  const r = await axios.get('https://www.gaokao.cn/school/140', {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  
  const $ = cheerio.load(r.data);
  console.log('Title:', $('title').text());
  
  // List all JS script sources
  console.log('\nJS scripts:');
  $('script[src]').each((i, s) => {
    const src = $(s).attr('src');
    if (src && !src.includes('baidu') && !src.includes('map')) {
      console.log('  [' + i + '] ' + src.substring(0, 120));
    }
  });

  // Download and analyze the main runtime and vendor chunks
  const jsFiles = [];
  $('script[src]').each((i, s) => {
    const src = $(s).attr('src');
    if (src && (src.includes('runtime') || src.includes('vendor') || src.includes('main'))) {
      jsFiles.push(src.startsWith('http') ? src : 'https://www.gaokao.cn' + src);
    }
  });

  // Search for API patterns in the HTML itself
  console.log('\n=== Searching HTML for API paths ===');
  const apiPatterns = [
    /["'](\/api\/[^"']+)["']/g,
    /["'](https?:\/\/[^"']*(?:gaokao|eol)[^"']*(?:api|score|school|special)[^"']*)["']/g,
    /['"](\/[a-z]+\/[a-z]+\/\d+\/\d+\/\d+(?:\.json)?)['"]/g,
  ];
  
  for (const p of apiPatterns) {
    const found = new Set();
    let m;
    while ((m = p.exec(r.data)) !== null) {
      found.add(m[1]);
    }
    if (found.size > 0) {
      console.log('Pattern matches:');
      [...found].slice(0, 20).forEach(v => console.log('  ' + v));
    }
  }

  // Also look for API endpoints in __NEXT_DATA__ or similar
  const nextDataMatch = r.data.match(/__NEXT_DATA__\s*=\s*({.+?});/);
  if (nextDataMatch) {
    console.log('\n__NEXT_DATA__ found!');
    const parsed = JSON.parse(nextDataMatch[1]);
    console.log('Props keys:', Object.keys(parsed.props || {}).join(', '));
    console.log('Page:', parsed.page);
    const propsStr = JSON.stringify(parsed.props).substring(0, 1000);
    console.log('Props preview:', propsStr);
  }

  // Try downloading the app.js or main chunk for API analysis
  console.log('\n=== Downloading vendor/main chunks ===');
  for (const file of jsFiles) {
    try {
      const res = await axios.get(file, { timeout: 15000 });
      const js = res.data;
      console.log('\nFile:', file.split('/').pop(), (js.length / 1024).toFixed(1), 'KB');
      
      // Find API URLs
      const urlRegex = /["'](https?:\/\/[^"']*(?:api|score|school|special|province|admission)[^"']*)["']/g;
      const urls = new Set();
      let m;
      while ((m = urlRegex.exec(js)) !== null) {
        const url = m[1];
        if (url.length < 300 && !url.includes('baidu') && !url.includes('map') && !url.includes('google')) {
          urls.add(url);
        }
      }
      if (urls.size > 0) {
        console.log('API URLs:', urls.size);
        [...urls].forEach(u => console.log('  ' + u));
      }
    } catch (e) {
      console.log('Error downloading', file, e.message);
    }
  }
}

main().catch(console.error);
