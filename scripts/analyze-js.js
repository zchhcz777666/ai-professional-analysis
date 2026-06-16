const axios = require('axios');
const fs = require('fs');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  // Fetch showchsi_m.js
  console.log('Fetching showchsi_m.js...');
  try {
    const res = await axios.get('https://t1.chei.com.cn/common/axvert/js/showchsi_m.js', { 
      headers, timeout: 10000 
    });
    const js = res.data;
    console.log(`JS size: ${js.length} bytes`);
    
    // Search for score/admission related patterns
    const patterns = [
      /['"]([^'"]*(?:score|fenshu|lqfs|admission|province|录取|分数)[^'"]*)['"]/gi,
      /(?:url|api|uri)[:=]\s*['"]([^'"]+)['"]/gi,
      /(?:fetch|ajax|get|post)\(['"]([^'"]+)['"]/gi,
      /(?:tab=)([a-z]+)/gi,
    ];
    
    const results = new Set();
    
    for (const pat of patterns) {
      const found = [...js.matchAll(pat)];
      for (const f of found) {
        const val = f[1] || f[0];
        if (val.length < 200 && val.length > 2) {
          // Only add if it looks like a URL or API path
          if (val.includes('/') || val.includes('?') || val.includes('score') || val.includes('admission') || val.includes('province') || val.includes('fenshu')) {
            results.add(val);
          }
        }
      }
    }
    
    console.log(`\nFound ${results.size} relevant patterns:`);
    [...results].sort().forEach(r => {
      // Find context around this pattern
      const idx = js.indexOf(r);
      const context = idx >= 0 ? js.substring(Math.max(0, idx - 50), idx + r.length + 50) : '';
      console.log(`\n  ${r}`);
      if (context) {
        // Clean up context
        const clean = context.replace(/\n/g, ' ').trim().substring(0, 120);
        console.log(`  Context: ...${clean}...`);
      }
    });
    
    // Also look for any hardcoded URLs
    const urls = [...js.matchAll(/https?:\/\/[^'"\s\)]+/g)];
    console.log(`\n\nHardcoded URLs: ${urls.length}`);
    urls.forEach(u => console.log(`  ${u[0].substring(0, 120)}`));
    
    // Save the JS for further analysis
    fs.writeFileSync('c:\\Users\\Administrator\\.trae-cn\\aizhuanyefengxi\\scripts\\showchsi_m.js', js, 'utf-8');
    console.log('\nSaved to showchsi_m.js');
    
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

test().catch(e => console.error('Fatal:', e.message));