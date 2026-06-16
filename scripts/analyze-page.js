const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  const res = await axios.get('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score', { 
    headers, timeout: 10000 
  });

  const html = res.data;
  
  // Extract all inline scripts and look for API calls
  const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  
  const results = [];
  
  for (const match of scriptMatches) {
    const script = match[1].trim();
    if (!script || script.length < 10) continue;
    
    // Look for fetch, axios, $.ajax, XMLHttpRequest patterns
    const apiPatterns = [
      /fetch\(['"]([^'"]+)['"]\)/g,
      /\$\.(?:get|post|ajax)\(['"]([^'"]+)['"]/g,
      /axios\.(?:get|post)\(['"]([^'"]+)['"]/g,
      /XMLHttpRequest/g,
      /url:\s*['"]([^'"]+(?:score|admission|province|fenshu|lqfs)[^'"]*)['"]/gi,
      /['"]([^'"]*(?:api|data|score|admission|province)[^'"]*(?:\.json|\.do|\.action))['"]/gi,
    ];
    
    for (const pattern of apiPatterns) {
      const found = [...script.matchAll(pattern)];
      for (const f of found) {
        results.push(f[0].substring(0, 150));
      }
    }
    
    // Also look for Vue data fetching patterns
    if (script.includes('score') || script.includes('admission') || script.includes('province') || script.includes('fenshu')) {
      // Print relevant lines
      const lines = script.split('\n');
      for (const line of lines) {
        if (line.includes('score') || line.includes('admission') || line.includes('province') || line.includes('fenshu') || line.includes('lqfs') || line.includes('api') || line.includes('fetch') || line.includes('ajax') || line.includes('axios')) {
          results.push('SCRIPT: ' + line.trim().substring(0, 200));
        }
      }
    }
  }
  
  // Also check external script tags
  const externalScripts = [...html.matchAll(/<script[^>]*src=['"]([^'"]+)['"][^>]*>/gi)];
  for (const m of externalScripts) {
    const src = m[1];
    if (src.includes('chsi') || src.includes('showchsi')) {
      results.push('EXTERNAL SCRIPT: ' + src);
      
      // Try to fetch it
      try {
        const url = src.startsWith('http') ? src : `https://gaokao.chsi.com.cn${src}`;
        const scriptRes = await axios.get(url, { headers, timeout: 5000 });
        const js = scriptRes.data;
        
        // Look for score/admission related patterns
        const patterns = [
          /['"]([^'"]*score[^'"]*)['"]/gi,
          /['"]([^'"]*admission[^'"]*)['"]/gi,
          /['"]([^'"]*fenshu[^'"]*)['"]/gi,
          /['"]([^'"]*province[^'"]*)['"]/gi,
          /url\s*[:=]\s*['"]([^'"]+)['"]/gi,
        ];
        
        for (const pat of patterns) {
          const found = [...js.matchAll(pat)];
          for (const f of found) {
            const val = f[1];
            if (val.includes('sch') || val.includes('api') || val.includes('data') || val.includes('get')) {
              if (val.length < 200 && val.length > 3) {
                results.push(`  ${pat.source.substring(0, 20)}: ${val}`);
              }
            }
          }
        }
        
        // Also check for function names
        if (js.includes('score') || js.includes('admission') || js.includes('fenshu')) {
          results.push(`  JS file has score-related content (${js.length} bytes)`);
        }
        
      } catch (e) {
        results.push(`  Fetch error: ${e.message.substring(0, 50)}`);
      }
    }
  }
  
  // Also check for Vue data binding
  const vueBindings = [...html.matchAll(/\{\{[^}]+\}\}/g)];
  const vueData = vueBindings.filter(v => v[0].includes('score') || v[0].includes('table') || v[0].includes('data'));
  if (vueData.length > 0) {
    results.push('Vue bindings: ' + vueData.map(v => v[0]).join(', ').substring(0, 200));
  }
  
  // Check for data-* attributes
  const dataAttrs = [...html.matchAll(/data-[a-z]+=['"][^'"]*['"]/gi)];
  results.push(`Data attributes: ${dataAttrs.length}`);
  
  fs.writeFileSync('c:\\Users\\Administrator\\.trae-cn\\aizhuanyefengxi\\scripts\\test-output2.txt', results.join('\n'), 'utf-8');
  console.log(`Found ${results.length} results. Written to test-output2.txt`);
}

test().catch(e => console.error('Fatal:', e.message));