const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  };

  console.log('=== eol.cn web pages ===');
  
  const tests = [
    { name: 'gkcx school detail', url: 'https://gkcx.eol.cn/school/1/provinceline/' },
    { name: 'gkcx school major', url: 'https://gkcx.eol.cn/school/1/special' },
    { name: 'gaokao.eol.cn search', url: 'https://gaokao.eol.cn/beijing/' },
    { name: 'college.eol.cn school', url: 'https://college.eol.cn/beijing/1.html' },
    { name: 'college score', url: 'https://college.eol.cn/beijing/1/score.html' },
    { name: 'data.eol.cn', url: 'https://data.eol.cn/beijing/1/scoreline.html' },
  ];

  for (const test of tests) {
    try {
      const res = await axios.get(test.url, { headers, timeout: 10000 });
      console.log(`\n${test.name} (${test.url}):`);
      console.log(`  Status: ${res.status}, Length: ${(res.data.length/1024).toFixed(1)} KB`);
      const $ = cheerio.load(res.data);
      console.log(`  Tables: ${$('table').length}`);
      
      // Check for score-related content
      if (res.data.includes('分数') || res.data.includes('录取') || res.data.includes('位次')) {
        console.log('  Contains score-related keywords');
      }
      
      // Print tables if any
      if ($('table').length > 0) {
        $('table').each((i, table) => {
          const headers = [];
          $(table).find('tr').first().find('th, td').each((j, td) => {
            headers.push($(td).text().trim());
          });
          if (headers.length > 0) console.log(`  Table ${i}: [${headers.join(', ').substring(0, 150)}]`);
        });
      }
    } catch (e) {
      console.log(`\n${test.name}: Error - ${e.message}`);
    }
  }

  // Try the gkcx API with proper parameters
  console.log('\n\n=== gkcx API with school_id ===');
  try {
    const res = await axios.get('https://gkcx.eol.cn/school/1/special', { 
      headers, timeout: 10000 
    });
    const $ = cheerio.load(res.data);
    console.log(`Tables: ${$('table').length}`);
    console.log(`Title: ${$('title').text()}`);
    
    // Look for data in script tags
    $('script').each((i, script) => {
      const content = $(script).html() || '';
      if (content.includes('score') || content.includes('special') || content.includes('data') || content.includes('province')) {
        console.log(`\nScript #${i}: ${content.substring(0, 500)}`);
      }
    });
    
    // Look for JSON data embedded in the page
    const matches = res.data.match(/window\.__NUXT__|window\.__INITIAL_STATE__|window\.__DATA__/g);
    if (matches) {
      console.log(`\nFound data store patterns: ${matches.join(', ')}`);
      const idx = res.data.indexOf('window.__');
      if (idx >= 0) {
        console.log(res.data.substring(idx, idx + 1000));
      }
    }
    
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

test();